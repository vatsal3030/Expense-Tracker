import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';

export const groupRouter = Router();
groupRouter.use(authenticate);

// Security metadata helpers for password protection and admin approval
function encodeGroupMeta(description?: string | null, password?: string | null, requireAdminApproval?: boolean | null): string | undefined {
  if (!password && !requireAdminApproval) return description || undefined;
  const meta = { pwd: password || null, approval: Boolean(requireAdminApproval) };
  const clean = (description || '').replace(/\s*<!--fs_meta:.*?-->\s*/g, '').trim();
  return `${clean}\n<!--fs_meta:${JSON.stringify(meta)}-->`;
}

export function parseGroupMeta(description?: string | null) {
  if (!description) return { description: '', isPasswordProtected: false, password: null as string | null, requireAdminApproval: false };
  const match = description.match(/<!--fs_meta:(.*?)-->/);
  if (!match) return { description, isPasswordProtected: false, password: null as string | null, requireAdminApproval: false };
  try {
    const meta = JSON.parse(match[1]);
    const clean = description.replace(/\s*<!--fs_meta:.*?-->\s*/g, '').trim();
    return {
      description: clean,
      isPasswordProtected: Boolean(meta.pwd),
      password: (meta.pwd as string) || null,
      requireAdminApproval: Boolean(meta.approval),
    };
  } catch {
    return { description, isPasswordProtected: false, password: null as string | null, requireAdminApproval: false };
  }
}

// POST /api/groups — Create a new group
const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['HOME', 'TRIP', 'COUPLE', 'OFFICE', 'FRIENDS', 'FAMILY', 'PROJECT', 'OTHER']).optional(),
  currency: z.string().length(3).default('INR'),
  memberIds: z.array(z.string().uuid()).optional(),
  password: z.string().max(50).optional(),
  requireAdminApproval: z.boolean().optional(),
});

groupRouter.post(
  '/',
  validate({ body: createGroupSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, description, type, currency, memberIds, password, requireAdminApproval } = req.body;
      const finalDescription = encodeGroupMeta(description, password, requireAdminApproval);

      const group = await prisma.group.create({
        data: {
          name,
          description: finalDescription,
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

      const meta = parseGroupMeta(group.description);
      res.status(201).json({
        success: true,
        data: {
          ...group,
          description: meta.description,
          isPasswordProtected: meta.isPasswordProtected,
          requireAdminApproval: meta.requireAdminApproval,
        },
      });
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

    const mapped = groups.map((g) => {
      const meta = parseGroupMeta(g.description);
      return {
        ...g,
        description: meta.description,
        isPasswordProtected: meta.isPasswordProtected,
        requireAdminApproval: meta.requireAdminApproval,
      };
    });

    res.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch groups.' });
  }
});

// GET /api/groups/public/:id — Public info for invite link preview
groupRouter.get('/public/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found.' });
      return;
    }

    const meta = parseGroupMeta(group.description);
    const admin = group.members.find((m) => m.role === 'ADMIN');
    const isMember = group.members.some((m) => m.userId === req.user?.id);

    res.json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        type: group.type,
        currency: group.currency,
        memberCount: group.members.length,
        adminName: admin?.user?.name || 'Admin',
        isPasswordProtected: meta.isPasswordProtected,
        requireAdminApproval: meta.requireAdminApproval,
        isMember,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch group info.' });
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

    const meta = parseGroupMeta(group.description);
    res.json({
      success: true,
      data: {
        ...group,
        description: meta.description,
        isPasswordProtected: meta.isPasswordProtected,
        requireAdminApproval: meta.requireAdminApproval,
      },
    });
  } catch (error: any) {
    console.error('Get group error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch group details.' });
  }
});

// GET /api/groups/:id/invite — Generate shareable group invite link
groupRouter.get('/:id/invite', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const group = await prisma.group.findFirst({
      where: {
        id,
        members: { some: { userId: req.user!.id } },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found.' });
      return;
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const inviteUrl = `${clientUrl}/groups/join/${id}`;
    const meta = parseGroupMeta(group.description);

    res.json({
      success: true,
      data: {
        inviteUrl,
        code: id.slice(0, 8).toUpperCase(),
        isPasswordProtected: meta.isPasswordProtected,
        requireAdminApproval: meta.requireAdminApproval,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to generate invite link.' });
  }
});

// POST /api/groups/:id/join — Join group via invite link (checks password and admin approval)
groupRouter.post('/:id/join', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const { passcode } = req.body;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found or invite expired.' });
      return;
    }

    // Check if already a member
    const existing = group.members.find((m) => m.userId === userId);
    if (existing) {
      res.json({ success: true, message: 'You are already a member of this group.', data: { status: 'ALREADY_MEMBER', groupId: id } });
      return;
    }

    const meta = parseGroupMeta(group.description);

    // Verify passcode if protected
    if (meta.isPasswordProtected && meta.password) {
      if (!passcode || passcode.trim() !== meta.password.trim()) {
        res.status(403).json({ success: false, error: 'Invalid group password. Please enter the correct passcode.' });
        return;
      }
    }

    // If admin approval is required, send request notification instead of immediate join
    if (meta.requireAdminApproval) {
      const adminMember = group.members.find((m) => m.role === 'ADMIN');
      const requester = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

      if (adminMember) {
        await prisma.notification.create({
          data: {
            userId: adminMember.userId,
            type: 'GROUP_INVITE',
            title: 'Group Join Request',
            message: `${requester?.name || 'A user'} requested to join "${group.name}".`,
            data: { groupId: id, requesterId: userId },
          },
        });
      }

      res.json({
        success: true,
        data: {
          status: 'PENDING_APPROVAL',
          message: 'Join request sent! An admin must approve before you can enter.',
        },
      });
      return;
    }

    // Direct join
    const member = await prisma.groupMember.create({
      data: { groupId: id, userId, role: 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });

    await prisma.activity.create({
      data: {
        userId,
        groupId: id,
        type: 'GROUP_MEMBER_ADDED',
        message: `joined the group via invite link`,
      },
    });

    res.json({
      success: true,
      data: {
        status: 'JOINED',
        message: 'Successfully joined the group!',
        member,
      },
    });
  } catch (error: any) {
    console.error('Join group error:', error);
    res.status(500).json({ success: false, error: 'Failed to join group.' });
  }
});

// POST /api/groups/:id/members — Add member to group (by userId, email, or phone)
const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(5, 'Invalid phone number').optional(),
}).refine((data) => data.userId || data.email || data.phone, {
  message: 'Please provide userId, email, or phone number',
});

groupRouter.post(
  '/:id/members',
  validate({ body: addMemberSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { userId, email, phone } = req.body;

      // Verify requester is group member
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId: req.user!.id } },
      });

      if (!membership) {
        res.status(403).json({ success: false, error: 'You are not a member of this group.' });
        return;
      }

      let targetUserId = userId;

      if (!targetUserId && email) {
        let u = await prisma.user.findFirst({
          where: { email: { equals: email.trim(), mode: 'insensitive' } },
        });
        if (!u) {
          u = await prisma.user.create({
            data: {
              email: email.trim().toLowerCase(),
              name: email.split('@')[0],
              isActive: false,
            },
          });
        }
        targetUserId = u.id;
      } else if (!targetUserId && phone) {
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
        targetUserId = u.id;
      }

      // Check if already a member
      const existingMember = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId: targetUserId } },
      });

      if (existingMember) {
        res.status(409).json({ success: false, error: 'User is already a member of this group.' });
        return;
      }

      const member = await prisma.groupMember.create({
        data: { groupId: id, userId: targetUserId, role: 'MEMBER' },
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

      // Notify added user
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'GROUP_JOINED',
          title: 'Added to Group',
          message: `You were added to group "${membership.groupId}" by ${req.user!.email}.`,
          data: { groupId: id },
        },
      }).catch(() => {});

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
