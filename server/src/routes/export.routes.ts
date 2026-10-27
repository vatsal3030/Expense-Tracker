import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Prisma, ExpenseCategory, GroupType } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma';

export const exportRouter = Router();
exportRouter.use(authenticate);

// =============================================================================
// GET /api/export/group/:groupId — Export group expenses as CSV
// =============================================================================
exportRouter.get('/group/:groupId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const groupId = req.params.groupId as string;

    // Verify membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.user!.id },
    });

    if (!membership) {
      res.status(403).json({ success: false, error: 'You are not a member of this group.' });
      return;
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        expenses: {
          where: { isDeleted: false },
          orderBy: { date: 'desc' },
          include: {
            paidBy: { select: { name: true, email: true } },
            shares: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        members: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found.' });
      return;
    }

    // Generate CSV
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Paid By', 'Split Type', 'Shares'];
    const rows = group.expenses.map((exp) => {
      const shares = exp.shares
        .map((s) => `${s.user.name}: ₹${Number(s.amount).toFixed(2)}`)
        .join(' | ');

      return [
        new Date(exp.date).toLocaleDateString('en-IN'),
        `"${exp.description.replace(/"/g, '""')}"`,
        exp.category,
        Number(exp.amount).toFixed(2),
        exp.currency,
        exp.paidBy.name,
        exp.splitType,
        `"${shares}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_expenses.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export group error:', error);
    res.status(500).json({ success: false, error: 'Failed to export group expenses.' });
  }
});

// =============================================================================
// GET /api/export/personal — Export personal expenses as CSV
// =============================================================================
exportRouter.get('/personal', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from as string);
    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    const expenses = await prisma.expense.findMany({
      where: {
        isDeleted: false,
        OR: [
          { paidById: req.user!.id },
          { createdById: req.user!.id },
          { shares: { some: { userId: req.user!.id } } },
        ],
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      orderBy: { date: 'desc' },
      include: {
        paidBy: { select: { name: true } },
        group: { select: { name: true } },
        shares: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    const headers = ['Date', 'Description', 'Category', 'Total Bill', 'Currency', 'Paid By', 'Group', 'Your Outflow Share'];
    const rows = expenses.map((exp) => {
      const myShare = exp.shares.find((s) => s.userId === req.user!.id);
      const userShareAmount = myShare
        ? Number(myShare.amount)
        : (exp.paidById === req.user!.id ? Number(exp.amount) : 0);

      return [
        new Date(exp.date).toLocaleDateString('en-IN'),
        `"${exp.description.replace(/"/g, '""')}"`,
        exp.category,
        Number(exp.amount).toFixed(2),
        exp.currency,
        exp.paidBy.name,
        exp.group?.name || 'Personal',
        userShareAmount.toFixed(2),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expense_report_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export personal error:', error);
    res.status(500).json({ success: false, error: 'Failed to export expenses.' });
  }
});

// =============================================================================
// GET /api/export/report — Generate JSON report (for frontend PDF rendering)
// =============================================================================
exportRouter.get('/report', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { from, to, groupId } = req.query;

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from as string);
    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    const whereClause: any = {
      isDeleted: false,
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    };

    if (groupId) {
      whereClause.groupId = groupId as string;
    } else {
      whereClause.OR = [
        { paidById: req.user!.id },
        { createdById: req.user!.id },
        { shares: { some: { userId: req.user!.id } } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        paidBy: { select: { name: true, email: true } },
        group: { select: { name: true } },
        shares: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    const currentUserId = req.user!.id;
    const isPersonalScope = !groupId;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    let totalAmount = 0;

    expenses.forEach((exp) => {
      const myShare = exp.shares.find((s) => s.userId === currentUserId);
      const userShareAmount = myShare
        ? Number(myShare.amount)
        : (exp.paidById === currentUserId ? Number(exp.amount) : 0);

      // In personal scope, the user's outflow is their own share of the bill
      const amt = isPersonalScope ? userShareAmount : Number(exp.amount);
      totalAmount += amt;
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + amt;
    });

    // Monthly breakdown
    const monthlyBreakdown: Record<string, number> = {};
    expenses.forEach((exp) => {
      const myShare = exp.shares.find((s) => s.userId === currentUserId);
      const userShareAmount = myShare
        ? Number(myShare.amount)
        : (exp.paidById === currentUserId ? Number(exp.amount) : 0);
      const amt = isPersonalScope ? userShareAmount : Number(exp.amount);
      const month = new Date(exp.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
      monthlyBreakdown[month] = (monthlyBreakdown[month] || 0) + amt;
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true, email: true },
    });

    res.json({
      success: true,
      data: {
        reportDate: new Date().toISOString(),
        generatedBy: user,
        period: {
          from: from || expenses[expenses.length - 1]?.date || null,
          to: to || expenses[0]?.date || null,
        },
        summary: {
          totalExpenses: expenses.length,
          totalAmount,
          averagePerExpense: expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0,
          categoryBreakdown,
          monthlyBreakdown,
        },
        expenses: expenses.map((exp) => {
          const myShare = exp.shares.find((s) => s.userId === currentUserId);
          const userShareAmount = myShare
            ? Number(myShare.amount)
            : (exp.paidById === currentUserId ? Number(exp.amount) : 0);
          const totalBill = Number(exp.amount);
          const isSplit = exp.shares.length > 1;

          return {
            id: exp.id,
            date: exp.date,
            description: exp.description,
            category: exp.category,
            // In personal report, the relevant outflow is the user's split share
            amount: isPersonalScope ? userShareAmount : totalBill,
            totalBill,
            userShare: userShareAmount,
            isSplit,
            splitCount: exp.shares.length,
            currency: exp.currency,
            paidBy: exp.paidBy?.name || 'Unknown',
            paidById: exp.paidById,
            isPaidByMe: exp.paidById === currentUserId,
            group: exp.group?.name || 'Personal',
            groupId: exp.groupId,
            shares: exp.shares.map((s) => ({
              userId: s.userId,
              name: s.user?.name || 'Unknown',
              amount: Number(s.amount),
            })),
          };
        }),
      },
    });
  } catch (error: any) {
    console.error('Generate report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report.' });
  }
});

// =============================================================================
// POST /api/export/import-splitwise — 1-Click Splitwise CSV Migration Engine
// =============================================================================
const importSplitwiseSchema = z.object({
  groupName: z.string().min(1, 'Group name is required').max(100),
  groupType: z.enum(['HOME', 'TRIP', 'COUPLE', 'OFFICE', 'FRIENDS', 'FAMILY', 'PROJECT', 'OTHER']).optional(),
  currency: z.string().min(3).max(3).optional(),
  membersMapping: z.array(
    z.object({
      columnName: z.string().min(1),
      isCurrentUser: z.boolean(),
      existingUserId: z.string().uuid().optional(),
      guestEmail: z.string().email().optional(),
    })
  ).min(2, 'At least 2 members are required to split expenses.'),
  expenses: z.array(
    z.object({
      date: z.string().optional(),
      description: z.string().default('Expense'),
      category: z.string().optional(),
      cost: z.number().min(0),
      currency: z.string().optional(),
      shares: z.record(z.string(), z.number()),
    })
  ),
});

function mapSplitwiseCategory(cat?: string): ExpenseCategory {
  if (!cat) return 'GENERAL';
  const c = cat.toLowerCase();
  if (c.includes('food') || c.includes('dining') || c.includes('restaurant') || c.includes('drink') || c.includes('lunch') || c.includes('dinner')) return 'FOOD';
  if (c.includes('grocer') || c.includes('supermarket') || c.includes('market')) return 'GROCERIES';
  if (c.includes('transport') || c.includes('taxi') || c.includes('cab') || c.includes('uber') || c.includes('fuel') || c.includes('gas') || c.includes('flight') || c.includes('plane') || c.includes('bus') || c.includes('train')) return 'TRANSPORT';
  if (c.includes('entertain') || c.includes('movie') || c.includes('ticket') || c.includes('game') || c.includes('music')) return 'ENTERTAINMENT';
  if (c.includes('rent') || c.includes('housing') || c.includes('hotel') || c.includes('stay') || c.includes('airbnb')) return 'RENT';
  if (c.includes('utilit') || c.includes('electric') || c.includes('water') || c.includes('internet') || c.includes('wifi') || c.includes('phone') || c.includes('bill')) return 'UTILITIES';
  if (c.includes('shop') || c.includes('cloth') || c.includes('mall') || c.includes('electronic')) return 'SHOPPING';
  if (c.includes('health') || c.includes('medic') || c.includes('doctor') || c.includes('pharmacy')) return 'HEALTH';
  if (c.includes('subscript') || c.includes('netflix') || c.includes('spotify') || c.includes('cloud')) return 'SUBSCRIPTIONS';
  if (c.includes('gift')) return 'GIFTS';
  if (c.includes('travel') || c.includes('tour') || c.includes('trip')) return 'TRAVEL';
  return 'GENERAL';
}

exportRouter.post(
  '/import-splitwise',
  validate({ body: importSplitwiseSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { groupName, groupType, currency, membersMapping, expenses } = req.body;
      const currentUserId = req.user!.id;

      // 1. Validate that exactly one column is marked as the current logged-in user
      const currentUserMapping = membersMapping.find((m: any) => m.isCurrentUser);
      if (!currentUserMapping) {
        res.status(400).json({ success: false, error: 'One member must be designated as your account ("You").' });
        return;
      }

      // 2. Execute migration inside an atomic database transaction
      const result = await prisma.$transaction(async (tx) => {
        const columnNameToUserId: Record<string, string> = {};

        // Resolve each member in the CSV to a FairShare user ID
        for (const member of membersMapping) {
          if (member.isCurrentUser) {
            columnNameToUserId[member.columnName] = currentUserId;
          } else if (member.existingUserId) {
            const existing = await tx.user.findUnique({ where: { id: member.existingUserId } });
            if (existing) {
              columnNameToUserId[member.columnName] = existing.id;
            } else {
              throw new Error(`Specified user with ID ${member.existingUserId} not found.`);
            }
          } else {
            // Find or create guest placeholder user
            const guestEmail =
              member.guestEmail ||
              `guest_${member.columnName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}@fairshare.local`;

            let guestUser = await tx.user.findFirst({
              where: {
                OR: [
                  { email: guestEmail },
                  { name: member.columnName.trim(), supabaseId: null },
                ],
              },
            });

            if (!guestUser) {
              guestUser = await tx.user.create({
                data: {
                  name: member.columnName.trim(),
                  email: guestEmail,
                  defaultCurrency: currency || 'INR',
                  isActive: true,
                },
              });
            }

            columnNameToUserId[member.columnName] = guestUser.id;
          }
        }

        const uniqueUserIds = Array.from(new Set(Object.values(columnNameToUserId)));

        // Create the Group
        const group = await tx.group.create({
          data: {
            name: groupName.trim(),
            type: (groupType as GroupType) || 'TRIP',
            currency: currency || 'INR',
            members: {
              create: uniqueUserIds.map((userId) => ({
                userId,
                role: userId === currentUserId ? 'ADMIN' : 'MEMBER',
              })),
            },
          },
        });

        let expensesCreated = 0;
        let settlementsCreated = 0;

        // Process each expense / settlement row
        for (const row of expenses) {
          const cost = Number(row.cost) || 0;
          const desc = (row.description || '').trim();
          const isSettlement =
            /settle|payment|repay/i.test(desc) ||
            (row.category && row.category.toLowerCase() === 'payment');

          if (isSettlement && cost > 0) {
            // Settlement row in Splitwise: one person has positive delta (payer), one has negative delta (payee)
            let payerCol: string | null = null;
            let payeeCol: string | null = null;

            for (const [col, rawDelta] of Object.entries(row.shares)) {
              const delta = Number(rawDelta) || 0;
              if (delta > 0 && !payerCol) payerCol = col;
              if (delta < 0 && !payeeCol) payeeCol = col;
            }

            if (payerCol && payeeCol && columnNameToUserId[payerCol] && columnNameToUserId[payeeCol]) {
              await tx.settlement.create({
                data: {
                  groupId: group.id,
                  payerId: columnNameToUserId[payerCol],
                  payeeId: columnNameToUserId[payeeCol],
                  amount: new Prisma.Decimal(cost),
                  currency: row.currency || currency || 'INR',
                  status: 'CONFIRMED',
                  notes: desc || 'Imported Splitwise Settlement',
                },
              });
              settlementsCreated++;
              continue;
            }
          }

          // Standard Expense row
          if (cost > 0) {
            // Determine primary payer: member with maximum positive delta
            let maxDelta = -Infinity;
            let payerCol: string | null = null;

            for (const [col, rawDelta] of Object.entries(row.shares)) {
              const delta = Number(rawDelta) || 0;
              if (delta > maxDelta) {
                maxDelta = delta;
                payerCol = col;
              }
            }

            // Fallback to current user if payer not identified
            const paidById = payerCol && columnNameToUserId[payerCol]
              ? columnNameToUserId[payerCol]
              : currentUserId;

            // Calculate each member's owed share:
            // For member i != payer: owed = |delta|
            // For payer: owed = cost - maxDelta (or remaining portion)
            const rawShares: Array<{ userId: string; amount: number }> = [];

            for (const [col, rawDelta] of Object.entries(row.shares)) {
              const delta = Number(rawDelta) || 0;
              const uId = columnNameToUserId[col];
              if (!uId) continue;

              let shareAmt = 0;
              if (col === payerCol) {
                shareAmt = Math.max(0, cost - maxDelta);
              } else {
                shareAmt = Math.abs(delta);
              }

              if (shareAmt > 0) {
                rawShares.push({ userId: uId, amount: shareAmt });
              }
            }

            // If rawShares is empty or zero, split equally among all group members
            let finalShares = rawShares;
            if (finalShares.length === 0) {
              const equalShare = Number((cost / uniqueUserIds.length).toFixed(2));
              finalShares = uniqueUserIds.map((uId) => ({ userId: uId, amount: equalShare }));
            }

            // Normalize shares to guarantee sum(shares) === cost
            const totalSplitSum = finalShares.reduce((s, item) => s + item.amount, 0);
            const diff = Number((cost - totalSplitSum).toFixed(2));
            if (diff !== 0 && finalShares.length > 0) {
              finalShares[0].amount = Number((finalShares[0].amount + diff).toFixed(2));
            }

            const expDate = row.date ? new Date(row.date) : new Date();

            await tx.expense.create({
              data: {
                groupId: group.id,
                paidById,
                createdById: currentUserId,
                description: desc || 'Imported Expense',
                amount: new Prisma.Decimal(cost),
                currency: row.currency || currency || 'INR',
                category: mapSplitwiseCategory(row.category),
                splitType: 'EXACT',
                date: isNaN(expDate.getTime()) ? new Date() : expDate,
                notes: 'Imported from Splitwise',
                shares: {
                  create: finalShares.map((s) => ({
                    userId: s.userId,
                    amount: new Prisma.Decimal(s.amount),
                  })),
                },
              },
            });
            expensesCreated++;
          }
        }

        // Record Activity
        await tx.activity.create({
          data: {
            userId: currentUserId,
            groupId: group.id,
            type: 'GROUP_CREATED',
            message: `created group "${group.name}" with ${expensesCreated} expenses and ${settlementsCreated} settlements imported from Splitwise`,
          },
        });

        return {
          groupId: group.id,
          groupName: group.name,
          expensesCreated,
          settlementsCreated,
          membersCount: uniqueUserIds.length,
        };
      });

      res.status(201).json({
        success: true,
        message: `Successfully migrated "${result.groupName}" to FairShare!`,
        data: result,
      });
    } catch (error: any) {
      console.error('Import Splitwise error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to import Splitwise data.' });
    }
  }
);
