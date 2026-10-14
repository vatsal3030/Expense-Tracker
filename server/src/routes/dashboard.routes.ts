import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

// GET /api/dashboard/summary — Get dashboard summary data
dashboardRouter.get('/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Total you owe (sum of your unpaid shares in expenses you didn't pay for)
    const youOweData = await prisma.expenseShare.aggregate({
      where: {
        userId,
        isPaid: false,
        expense: {
          isDeleted: false,
          paidById: { not: userId },
        },
      },
      _sum: { amount: true },
    });

    // Total owed to you (sum of unpaid shares from others in expenses you paid for)
    const owedToYouData = await prisma.expenseShare.aggregate({
      where: {
        userId: { not: userId },
        isPaid: false,
        expense: {
          isDeleted: false,
          paidById: userId,
        },
      },
      _sum: { amount: true },
    });

    // This month's spending
    const thisMonthSpending = await prisma.expense.aggregate({
      where: {
        isDeleted: false,
        date: { gte: startOfMonth, lte: endOfMonth },
        OR: [
          { paidById: userId },
          { shares: { some: { userId } } },
        ],
      },
      _sum: { amount: true },
      _count: true,
    });

    // Last month's spending (for comparison)
    const lastMonthSpending = await prisma.expense.aggregate({
      where: {
        isDeleted: false,
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
        OR: [
          { paidById: userId },
          { shares: { some: { userId } } },
        ],
      },
      _sum: { amount: true },
    });

    // Category breakdown for this month
    const categoryBreakdown = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        isDeleted: false,
        date: { gte: startOfMonth, lte: endOfMonth },
        OR: [
          { paidById: userId },
          { shares: { some: { userId } } },
        ],
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    // Groups count
    const groupsCount = await prisma.groupMember.count({
      where: { userId },
    });

    // Recent activities
    const recentActivities = await prisma.activity.findMany({
      where: {
        OR: [
          { userId },
          { group: { members: { some: { userId } } } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Pending settlements
    const pendingSettlements = await prisma.settlement.count({
      where: {
        OR: [
          { payerId: userId },
          { payeeId: userId },
        ],
        status: 'PENDING',
      },
    });

    const thisMonthTotal = Number(thisMonthSpending._sum.amount || 0);
    const lastMonthTotal = Number(lastMonthSpending._sum.amount || 0);
    const monthOverMonthChange = lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        youOwe: Number(youOweData._sum.amount || 0),
        owedToYou: Number(owedToYouData._sum.amount || 0),
        totalBalance: Number(owedToYouData._sum.amount || 0) - Number(youOweData._sum.amount || 0),
        thisMonth: {
          total: thisMonthTotal,
          count: thisMonthSpending._count,
          change: monthOverMonthChange,
        },
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c.category,
          amount: Number(c._sum.amount || 0),
          count: c._count,
        })),
        groupsCount,
        pendingSettlements,
        recentActivities,
      },
    });
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data.' });
  }
});

// GET /api/dashboard/spending-trend — Monthly spending trend (last 6 months)
dashboardRouter.get('/spending-trend', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const spending = await prisma.expense.aggregate({
        where: {
          isDeleted: false,
          date: { gte: start, lte: end },
          OR: [
            { paidById: userId },
            { shares: { some: { userId } } },
          ],
        },
        _sum: { amount: true },
      });

      months.push({
        month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        amount: Number(spending._sum.amount || 0),
      });
    }

    res.json({ success: true, data: months });
  } catch (error: any) {
    console.error('Spending trend error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch spending trend.' });
  }
});
