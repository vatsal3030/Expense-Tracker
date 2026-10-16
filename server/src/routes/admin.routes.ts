import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const adminRouter = Router();

// Protect all admin routes with authentication
adminRouter.use(authenticate);

// Restricted to authorized platform administrators only
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'rajkotgamer74@gmail.com,vatsalvadgama30@gmail.com,admin@fairshare.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

adminRouter.use((req: AuthenticatedRequest, res: Response, next) => {
  const userEmail = req.user?.email?.toLowerCase();
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    res.status(403).json({ success: false, error: 'Access denied: Platform Administrator privileges required.' });
    return;
  }
  next();
});

// GET /api/admin/overview — Platform-wide telemetry and KPI metrics
adminRouter.get('/overview', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalGroups,
      totalExpenses,
      expenseVolume,
      totalSettlements,
      settlementVolume,
      totalFriendships,
      pendingFriendships,
      recentActivities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.group.count(),
      prisma.expense.count({ where: { isDeleted: false } }),
      prisma.expense.aggregate({
        where: { isDeleted: false },
        _sum: { amount: true },
      }),
      prisma.settlement.count({ where: { status: 'CONFIRMED' } }),
      prisma.settlement.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      prisma.friendship.count({ where: { status: 'ACCEPTED' } }),
      prisma.friendship.count({ where: { status: 'PENDING' } }),
      prisma.activity.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          group: { select: { id: true, name: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalGroups,
          totalExpenses,
          totalVolume: Number(expenseVolume._sum?.amount || 0),
          totalSettlements,
          settledVolume: Number(settlementVolume._sum?.amount || 0),
          totalFriendships,
          pendingFriendships,
        },
        recentActivities,
        system: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          timestamp: new Date().toISOString(),
          status: 'HEALTHY',
        },
      },
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch platform metrics.' });
  }
});

// GET /api/admin/users — List registered users with stats & filtering
adminRouter.get('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string)?.trim() || '';
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          defaultCurrency: true,
          _count: {
            select: {
              groupMembers: true,
              expensesCreated: true,
              expensesPaid: true,
              friendsInitiated: { where: { status: 'ACCEPTED' } },
              friendsReceived: { where: { status: 'ACCEPTED' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      defaultCurrency: u.defaultCurrency,
      groupsCount: u._count.groupMembers,
      expensesCount: u._count.expensesCreated + u._count.expensesPaid,
      friendsCount: u._count.friendsInitiated + u._count.friendsReceived,
    }));

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Admin users list error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users directory.' });
  }
});

// GET /api/admin/activity — Platform-wide recent audit activity
adminRouter.get('/activity', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const activities = await prisma.activity.findMany({
      take: 40,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        group: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: activities });
  } catch (error: any) {
    console.error('Admin activity log error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch platform activity.' });
  }
});

// PATCH /api/admin/users/:id/toggle-status — Toggle user active / suspended status
adminRouter.patch('/users/:id/toggle-status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetId = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, isActive: true } });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });

    res.json({
      success: true,
      data: updated,
      message: `User ${updated.name} has been ${updated.isActive ? 'reactivated' : 'deactivated'}.`,
    });
  } catch (error: any) {
    console.error('Admin toggle status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status.' });
  }
});
