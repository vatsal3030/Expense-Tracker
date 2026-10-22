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

    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'rajkotgamer74@gmail.com,vatsalvadgama30@gmail.com,admin@fairshare.com')
      .split(',')
      .map((e) => e.trim().toLowerCase());

    const isAdmin = Boolean(user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

    res.json({
      success: true,
      data: {
        ...user,
        isAdmin,
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

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'support', 'help', 'fairshare',
  'api', 'auth', 'system', 'null', 'undefined', 'mod', 'staff',
  'official', 'team', 'security', 'billing', 'terms', 'privacy',
  'settings', 'dashboard', 'expenses', 'groups', 'friends', 'reports', 'notifications'
]);

// GET /api/users/check-username?username=xyz — Check username format & availability
userRouter.get('/check-username', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const raw = (req.query.username as string)?.trim().toLowerCase();

    if (!raw) {
      res.status(400).json({ success: false, error: 'Username query parameter is required.' });
      return;
    }

    if (raw.length < 3 || raw.length > 30) {
      res.json({
        success: true,
        data: {
          available: false,
          isCurrent: false,
          message: 'Username must be between 3 and 30 characters.',
        },
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(raw)) {
      res.json({
        success: true,
        data: {
          available: false,
          isCurrent: false,
          message: 'Username can only contain letters, numbers, and underscores.',
        },
      });
      return;
    }

    if (RESERVED_USERNAMES.has(raw)) {
      res.json({
        success: true,
        data: {
          available: false,
          isCurrent: false,
          message: 'This username is reserved by the platform.',
        },
      });
      return;
    }

    // Check if the current user already has this username
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { username: true },
    });

    if (currentUser?.username?.toLowerCase() === raw) {
      res.json({
        success: true,
        data: {
          available: true,
          isCurrent: true,
          message: 'This is your current username.',
        },
      });
      return;
    }

    // Check if another user has this username
    const existing = await prisma.user.findFirst({
      where: {
        username: { equals: raw, mode: 'insensitive' },
        id: { not: req.user!.id },
      },
    });

    if (existing) {
      res.json({
        success: true,
        data: {
          available: false,
          isCurrent: false,
          message: 'Username is already taken by another user.',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        available: true,
        isCurrent: false,
        message: 'Username is available!',
      },
    });
  } catch (error: any) {
    console.error('Check username error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify username.' });
  }
});

// PUT /api/users/profile — Update user profile
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
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
      const dataToUpdate: any = { ...req.body };

      if (dataToUpdate.username) {
        const normalized = dataToUpdate.username.trim().toLowerCase();
        if (RESERVED_USERNAMES.has(normalized)) {
          res.status(400).json({ success: false, error: 'This username is reserved.' });
          return;
        }

        const existing = await prisma.user.findFirst({
          where: {
            username: { equals: normalized, mode: 'insensitive' },
            id: { not: req.user!.id },
          },
        });

        if (existing) {
          res.status(409).json({ success: false, error: 'Username is already taken.' });
          return;
        }

        dataToUpdate.username = normalized;
      }

      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: dataToUpdate,
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

// GET /api/users/search?q=query — Search users by name, email, or phone
userRouter.get('/search', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string)?.trim();
    const currentUserId = req.user!.id;

    if (!query || query.length < 2) {
      res.status(400).json({ success: false, error: 'Search query must be at least 2 characters.' });
      return;
    }

    const cleanDigits = query.replace(/\D/g, '');

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { email: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
              ...(cleanDigits.length >= 3 ? [{ phone: { contains: cleanDigits } }] : []),
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
      },
      take: 12,
    });

    if (users.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const userIds = users.map((u) => u.id);
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: currentUserId, friendId: { in: userIds } },
          { userId: { in: userIds }, friendId: currentUserId },
        ],
      },
    });

    const enrichedUsers = users.map((u) => {
      const f = friendships.find(
        (rel) =>
          (rel.userId === currentUserId && rel.friendId === u.id) ||
          (rel.userId === u.id && rel.friendId === currentUserId)
      );

      let friendshipStatus: 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' = 'NONE';
      let friendshipId: string | null = null;

      if (f) {
        friendshipId = f.id;
        if (f.status === 'ACCEPTED') {
          friendshipStatus = 'FRIENDS';
        } else if (f.userId === currentUserId) {
          friendshipStatus = 'REQUEST_SENT';
        } else {
          friendshipStatus = 'REQUEST_RECEIVED';
        }
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        friendshipStatus,
        friendshipId,
      };
    });

    res.json({ success: true, data: enrichedUsers });
  } catch (error: any) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, error: 'Search failed.' });
  }
});

// GET /api/users/:id/public-profile — Get safe, non-confidential friend/user public profile
userRouter.get('/:id/public-profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id as string;
    const currentUserId = req.user!.id;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        defaultCurrency: true,
      },
    });

    if (!targetUser) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    // Check friendship status
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: currentUserId, friendId: targetUserId },
          { userId: targetUserId, friendId: currentUserId },
        ],
      },
    });

    let friendshipStatus: 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' = 'NONE';
    let friendshipId: string | null = null;
    let friendsSince: Date | null = null;

    if (friendship) {
      friendshipId = friendship.id;
      if (friendship.status === 'ACCEPTED') {
        friendshipStatus = 'FRIENDS';
        friendsSince = friendship.updatedAt;
      } else if (friendship.userId === currentUserId) {
        friendshipStatus = 'REQUEST_SENT';
      } else {
        friendshipStatus = 'REQUEST_RECEIVED';
      }
    }

    // Find mutual groups where both users are active members
    const mutualGroups = await prisma.group.findMany({
      where: {
        AND: [
          { members: { some: { userId: currentUserId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        type: true,
        _count: { select: { members: true } },
      },
    });

    // Compute net balance between current user and target user
    // 1. Target owes current user: shares where userId is target, expense.paidById is current user, unpaid
    const theyOweMe = await prisma.expenseShare.aggregate({
      where: {
        userId: targetUserId,
        isPaid: false,
        expense: {
          paidById: currentUserId,
          isDeleted: false,
        },
      },
      _sum: { amount: true },
    });

    // 2. Current user owes target: shares where userId is current user, expense.paidById is target, unpaid
    const iOweThem = await prisma.expenseShare.aggregate({
      where: {
        userId: currentUserId,
        isPaid: false,
        expense: {
          paidById: targetUserId,
          isDeleted: false,
        },
      },
      _sum: { amount: true },
    });

    const owedToMe = Number(theyOweMe._sum.amount || 0);
    const owedByMe = Number(iOweThem._sum.amount || 0);
    const netBalance = owedToMe - owedByMe;

    // FairScore Tier calculation based on their settlements count
    const settlementsCount = await prisma.settlement.count({
      where: {
        OR: [{ payerId: targetUserId }, { payeeId: targetUserId }],
        status: 'CONFIRMED',
      },
    });

    let fairScoreTier = 'Silver';
    if (settlementsCount >= 20) fairScoreTier = 'Diamond';
    else if (settlementsCount >= 10) fairScoreTier = 'Platinum';
    else if (settlementsCount >= 3) fairScoreTier = 'Gold';

    res.json({
      success: true,
      data: {
        id: targetUser.id,
        name: targetUser.name,
        avatarUrl: targetUser.avatarUrl,
        memberSince: targetUser.createdAt,
        defaultCurrency: targetUser.defaultCurrency || 'INR',
        friendshipStatus,
        friendshipId,
        friendsSince,
        mutualGroups: mutualGroups.map((g) => ({
          id: g.id,
          name: g.name,
          imageUrl: g.imageUrl,
          type: g.type,
          memberCount: g._count.members,
        })),
        netBalance,
        fairScoreTier,
      },
    });
  } catch (error: any) {
    console.error('Get public profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch public profile.' });
  }
});

