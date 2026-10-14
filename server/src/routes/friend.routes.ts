import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';

export const friendRouter = Router();
friendRouter.use(authenticate);

// POST /api/friends/request — Send friend request
const friendRequestSchema = z.object({
  friendId: z.string().uuid('Invalid user ID'),
});

friendRouter.post(
  '/request',
  validate({ body: friendRequestSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { friendId } = req.body;
      const userId = req.user!.id;

      if (friendId === userId) {
        res.status(400).json({ success: false, error: 'Cannot send friend request to yourself.' });
        return;
      }

      // Check if friendship already exists
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
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
        data: { userId, friendId, status: 'PENDING' },
        include: {
          friend: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      // Notify the friend
      const requester = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: friendId,
          type: 'FRIEND_REQUEST',
          title: 'New Friend Request',
          message: `${requester?.name} sent you a friend request.`,
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
