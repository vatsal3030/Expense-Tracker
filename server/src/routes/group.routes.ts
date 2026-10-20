import { Router, Response } from 'express';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import appCache from '../lib/cache';

export const groupRouter = Router();

// Helper to provide comprehensive group rules & guidelines
function getGroupRules(type: string, isApprovalRequired: boolean, isPasswordProtected: boolean, currency: string): string[] {
  const rules = [
    'Fair & transparent ledger: all expenses and splits are recorded in real-time.',
    `All financial accounting is calculated in base currency (${currency}).`,
    'Settlements can be paid directly via UPI or logged in-app with instant balance reconciliation.',
  ];

  if (type === 'TRIP') {
    rules.unshift('Trip expenses are split equally among active travelers unless customized.');
    rules.push('Attach bills or keep original receipts for food, cabs, and accommodation.');
  } else if (type === 'HOME') {
    rules.unshift('Shared rent, utilities, and household supplies logged on a unified monthly ledger.');
    rules.push('Notify group members before committing to large unexpected shared purchases.');
  } else if (type === 'OFFICE' || type === 'PROJECT') {
    rules.unshift('Project and team outing expenses require clear descriptions and itemized receipts.');
  } else if (type === 'COUPLE') {
    rules.unshift('Shared partner finances with customizable split ratios.');
  }

  if (isApprovalRequired) {
    rules.push('Member admission requires approval by the group admin to maintain privacy.');
  }
  if (isPasswordProtected) {
    rules.push('A valid group passcode is required to complete joining.');
  }

  return rules;
}

// GET /api/groups/public/:id — Public info for invite link preview (open to unauthenticated & authenticated users)
groupRouter.get('/public/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found.' });
      return;
    }

    const meta = parseGroupMeta(group.description);
    const admin = group.members.find((m) => m.role === 'ADMIN') || group.members[0];
    const isMember = req.user?.id ? group.members.some((m) => m.userId === req.user?.id) : false;

    // Detect mutual friends (Instagram-style) if viewer is authenticated
    let mutualFriends: { id: string; name: string; avatarUrl: string | null }[] = [];
    if (req.user?.id) {
      const friendships = await prisma.friendship.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ userId: req.user.id }, { friendId: req.user.id }],
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          friend: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      const friendMap = new Map<string, { id: string; name: string; avatarUrl: string | null }>();
      for (const f of friendships) {
        const other = f.userId === req.user.id ? f.friend : f.user;
        if (other && other.id !== req.user.id) {
          friendMap.set(other.id, other);
        }
      }

      for (const m of group.members) {
        if (m.userId !== req.user.id && friendMap.has(m.userId)) {
          mutualFriends.push(friendMap.get(m.userId)!);
        }
      }
    }

    // Member preview list (up to 8 members)
    const membersPreview = group.members.slice(0, 8).map((m) => ({
      id: m.user.id,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    const rules = getGroupRules(group.type, meta.requireAdminApproval, meta.isPasswordProtected, group.currency);

    res.json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        description: meta.description || '',
        type: group.type,
        currency: group.currency,
        createdAt: group.createdAt,
        memberCount: group.members.length,
        expenseCount: group._count.expenses,
        admin: {
          name: admin?.user?.name || 'Group Admin',
          avatarUrl: admin?.user?.avatarUrl || null,
        },
        adminName: admin?.user?.name || 'Group Admin',
        isPasswordProtected: meta.isPasswordProtected,
        requireAdminApproval: meta.requireAdminApproval,
        isMember,
        mutualFriends,
        members: membersPreview,
        rules,
      },
    });
  } catch (error: any) {
    console.error('Public group info error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch group info.' });
  }
});

groupRouter.use(authenticate);

// Security and group configuration metadata helpers
async function encodeGroupMeta(
  description?: string | null,
  password?: string | null,
  requireAdminApproval?: boolean | null,
  onlyAdminInvite?: boolean | null,
  onlyAdminEdit?: boolean | null,
  simplifyDebts?: boolean | null,
  requireSettlementConfirmation?: boolean | null
): Promise<string | undefined> {
  const clean = (description || '').replace(/\s*<!--fs_meta:.*?-->\s*/g, '').trim();
  const hasSettings =
    password !== undefined ||
    requireAdminApproval !== undefined ||
    onlyAdminInvite !== undefined ||
    onlyAdminEdit !== undefined ||
    simplifyDebts !== undefined ||
    requireSettlementConfirmation !== undefined;

  if (!hasSettings && !password && !requireAdminApproval) return clean || undefined;

  const hashedPwd = password ? (password.startsWith('$2') ? password : await bcrypt.hash(password, 10)) : null;
  const meta: any = {
    pwd: hashedPwd,
    approval: Boolean(requireAdminApproval),
    onlyAdminInvite: Boolean(onlyAdminInvite),
    onlyAdminEdit: Boolean(onlyAdminEdit),
    simplifyDebts: simplifyDebts !== false,
    requireSettlementConfirmation: Boolean(requireSettlementConfirmation),
  };
  return `${clean}\n<!--fs_meta:${JSON.stringify(meta)}-->`;
}

export function parseGroupMeta(description?: string | null) {
  if (!description) {
    return {
      description: '',
      isPasswordProtected: false,
      password: null as string | null,
      requireAdminApproval: false,
      onlyAdminInvite: false,
      onlyAdminEdit: false,
      simplifyDebts: true,
      requireSettlementConfirmation: false,
    };
  }
  const match = description.match(/<!--fs_meta:(.*?)-->/);
  if (!match) {
    return {
      description,
      isPasswordProtected: false,
      password: null as string | null,
      requireAdminApproval: false,
      onlyAdminInvite: false,
      onlyAdminEdit: false,
      simplifyDebts: true,
      requireSettlementConfirmation: false,
    };
  }
  try {
    const meta = JSON.parse(match[1]);
    const clean = description.replace(/\s*<!--fs_meta:.*?-->\s*/g, '').trim();
    return {
      description: clean,
      isPasswordProtected: Boolean(meta.pwd),
      password: (meta.pwd as string) || null,
      requireAdminApproval: Boolean(meta.approval),
      onlyAdminInvite: Boolean(meta.onlyAdminInvite),
      onlyAdminEdit: Boolean(meta.onlyAdminEdit),
      simplifyDebts: meta.simplifyDebts !== false,
      requireSettlementConfirmation: Boolean(meta.requireSettlementConfirmation),
    };
  } catch {
    return {
      description,
      isPasswordProtected: false,
      password: null as string | null,
      requireAdminApproval: false,
      onlyAdminInvite: false,
      onlyAdminEdit: false,
      simplifyDebts: true,
      requireSettlementConfirmation: false,
    };
  }
}

// POST /api/groups — Create a new group
const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(100, 'Group name cannot exceed 100 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  type: z.enum(['HOME', 'TRIP', 'COUPLE', 'OFFICE', 'FRIENDS', 'FAMILY', 'PROJECT', 'OTHER']).optional(),
  currency: z.string().trim().length(3).default('INR'),
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
      const finalDescription = await encodeGroupMeta(description, password, requireAdminApproval);

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
          members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, username: true } } } },
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

      // Invalidate relevant user caches
      appCache.invalidatePrefix(`groups:list:${req.user!.id}`);
      appCache.invalidatePrefix(`dashboard:${req.user!.id}`);
      for (const mId of memberIds || []) {
        appCache.invalidatePrefix(`groups:list:${mId}`);
        appCache.invalidatePrefix(`dashboard:${mId}`);
      }

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
    const cacheKey = `groups:list:${req.user!.id}`;
    const cached = await appCache.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const userIds = [req.user!.id, req.user!.supabaseId].filter(Boolean);
    const groups = await prisma.group.findMany({
      where: {
        members: { some: { userId: { in: userIds } } },
        isActive: true,
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, username: true } },
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

    appCache.set(cacheKey, mapped, 20000);
    res.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch groups.' });
  }
});

// GET /api/groups/:id — Get group details
groupRouter.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const cacheKey = `group:${id}:${req.user!.id}`;
    const cached = await appCache.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const userIds = [req.user!.id, req.user!.supabaseId].filter(Boolean);

    const group = await prisma.group.findFirst({
      where: {
        id,
        members: { some: { userId: { in: userIds } } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, username: true } },
          },
        },
        expenses: {
          where: { isDeleted: false },
          include: {
            paidBy: { select: { id: true, name: true, avatarUrl: true, username: true } },
            shares: { include: { user: { select: { id: true, name: true, avatarUrl: true, username: true } } } },
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
    const data = {
      ...group,
      description: meta.description,
      isPasswordProtected: meta.isPasswordProtected,
      requireAdminApproval: meta.requireAdminApproval,
      onlyAdminInvite: meta.onlyAdminInvite,
      onlyAdminEdit: meta.onlyAdminEdit,
      simplifyDebts: meta.simplifyDebts,
      requireSettlementConfirmation: meta.requireSettlementConfirmation,
    };

    appCache.set(cacheKey, data, 20000);
    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Get group error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch group details.' });
  }
});

// PUT /api/groups/:id — Update group details & configuration (Admin only)
const updateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name cannot be empty').max(100, 'Group name cannot exceed 100 characters').optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  type: z.enum(['HOME', 'TRIP', 'COUPLE', 'OFFICE', 'FRIENDS', 'FAMILY', 'PROJECT', 'OTHER']).optional(),
  currency: z.string().trim().length(3).optional(),
  password: z.string().max(50).nullable().optional(),
  requireAdminApproval: z.boolean().optional(),
  onlyAdminInvite: z.boolean().optional(),
  onlyAdminEdit: z.boolean().optional(),
  simplifyDebts: z.boolean().optional(),
});

groupRouter.put(
  '/:id',
  validate({ body: updateGroupSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userIds = [req.user!.id, req.user!.supabaseId].filter(Boolean);

      // Verify admin role for authenticity & accountability
      const requesterMembership = await prisma.groupMember.findFirst({
        where: { groupId: id, userId: { in: userIds } },
      });

      if (!requesterMembership) {
        res.status(404).json({ success: false, error: 'Group not found or you are not a member.' });
        return;
      }

      if (requesterMembership.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Only group administrators can modify group settings.' });
        return;
      }

      const existingGroup = await prisma.group.findUnique({ where: { id } });
      if (!existingGroup) {
        res.status(404).json({ success: false, error: 'Group not found.' });
        return;
      }

      const existingMeta = parseGroupMeta(existingGroup.description);
      const newDesc = req.body.description !== undefined ? req.body.description : existingMeta.description;
      const newApproval = req.body.requireAdminApproval !== undefined ? req.body.requireAdminApproval : existingMeta.requireAdminApproval;
      const newOnlyAdminInvite = req.body.onlyAdminInvite !== undefined ? req.body.onlyAdminInvite : existingMeta.onlyAdminInvite;
      const newOnlyAdminEdit = req.body.onlyAdminEdit !== undefined ? req.body.onlyAdminEdit : existingMeta.onlyAdminEdit;
      const newSimplifyDebts = req.body.simplifyDebts !== undefined ? req.body.simplifyDebts : existingMeta.simplifyDebts;
      const newRequireSettlementConfirmation = req.body.requireSettlementConfirmation !== undefined ? req.body.requireSettlementConfirmation : existingMeta.requireSettlementConfirmation;

      let pwdToEncode: string | null = null;
      if (req.body.password === null || req.body.password === '') {
        pwdToEncode = null;
      } else if (req.body.password) {
        pwdToEncode = req.body.password;
      } else if (existingMeta.isPasswordProtected && existingMeta.password) {
        pwdToEncode = existingMeta.password;
      }

      const finalDescription = await encodeGroupMeta(
        newDesc,
        pwdToEncode,
        newApproval,
        newOnlyAdminInvite,
        newOnlyAdminEdit,
        newSimplifyDebts,
        newRequireSettlementConfirmation
      );

      const updateData: any = {};
      if (req.body.name) updateData.name = req.body.name.trim();
      if (finalDescription !== undefined) updateData.description = finalDescription;
      if (req.body.type) updateData.type = req.body.type;
      if (req.body.currency) updateData.currency = req.body.currency.trim().toUpperCase();

      const updated = await prisma.group.update({
        where: { id },
        data: updateData,
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
        },
      });

      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          groupId: id,
          type: 'GROUP_CREATED',
          message: `updated group settings and preferences`,
        },
      });

      appCache.invalidatePrefix(`groups:list`);
      appCache.invalidatePrefix(`group:${id}`);
      appCache.invalidatePrefix(`dashboard`);

      const meta = parseGroupMeta(updated.description);
      res.json({
        success: true,
        data: {
          ...updated,
          description: meta.description,
          isPasswordProtected: meta.isPasswordProtected,
          requireAdminApproval: meta.requireAdminApproval,
          onlyAdminInvite: meta.onlyAdminInvite,
          onlyAdminEdit: meta.onlyAdminEdit,
          simplifyDebts: meta.simplifyDebts,
          requireSettlementConfirmation: meta.requireSettlementConfirmation,
        },
      });
    } catch (error: any) {
      console.error('Update group error:', error);
      res.status(500).json({ success: false, error: 'Failed to update group.' });
    }
  }
);

// DELETE /api/groups/:id — Soft-delete / archive group (Admin only)
groupRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userIds = [req.user!.id, req.user!.supabaseId].filter(Boolean);

    const requesterMembership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: { in: userIds } },
    });

    if (!requesterMembership) {
      res.status(404).json({ success: false, error: 'Group not found or you are not a member.' });
      return;
    }

    if (requesterMembership.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only group administrators can delete or archive this group.' });
      return;
    }

    await prisma.group.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        groupId: id,
        type: 'GROUP_MEMBER_REMOVED',
        message: `deleted/archived group`,
      },
    });

    appCache.invalidatePrefix(`groups:list`);
    appCache.invalidatePrefix(`dashboard`);

    res.json({ success: true, message: 'Group deleted successfully.' });
  } catch (error: any) {
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete group.' });
  }
});

// POST /api/groups/:id/leave — Member leaves group (safeguards sole admin)
groupRouter.post('/:id/leave', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userIds = [req.user!.id, req.user!.supabaseId].filter(Boolean);

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: { in: userIds } },
    });

    if (!membership) {
      res.status(404).json({ success: false, error: 'You are not a member of this group.' });
      return;
    }

    // Check if user is the sole remaining admin in a multi-member group
    if (membership.role === 'ADMIN') {
      const [adminCount, totalMembers] = await Promise.all([
        prisma.groupMember.count({ where: { groupId: id, role: 'ADMIN' } }),
        prisma.groupMember.count({ where: { groupId: id } }),
      ]);

      if (adminCount <= 1 && totalMembers > 1) {
        res.status(400).json({
          success: false,
          error: 'You are the only admin in this group. Please make another member Admin before leaving.',
        });
        return;
      }

      // If user is the only member left in the group, archive the group on leave
      if (totalMembers <= 1) {
        await prisma.group.update({
          where: { id },
          data: { isActive: false },
        });
      }
    }

    await prisma.groupMember.delete({
      where: { id: membership.id },
    });

    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        groupId: id,
        type: 'GROUP_MEMBER_REMOVED',
        message: 'left the group',
      },
    });

    appCache.invalidatePrefix(`groups:list`);
    appCache.invalidatePrefix(`group:${id}`);
    appCache.invalidatePrefix(`dashboard`);

    res.json({ success: true, message: 'You have left the group successfully.' });
  } catch (error: any) {
    console.error('Leave group error:', error);
    res.status(500).json({ success: false, error: 'Failed to leave group.' });
  }
});

// GET /api/groups/:id/export — Export group transaction history & ledger
groupRouter.get('/:id/export', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userIds = [req.user!.id, req.user!.supabaseId].filter(Boolean);

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: { in: userIds } },
    });

    if (!membership) {
      res.status(403).json({ success: false, error: 'Not a member of this group.' });
      return;
    }

    const [group, expenses, settlements] = await Promise.all([
      prisma.group.findUnique({
        where: { id },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      }),
      prisma.expense.findMany({
        where: { groupId: id, isDeleted: false },
        include: {
          paidBy: { select: { id: true, name: true } },
          shares: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.settlement.findMany({
        where: { groupId: id, status: 'CONFIRMED' },
        include: {
          payer: { select: { id: true, name: true } },
          payee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          currency: group.currency,
          memberCount: group.members.length,
          members: group.members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email, role: m.role })),
        },
        expenses: expenses.map((e) => ({
          id: e.id,
          description: e.description,
          amount: Number(e.amount),
          date: e.date,
          category: e.category,
          paidBy: e.paidBy.name,
          splitType: e.splitType,
          shares: e.shares.map((s) => ({ user: s.user.name, amount: Number(s.amount) })),
        })),
        settlements: settlements.map((s) => ({
          id: s.id,
          amount: Number(s.amount),
          payer: s.payer.name,
          payee: s.payee.name,
          date: s.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Export group error:', error);
    res.status(500).json({ success: false, error: 'Failed to export group data.' });
  }
});

// GET /api/groups/:id/invite — Generate shareable group invite link
groupRouter.get('/:id/invite', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userIds = [req.user!.id, req.user!.supabaseId].filter(Boolean);
    const group = await prisma.group.findFirst({
      where: {
        id,
        members: { some: { userId: { in: userIds } } },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found.' });
      return;
    }

    const meta = parseGroupMeta(group.description);
    if (meta.onlyAdminInvite) {
      const membership = await prisma.groupMember.findFirst({
        where: { groupId: id, userId: { in: userIds } },
      });
      if (membership?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Only group administrators can view or share the invite link for this group.',
        });
        return;
      }
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const inviteUrl = `${clientUrl}/groups/join/${id}`;

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

    // Verify passcode if protected (bcrypt comparison)
    if (meta.isPasswordProtected && meta.password) {
      if (!passcode || !(await bcrypt.compare(passcode.trim(), meta.password))) {
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
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, username: true } } },
    });

    await prisma.activity.create({
      data: {
        userId,
        groupId: id,
        type: 'GROUP_MEMBER_ADDED',
        message: `joined the group via invite link`,
      },
    });

    appCache.invalidatePrefix(`groups:list:${userId}`);
    appCache.invalidatePrefix(`dashboard:${userId}`);

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
      const userIds = [req.user!.id, req.user!.supabaseId].filter(Boolean);
      const membership = await prisma.groupMember.findFirst({
        where: { groupId: id, userId: { in: userIds } },
      });

      if (!membership) {
        res.status(403).json({ success: false, error: 'You are not a member of this group.' });
        return;
      }

      // Check group policy: onlyAdminInvite
      const groupRecord = await prisma.group.findUnique({
        where: { id },
        select: { description: true },
      });
      if (groupRecord) {
        const meta = parseGroupMeta(groupRecord.description);
        if (meta.onlyAdminInvite && membership.role !== 'ADMIN') {
          res.status(403).json({
            success: false,
            error: 'Only group administrators are authorized to invite or add members to this group.',
          });
          return;
        }
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
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, username: true } } },
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

      appCache.invalidatePrefix(`group:${id}`);
      appCache.invalidatePrefix(`groups:list:${targetUserId}`);
      appCache.invalidatePrefix(`groups:list:${req.user!.id}`);

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

    appCache.invalidatePrefix(`groups:list:${userId}`);
    appCache.invalidatePrefix(`dashboard:${userId}`);

    res.json({ success: true, message: 'Member removed successfully.' });
  } catch (error: any) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove member.' });
  }
});

// PATCH /api/groups/:id/members/:userId/role — Update member role (WhatsApp-style multiple admins)
groupRouter.patch(
  '/:id/members/:userId/role',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const targetUserId = req.params.userId as string;
      const { role } = req.body;

      if (!['ADMIN', 'MEMBER'].includes(role)) {
        res.status(400).json({ success: false, error: 'Invalid role. Must be ADMIN or MEMBER.' });
        return;
      }

      // Verify requester is group ADMIN
      const requesterMembership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId: req.user!.id } },
      });

      if (!requesterMembership || requesterMembership.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Only group admins can manage member roles.' });
        return;
      }

      const targetMembership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId: targetUserId } },
        include: { user: { select: { id: true, name: true } } },
      });

      if (!targetMembership) {
        res.status(404).json({ success: false, error: 'Member not found in this group.' });
        return;
      }

      // If demoting an admin, ensure at least one other admin remains
      if (role === 'MEMBER' && targetMembership.role === 'ADMIN') {
        const adminCount = await prisma.groupMember.count({
          where: { groupId: id, role: 'ADMIN' },
        });
        if (adminCount <= 1) {
          res.status(400).json({
            success: false,
            error: 'Cannot demote the only remaining admin. Make another member admin first.',
          });
          return;
        }
      }

      const updated = await prisma.groupMember.update({
        where: { groupId_userId: { groupId: id, userId: targetUserId } },
        data: { role },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, username: true } } },
      });

      // Activity log
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          groupId: id,
          type: 'GROUP_MEMBER_ADDED',
          message: role === 'ADMIN'
            ? `made ${targetMembership.user.name} a group admin`
            : `dismissed ${targetMembership.user.name} as admin`,
        },
      });

      appCache.invalidatePrefix(`group:${id}`);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('Update member role error:', error);
      res.status(500).json({ success: false, error: 'Failed to update member role.' });
    }
  }
);

// GET /api/groups/:id/balances — Get simplified balances for a group (cached & optimized)
groupRouter.get('/:id/balances', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const cacheKey = `group:${id}:balances`;
    const cached = await appCache.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    // Verify membership
    const userIds = [req.user!.id, req.user!.supabaseId].filter(Boolean);
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: { in: userIds } },
    });

    if (!membership) {
      res.status(403).json({ success: false, error: 'Not a member of this group.' });
      return;
    }

    // Concurrently fetch expenses, settlements, members, and group config
    const [expenses, settlements, members, groupRecord] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId: id, isDeleted: false },
        include: { shares: true },
      }),
      prisma.settlement.findMany({
        where: { groupId: id, status: 'CONFIRMED' },
      }),
      prisma.groupMember.findMany({
        where: { groupId: id },
        include: { user: { select: { id: true, name: true, avatarUrl: true, username: true } } },
      }),
      prisma.group.findUnique({
        where: { id },
        select: { description: true },
      }),
    ]);

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

    const balances = members.map((member) => ({
      user: member.user,
      balance: Math.round((balanceMap[member.userId] || 0) * 100) / 100,
    }));

    // Respect group's simplifyDebts toggle
    const meta = parseGroupMeta(groupRecord?.description);
    const simplifyDebtsEnabled = meta.simplifyDebts !== false;
    const simplifiedDebts = simplifyDebtsEnabled ? simplifyDebts(balances) : [];
    const data = { balances, simplifiedDebts, simplifyDebtsEnabled };

    appCache.set(cacheKey, data, 20000);
    res.json({
      success: true,
      data,
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
