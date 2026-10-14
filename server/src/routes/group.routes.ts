import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';

export const groupRouter = Router();
groupRouter.use(authenticate);

// POST /api/groups — Create a new group
const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['HOME', 'TRIP', 'COUPLE', 'OFFICE', 'FRIENDS', 'FAMILY', 'PROJECT', 'OTHER']).optional(),
  currency: z.string().length(3).default('INR'),
  memberIds: z.array(z.string().uuid()).optional(),
});

groupRouter.post(
  '/',
  validate({ body: createGroupSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, description, type, currency, memberIds } = req.body;

      const group = await prisma.group.create({
        data: {
          name,
          description,
          type: type || 'OTHER',
          currency: currency || 'INR',
          members: {
            create: [
              { userId: req.user!.id, role: 'ADMIN' },
              ...(memberIds || []).map((id: string) => ({ userId: id, role: 'MEMBER' as const })),
            ],
          },
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
        },
      });

      // Create activity
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          groupId: group.id,
          type: 'GROUP_CREATED',
          message: `created group "${name}"`,
        },
      });

      res.status(201).json({ success: true, data: group });
    } catch (error: any) {
      console.error('Create group error:', error);
      res.status(500).json({ success: false, error: 'Failed to create group.' });
    }
  }
);

// GET /api/groups — Get all groups for current user
groupRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        members: { some: { userId: req.user!.id } },
        isActive: true,
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        _count: { select: { expenses: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: groups });
  } catch (error: any) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch groups.' });
  }
});

// GET /api/groups/:id — Get group details
groupRouter.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const group = await prisma.group.findFirst({
      where: {
        id,
        members: { some: { userId: req.user!.id } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        expenses: {
          where: { isDeleted: false },
          include: {
            paidBy: { select: { id: true, name: true, avatarUrl: true } },
            shares: { include: { user: { select: { id: true, name: true } } } },
          },
          orderBy: { date: 'desc' },
          take: 20,
        },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found.' });
      return;
    }

    res.json({ success: true, data: group });
  } catch (error: any) {
    console.error('Get group error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch group details.' });
  }
});

// PUT /api/groups/:id — Update group
const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  type: z.enum(['HOME', 'TRIP', 'COUPLE', 'OFFICE', 'FRIENDS', 'FAMILY', 'PROJECT', 'OTHER']).optional(),
  currency: z.string().length(3).optional(),
});

groupRouter.put(
  '/:id',
  validate({ body: updateGroupSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;

      // Check admin access
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId: req.user!.id } },
      });

      if (!membership || membership.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Only group admins can update group settings.' });
        return;
      }

      const updated = await prisma.group.update({
        where: { id },
        data: req.body,
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          },
        },
      });

      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('Update group error:', error);
      res.status(500).json({ success: false, error: 'Failed to update group.' });
    }
  }
);

// POST /api/groups/:id/members — Add member to group
const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

groupRouter.post(
  '/:id/members',
  validate({ body: addMemberSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { userId } = req.body;

      // Verify requester is group member
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId: req.user!.id } },
      });

      if (!membership) {
        res.status(403).json({ success: false, error: 'You are not a member of this group.' });
        return;
      }

      // Check if already a member
      const existingMember = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId } },
      });

      if (existingMember) {
        res.status(409).json({ success: false, error: 'User is already a member of this group.' });
        return;
      }

      const member = await prisma.groupMember.create({
        data: { groupId: id, userId, role: 'MEMBER' },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      });

      // Activity log
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          groupId: id,
          type: 'GROUP_MEMBER_ADDED',
          message: `added ${member.user.name} to the group`,
        },
      });

      res.status(201).json({ success: true, data: member });
    } catch (error: any) {
      console.error('Add member error:', error);
      res.status(500).json({ success: false, error: 'Failed to add member.' });
    }
  }
);

// DELETE /api/groups/:id/members/:userId — Remove member from group
groupRouter.delete('/:id/members/:userId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.params.userId as string;

    // Check admin or self-removal
    const requesterMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: req.user!.id } },
    });

    if (!requesterMembership) {
      res.status(403).json({ success: false, error: 'Not a member of this group.' });
      return;
    }

    if (userId !== req.user!.id && requesterMembership.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only admins can remove other members.' });
      return;
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: id, userId } },
    });

    res.json({ success: true, message: 'Member removed successfully.' });
  } catch (error: any) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove member.' });
  }
});

// GET /api/groups/:id/balances — Get simplified balances for a group
groupRouter.get('/:id/balances', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: req.user!.id } },
    });

    if (!membership) {
      res.status(403).json({ success: false, error: 'Not a member of this group.' });
      return;
    }

    // Get all expenses and settlements for the group
    const expenses = await prisma.expense.findMany({
      where: { groupId: id, isDeleted: false },
      include: { shares: true },
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: id, status: 'CONFIRMED' },
    });

    // Calculate net balances
    const balanceMap: Record<string, number> = {};

    for (const expense of expenses) {
      const paidAmount = Number(expense.amount);
      balanceMap[expense.paidById] = (balanceMap[expense.paidById] || 0) + paidAmount;

      for (const share of expense.shares) {
        const shareAmount = Number(share.amount);
        balanceMap[share.userId] = (balanceMap[share.userId] || 0) - shareAmount;
      }
    }

    for (const settlement of settlements) {
      const amount = Number(settlement.amount);
      balanceMap[settlement.payerId] = (balanceMap[settlement.payerId] || 0) + amount;
      balanceMap[settlement.payeeId] = (balanceMap[settlement.payeeId] || 0) - amount;
    }

    // Get user details
    const members = await prisma.groupMember.findMany({
      where: { groupId: id },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    const balances = members.map((member) => ({
      user: member.user,
      balance: Math.round((balanceMap[member.userId] || 0) * 100) / 100,
    }));

    // Simplify debts (minimize transactions)
    const simplifiedDebts = simplifyDebts(balances);

    res.json({
      success: true,
      data: { balances, simplifiedDebts },
    });
  } catch (error: any) {
    console.error('Get balances error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate balances.' });
  }
});

/**
 * Debt simplification algorithm — minimizes the number of transactions
 * needed to settle all debts within a group.
 */
function simplifyDebts(
  balances: Array<{ user: { id: string; name: string; avatarUrl: string | null }; balance: number }>
): Array<{ from: { id: string; name: string }; to: { id: string; name: string }; amount: number }> {
  const debts: Array<{ from: { id: string; name: string }; to: { id: string; name: string }; amount: number }> = [];

  // Separate into debtors (negative balance) and creditors (positive balance)
  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b.user, amount: Math.abs(b.balance) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b.user, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transferAmount = Math.min(debtor.amount, creditor.amount);

    if (transferAmount > 0.01) {
      debts.push({
        from: { id: debtor.id, name: debtor.name },
        to: { id: creditor.id, name: creditor.name },
        amount: Math.round(transferAmount * 100) / 100,
      });
    }

    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return debts;
}
