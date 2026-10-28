import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import appCache from '../lib/cache';
import { emitToUser, emitToGroup, emitToUsers } from '../lib/socket';
import { invalidateAndPrecomputeSimplifiedBalances } from './settlement.routes';

export const expenseRouter = Router();
expenseRouter.use(authenticate);

// POST /api/expenses — Create a new expense
const createExpenseSchema = z.object({
  groupId: z.string().nullish().transform((val) => (val && val.trim() !== '' ? val : null)),
  description: z.string().trim().min(1, 'Description is required').max(150, 'Description cannot exceed 150 characters'),
  amount: z.number().positive('Amount must be positive').min(0.01, 'Minimum amount is ₹0.01').max(10000000, 'Amount cannot exceed ₹10,000,000'),
  currency: z.string().trim().length(3).default('INR'),
  category: z.enum([
    'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES', 'RENT',
    'HEALTH', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'SUBSCRIPTIONS', 'INSURANCE',
    'GIFTS', 'DONATIONS', 'INVESTMENTS', 'SALARY', 'FREELANCE', 'GENERAL', 'OTHER',
  ]).default('GENERAL'),
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES', 'ADJUSTMENT']).default('EQUAL'),
  date: z.any().optional(),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').nullish(),
  paidById: z.string().nullish(),
  splits: z.array(z.object({
    userId: z.string().trim().min(1, 'User ID is required'),
    amount: z.number().min(0, 'Split amount cannot be negative').max(10000000).optional(),
    percentage: z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100%').optional(),
    shares: z.number().positive('Shares must be positive').max(1000, 'Shares cannot exceed 1000').optional(),
    adjustment: z.number().min(-10000000).max(10000000).optional(),
  })).min(1, 'At least one split is required'),
});

expenseRouter.post(
  '/',
  validate({ body: createExpenseSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { groupId, description, amount, currency, category, splitType, date, notes, paidById, splits } = req.body;

      // Idempotency guard: prevent duplicate submission within 8 seconds
      const idempotencyKey = (req.headers['idempotency-key'] as string) || `expense:${req.user!.id}:${description}:${amount}:${groupId || 'none'}`;
      const cachedExpense = appCache.getSync(`idempotent:${idempotencyKey}`);
      if (cachedExpense) {
        res.status(200).json({ success: true, data: cachedExpense, idempotent: true });
        return;
      }

      const actualPaidBy = paidById && paidById.trim() !== '' ? paidById : req.user!.id;

      // Resolve user IDs in splits (map Supabase ID to internal Postgres ID if needed)
      const inputUserIds = Array.from(new Set([actualPaidBy, ...splits.map((s: any) => s.userId)]));
      const dbUsers = await prisma.user.findMany({
        where: {
          OR: [
            { id: { in: inputUserIds } },
            { supabaseId: { in: inputUserIds } },
          ],
        },
        select: { id: true, supabaseId: true },
      });

      const idMap = new Map<string, string>();
      dbUsers.forEach((u) => {
        idMap.set(u.id, u.id);
        if (u.supabaseId) idMap.set(u.supabaseId, u.id);
      });

      const resolvedPaidById = idMap.get(actualPaidBy) || req.user!.id;

      const resolvedSplits = splits.map((s: any) => ({
        ...s,
        userId: idMap.get(s.userId) || s.userId,
      }));

      // Validate that payer is in the group (if group expense)
      if (groupId) {
        const payerMembership = await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId, userId: resolvedPaidById } },
        });
        if (!payerMembership) {
          res.status(400).json({ success: false, error: 'Payer must be a group member.' });
          return;
        }
      }

      // Calculate shares based on split type
      const calculatedShares = calculateShares(splitType, amount, resolvedSplits);

      // Validate total shares equal the expense amount
      const totalShares = calculatedShares.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(totalShares - amount) > 0.05) {
        res.status(400).json({
          success: false,
          error: `Split amounts (₹${totalShares.toFixed(2)}) don't match expense amount (₹${amount.toFixed(2)}).`,
        });
        return;
      }

      const expenseDate = date ? new Date(date) : new Date();

      const expense = await prisma.expense.create({
        data: {
          groupId: groupId || null,
          paidById: resolvedPaidById,
          createdById: req.user!.id,
          description,
          amount: new Prisma.Decimal(amount),
          currency,
          category,
          splitType: splitType === 'ADJUSTMENT' ? 'EXACT' : splitType,
          date: isNaN(expenseDate.getTime()) ? new Date() : expenseDate,
          notes: notes || null,
          shares: {
            create: calculatedShares.map((s) => ({
              userId: s.userId,
              amount: new Prisma.Decimal(s.amount),
            })),
          },
        },
        include: {
          paidBy: { select: { id: true, name: true, avatarUrl: true, username: true } },
          shares: { include: { user: { select: { id: true, name: true, avatarUrl: true, username: true } } } },
          group: { select: { id: true, name: true } },
        },
      });

      // Activity log
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          groupId: groupId || null,
          expenseId: expense.id,
          type: 'EXPENSE_CREATED',
          message: `added "${description}" — ₹${amount.toFixed(2)}`,
        },
      });

      // Notify ONLY those users who are actually involved in this transaction (excluding the creator)
      const involvedUserIds = Array.from(
        new Set(
          calculatedShares
            .map((s) => s.userId)
            .filter((uid) => uid !== req.user!.id)
        )
      );

      if (involvedUserIds.length > 0) {
        const creatorName = expense.paidBy?.name || 'A friend';
        await prisma.notification.createMany({
          data: involvedUserIds.map((targetUid) => {
            const userShare = calculatedShares.find((s) => s.userId === targetUid);
            const shareAmount = userShare ? userShare.amount.toFixed(2) : '0.00';
            return {
              userId: targetUid,
              type: 'EXPENSE_ADDED',
              title: 'New Shared Expense',
              message: `${creatorName} added "${description}". Your share is ₹${shareAmount}.`,
              data: { expenseId: expense.id, groupId: groupId || null },
            };
          }),
        }).catch((err) => console.error('Notification creation error:', err));

        // Real-time socket notification to involved users
        involvedUserIds.forEach((targetUid) => {
          const userShare = calculatedShares.find((s) => s.userId === targetUid);
          const shareAmount = userShare ? userShare.amount.toFixed(2) : '0.00';
          emitToUser(targetUid, 'notification', {
            type: 'EXPENSE_ADDED',
            title: 'New Shared Expense',
            message: `${creatorName} added "${description}". Your share is ₹${shareAmount}.`,
            data: { expenseId: expense.id, groupId: groupId || null },
          });
        });
      }

      // Real-time socket event to all involved parties & group room
      const allInvolvedUsers = Array.from(
        new Set([req.user!.id, resolvedPaidById, ...calculatedShares.map((s) => s.userId)])
      );
      emitToUsers(allInvolvedUsers, 'expense:created', { expense, groupId: groupId || null });
      if (groupId) {
        emitToGroup(groupId, 'expense:created', { expense, groupId });
      }

      // Accountability audit trail: record activity on creation with initial state snapshot
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          groupId: groupId || null,
          expenseId: expense.id,
          type: 'EXPENSE_CREATED',
          message: `created expense "${expense.description}" for ₹${Number(expense.amount).toFixed(2)}`,
          metadata: {
            action: 'CREATED',
            actor: { id: req.user!.id, name: (req.user as any).name || req.user!.email, email: req.user!.email },
            snapshot: {
              description: expense.description,
              amount: Number(expense.amount),
              currency: expense.currency,
              category: expense.category,
              date: expense.date,
              splitType: expense.splitType,
              paidById: expense.paidById,
              sharesCount: calculatedShares.length,
            },
          },
        },
      }).catch((err) => console.error('Activity creation error:', err));

      // Invalidate dashboard, analytics, trends, budgets, settlements, and group caches for all involved users
      appCache.invalidatePrefix('dashboard:');
      appCache.invalidatePrefix('budgets:');
      appCache.invalidatePrefix('settlements:');
      appCache.invalidatePrefix('groups:list:');
      if (groupId) {
        appCache.invalidatePrefix(`group:${groupId}`);
      }

      // Materialized balance maintenance: precompute simplified debts in background (0ms reads)
      invalidateAndPrecomputeSimplifiedBalances(allInvolvedUsers);

      appCache.set(`idempotent:${idempotencyKey}`, expense, 8000);
      res.status(201).json({ success: true, data: expense });
    } catch (error: any) {
      console.error('Create expense error:', error);
      res.status(500).json({ success: false, error: 'Failed to create expense.' });
    }
  }
);

// GET /api/expenses — Get expenses with rich sorting, filtering & search
expenseRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      groupId,
      category,
      splitType,
      search,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sortBy = 'date_desc',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 50);
    const skip = (pageNum - 1) * limitNum;

    // Authorization: user can only see expenses they paid or have a share in
    // Uses AND to ensure search filters NEVER bypass this auth check
    const where: any = {
      isDeleted: false,
      AND: [
        {
          OR: [
            { paidById: req.user!.id },
            { shares: { some: { userId: req.user!.id } } },
          ],
        },
      ],
    };

    if (groupId && typeof groupId === 'string' && groupId.trim() !== '') {
      where.groupId = groupId;
    }
    if (category && typeof category === 'string' && category.trim() !== '') {
      where.category = category;
    }
    if (splitType && typeof splitType === 'string' && splitType.trim() !== '') {
      where.splitType = splitType;
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.AND.push({
        OR: [
          { description: { contains: search.trim(), mode: 'insensitive' } },
          { notes: { contains: search.trim(), mode: 'insensitive' } },
        ],
      });
    }
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = new Prisma.Decimal(Number(minAmount));
      if (maxAmount) where.amount.lte = new Prisma.Decimal(Number(maxAmount));
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    // Dynamic sorting
    let orderBy: any = { date: 'desc' };
    switch (sortBy) {
      case 'date_asc':
        orderBy = { date: 'asc' };
        break;
      case 'amount_desc':
        orderBy = { amount: 'desc' };
        break;
      case 'amount_asc':
        orderBy = { amount: 'asc' };
        break;
      case 'desc_asc':
        orderBy = { description: 'asc' };
        break;
      case 'desc_desc':
        orderBy = { description: 'desc' };
        break;
      case 'date_desc':
      default:
        orderBy = { date: 'desc' };
        break;
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          paidBy: { select: { id: true, name: true, avatarUrl: true, email: true, username: true } },
          shares: { include: { user: { select: { id: true, name: true, avatarUrl: true, email: true, username: true } } } },
          group: { select: { id: true, name: true } },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch expenses.' });
  }
});

// GET /api/expenses/:id — Get single expense with complete split details
expenseRouter.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        isDeleted: false,
        OR: [
          { paidById: req.user!.id },
          { shares: { some: { userId: req.user!.id } } },
        ],
      },
      include: {
        paidBy: { select: { id: true, name: true, avatarUrl: true, email: true, username: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true, username: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, email: true, username: true } },
          },
        },
        group: { select: { id: true, name: true } },
      },
    });

    if (!expense) {
      res.status(404).json({ success: false, error: 'Expense not found.' });
      return;
    }

    res.json({ success: true, data: expense });
  } catch (error: any) {
    console.error('Get expense error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch expense.' });
  }
});

// PUT /api/expenses/:id — Update expense
const updateExpenseSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(150, 'Description cannot exceed 150 characters').optional(),
  amount: z.number().positive('Amount must be positive').min(0.01, 'Minimum amount is ₹0.01').max(10000000, 'Amount cannot exceed ₹10,000,000').optional(),
  category: z.enum([
    'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES', 'RENT',
    'HEALTH', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'SUBSCRIPTIONS', 'INSURANCE',
    'GIFTS', 'DONATIONS', 'INVESTMENTS', 'SALARY', 'FREELANCE', 'GENERAL', 'OTHER',
  ]).optional(),
  date: z.any().optional(),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').nullable().optional(),
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES']).optional(),
  splits: z.array(z.object({
    userId: z.string().trim().min(1, 'User ID is required'),
    amount: z.number().min(0, 'Split amount cannot be negative').max(10000000).optional(),
    percentage: z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100%').optional(),
    shares: z.number().positive('Shares must be positive').max(1000, 'Shares cannot exceed 1000').optional(),
  })).optional(),
});

expenseRouter.put(
  '/:id',
  validate({ body: updateExpenseSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { description, amount, category, date, notes, splitType, splits } = req.body;

      const existing = await prisma.expense.findFirst({
        where: { id, isDeleted: false },
        include: {
          shares: true,
          group: {
            include: {
              members: {
                where: { userId: req.user!.id },
              },
            },
          },
        },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: 'Expense not found.' });
        return;
      }

      const isCreator = existing.createdById === req.user!.id;
      const isPayer = existing.paidById === req.user!.id;
      const isGroupAdmin = existing.group?.members?.some((m) => m.role === 'ADMIN') ?? false;

      if (!isCreator && !isPayer && !isGroupAdmin) {
        res.status(403).json({ success: false, error: 'Unauthorized to modify this expense.' });
        return;
      }

      const updateData: any = {};
      if (description) updateData.description = description;
      if (category) updateData.category = category;
      if (date) updateData.date = new Date(date);
      if (notes !== undefined) updateData.notes = notes;

      const effectiveAmount = amount ? Number(amount) : Number(existing.amount);

      if (splits && splits.length > 0) {
        const effectiveSplitType = splitType || existing.splitType;
        const calculatedShares = calculateShares(effectiveSplitType, effectiveAmount, splits);

        const totalShares = calculatedShares.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(totalShares - effectiveAmount) > 0.05) {
          res.status(400).json({
            success: false,
            error: `Split amounts don't match expense amount.`,
          });
          return;
        }

        await prisma.expenseShare.deleteMany({ where: { expenseId: id } });
        await prisma.expenseShare.createMany({
          data: calculatedShares.map((s) => ({
            expenseId: id,
            userId: s.userId,
            amount: new Prisma.Decimal(s.amount),
          })),
        });
      } else if (amount && Number(amount) !== Number(existing.amount) && existing.shares.length > 0) {
        // Automatically scale existing shares proportionally to match the new amount
        const oldTotal = existing.shares.reduce((sum, s) => sum + Number(s.amount), 0);
        const newTotal = Number(amount);
        const ratio = oldTotal > 0 ? newTotal / oldTotal : 1 / existing.shares.length;

        let accumulated = 0;
        const recomputedShares = existing.shares.map((s, idx) => {
          let sAmt = Math.round(Number(s.amount) * ratio * 100) / 100;
          if (idx === existing.shares.length - 1) {
            sAmt = Math.round((newTotal - accumulated) * 100) / 100;
          } else {
            accumulated += sAmt;
          }
          return { userId: s.userId, amount: new Prisma.Decimal(sAmt) };
        });

        await prisma.expenseShare.deleteMany({ where: { expenseId: id } });
        await prisma.expenseShare.createMany({
          data: recomputedShares.map((s) => ({
            expenseId: id,
            userId: s.userId,
            amount: s.amount,
          })),
        });
      }

      const updated = await prisma.expense.update({
        where: { id },
        data: {
          ...updateData,
          ...(amount && { amount: new Prisma.Decimal(amount) }),
          ...(splitType && { splitType }),
        },
        include: {
          paidBy: { select: { id: true, name: true, avatarUrl: true, username: true } },
          shares: { include: { user: { select: { id: true, name: true, avatarUrl: true, username: true } } } },
        },
      });

      // Compute exact accountability diff of what changed
      const changes: Record<string, { from: any; to: any }> = {};
      if (description && description !== existing.description) {
        changes.description = { from: existing.description, to: description };
      }
      if (amount && Number(amount) !== Number(existing.amount)) {
        changes.amount = { from: Number(existing.amount), to: Number(amount) };
      }
      if (category && category !== existing.category) {
        changes.category = { from: existing.category, to: category };
      }
      if (date && new Date(date).toISOString().slice(0, 10) !== new Date(existing.date).toISOString().slice(0, 10)) {
        changes.date = { from: new Date(existing.date).toISOString().slice(0, 10), to: new Date(date).toISOString().slice(0, 10) };
      }
      if (splitType && splitType !== existing.splitType) {
        changes.splitType = { from: existing.splitType, to: splitType };
      }
      if (notes !== undefined && notes !== existing.notes) {
        changes.notes = { from: existing.notes || '', to: notes || '' };
      }

      const changedFields = Object.keys(changes);
      const changeSummary = changedFields.length > 0 ? changedFields.join(', ') : 'shares breakdown adjusted';

      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          groupId: existing.groupId,
          expenseId: id,
          type: 'EXPENSE_UPDATED',
          message: `updated "${updated.description}" (${changeSummary})`,
          metadata: {
            action: 'UPDATED',
            actor: { id: req.user!.id, name: (req.user as any).name || req.user!.email, email: req.user!.email },
            changes,
            previousState: {
              description: existing.description,
              amount: Number(existing.amount),
              category: existing.category,
              date: existing.date,
              splitType: existing.splitType,
            },
            newState: {
              description: updated.description,
              amount: Number(updated.amount),
              category: updated.category,
              date: updated.date,
              splitType: updated.splitType,
            },
          },
        },
      });

      // Real-time socket event to all involved parties & group room
      const allInvolvedUsers = Array.from(
        new Set([
          req.user!.id,
          existing.createdById,
          existing.paidById,
          ...existing.shares.map((s) => s.userId),
          ...updated.shares.map((s: any) => s.userId),
        ])
      );
      emitToUsers(allInvolvedUsers, 'expense:updated', { expense: updated, groupId: existing.groupId });
      if (existing.groupId) {
        emitToGroup(existing.groupId, 'expense:updated', { expense: updated, groupId: existing.groupId });
      }

      appCache.invalidatePrefix(`dashboard:${req.user!.id}`);
      appCache.invalidatePrefix('settlements:');
      if (existing.groupId) {
        appCache.invalidatePrefix(`group:${existing.groupId}`);
        appCache.invalidatePrefix(`groups:${existing.groupId}`);
        appCache.invalidatePrefix('groups:list:');
      }

      // Materialized balance maintenance: precompute simplified debts in background (0ms reads)
      invalidateAndPrecomputeSimplifiedBalances(allInvolvedUsers);

      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('Update expense error:', error);
      res.status(500).json({ success: false, error: 'Failed to update expense.' });
    }
  }
);

// DELETE /api/expenses/:id — Soft delete expense
expenseRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.expense.findFirst({
      where: { id, isDeleted: false },
      include: {
        shares: true,
        group: {
          include: {
            members: {
              where: { userId: req.user!.id },
            },
          },
        },
      },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Expense not found or already deleted.' });
      return;
    }

    const isCreator = existing.createdById === req.user!.id;
    const isPayer = existing.paidById === req.user!.id;
    const isGroupAdmin = existing.group?.members?.some((m) => m.role === 'ADMIN') ?? false;

    if (!isCreator && !isPayer && !isGroupAdmin) {
      res.status(403).json({ success: false, error: 'Unauthorized to delete this expense.' });
      return;
    }

    await prisma.expense.update({
      where: { id },
      data: { isDeleted: true },
    });

    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        groupId: existing.groupId,
        expenseId: id,
        type: 'EXPENSE_DELETED',
        message: `deleted "${existing.description}"`,
        metadata: {
          action: 'DELETED',
          actor: { id: req.user!.id, name: (req.user as any).name || req.user!.email, email: req.user!.email },
          snapshot: {
            description: existing.description,
            amount: Number(existing.amount),
            currency: existing.currency,
            category: existing.category,
            date: existing.date,
            splitType: existing.splitType,
          },
        },
      },
    });

    // Real-time socket event for expense deletion
    const allInvolvedUsers = Array.from(
      new Set([
        req.user!.id,
        existing.createdById,
        existing.paidById,
        ...existing.shares.map((s) => s.userId),
      ])
    );
    emitToUsers(allInvolvedUsers, 'expense:deleted', { expenseId: id, groupId: existing.groupId });
    if (existing.groupId) {
      emitToGroup(existing.groupId, 'expense:deleted', { expenseId: id, groupId: existing.groupId });
    }

    appCache.invalidatePrefix(`dashboard:${req.user!.id}`);
    appCache.invalidatePrefix('settlements:');
    if (existing.groupId) {
      appCache.invalidatePrefix(`group:${existing.groupId}`);
      appCache.invalidatePrefix(`groups:${existing.groupId}`);
      appCache.invalidatePrefix('groups:list:');
    }

    // Materialized balance maintenance: precompute simplified debts in background (0ms reads)
    invalidateAndPrecomputeSimplifiedBalances(allInvolvedUsers);

    res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete expense.' });
  }
});

// GET /api/expenses/:id/audit-trail — Transaction Accountability & Change History
expenseRouter.get('/:id/audit-trail', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const expense = await prisma.expense.findFirst({
      where: { id },
      include: {
        shares: true,
        group: {
          include: {
            members: {
              where: { userId: req.user!.id },
            },
          },
        },
      },
    });

    if (!expense) {
      res.status(404).json({ success: false, error: 'Expense not found.' });
      return;
    }

    // Authorization: User must be creator, payer, share recipient, or group member
    const isCreator = expense.createdById === req.user!.id;
    const isPayer = expense.paidById === req.user!.id;
    const isParticipant = expense.shares.some((s) => s.userId === req.user!.id);
    const isGroupMember = (expense.group?.members?.length ?? 0) > 0;

    if (!isCreator && !isPayer && !isParticipant && !isGroupMember) {
      res.status(403).json({ success: false, error: 'Unauthorized to view audit trail for this expense.' });
      return;
    }

    const activities = await prisma.activity.findMany({
      where: {
        expenseId: id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: activities.map((act) => ({
        id: act.id,
        type: act.type,
        message: act.message,
        timestamp: act.createdAt,
        actor: act.user,
        metadata: act.metadata,
      })),
    });
  } catch (error: any) {
    console.error('Fetch audit trail error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit trail.' });
  }
});

/**
 * Calculate individual shares based on split type with exact penny/cent mathematical balance.
 */
function calculateShares(
  splitType: string,
  totalAmount: number,
  splits: Array<{ userId: string; amount?: number; percentage?: number; shares?: number; adjustment?: number }>
): Array<{ userId: string; amount: number }> {
  const round2 = (val: number) => Math.round(val * 100) / 100;

  switch (splitType) {
    case 'EQUAL': {
      const count = splits.length || 1;
      const perPerson = Math.floor((totalAmount / count) * 100) / 100;
      const remainder = round2(totalAmount - perPerson * count);

      return splits.map((s, i) => ({
        userId: s.userId,
        amount: i === 0 ? round2(perPerson + remainder) : perPerson,
      }));
    }

    case 'EXACT': {
      return splits.map((s) => ({
        userId: s.userId,
        amount: round2(s.amount || 0),
      }));
    }

    case 'PERCENTAGE': {
      const calculated = splits.map((s) => ({
        userId: s.userId,
        amount: round2((totalAmount * (s.percentage || 0)) / 100),
      }));
      const sum = round2(calculated.reduce((acc, curr) => acc + curr.amount, 0));
      const diff = round2(totalAmount - sum);
      if (diff !== 0 && calculated.length > 0) {
        calculated[0].amount = round2(calculated[0].amount + diff);
      }
      return calculated;
    }

    case 'SHARES': {
      const totalShares = splits.reduce((sum, s) => sum + (s.shares || 1), 0);
      const safeShares = totalShares > 0 ? totalShares : 1;
      const calculated = splits.map((s) => ({
        userId: s.userId,
        amount: round2((totalAmount * (s.shares || 1)) / safeShares),
      }));
      const sum = round2(calculated.reduce((acc, curr) => acc + curr.amount, 0));
      const diff = round2(totalAmount - sum);
      if (diff !== 0 && calculated.length > 0) {
        calculated[0].amount = round2(calculated[0].amount + diff);
      }
      return calculated;
    }

    case 'ADJUSTMENT': {
      const count = splits.length || 1;
      const totalAdj = splits.reduce((acc, s) => acc + (s.adjustment || 0), 0);
      const baseShare = (totalAmount - totalAdj) / count;
      const calculated = splits.map((s) => ({
        userId: s.userId,
        amount: Math.max(0, round2(baseShare + (s.adjustment || 0))),
      }));
      const sum = round2(calculated.reduce((acc, curr) => acc + curr.amount, 0));
      const diff = round2(totalAmount - sum);
      if (diff !== 0 && calculated.length > 0) {
        calculated[0].amount = round2(calculated[0].amount + diff);
      }
      return calculated;
    }

    default: {
      const count = splits.length || 1;
      const perPerson = Math.floor((totalAmount / count) * 100) / 100;
      const remainder = round2(totalAmount - perPerson * count);
      return splits.map((s, i) => ({
        userId: s.userId,
        amount: i === 0 ? round2(perPerson + remainder) : perPerson,
      }));
    }
  }
}

