import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const activityRouter = Router();
activityRouter.use(authenticate);

// GET /api/activities — Get recent activities
activityRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId, page = '1', limit = '30' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);

    const where: any = {
      OR: [
        { userId: req.user!.id },
        {
          group: {
            members: { some: { userId: req.user!.id } },
          },
        },
      ],
    };

    if (groupId) where.groupId = groupId;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          group: { select: { id: true, name: true } },
          expense: { select: { id: true, description: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.activity.count({ where }),
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    console.error('Get activities error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activities.' });
  }
});
