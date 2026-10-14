import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';

export const userRouter = Router();

// All user routes require authentication
userRouter.use(authenticate);

// GET /api/users/profile — Get current user's full profile
userRouter.get('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        _count: {
          select: {
            groupMembers: true,
            expensesPaid: true,
            friendsInitiated: { where: { status: 'ACCEPTED' } },
            friendsReceived: { where: { status: 'ACCEPTED' } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        ...user,
        totalFriends: user._count.friendsInitiated + user._count.friendsReceived,
        totalGroups: user._count.groupMembers,
        totalExpenses: user._count.expensesPaid,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile.' });
  }
});

// PUT /api/users/profile — Update user profile
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  defaultCurrency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

userRouter.put(
  '/profile',
  validate({ body: updateProfileSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: req.body,
      });

      res.json({
        success: true,
        data: updated,
        message: 'Profile updated successfully.',
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to update profile.' });
    }
  }
);

// GET /api/users/search?q=query — Search users by email or name
userRouter.get('/search', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string)?.trim();

    if (!query || query.length < 2) {
      res.status(400).json({ success: false, error: 'Search query must be at least 2 characters.' });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user!.id } },
          {
            OR: [
              { email: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
      take: 10,
    });

    res.json({ success: true, data: users });
  } catch (error: any) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, error: 'Search failed.' });
  }
});
