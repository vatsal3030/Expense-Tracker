import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const exportRouter = Router();
exportRouter.use(authenticate);

// =============================================================================
// GET /api/export/group/:groupId — Export group expenses as CSV
// =============================================================================
exportRouter.get('/group/:groupId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const groupId = req.params.groupId as string;

    // Verify membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.user!.id },
    });

    if (!membership) {
      res.status(403).json({ success: false, error: 'You are not a member of this group.' });
      return;
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        expenses: {
          where: { isDeleted: false },
          orderBy: { date: 'desc' },
          include: {
            paidBy: { select: { name: true, email: true } },
            shares: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        members: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found.' });
      return;
    }

    // Generate CSV
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Paid By', 'Split Type', 'Shares'];
    const rows = group.expenses.map((exp) => {
      const shares = exp.shares
        .map((s) => `${s.user.name}: ₹${Number(s.amount).toFixed(2)}`)
        .join(' | ');

      return [
        new Date(exp.date).toLocaleDateString('en-IN'),
        `"${exp.description.replace(/"/g, '""')}"`,
        exp.category,
        Number(exp.amount).toFixed(2),
        exp.currency,
        exp.paidBy.name,
        exp.splitType,
        `"${shares}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_expenses.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export group error:', error);
    res.status(500).json({ success: false, error: 'Failed to export group expenses.' });
  }
});

// =============================================================================
// GET /api/export/personal — Export personal expenses as CSV
// =============================================================================
exportRouter.get('/personal', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from as string);
    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    const expenses = await prisma.expense.findMany({
      where: {
        isDeleted: false,
        OR: [
          { paidById: req.user!.id },
          { createdById: req.user!.id },
          { shares: { some: { userId: req.user!.id } } },
        ],
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      orderBy: { date: 'desc' },
      include: {
        paidBy: { select: { name: true } },
        group: { select: { name: true } },
        shares: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Paid By', 'Group', 'Your Share'];
    const rows = expenses.map((exp) => {
      const myShare = exp.shares.find((s) => s.userId === req.user!.id);
      return [
        new Date(exp.date).toLocaleDateString('en-IN'),
        `"${exp.description.replace(/"/g, '""')}"`,
        exp.category,
        Number(exp.amount).toFixed(2),
        exp.currency,
        exp.paidBy.name,
        exp.group?.name || 'Personal',
        myShare ? Number(myShare.amount).toFixed(2) : '0.00',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expense_report_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export personal error:', error);
    res.status(500).json({ success: false, error: 'Failed to export expenses.' });
  }
});

// =============================================================================
// GET /api/export/report — Generate JSON report (for frontend PDF rendering)
// =============================================================================
exportRouter.get('/report', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { from, to, groupId } = req.query;

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from as string);
    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    const whereClause: any = {
      isDeleted: false,
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    };

    if (groupId) {
      whereClause.groupId = groupId as string;
    } else {
      whereClause.OR = [
        { paidById: req.user!.id },
        { createdById: req.user!.id },
        { shares: { some: { userId: req.user!.id } } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        paidBy: { select: { name: true, email: true } },
        group: { select: { name: true } },
        shares: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    let totalAmount = 0;

    expenses.forEach((exp) => {
      const amt = Number(exp.amount);
      totalAmount += amt;
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + amt;
    });

    // Monthly breakdown
    const monthlyBreakdown: Record<string, number> = {};
    expenses.forEach((exp) => {
      const month = new Date(exp.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
      monthlyBreakdown[month] = (monthlyBreakdown[month] || 0) + Number(exp.amount);
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true, email: true },
    });

    res.json({
      success: true,
      data: {
        reportDate: new Date().toISOString(),
        generatedBy: user,
        period: {
          from: from || expenses[expenses.length - 1]?.date || null,
          to: to || expenses[0]?.date || null,
        },
        summary: {
          totalExpenses: expenses.length,
          totalAmount,
          averagePerExpense: expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0,
          categoryBreakdown,
          monthlyBreakdown,
        },
        expenses: expenses.map((exp) => ({
          date: exp.date,
          description: exp.description,
          category: exp.category,
          amount: Number(exp.amount),
          currency: exp.currency,
          paidBy: exp.paidBy.name,
          group: exp.group?.name || 'Personal',
          shares: exp.shares.map((s) => ({
            name: s.user.name,
            amount: Number(s.amount),
          })),
        })),
      },
    });
  } catch (error: any) {
    console.error('Generate report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report.' });
  }
});
