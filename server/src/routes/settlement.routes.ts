import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import appCache from '../lib/cache';
import { parseGroupMeta } from '../lib/groupMeta';
import { emitToUser, emitToGroup } from '../lib/socket';

export const settlementRouter = Router();
settlementRouter.use(authenticate);

// POST /api/settlements — Create a settlement
const createSettlementSchema = z.object({
  groupId: z.string().uuid().optional().nullable(),
  payeeId: z.string().uuid('Payee ID is required'),
  amount: z.number().positive('Amount must be positive').min(0.01, 'Minimum settlement is ₹0.01').max(10000000, 'Settlement amount cannot exceed ₹10,000,000'),
  currency: z.string().trim().length(3).default('INR'),
  notes: z.string().trim().max(300, 'Notes cannot exceed 300 characters').optional(),
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

      // Idempotency guard: prevent duplicate settlement submissions within 8 seconds
      const idempotencyKey = (req.headers['idempotency-key'] as string) || `settle:${req.user!.id}:${payeeId}:${amount}:${groupId || 'none'}`;
      const cachedSettlement = appCache.getSync(`idempotent:${idempotencyKey}`);
      if (cachedSettlement) {
        res.status(200).json({ success: true, data: cachedSettlement, idempotent: true });
        return;
      }

      // Check group setting: Does group require explicit payee confirmation?
      let autoConfirm = false;
      if (groupId) {
        const grp = await prisma.group.findUnique({
          where: { id: groupId },
          select: { description: true },
        });
        if (grp) {
          const meta = parseGroupMeta(grp.description);
          autoConfirm = !meta.requireSettlementConfirmation;
        }
      }

      const settlement = await prisma.settlement.create({
        data: {
          groupId: groupId || null,
          payerId: req.user!.id,
          payeeId,
          amount: new Prisma.Decimal(amount),
          currency,
          notes,
          status: autoConfirm ? 'CONFIRMED' : 'PENDING',
          settledAt: autoConfirm ? new Date() : null,
        },
        include: {
          payer: { select: { id: true, name: true, avatarUrl: true } },
          payee: { select: { id: true, name: true, avatarUrl: true } },
          group: { select: { id: true, name: true } },
        },
      });

      // Create notification for payee
      const notifType = autoConfirm ? 'SETTLEMENT_CONFIRMED' : 'SETTLEMENT_REQUEST';
      const notifTitle = autoConfirm ? 'Payment Settled' : 'Settlement Request';
      const notifMessage = autoConfirm
        ? `${settlement.payer.name} settled ₹${amount.toFixed(2)} with you.`
        : `${settlement.payer.name} wants to settle ₹${amount.toFixed(2)} with you.`;

      const notif = await prisma.notification.create({
        data: {
          userId: payeeId,
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          data: { settlementId: settlement.id },
        },
      });

      emitToUser(payeeId, 'notification', notif);
      emitToUser(payeeId, 'settlement:created', settlement);
      emitToUser(req.user!.id, 'settlement:created', settlement);
      if (groupId) {
        emitToGroup(groupId, 'settlement:created', settlement);
      }

      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          groupId: groupId || null,
          type: autoConfirm ? 'SETTLEMENT_CONFIRMED' : 'SETTLEMENT_CREATED',
          message: `${autoConfirm ? 'settled' : 'recorded a payment of'} ₹${amount.toFixed(2)} to ${settlement.payee.name}`,
        },
      });

      appCache.invalidatePrefix('dashboard:');
      if (groupId) {
        appCache.invalidatePrefix(`group:${groupId}`);
        appCache.invalidatePrefix('groups:list');
      }
      appCache.set(`idempotent:${idempotencyKey}`, settlement, 8000);

      res.status(201).json({ success: true, data: settlement });
    } catch (error: any) {
      console.error('Create settlement error:', error);
      res.status(500).json({ success: false, error: 'Failed to create settlement.' });
    }
  }
);

// GET /api/settlements/simplified — Splitwise-style Global Debt Simplification
settlementRouter.get('/simplified', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;

    // Fetch all user's shared expenses (where user is payer or participant)
    const expenses = await prisma.expense.findMany({
      where: {
        isDeleted: false,
        OR: [
          { paidById: currentUserId },
          { shares: { some: { userId: currentUserId } } },
        ],
      },
      include: {
        paidBy: { select: { id: true, name: true, avatarUrl: true } },
        shares: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      },
    });

    // Fetch all confirmed settlements
    const settlements = await prisma.settlement.findMany({
      where: {
        status: 'CONFIRMED',
        OR: [
          { payerId: currentUserId },
          { payeeId: currentUserId },
        ],
      },
      include: {
        payer: { select: { id: true, name: true, avatarUrl: true } },
        payee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Map net balances across all counterparties
    const userMap = new Map<string, { id: string; name: string; avatarUrl: string | null }>();
    const balanceMap: Record<string, number> = {};

    for (const exp of expenses) {
      const payerId = exp.paidById;
      userMap.set(payerId, exp.paidBy);

      for (const share of exp.shares) {
        const debtorId = share.userId;
        userMap.set(debtorId, share.user);
        const shareAmount = Number(share.amount);

        if (payerId !== debtorId) {
          balanceMap[payerId] = (balanceMap[payerId] || 0) + shareAmount;
          balanceMap[debtorId] = (balanceMap[debtorId] || 0) - shareAmount;
        }
      }
    }

    for (const set of settlements) {
      const amount = Number(set.amount);
      userMap.set(set.payerId, set.payer);
      userMap.set(set.payeeId, set.payee);

      balanceMap[set.payerId] = (balanceMap[set.payerId] || 0) + amount;
      balanceMap[set.payeeId] = (balanceMap[set.payeeId] || 0) - amount;
    }

    const balances = Array.from(userMap.values()).map((u) => ({
      user: u,
      balance: Math.round((balanceMap[u.id] || 0) * 100) / 100,
    }));

    // Splitwise Min-Cash-Flow Algorithm:
    // Separate into debtors (< 0) and creditors (> 0)
    const debtors = balances
      .filter((b) => b.balance < -0.01)
      .map((b) => ({ ...b.user, amount: Math.abs(b.balance) }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = balances
      .filter((b) => b.balance > 0.01)
      .map((b) => ({ ...b.user, amount: b.balance }))
      .sort((a, b) => b.amount - a.amount);

    const simplifiedDebts: Array<{
      from: { id: string; name: string; avatarUrl: string | null };
      to: { id: string; name: string; avatarUrl: string | null };
      amount: number;
    }> = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const transferAmount = Math.min(debtor.amount, creditor.amount);

      if (transferAmount > 0.01) {
        simplifiedDebts.push({
          from: { id: debtor.id, name: debtor.name, avatarUrl: debtor.avatarUrl },
          to: { id: creditor.id, name: creditor.name, avatarUrl: creditor.avatarUrl },
          amount: Math.round(transferAmount * 100) / 100,
        });
      }

      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    res.json({
      success: true,
      data: {
        balances,
        simplifiedDebts,
        currentUserBalance: balanceMap[currentUserId] || 0,
        savingsCount: Math.max(0, expenses.length - simplifiedDebts.length),
      },
    });
  } catch (error: any) {
    console.error('Simplify debts error:', error);
    res.status(500).json({ success: false, error: 'Failed to simplify debts.' });
  }
});

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

    appCache.invalidatePrefix('dashboard:');
    if (settlement.groupId) {
      appCache.invalidatePrefix(`group:${settlement.groupId}`);
      appCache.invalidatePrefix('groups:list');
      emitToGroup(settlement.groupId, 'settlement:confirmed', updated);
    }
    emitToUser(settlement.payerId, 'settlement:confirmed', updated);
    emitToUser(req.user!.id, 'settlement:confirmed', updated);

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

// DELETE /api/settlements/:id — Cancel pending settlement (Payer/Creator accountability)
settlementRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const settlement = await prisma.settlement.findFirst({
      where: { id, payerId: req.user!.id, status: 'PENDING' },
    });

    if (!settlement) {
      res.status(404).json({ success: false, error: 'Pending settlement not found or already processed.' });
      return;
    }

    await prisma.settlement.delete({ where: { id } });

    appCache.invalidatePrefix('dashboard:');

    res.json({ success: true, message: 'Settlement request cancelled successfully.' });
  } catch (error: any) {
    console.error('Cancel settlement error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel settlement.' });
  }
});
