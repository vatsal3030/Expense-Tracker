import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';

export const friendRouter = Router();
friendRouter.use(authenticate);

// POST /api/friends/request — Send friend request (by friendId, email, or phone)
const friendRequestSchema = z.object({
  friendId: z.string().uuid('Invalid user ID').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(5, 'Invalid phone number').optional(),
}).refine((data) => data.friendId || data.email || data.phone, {
  message: 'Please provide friendId, email, or phone number',
});

// GET /api/friends/invite-link — Get shareable friend invite link
friendRouter.get('/invite-link', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const inviteUrl = `${clientUrl}/friends?invite=${userId}`;
    res.json({ success: true, data: { inviteUrl } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to generate invite link.' });
  }
});

friendRouter.post(
  '/request',
  validate({ body: friendRequestSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { friendId, email, phone } = req.body;
      const userId = req.user!.id;
      let targetFriendId = friendId;

      // Look up friend by email or phone if friendId not directly provided
      if (!targetFriendId && email) {
        let u = await prisma.user.findFirst({
          where: { email: { equals: email.trim(), mode: 'insensitive' } },
        });
        if (!u) {
          // Auto-create pending user for invite
          u = await prisma.user.create({
            data: {
              email: email.trim().toLowerCase(),
              name: email.split('@')[0],
              isActive: false,
            },
          });
        }
        targetFriendId = u.id;
      } else if (!targetFriendId && phone) {
        let u = await prisma.user.findFirst({
          where: { phone: phone.trim() },
        });
        if (!u) {
          const cleanPhone = phone.trim().replace(/\D/g, '');
          u = await prisma.user.create({
            data: {
              email: `${cleanPhone}@invited.fairshare.local`,
              name: `Friend (${phone.trim()})`,
              phone: phone.trim(),
              isActive: false,
            },
          });
        }
        targetFriendId = u.id;
      }

      if (targetFriendId === userId) {
        res.status(400).json({ success: false, error: 'Cannot send friend request to yourself.' });
        return;
      }

      // Check if friendship already exists
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId: targetFriendId },
            { userId: targetFriendId, friendId: userId },
          ],
        },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: existing.status === 'PENDING' ? 'Friend request already pending.' : 'Already friends.',
        });
        return;
      }

      const friendship = await prisma.friendship.create({
        data: { userId, friendId: targetFriendId, status: 'PENDING' },
        include: {
          friend: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      // Notify the friend
      const requester = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: targetFriendId,
          type: 'FRIEND_REQUEST',
          title: 'New Friend Request',
          message: `${requester?.name || 'A user'} sent you a friend request.`,
          data: { friendshipId: friendship.id },
        },
      });

      res.status(201).json({ success: true, data: friendship });
    } catch (error: any) {
      console.error('Friend request error:', error);
      res.status(500).json({ success: false, error: 'Failed to send friend request.' });
    }
  }
);

// GET /api/friends — Get all friends
friendRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        friend: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Normalize — always return the "other" person
    const friends = friendships.map((f) => ({
      friendshipId: f.id,
      friend: f.userId === userId ? f.friend : f.user,
      since: f.updatedAt,
    }));

    res.json({ success: true, data: friends });
  } catch (error: any) {
    console.error('Get friends error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch friends.' });
  }
});

// GET /api/friends/pending — Get pending friend requests
friendRouter.get('/pending', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requests = await prisma.friendship.findMany({
      where: { friendId: req.user!.id, status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: requests });
  } catch (error: any) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending requests.' });
  }
});

// PATCH /api/friends/:id/accept — Accept friend request
friendRouter.patch('/:id/accept', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const friendship = await prisma.friendship.findFirst({
      where: { id, friendId: req.user!.id, status: 'PENDING' },
    });

    if (!friendship) {
      res.status(404).json({ success: false, error: 'Friend request not found.' });
      return;
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: 'ACCEPTED' },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        friend: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Accept friend error:', error);
    res.status(500).json({ success: false, error: 'Failed to accept friend request.' });
  }
});

// DELETE /api/friends/:id — Remove friend
friendRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const friendship = await prisma.friendship.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user!.id },
          { friendId: req.user!.id },
        ],
      },
    });

    if (!friendship) {
      res.status(404).json({ success: false, error: 'Friendship not found.' });
      return;
    }

    await prisma.friendship.delete({ where: { id } });
    res.json({ success: true, message: 'Friend removed.' });
  } catch (error: any) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove friend.' });
  }
});
