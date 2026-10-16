import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import appCache from '../lib/cache';

export const expenseRouter = Router();
expenseRouter.use(authenticate);

// POST /api/expenses — Create a new expense
const createExpenseSchema = z.object({
  groupId: z.string().nullish().transform((val) => (val && val.trim() !== '' ? val : null)),
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive').max(99999999.99),
  currency: z.string().length(3).default('INR'),
  category: z.enum([
    'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES', 'RENT',
    'HEALTH', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'SUBSCRIPTIONS', 'INSURANCE',
    'GIFTS', 'DONATIONS', 'INVESTMENTS', 'SALARY', 'FREELANCE', 'GENERAL', 'OTHER',
  ]).default('GENERAL'),
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES', 'ADJUSTMENT']).default('EQUAL'),
  date: z.any().optional(),
  notes: z.string().max(500).nullish(),
  paidById: z.string().nullish(),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number().optional(),
    percentage: z.number().optional(),
    shares: z.number().optional(),
    adjustment: z.number().optional(),
  })).min(1, 'At least one split is required'),
});

expenseRouter.post(
  '/',
  validate({ body: createExpenseSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { groupId, description, amount, currency, category, splitType, date, notes, paidById, splits } = req.body;

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
          paidBy: { select: { id: true, name: true, avatarUrl: true } },
          shares: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
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
      }

      // Invalidate dashboard and group caches for all involved users
      appCache.invalidatePrefix(`dashboard:${req.user!.id}`);
      appCache.invalidatePrefix(`dashboard:${resolvedPaidById}`);
      for (const s of calculatedShares) {
        appCache.invalidatePrefix(`dashboard:${s.userId}`);
      }
      if (groupId) {
        appCache.invalidatePrefix('groups:list:');
      }

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

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        paidBy: { select: { id: true, name: true, avatarUrl: true, email: true } },
        shares: { include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } } },
        group: { select: { id: true, name: true } },
      },
      orderBy,
      skip,
      take: limitNum,
    });

    const total = await prisma.expense.count({ where });

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
        paidBy: { select: { id: true, name: true, avatarUrl: true, email: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, email: true } },
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
  description: z.string().min(1).max(200).optional(),
  amount: z.number().positive().max(99999999.99).optional(),
  category: z.enum([
    'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES', 'RENT',
    'HEALTH', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'SUBSCRIPTIONS', 'INSURANCE',
    'GIFTS', 'DONATIONS', 'INVESTMENTS', 'SALARY', 'FREELANCE', 'GENERAL', 'OTHER',
  ]).optional(),
  date: z.any().optional(),
  notes: z.string().max(500).nullable().optional(),
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES']).optional(),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number().optional(),
    percentage: z.number().optional(),
    shares: z.number().optional(),
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
        where: { id, createdById: req.user!.id, isDeleted: false },
        include: { shares: true },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: 'Expense not found or unauthorized.' });
        return;
      }

      const updateData: any = {};
      if (description) updateData.description = description;
      if (category) updateData.category = category;
      if (date) updateData.date = new Date(date);
      if (notes !== undefined) updateData.notes = notes;

      if (splits && splits.length > 0) {
        const effectiveAmount = amount || Number(existing.amount);
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
      }

      const updated = await prisma.expense.update({
        where: { id },
        data: {
          ...updateData,
          ...(amount && { amount: new Prisma.Decimal(amount) }),
          ...(splitType && { splitType }),
        },
        include: {
          paidBy: { select: { id: true, name: true, avatarUrl: true } },
          shares: { include: { user: { select: { id: true, name: true } } } },
        },
      });

      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          groupId: existing.groupId,
          expenseId: id,
          type: 'EXPENSE_UPDATED',
          message: `updated "${updated.description}"`,
        },
      });

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
      where: { id, createdById: req.user!.id, isDeleted: false },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Expense not found or already deleted.' });
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
      },
    });

    appCache.invalidatePrefix(`dashboard:${req.user!.id}`);
    if (existing.groupId) {
      appCache.invalidatePrefix('groups:list:');
    }

    res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete expense.' });
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

