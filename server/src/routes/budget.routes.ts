import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import appCache from '../lib/cache';

export const budgetRouter = Router();
budgetRouter.use(authenticate);

// POST /api/budgets — Create a budget
const createBudgetSchema = z.object({
  category: z.enum([
    'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES', 'RENT',
    'HEALTH', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'SUBSCRIPTIONS', 'INSURANCE',
    'GIFTS', 'DONATIONS', 'INVESTMENTS', 'SALARY', 'FREELANCE', 'GENERAL', 'OTHER',
  ]),
  amount: z.number().positive('Budget amount must be positive').min(1, 'Minimum budget is ₹1').max(10000000, 'Budget amount cannot exceed ₹10,000,000'),
  currency: z.string().trim().length(3).default('INR'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  alertAt: z.number().int().min(1, 'Alert threshold must be at least 1%').max(100, 'Alert threshold cannot exceed 100%').default(80),
});

budgetRouter.post(
  '/',
  validate({ body: createBudgetSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { category, amount, currency, period, alertAt } = req.body;

      // Check if budget already exists for this category and period
      const existing = await prisma.budget.findUnique({
        where: {
          userId_category_period: {
            userId: req.user!.id,
            category,
            period,
          },
        },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: `A ${period.toLowerCase()} budget for ${category.toLowerCase()} already exists.`,
        });
        return;
      }

      const budget = await prisma.budget.create({
        data: {
          userId: req.user!.id,
          category,
          amount: new Decimal(amount),
          currency,
          period,
          alertAt,
        },
      });

      const budgetAmount = Number(budget.amount);
      const budgetData = {
        ...budget,
        spent: 0,
        remaining: budgetAmount,
        percentage: 0,
        isOverBudget: false,
        isAlerted: false,
      };

      res.status(201).json({ success: true, data: budgetData });
    } catch (error: any) {
      console.error('Create budget error:', error);
      res.status(500).json({ success: false, error: 'Failed to create budget.' });
    }
  }
);

// GET /api/budgets — Get all budgets with spending progress (Cached & Parallelized)
budgetRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cacheKey = `budgets:list:${userId}`;
    const cached = appCache.getSync(cacheKey) || (await appCache.get(cacheKey));
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const budgets = await prisma.budget.findMany({
      where: { userId, isActive: true },
      orderBy: { category: 'asc' },
    });

    // Concurrently aggregate spending for all budgets in a single roundtrip
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const { start, end } = getPeriodDateRange(budget.period);

        const spending = await prisma.expense.aggregate({
          where: {
            isDeleted: false,
            category: budget.category,
            date: { gte: start, lte: end },
            OR: [
              { paidById: userId },
              { shares: { some: { userId } } },
            ],
          },
          _sum: { amount: true },
        });

        const spent = Number(spending._sum.amount || 0);
        const budgetAmount = Number(budget.amount);
        const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;

        return {
          ...budget,
          spent,
          remaining: Math.max(budgetAmount - spent, 0),
          percentage,
          isOverBudget: spent > budgetAmount,
          isAlerted: percentage >= budget.alertAt,
          periodRange: { start, end },
        };
      })
    );

    appCache.set(cacheKey, budgetsWithSpending, 30000);
    res.json({ success: true, data: budgetsWithSpending });
  } catch (error: any) {
    console.error('Get budgets error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch budgets.' });
  }
});

// PUT /api/budgets/:id — Update budget
const updateBudgetSchema = z.object({
  amount: z.number().positive('Budget amount must be positive').min(1, 'Minimum budget is ₹1').max(10000000, 'Budget amount cannot exceed ₹10,000,000').optional(),
  alertAt: z.number().int().min(1, 'Alert threshold must be between 1% and 100%').max(100, 'Alert threshold cannot exceed 100%').optional(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  isActive: z.boolean().optional(),
});

budgetRouter.put(
  '/:id',
  validate({ body: updateBudgetSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const budget = await prisma.budget.findFirst({
        where: { id, userId: req.user!.id },
      });

      if (!budget) {
        res.status(404).json({ success: false, error: 'Budget not found.' });
        return;
      }

      if (req.body.period && req.body.period !== budget.period) {
        const conflict = await prisma.budget.findUnique({
          where: {
            userId_category_period: {
              userId: req.user!.id,
              category: budget.category,
              period: req.body.period,
            },
          },
        });
        if (conflict && conflict.id !== id) {
          res.status(409).json({
            success: false,
            error: `A ${req.body.period.toLowerCase()} budget for ${budget.category.toLowerCase()} already exists.`,
          });
          return;
        }
      }

      const updated = await prisma.budget.update({
        where: { id },
        data: {
          ...(req.body.amount && { amount: new Decimal(req.body.amount) }),
          ...(req.body.alertAt !== undefined && { alertAt: req.body.alertAt }),
          ...(req.body.period && { period: req.body.period }),
          ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
        },
      });

      appCache.invalidatePrefix('budgets:');
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('Update budget error:', error);
      res.status(500).json({ success: false, error: 'Failed to update budget.' });
    }
  }
);

// DELETE /api/budgets/:id — Delete budget
budgetRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const budget = await prisma.budget.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!budget) {
      res.status(404).json({ success: false, error: 'Budget not found.' });
      return;
    }

    await prisma.budget.delete({ where: { id } });
    appCache.invalidatePrefix('budgets:');
    res.json({ success: true, message: 'Budget deleted successfully.' });
  } catch (error: any) {
    console.error('Delete budget error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete budget.' });
  }
});

// =============================================================================
// GET /api/budgets/burn-rate — Predictive budget burn rate & daily safe-spend (Cached & Parallelized)
// =============================================================================
budgetRouter.get('/burn-rate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cacheKey = `budgets:burn-rate:${userId}`;
    const cached = appCache.getSync(cacheKey) || (await appCache.get(cacheKey));
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const budgets = await prisma.budget.findMany({
      where: { userId, isActive: true },
      orderBy: { category: 'asc' },
    });

    const now = new Date();
    const burnRates = await Promise.all(
      budgets.map(async (budget) => {
        const { start, end } = getPeriodDateRange(budget.period);
        const totalDays = Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 1);
        const elapsedDays = Math.max(Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 1);
        const remainingDays = Math.max(Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 1);

        // Concurrently query spending
        const spending = await prisma.expense.aggregate({
          where: {
            isDeleted: false,
            category: budget.category,
            date: { gte: start, lte: end },
            OR: [
              { paidById: userId },
              { shares: { some: { userId } } },
            ],
          },
          _sum: { amount: true },
        });

        const spent = Number(spending._sum.amount || 0);
        const budgetAmount = Number(budget.amount);
        const remaining = Math.max(budgetAmount - spent, 0);
        const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;

        // Burn rate calculations
        const dailySpendRate = elapsedDays > 0 ? spent / elapsedDays : 0;
        const dailySafeSpend = remainingDays > 0 ? remaining / remainingDays : 0;
        const idealDailySpend = totalDays > 0 ? budgetAmount / totalDays : 0;

        // Projected depletion
        const projectedDepletionDays = dailySpendRate > 0 ? Math.ceil(remaining / dailySpendRate) : Infinity;
        const projectedDepletionDate = projectedDepletionDays !== Infinity
          ? new Date(now.getTime() + projectedDepletionDays * 24 * 60 * 60 * 1000)
          : null;

        // Pacing: how many days ahead or behind the ideal linear spend
        const idealSpentByNow = idealDailySpend * elapsedDays;
        const pacingDelta = idealSpentByNow - spent; // positive = under budget, negative = over
        const pacingStatus: 'on_track' | 'ahead' | 'behind' | 'depleted' =
          remaining <= 0 ? 'depleted' :
          Math.abs(pacingDelta) < idealDailySpend * 0.5 ? 'on_track' :
          pacingDelta > 0 ? 'ahead' : 'behind';

        return {
          budgetId: budget.id,
          category: budget.category,
          period: budget.period,
          budgetAmount,
          spent,
          remaining,
          percentage,
          totalDays,
          elapsedDays,
          remainingDays,
          dailySpendRate: Math.round(dailySpendRate * 100) / 100,
          dailySafeSpend: Math.round(dailySafeSpend * 100) / 100,
          idealDailySpend: Math.round(idealDailySpend * 100) / 100,
          projectedDepletionDays: projectedDepletionDays === Infinity ? null : projectedDepletionDays,
          projectedDepletionDate,
          pacingDelta: Math.round(pacingDelta * 100) / 100,
          pacingStatus,
          alertMessage: generateBurnRateAlert(budget.category, dailySpendRate, remaining, remainingDays, pacingStatus),
          periodRange: { start, end },
        };
      })
    );

    appCache.set(cacheKey, burnRates, 30000);
    res.json({ success: true, data: burnRates });
  } catch (error: any) {
    console.error('Burn rate error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate burn rate.' });
  }
});

function generateBurnRateAlert(
  category: string,
  dailyRate: number,
  remaining: number,
  remainingDays: number,
  status: string,
): string | null {
  const cat = category.charAt(0) + category.slice(1).toLowerCase();
  if (status === 'depleted') {
    return `Your ${cat} budget is fully depleted.`;
  }
  if (status === 'behind' && dailyRate > 0) {
    const daysUntilDepleted = Math.ceil(remaining / dailyRate);
    return `At ₹${Math.round(dailyRate).toLocaleString('en-IN')}/day, your ${cat} budget will deplete in ${daysUntilDepleted} days.`;
  }
  return null;
}

/**
 * Get date range for a budget period.
 */
function getPeriodDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (period) {
    case 'WEEKLY':
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'MONTHLY':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'QUARTERLY':
      const quarter = Math.floor(now.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'YEARLY':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}
