import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export const settlementRouter = Router();
settlementRouter.use(authenticate);

// POST /api/settlements — Create a settlement
const createSettlementSchema = z.object({
  groupId: z.string().uuid().optional().nullable(),
  payeeId: z.string().uuid('Payee ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('INR'),
  notes: z.string().max(500).optional(),
});

settlementRouter.post(
  '/',
  validate({ body: createSettlementSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { groupId, payeeId, amount, currency, notes } = req.body;

      if (payeeId === req.user!.id) {
        res.status(400).json({ success: false, error: 'Cannot settle with yourself.' });
        return;
      }

      const settlement = await prisma.settlement.create({
        data: {
          groupId: groupId || null,
          payerId: req.user!.id,
          payeeId,
          amount: new Decimal(amount),
          currency,
          notes,
          status: 'PENDING',
        },
        include: {
          payer: { select: { id: true, name: true, avatarUrl: true } },
          payee: { select: { id: true, name: true, avatarUrl: true } },
          group: { select: { id: true, name: true } },
        },
      });

      // Create notification for payee
      await prisma.notification.create({
        data: {
          userId: payeeId,
          type: 'SETTLEMENT_REQUEST',
          title: 'Settlement Request',
          message: `${settlement.payer.name} wants to settle ₹${amount.toFixed(2)} with you.`,
          data: { settlementId: settlement.id },
        },
      });

      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          groupId: groupId || null,
          type: 'SETTLEMENT_CREATED',
          message: `recorded a payment of ₹${amount.toFixed(2)} to ${settlement.payee.name}`,
        },
      });

      res.status(201).json({ success: true, data: settlement });
    } catch (error: any) {
      console.error('Create settlement error:', error);
      res.status(500).json({ success: false, error: 'Failed to create settlement.' });
    }
  }
);

// GET /api/settlements — Get settlements
settlementRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);

    const where: any = {
      OR: [
        { payerId: req.user!.id },
        { payeeId: req.user!.id },
      ],
    };

    if (groupId) where.groupId = groupId;
    if (status) where.status = status;

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        include: {
          payer: { select: { id: true, name: true, avatarUrl: true } },
          payee: { select: { id: true, name: true, avatarUrl: true } },
          group: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.settlement.count({ where }),
    ]);

    res.json({
      success: true,
      data: settlements,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    console.error('Get settlements error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settlements.' });
  }
});

// PATCH /api/settlements/:id/confirm — Confirm a settlement
settlementRouter.patch('/:id/confirm', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const settlement = await prisma.settlement.findFirst({
      where: { id, payeeId: req.user!.id, status: 'PENDING' },
    });

    if (!settlement) {
      res.status(404).json({ success: false, error: 'Settlement not found or already processed.' });
      return;
    }

    const updated = await prisma.settlement.update({
      where: { id },
      data: { status: 'CONFIRMED', settledAt: new Date() },
      include: {
        payer: { select: { id: true, name: true, avatarUrl: true } },
        payee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Notify payer
    await prisma.notification.create({
      data: {
        userId: settlement.payerId,
        type: 'SETTLEMENT_CONFIRMED',
        title: 'Settlement Confirmed',
        message: `${updated.payee.name} confirmed your payment of ₹${Number(settlement.amount).toFixed(2)}.`,
        data: { settlementId: settlement.id },
      },
    });

    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        groupId: settlement.groupId,
        type: 'SETTLEMENT_CONFIRMED',
        message: `confirmed settlement of ₹${Number(settlement.amount).toFixed(2)} from ${updated.payer.name}`,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Confirm settlement error:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm settlement.' });
  }
});

// PATCH /api/settlements/:id/reject — Reject a settlement
settlementRouter.patch('/:id/reject', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const settlement = await prisma.settlement.findFirst({
      where: { id, payeeId: req.user!.id, status: 'PENDING' },
    });

    if (!settlement) {
      res.status(404).json({ success: false, error: 'Settlement not found or already processed.' });
      return;
    }

    const updated = await prisma.settlement.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        payer: { select: { id: true, name: true } },
        payee: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Reject settlement error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject settlement.' });
  }
});
