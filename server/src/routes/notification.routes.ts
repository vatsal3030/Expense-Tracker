import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const notificationRouter = Router();
notificationRouter.use(authenticate);

// GET /api/notifications — Get all notifications for current user
notificationRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications.' });
  }
});

// PATCH /api/notifications/:id/read — Mark single notification as read
notificationRouter.patch('/:id/read', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error: any) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification.' });
  }
});

// POST /api/notifications/mark-all-read — Mark all notifications as read
notificationRouter.post('/mark-all-read', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notifications.' });
  }
});

// DELETE /api/notifications — Clear all notifications
notificationRouter.delete('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.deleteMany({
      where: { userId },
    });

    res.json({ success: true, message: 'Notifications cleared.' });
  } catch (error: any) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to clear notifications.' });
  }
});
