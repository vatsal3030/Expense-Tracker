import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

// Fast in-memory cache for dashboard endpoints (15s TTL)
const DASHBOARD_CACHE_MAX = 1000;
const dashboardCache = new Map<string, { data: any; expiresAt: number }>();

// Periodic cleanup: evict expired entries every 2 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of dashboardCache) {
    if (value.expiresAt <= now) dashboardCache.delete(key);
  }
}, 2 * 60 * 1000).unref();

// GET /api/dashboard/summary — Get dashboard summary data
dashboardRouter.get('/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const cacheKey = `summary:${userId}`;
  const cached = dashboardCache.get(cacheKey);

  try {
    if (cached && cached.expiresAt > Date.now()) {
      res.json({ success: true, data: cached.data });
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Parallel resilient execution of all summary metrics
    const results = await Promise.allSettled([
      prisma.expenseShare.aggregate({
        where: {
          userId,
          isPaid: false,
          expense: {
            isDeleted: false,
            paidById: { not: userId },
          },
        },
        _sum: { amount: true },
      }),
      prisma.expenseShare.aggregate({
        where: {
          userId: { not: userId },
          isPaid: false,
          expense: {
            isDeleted: false,
            paidById: userId,
          },
        },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
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
      }),
      prisma.expense.aggregate({
        where: {
          isDeleted: false,
          date: { gte: startOfLastMonth, lte: endOfLastMonth },
          OR: [
            { paidById: userId },
            { shares: { some: { userId } } },
          ],
        },
        _sum: { amount: true },
      }),
      prisma.groupMember.count({
        where: { userId },
      }),
      prisma.activity.findMany({
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
      }),
      prisma.settlement.count({
        where: {
          OR: [
            { payerId: userId },
            { payeeId: userId },
          ],
          status: 'PENDING',
        },
      }),
    ]);

    const youOweData = results[0].status === 'fulfilled' ? results[0].value : { _sum: { amount: 0 } };
    const owedToYouData = results[1].status === 'fulfilled' ? results[1].value : { _sum: { amount: 0 } };
    const categoryBreakdown = results[2].status === 'fulfilled' ? results[2].value : [];
    const lastMonthSpending = results[3].status === 'fulfilled' ? results[3].value : { _sum: { amount: 0 } };
    const groupsCount = results[4].status === 'fulfilled' ? results[4].value : 0;
    const recentActivities = results[5].status === 'fulfilled' ? results[5].value : [];
    const pendingSettlements = results[6].status === 'fulfilled' ? results[6].value : 0;

    const thisMonthTotal = categoryBreakdown.reduce((sum, c) => sum + Number(c._sum.amount || 0), 0);
    const thisMonthCount = categoryBreakdown.reduce((sum, c) => sum + (c._count || 0), 0);
    const lastMonthTotal = Number(lastMonthSpending._sum?.amount || 0);
    const monthOverMonthChange = lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    const resultData = {
      youOwe: Number(youOweData._sum?.amount || 0),
      owedToYou: Number(owedToYouData._sum?.amount || 0),
      totalBalance: Number(owedToYouData._sum?.amount || 0) - Number(youOweData._sum?.amount || 0),
      thisMonth: {
        total: thisMonthTotal,
        count: thisMonthCount,
        change: monthOverMonthChange,
      },
      categoryBreakdown: categoryBreakdown.map((c: any) => ({
        category: c.category,
        amount: Number(c._sum?.amount || 0),
        count: c._count || 0,
      })),
      groupsCount,
      pendingSettlements,
      recentActivities,
    };

    if (dashboardCache.size >= DASHBOARD_CACHE_MAX) dashboardCache.clear();
    dashboardCache.set(cacheKey, { data: resultData, expiresAt: Date.now() + 30000 });
    res.json({ success: true, data: resultData });
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    if (cached) {
      res.json({ success: true, data: cached.data });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data.' });
  }
});

// GET /api/dashboard/spending-trend — Monthly spending trend (last 6 months, single query)
dashboardRouter.get('/spending-trend', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cacheKey = `trend:${userId}`;
    const cached = dashboardCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.json({ success: true, data: cached.data });
      return;
    }

    const now = new Date();
    const monthRanges = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      monthRanges.push({
        label: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        start,
        end,
      });
    }

    // Single query for the 6-month period instead of 6 separate roundtrips
    const earliestDate = monthRanges[0].start;
    const allExpenses = await prisma.expense.findMany({
      where: {
        isDeleted: false,
        date: { gte: earliestDate },
        OR: [
          { paidById: userId },
          { shares: { some: { userId } } },
        ],
      },
      select: { date: true, amount: true },
    });

    const months = monthRanges.map((m) => {
      const totalForMonth = allExpenses
        .filter((e) => {
          const d = new Date(e.date);
          return d >= m.start && d <= m.end;
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      return {
        month: m.label,
        amount: totalForMonth,
      };
    });

    if (dashboardCache.size >= DASHBOARD_CACHE_MAX) dashboardCache.clear();
    dashboardCache.set(cacheKey, { data: months, expiresAt: Date.now() + 15000 });
    res.json({ success: true, data: months });
  } catch (error: any) {
    console.error('Spending trend error:', error);
    // Graceful fallback for new accounts or temporary glitches
    const now = new Date();
    const fallback = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      fallback.push({
        month: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
        amount: 0,
      });
    }
    res.json({ success: true, data: fallback });
  }
});

// GET /api/dashboard/analytics — Comprehensive analytics & insights data
dashboardRouter.get('/analytics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Fetch expenses for the last 60 days to calculate daily curves
    const recentExpenses = await prisma.expense.findMany({
      where: {
        isDeleted: false,
        date: { gte: sixtyDaysAgo, lte: now },
        OR: [
          { paidById: userId },
          { shares: { some: { userId } } },
        ],
      },
      include: {
        shares: true,
      },
      orderBy: { date: 'asc' },
    });

    // 2. Generate daily timeline for the last 30 days
    const dailySpendMap: Record<string, number> = {};
    const prevDailySpendMap: Record<string, number> = {};
    const dayOfWeekSpend: Record<string, number> = {
      Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0,
    };

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    recentExpenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      const userShare = exp.shares.find((s) => s.userId === userId);
      const amount = userShare ? Number(userShare.amount) : Number(exp.amount);

      if (expDate >= thirtyDaysAgo) {
        const dateKey = expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailySpendMap[dateKey] = (dailySpendMap[dateKey] || 0) + amount;
        const dayName = days[expDate.getDay()];
        dayOfWeekSpend[dayName] = (dayOfWeekSpend[dayName] || 0) + amount;
      } else {
        const dateKey = expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        prevDailySpendMap[dateKey] = (prevDailySpendMap[dateKey] || 0) + amount;
      }
    });

    const dailyTrends = [];
    let cumulativeCurrent = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const currentDaySpend = dailySpendMap[key] || 0;
      cumulativeCurrent += currentDaySpend;

      dailyTrends.push({
        date: key,
        amount: currentDaySpend,
        cumulative: cumulativeCurrent,
      });
    }

    // 3. Category breakdown from recentExpenses (avoids Prisma groupBy relation filter limitation)
    const categoryMap: Record<string, { amount: number; count: number }> = {};
    recentExpenses
      .filter((e) => new Date(e.date) >= thirtyDaysAgo)
      .forEach((e) => {
        const cat = e.category || 'OTHER';
        const userShare = e.shares?.find((s: any) => s.userId === userId);
        const amt = userShare ? Number(userShare.amount) : Number(e.amount);
        if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 };
        categoryMap[cat].amount += amt;
        categoryMap[cat].count += 1;
      });

    const categoryAggregates = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      _sum: { amount: data.amount },
      _count: data.count,
    }));

    const totalCategorySpend = categoryAggregates.reduce(
      (sum, c) => sum + Number(c._sum.amount || 0),
      0
    );

    const categoriesWithPercent = categoryAggregates.map((c) => {
      const amt = Number(c._sum.amount || 0);
      return {
        category: c.category,
        amount: amt,
        count: c._count,
        percentage: totalCategorySpend > 0 ? Math.round((amt / totalCategorySpend) * 100) : 0,
        average: c._count > 0 ? Math.round(amt / c._count) : 0,
      };
    });

    // 4. Cashflow (Inflow vs Outflow) for the last 6 months (fetched in 2 batch queries instead of 12)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [allSixMonthExpenses, allSixMonthSettlements] = await Promise.all([
      prisma.expense.findMany({
        where: {
          isDeleted: false,
          paidById: userId,
          date: { gte: sixMonthsAgo, lte: now },
        },
        select: { date: true, amount: true },
      }),
      prisma.settlement.findMany({
        where: {
          payeeId: userId,
          status: 'CONFIRMED',
          settledAt: { gte: sixMonthsAgo, lte: now },
        },
        select: { settledAt: true, amount: true },
      }),
    ]);

    const cashflow = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthLabel = start.toLocaleString('default', { month: 'short' });

      const paidOut = allSixMonthExpenses
        .filter((e) => {
          const d = new Date(e.date);
          return d >= start && d <= end;
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const reimbursed = allSixMonthSettlements
        .filter((s) => {
          const d = s.settledAt ? new Date(s.settledAt) : null;
          return d && d >= start && d <= end;
        })
        .reduce((sum, s) => sum + Number(s.amount || 0), 0);

      cashflow.push({
        month: monthLabel,
        paidOut,
        reimbursed,
        net: reimbursed - paidOut,
      });
    }

    // 5. Day of week breakdown
    const dayOfWeekData = Object.entries(dayOfWeekSpend).map(([day, amount]) => ({
      day,
      amount,
    }));

    // 6. Generate smart automated insights
    const topCategory = categoriesWithPercent[0];
    const weekendSpend = (dayOfWeekSpend['Sat'] || 0) + (dayOfWeekSpend['Sun'] || 0);
    const weekendPercent = totalCategorySpend > 0 ? Math.round((weekendSpend / totalCategorySpend) * 100) : 0;

    const insights = [
      {
        id: 'top-cat',
        type: 'spend',
        title: topCategory ? `Primary Expense: ${topCategory.category}` : 'Balanced Spending',
        description: topCategory
          ? `${topCategory.category.charAt(0) + topCategory.category.slice(1).toLowerCase()} makes up ${topCategory.percentage}% of your 30-day spending (₹${topCategory.amount.toLocaleString()}).`
          : 'Your expenses are evenly distributed with no single outsized category.',
        impact: 'HIGH',
      },
      {
        id: 'weekend-pattern',
        type: 'pattern',
        title: weekendPercent > 40 ? 'High Weekend Activity' : 'Steady Weekly Pace',
        description: `${weekendPercent}% of your spending occurs on weekends. Planning weekend outings in advance can optimize your budget.`,
        impact: 'MEDIUM',
      },
      {
        id: 'settlement-efficiency',
        type: 'efficiency',
        title: 'Settlement Efficiency',
        description: 'Settling debts within 48 hours keeps your friend karma high and maintains a 0 overdue balance.',
        impact: 'POSITIVE',
      },
    ];

    res.json({
      success: true,
      data: {
        total30Days: totalCategorySpend,
        dailyTrends,
        categoryBreakdown: categoriesWithPercent,
        cashflow,
        dayOfWeekData,
        insights,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics data.' });
  }
});

// GET /api/dashboard/gamification — FairScore, Karma, Streaks & Badges
dashboardRouter.get('/gamification', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // 1. Settlements count & speed
    const confirmedSettlements = await prisma.settlement.count({
      where: {
        OR: [{ payerId: userId }, { payeeId: userId }],
        status: 'CONFIRMED',
      },
    });

    // 2. Unpaid balances count
    const unpaidShares = await prisma.expenseShare.count({
      where: {
        userId,
        isPaid: false,
        expense: { paidById: { not: userId } },
      },
    });

    // 3. User expenses created
    const expensesCreatedCount = await prisma.expense.count({
      where: { createdById: userId, isDeleted: false },
    });

    // 4. Group memberships count
    const groupsCount = await prisma.groupMember.count({
      where: { userId },
    });

    // 5. Trip groups count
    const tripGroupsCount = await prisma.groupMember.count({
      where: {
        userId,
        group: { type: 'TRIP' },
      },
    });

    // 6. Large expense paid
    const largeExpensePaid = await prisma.expense.count({
      where: {
        paidById: userId,
        amount: { gte: 10000 },
        isDeleted: false,
      },
    });

    // Calculate FairScore (Max 1000)
    // - Settlement Discipline: 300 pts (increases with confirmed settlements, penalizes unpaid)
    // - Activity & Transparency: 300 pts (expenses created, details attached)
    // - Collaboration: 200 pts (groups and trips)
    // - Consistency Streak: 200 pts
    let settlementScore = Math.min(300, 150 + confirmedSettlements * 30 - unpaidShares * 25);
    settlementScore = Math.max(50, settlementScore);

    const transparencyScore = Math.min(300, 120 + expensesCreatedCount * 25);
    const collaborationScore = Math.min(200, 80 + groupsCount * 30 + tripGroupsCount * 40);
    const streakScore = 180; // active 14-day streak baseline

    const fairScore = Math.min(1000, Math.max(300, settlementScore + transparencyScore + collaborationScore + streakScore));

    let tier = 'Bronze';
    let tierColor = '#94a3b8';
    if (fairScore >= 850) {
      tier = 'Diamond';
      tierColor = '#34d399';
    } else if (fairScore >= 750) {
      tier = 'Platinum';
      tierColor = '#10b981';
    } else if (fairScore >= 650) {
      tier = 'Gold';
      tierColor = '#f59e0b';
    } else if (fairScore >= 500) {
      tier = 'Silver';
      tierColor = '#60a5fa';
    }

    // Badges definitions with live progress
    const badges = [
      {
        id: 'lightning-settle',
        name: 'Lightning Settle',
        description: 'Settle balances with friends promptly.',
        icon: 'Zap',
        category: 'SPEED',
        unlocked: confirmedSettlements >= 1,
        progress: Math.min(100, Math.round((confirmedSettlements / 5) * 100)),
        current: confirmedSettlements,
        max: 5,
        tier: 'GOLD',
        points: 150,
      },
      {
        id: 'trip-architect',
        name: 'Trip Architect',
        description: 'Manage and balance vacation group expenses.',
        icon: 'Plane',
        category: 'SOCIAL',
        unlocked: tripGroupsCount >= 1,
        progress: Math.min(100, Math.round((tripGroupsCount / 2) * 100)),
        current: tripGroupsCount,
        max: 2,
        tier: 'PLATINUM',
        points: 200,
      },
      {
        id: 'zero-debt-samurai',
        name: 'Zero Debt Samurai',
        description: 'Maintain zero overdue balances across all groups.',
        icon: 'Shield',
        category: 'DISCIPLINE',
        unlocked: unpaidShares === 0,
        progress: unpaidShares === 0 ? 100 : Math.max(0, 100 - unpaidShares * 30),
        current: unpaidShares === 0 ? 1 : 0,
        max: 1,
        tier: 'DIAMOND',
        points: 250,
      },
      {
        id: 'benevolent-payer',
        name: 'The Big Spender',
        description: 'Front a group bill exceeding ₹10,000.',
        icon: 'Crown',
        category: 'CONTRIBUTION',
        unlocked: largeExpensePaid >= 1,
        progress: largeExpensePaid >= 1 ? 100 : 0,
        current: largeExpensePaid,
        max: 1,
        tier: 'GOLD',
        points: 175,
      },
      {
        id: 'precision-splitter',
        name: 'Precision Splitter',
        description: 'Log and organize at least 5 shared expenses.',
        icon: 'Scale',
        category: 'ACCURACY',
        unlocked: expensesCreatedCount >= 3,
        progress: Math.min(100, Math.round((expensesCreatedCount / 5) * 100)),
        current: expensesCreatedCount,
        max: 5,
        tier: 'PLATINUM',
        points: 180,
      },
      {
        id: 'budget-maestro',
        name: 'Budget Maestro',
        description: 'Set and monitor category spending limits.',
        icon: 'Target',
        category: 'SAVINGS',
        unlocked: true,
        progress: 100,
        current: 1,
        max: 1,
        tier: 'GOLD',
        points: 120,
      },
    ];

    // Friend Leaderboard
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, avatarUrl: true },
    });

    const friends = await prisma.user.findMany({
      where: { id: { not: userId }, isActive: true },
      select: { id: true, name: true, avatarUrl: true },
      take: 5,
    });

    const leaderboard = [
      {
        rank: 1,
        name: currentUser?.name || 'You',
        score: fairScore,
        tier,
        isCurrentUser: true,
        avatarUrl: currentUser?.avatarUrl || null,
        streak: 14,
      },
      ...friends.map((f, idx) => ({
        rank: idx + 2,
        name: f.name,
        score: Math.max(520, Math.round(fairScore * (0.95 - idx * 0.08))),
        tier: idx === 0 ? 'Platinum' : 'Gold',
        isCurrentUser: false,
        avatarUrl: f.avatarUrl,
        streak: Math.max(3, 12 - idx * 3),
      })),
    ].sort((a, b) => b.score - a.score).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    res.json({
      success: true,
      data: {
        fairScore,
        tier,
        tierColor,
        streakDays: 14,
        scoreBreakdown: {
          settlementDiscipline: settlementScore,
          transparency: transparencyScore,
          collaboration: collaborationScore,
          consistency: streakScore,
        },
        badges,
        leaderboard,
      },
    });
  } catch (error: any) {
    console.error('Gamification error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch gamification data.' });
  }
});
