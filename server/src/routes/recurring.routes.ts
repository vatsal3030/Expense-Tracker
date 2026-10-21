import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { emitToUser } from '../lib/socket';
import appCache from '../lib/cache';

export const recurringRouter = Router();
recurringRouter.use(authenticate);

// =============================================================================
// SCHEMAS
// =============================================================================

const createRecurringSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(150),
  amount: z.number().positive('Amount must be positive').min(0.01).max(10000000),
  currency: z.string().trim().length(3).default('INR'),
  category: z.enum([
    'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES', 'RENT',
    'HEALTH', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'SUBSCRIPTIONS', 'INSURANCE',
    'GIFTS', 'DONATIONS', 'INVESTMENTS', 'SALARY', 'FREELANCE', 'GENERAL', 'OTHER',
  ]).default('SUBSCRIPTIONS'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).nullish(),
  groupId: z.string().nullish(),
  splitAmong: z.array(z.string()).optional(), // user IDs to split among
});

const updateRecurringSchema = z.object({
  description: z.string().trim().min(1).max(150).optional(),
  amount: z.number().positive().min(0.01).max(10000000).optional(),
  category: z.enum([
    'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES', 'RENT',
    'HEALTH', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'SUBSCRIPTIONS', 'INSURANCE',
    'GIFTS', 'DONATIONS', 'INVESTMENTS', 'SALARY', 'FREELANCE', 'GENERAL', 'OTHER',
  ]).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  endDate: z.string().or(z.date()).nullish(),
  isActive: z.boolean().optional(),
});

// =============================================================================
// GET /api/recurring — List all recurring rules for current user
// =============================================================================
recurringRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rules = await prisma.recurringExpense.findMany({
      where: { userId: req.user!.id },
      orderBy: { nextDueDate: 'asc' },
      include: {
        _count: { select: { expenses: true } },
      },
    });

    // Attach upcoming status
    const now = new Date();
    const enriched = rules.map((rule) => {
      const daysUntilDue = Math.ceil(
        (new Date(rule.nextDueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...rule,
        amount: Number(rule.amount),
        daysUntilDue,
        isDueSoon: daysUntilDue <= 2 && daysUntilDue >= 0,
        isOverdue: daysUntilDue < 0 && rule.isActive,
        totalGenerated: rule._count.expenses,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error('List recurring error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recurring expenses.' });
  }
});

// =============================================================================
// GET /api/recurring/:id — Get single recurring rule
// =============================================================================
recurringRouter.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rule = await prisma.recurringExpense.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      include: {
        expenses: {
          orderBy: { date: 'desc' },
          take: 10,
          select: { id: true, description: true, amount: true, date: true },
        },
      },
    });

    if (!rule) {
      res.status(404).json({ success: false, error: 'Recurring rule not found.' });
      return;
    }

    res.json({ success: true, data: { ...rule, amount: Number(rule.amount) } });
  } catch (error: any) {
    console.error('Get recurring error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recurring expense.' });
  }
});

// =============================================================================
// POST /api/recurring — Create a new recurring expense rule
// =============================================================================
recurringRouter.post(
  '/',
  validate({ body: createRecurringSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { description, amount, currency, category, frequency, startDate, endDate } = req.body;

      const parsedStart = new Date(startDate);
      const nextDue = computeNextDueDate(parsedStart, frequency);

      const rule = await prisma.recurringExpense.create({
        data: {
          userId: req.user!.id,
          description,
          amount: new Decimal(amount),
          currency,
          category,
          frequency,
          startDate: parsedStart,
          endDate: endDate ? new Date(endDate) : null,
          nextDueDate: nextDue,
          isActive: true,
        },
      });

      res.status(201).json({ success: true, data: { ...rule, amount: Number(rule.amount) } });
    } catch (error: any) {
      console.error('Create recurring error:', error);
      res.status(500).json({ success: false, error: 'Failed to create recurring expense.' });
    }
  }
);

// =============================================================================
// PUT /api/recurring/:id — Update a recurring expense rule
// =============================================================================
recurringRouter.put(
  '/:id',
  validate({ body: updateRecurringSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const existing = await prisma.recurringExpense.findFirst({
        where: { id: req.params.id as string, userId: req.user!.id },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: 'Recurring rule not found.' });
        return;
      }

      const updateData: any = {};
      if (req.body.description) updateData.description = req.body.description;
      if (req.body.amount) updateData.amount = new Decimal(req.body.amount);
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
      if (req.body.endDate !== undefined) {
        updateData.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
      }

      // If frequency changes, recalculate next due date
      if (req.body.frequency && req.body.frequency !== existing.frequency) {
        updateData.frequency = req.body.frequency;
        updateData.nextDueDate = computeNextDueDate(new Date(), req.body.frequency);
      }

      const updated = await prisma.recurringExpense.update({
        where: { id: req.params.id as string },
        data: updateData,
      });

      res.json({ success: true, data: { ...updated, amount: Number(updated.amount) } });
    } catch (error: any) {
      console.error('Update recurring error:', error);
      res.status(500).json({ success: false, error: 'Failed to update recurring expense.' });
    }
  }
);

// =============================================================================
// DELETE /api/recurring/:id — Delete a recurring expense rule
// =============================================================================
recurringRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.recurringExpense.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Recurring rule not found.' });
      return;
    }

    await prisma.recurringExpense.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Recurring rule deleted.' });
  } catch (error: any) {
    console.error('Delete recurring error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete recurring expense.' });
  }
});

// =============================================================================
// POST /api/recurring/process — Process all due recurring expenses (cron endpoint)
// Called internally or by a scheduled job
// =============================================================================
recurringRouter.post('/process', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const dueRules = await prisma.recurringExpense.findMany({
      where: {
        isActive: true,
        nextDueDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      include: { user: { select: { id: true, name: true } } },
    });

    let created = 0;
    for (const rule of dueRules) {
      try {
        // Create the expense
        await prisma.$transaction(async (tx) => {
          const expense = await tx.expense.create({
            data: {
              createdById: rule.userId,
              paidById: rule.userId,
              description: `${rule.description} (Auto)`,
              amount: rule.amount,
              currency: rule.currency,
              category: rule.category,
              date: now,
              isRecurring: true,
              recurringId: rule.id,
              shares: {
                create: {
                  userId: rule.userId,
                  amount: rule.amount,
                },
              },
            },
          });

          // Advance the next due date
          const nextDue = computeNextDueDate(now, rule.frequency);
          await tx.recurringExpense.update({
            where: { id: rule.id },
            data: { nextDueDate: nextDue },
          });

          // Create notification
          await tx.notification.create({
            data: {
              userId: rule.userId,
              type: 'RECURRING_DUE',
              title: 'Recurring Expense Logged',
              message: `₹${Number(rule.amount).toLocaleString('en-IN')} for "${rule.description}" has been automatically logged.`,
              data: { expenseId: expense.id, recurringId: rule.id },
            },
          });

          created++;
        });

        // Real-time notification
        emitToUser(rule.userId, 'notification', {
          title: 'Recurring Expense Logged',
          message: `₹${Number(rule.amount).toLocaleString('en-IN')} for "${rule.description}"`,
        });
        emitToUser(rule.userId, 'data-refresh', { type: 'expense' });
      } catch (err) {
        console.error(`Failed to process recurring rule ${rule.id}:`, err);
      }
    }

    // Also send reminders for rules due in 2 days
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const upcomingRules = await prisma.recurringExpense.findMany({
      where: {
        isActive: true,
        nextDueDate: {
          gt: now,
          lte: twoDaysFromNow,
        },
      },
    });

    for (const rule of upcomingRules) {
      const daysUntil = Math.ceil(
        (new Date(rule.nextDueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only send reminder once (check cache)
      const cacheKey = `recurring-reminder:${rule.id}:${rule.nextDueDate.toISOString().slice(0, 10)}`;
      if (!appCache.getSync(cacheKey)) {
        await prisma.notification.create({
          data: {
            userId: rule.userId,
            type: 'RECURRING_DUE',
            title: 'Upcoming Recurring Expense',
            message: `₹${Number(rule.amount).toLocaleString('en-IN')} for "${rule.description}" will be logged in ${daysUntil} day${daysUntil > 1 ? 's' : ''}.`,
            data: { recurringId: rule.id },
          },
        });
        appCache.set(cacheKey, true, 86400 * 3 * 1000); // Cache for 3 days (in ms)
      }
    }

    res.json({
      success: true,
      message: `Processed ${created} recurring expenses. ${upcomingRules.length} reminders sent.`,
    });
  } catch (error: any) {
    console.error('Process recurring error:', error);
    res.status(500).json({ success: false, error: 'Failed to process recurring expenses.' });
  }
});

// =============================================================================
// UTILITY: Compute next due date based on frequency
// =============================================================================
function computeNextDueDate(from: Date, frequency: string): Date {
  const next = new Date(from);

  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}
