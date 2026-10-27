'use client';

import React, { Suspense, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Avatar, AvatarGroup, Chip,
  List, ListItem, ListItemAvatar, ListItemText, Divider, Button,
  Skeleton, useTheme, alpha, IconButton, Tooltip, Stack, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab,
  Alert, Snackbar, FormControlLabel, Switch, MenuItem, Paper, Menu, ListItemIcon,
} from '@mui/material';
import {
  ArrowBack, Add, Edit, Delete, Share, ContentCopy,
  WhatsApp, PersonAdd, Check, Lock, Security,
  AccountBalanceWallet, ArrowForward, QrCode2,
  TrendingUp, TrendingDown, ReceiptLong, People, Close,
  MoreVert, SupervisorAccount, PersonRemove,
  Settings, FileDownload, Logout, AdminPanelSettings, Save,
  TableChart, Shield,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { groupApi, settlementApi, expenseApi } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import UpiPaymentModal from '@/components/settlement/UpiPaymentModal';
import QrCodeModal from '@/components/common/QrCodeModal';
import SplitwiseExpenseItem from '@/components/expense/SplitwiseExpenseItem';
import SmartQuickAddBar from '@/components/expense/SmartQuickAddBar';
import { useSocket } from '@/providers/SocketProvider';
import { useDataRefresh, triggerDataRefresh } from '@/lib/events';

function GroupDetailSkeleton() {
  const theme = useTheme();
  return (
    <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 } }}>
      {/* Top Header Row Skeleton */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 2.5 }} />
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Skeleton width={180} height={36} />
              <Skeleton width={60} height={24} sx={{ borderRadius: 2 }} />
            </Stack>
            <Skeleton width={240} height={20} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Skeleton variant="rounded" width={110} height={38} sx={{ borderRadius: 2.5 }} />
          <Skeleton variant="rounded" width={120} height={38} sx={{ borderRadius: 2.5 }} />
          <Skeleton variant="rounded" width={130} height={38} sx={{ borderRadius: 2.5 }} />
        </Stack>
      </Box>

      {/* Balance Summary Cards Skeleton */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[1, 2, 3].map((i) => (
          <Paper key={i} className="glass-secondary" sx={{ p: 2.5, borderRadius: 3 }}>
            <Skeleton width="40%" height={16} />
            <Skeleton width="70%" height={36} sx={{ my: 1 }} />
            <Skeleton width="50%" height={14} />
          </Paper>
        ))}
      </Box>

      {/* Tabs Skeleton */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" width={90} height={36} sx={{ borderRadius: 2.5 }} />
          ))}
        </Stack>
      </Box>

      {/* Expenses List Skeleton */}
      <Paper className="glass-card" sx={{ p: 2, borderRadius: 3 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Skeleton variant="circular" width={42} height={42} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="45%" height={22} />
              <Skeleton width="25%" height={16} sx={{ mt: 0.5 }} />
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Skeleton width={70} height={24} />
              <Skeleton width={50} height={14} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

const GROUP_TYPES = ['HOME', 'TRIP', 'COUPLE', 'OFFICE', 'FRIENDS', 'FAMILY', 'PROJECT', 'OTHER'];

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: '🍔', TRANSPORT: '🚗', ENTERTAINMENT: '🎬', SHOPPING: '🛍️',
  UTILITIES: '💡', RENT: '🏠', HEALTH: '💊', EDUCATION: '📚',
  TRAVEL: '✈️', GROCERIES: '🛒', SUBSCRIPTIONS: '📱', GENERAL: '📋', OTHER: '📌',
};

function GroupDetailContent() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const isLight = theme.palette.mode === 'light';
  const { user, profile, loading: authLoading } = useAuth();

  const [group, setGroup] = useState<any>(null);
  const [balances, setBalances] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteContact, setInviteContact] = useState('');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // UPI Payment Modal State
  const [upiModal, setUpiModal] = useState<{
    open: boolean;
    payeeName: string;
    amount: number;
    payeeUpiId?: string;
    payeeId?: string;
  }>({
    open: false,
    payeeName: '',
    amount: 0,
  });

  const hasLoadedGroupRef = useRef(false);

  // Edit, Settings & Leave Group State
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [leaveGroupOpen, setLeaveGroupOpen] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editGroupForm, setEditGroupForm] = useState({
    name: '',
    description: '',
    type: 'OTHER',
    currency: 'INR',
    isPasswordProtected: false,
    password: '',
    requireAdminApproval: false,
    onlyAdminInvite: false,
    onlyAdminEdit: false,
    simplifyDebts: true,
    requireSettlementConfirmation: false,
  });
  const [editGroupError, setEditGroupError] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  // Synchronize editGroupForm when group data loads
  useEffect(() => {
    if (group) {
      setEditGroupForm({
        name: group.name || '',
        description: group.description || '',
        type: group.type || 'OTHER',
        currency: group.currency || 'INR',
        isPasswordProtected: Boolean(group.isPasswordProtected),
        password: '',
        requireAdminApproval: Boolean(group.requireAdminApproval),
        onlyAdminInvite: Boolean(group.onlyAdminInvite),
        onlyAdminEdit: Boolean(group.onlyAdminEdit),
        simplifyDebts: group.simplifyDebts !== false,
        requireSettlementConfirmation: Boolean(group.requireSettlementConfirmation),
      });
    }
  }, [group]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  const { joinGroup, leaveGroup } = useSocket();

  useEffect(() => {
    if (params.id) {
      joinGroup(params.id as string);
      return () => {
        leaveGroup(params.id as string);
      };
    }
  }, [params.id, joinGroup, leaveGroup]);

  useEffect(() => {
    if (user?.id && params.id) fetchGroup();
  }, [user?.id, params.id]);

  useDataRefresh(React.useCallback((detail?: any) => {
    if (detail?.type === 'expense' && detail?.data && detail.data.groupId === params.id) {
      setGroup((prev: any) => {
        if (!prev) return prev;
        const exists = (prev.expenses || []).some((e: any) => e.id === detail.data.id);
        if (exists) return prev;
        return {
          ...prev,
          expenses: [detail.data, ...(prev.expenses || [])],
        };
      });
    }
    fetchGroup();
  }, [params.id]));

  const fetchGroup = async () => {
    try {
      if (!hasLoadedGroupRef.current) {
        setLoading(true);
      }
      const [groupRes, balancesRes] = await Promise.all([
        groupApi.get(params.id as string),
        groupApi.getBalances(params.id as string),
      ]);
      setGroup(groupRes.data?.data);
      setBalances(balancesRes.data?.data);
      hasLoadedGroupRef.current = true;
    } catch (error) {
      console.error('Fetch group error:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/groups/join/${group?.id || ''}`
    : `https://fairshare.app/groups/join/${group?.id || ''}`;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setToastMessage('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! Join our "${group?.name}" group on FairShare to split expenses: ${inviteLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDirectInvite = async () => {
    if (!inviteContact.trim() || !group?.id) return;
    const contact = inviteContact.trim();
    const isEmail = contact.includes('@');
    const tempMemberId = `temp-inv-${Date.now()}`;
    const prevMembers = [...(group.members || [])];

    // Optimistic UI: show new member immediately
    setGroup((prev: any) => ({
      ...prev,
      members: [
        ...(prev.members || []),
        {
          id: tempMemberId,
          userId: tempMemberId,
          role: 'MEMBER',
          joinedAt: new Date().toISOString(),
          user: {
            id: tempMemberId,
            name: isEmail ? contact.split('@')[0] : contact,
            email: isEmail ? contact : null,
            phone: isEmail ? null : contact,
          },
        },
      ],
    }));

    setToastMessage(`Member invited: ${contact}! ✉️`);
    setInviteContact('');

    try {
      await groupApi.addMember(group.id, isEmail ? { email: contact } : { phone: contact });
      fetchGroup();
    } catch (err: any) {
      setGroup((prev: any) => ({ ...prev, members: prevMembers }));
      setToastMessage(err.response?.data?.error || 'Failed to add member. Reverted.');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: group?.currency || 'INR', maximumFractionDigits: 0 }).format(amount);

  const totalSpent = useMemo(() => {
    if (!group?.expenses) return 0;
    return group.expenses.reduce((acc: number, exp: any) => acc + Number(exp.amount || 0), 0);
  }, [group]);

  const isCurrentUser = useCallback((target: any): boolean => {
    if (!target) return false;
    const myId = profile?.id;
    const mySupabaseId = user?.id || (profile as any)?.supabaseId;
    const myEmail = user?.email?.toLowerCase() || profile?.email?.toLowerCase();

    if (typeof target === 'string') {
      return (Boolean(myId) && target === myId) || (Boolean(mySupabaseId) && target === mySupabaseId);
    }
    const targetId = target.userId || target.user?.id || target.id;
    const targetSupabaseId = target.user?.supabaseId || target.supabaseId;
    const targetEmail = (target.user?.email || target.email)?.toLowerCase();

    if (myId && (targetId === myId || targetSupabaseId === myId)) return true;
    if (mySupabaseId && (targetId === mySupabaseId || targetSupabaseId === mySupabaseId)) return true;
    if (myEmail && targetEmail && targetEmail === myEmail) return true;
    return false;
  }, [user, profile]);

  const myBalance = useMemo(() => {
    if (!balances?.balances) return 0;
    const currentMember = balances.balances.find((b: any) => isCurrentUser(b.user) || isCurrentUser(b));
    return currentMember ? currentMember.balance : 0;
  }, [balances, isCurrentUser]);

  const isGroupAdmin = useMemo(() => {
    if ((profile as any)?.isAdmin) return true;
    if (!group?.members) return false;
    const member = group.members.find((m: any) => isCurrentUser(m));
    return member?.role === 'ADMIN';
  }, [group, isCurrentUser, profile]);

  const [memberMenuAnchorEl, setMemberMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [removeConfirmMember, setRemoveConfirmMember] = useState<any>(null);

  const handleOpenMemberMenu = (e: React.MouseEvent<HTMLElement>, member: any) => {
    e.preventDefault();
    e.stopPropagation();
    setMemberMenuAnchorEl(e.currentTarget);
    setSelectedMember(member);
  };

  const handleCloseMemberMenu = () => {
    setMemberMenuAnchorEl(null);
    setSelectedMember(null);
  };

  // Group expenses by Month & Year
  const groupExpenses = group?.expenses;
  const groupedGroupExpenses = useMemo(() => {
    if (!groupExpenses) return {};
    const groups: Record<string, any[]> = {};
    groupExpenses.forEach((exp: any) => {
      const d = exp.date ? new Date(exp.date) : new Date();
      const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(exp);
    });
    return groups;
  }, [groupExpenses]);

  // WhatsApp-style Multiple Admin Role Toggle
  const handleUpdateMemberRole = async (targetUserId: string, targetName: string, newRole: 'ADMIN' | 'MEMBER') => {
    if (!group?.id) return;
    const prevMembers = [...(group.members || [])];
    setGroup((prev: any) => ({
      ...prev,
      members: prev.members.map((m: any) =>
        (m.userId === targetUserId || m.user?.id === targetUserId || m.id === targetUserId)
          ? { ...m, role: newRole }
          : m
      ),
    }));

    try {
      await groupApi.updateMemberRole(group.id, targetUserId, newRole);
      setToastMessage(newRole === 'ADMIN' ? `${targetName} is now a Group Admin 👑` : `${targetName} dismissed as Admin`);
      fetchGroup();
    } catch (err: any) {
      console.error('Update member role error:', err);
      setGroup((prev: any) => ({ ...prev, members: prevMembers }));
      setToastMessage(err.response?.data?.error || 'Failed to update member role.');
    }
  };

  // Remove member from group
  const handleRemoveMember = async (targetUserId: string, targetName: string) => {
    if (!group?.id) return;
    const prevMembers = [...(group.members || [])];
    setGroup((prev: any) => ({
      ...prev,
      members: prev.members.filter((m: any) => m.userId !== targetUserId && m.user?.id !== targetUserId && m.id !== targetUserId),
    }));

    try {
      await groupApi.removeMember(group.id, targetUserId);
      setToastMessage(`${targetName} removed from group.`);
      fetchGroup();
    } catch (err: any) {
      console.error('Remove member error:', err);
      setGroup((prev: any) => ({ ...prev, members: prevMembers }));
      setToastMessage(err.response?.data?.error || 'Failed to remove member.');
    }
  };

  const handleDeleteGroupExpense = async (expenseId: string) => {
    if (!group?.expenses) return;
    const prevExpenses = [...group.expenses];
    setGroup((prev: any) => ({
      ...prev,
      expenses: prev.expenses.filter((e: any) => e.id !== expenseId),
    }));
    setToastMessage('Expense removed from group.');

    try {
      await expenseApi.delete(expenseId);
      groupApi.getBalances(group.id).then((res) => setBalances(res.data?.data || null)).catch(() => {});
      triggerDataRefresh({ type: 'expense' });
    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      setGroup((prev: any) => ({ ...prev, expenses: prevExpenses }));
      setToastMessage(err.response?.data?.error || 'Failed to delete expense. Reverted.');
    }
  };

  const handleSettleUpi = (payeeName: string, amount: number, payeeId?: string) => {
    setUpiModal({
      open: true,
      payeeName,
      amount,
      payeeId,
      payeeUpiId: `${payeeName.toLowerCase().replace(/\s+/g, '')}@okaxis`,
    });
  };

  const handleRecordSettlement = async (toUserId: string, amount: number, payeeName?: string) => {
    if (!group?.id) return;
    const prevBalances = balances ? JSON.parse(JSON.stringify(balances)) : null;

    // Optimistic UI: update local debt and balance immediately
    if (balances) {
      setBalances((prev: any) => {
        if (!prev) return prev;
        const updatedDebts = (prev.simplifiedDebts || []).filter((d: any) => {
          return !(isCurrentUser(d.from) && (d.to?.id === toUserId || d.to?.userId === toUserId));
        });
        const updatedBalances = (prev.balances || []).map((b: any) => {
          if (isCurrentUser(b.user) || isCurrentUser(b)) {
            return { ...b, balance: b.balance + amount };
          }
          if (b.user?.id === toUserId || b.userId === toUserId) {
            return { ...b, balance: b.balance - amount };
          }
          return b;
        });
        return {
          ...prev,
          simplifiedDebts: updatedDebts,
          balances: updatedBalances,
        };
      });
    }

    setToastMessage(`Settlement of ${formatCurrency(amount)} recorded! ⚡`);

    try {
      const idempotencyKey = `settle_${group.id}_${toUserId}_${Date.now()}`;
      await settlementApi.create({
        payeeId: toUserId,
        amount,
        groupId: group.id,
        notes: 'Group settlement via FairShare',
      }, {
        headers: { 'idempotency-key': idempotencyKey },
      });
      fetchGroup();
      triggerDataRefresh({ type: 'settlement' });
    } catch (err: any) {
      console.error('Record settlement error:', err);
      if (prevBalances) setBalances(prevBalances);
      setToastMessage(err.response?.data?.error || 'Failed to record settlement. Reverted.');
    }
  };

  const adminMembers = useMemo(() => {
    return (group?.members || []).filter((m: any) => m.role === 'ADMIN');
  }, [group?.members]);

  const isOnlyAdmin = isGroupAdmin && adminMembers.length <= 1 && (group?.members?.length || 0) > 1;

  const handleOpenEditGroup = () => {
    if (!group) return;
    setEditGroupForm({
      name: group.name || '',
      description: group.description || '',
      type: group.type || 'OTHER',
      currency: group.currency || 'INR',
      isPasswordProtected: Boolean(group.isPasswordProtected),
      password: '',
      requireAdminApproval: Boolean(group.requireAdminApproval),
      onlyAdminInvite: Boolean(group.onlyAdminInvite),
      onlyAdminEdit: Boolean(group.onlyAdminEdit),
      simplifyDebts: group.simplifyDebts !== false,
      requireSettlementConfirmation: Boolean(group.requireSettlementConfirmation),
    });
    setEditGroupError('');
    setEditGroupOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!editGroupForm.name.trim()) {
      setEditGroupError('Group name is required.');
      return;
    }
    if (editGroupForm.name.trim().length > 100) {
      setEditGroupError('Group name cannot exceed 100 characters.');
      return;
    }
    if (editGroupForm.description.length > 500) {
      setEditGroupError('Description cannot exceed 500 characters.');
      return;
    }

    setSavingGroup(true);
    setEditGroupError('');

    const prevGroup = group ? { ...group } : null;
    // Optimistic UI: apply changes immediately in state
    setGroup((prev: any) => ({
      ...prev,
      name: editGroupForm.name.trim(),
      description: editGroupForm.description.trim(),
      type: editGroupForm.type,
      currency: editGroupForm.currency,
      requireAdminApproval: editGroupForm.requireAdminApproval,
      onlyAdminInvite: editGroupForm.onlyAdminInvite,
      onlyAdminEdit: editGroupForm.onlyAdminEdit,
      simplifyDebts: editGroupForm.simplifyDebts,
      requireSettlementConfirmation: editGroupForm.requireSettlementConfirmation,
    }));
    setToastMessage('Group settings updated successfully! ⚙️');

    try {
      const payload: any = {
        name: editGroupForm.name.trim(),
        description: editGroupForm.description.trim(),
        type: editGroupForm.type,
        currency: editGroupForm.currency,
        requireAdminApproval: editGroupForm.requireAdminApproval,
        onlyAdminInvite: editGroupForm.onlyAdminInvite,
        onlyAdminEdit: editGroupForm.onlyAdminEdit,
        simplifyDebts: editGroupForm.simplifyDebts,
        requireSettlementConfirmation: editGroupForm.requireSettlementConfirmation,
      };
      if (editGroupForm.isPasswordProtected && editGroupForm.password) {
        payload.password = editGroupForm.password;
      } else if (!editGroupForm.isPasswordProtected) {
        payload.password = null;
      }

      const res = await groupApi.update(group.id, payload);
      if (res.data?.data) {
        setGroup((prev: any) => ({
          ...prev,
          ...res.data.data,
        }));
      }
      setEditGroupOpen(false);
    } catch (err: any) {
      console.error('Update group error:', err);
      if (prevGroup) setGroup(prevGroup);
      const msg = err.response?.data?.error || 'Failed to update group settings. Changes reverted.';
      setEditGroupError(msg);
      setToastMessage(msg);
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group?.id) return;
    setDeletingGroup(true);
    try {
      await groupApi.delete(group.id);
      setToastMessage('Group deleted successfully.');
      router.push('/groups');
    } catch (err: any) {
      console.error('Delete group error:', err);
      setToastMessage(err.response?.data?.error || 'Failed to delete group.');
      setDeletingGroup(false);
      setDeleteGroupOpen(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group?.id) return;
    setLeavingGroup(true);
    try {
      await groupApi.leave(group.id);
      setToastMessage('You have successfully left the group.');
      router.push('/groups');
    } catch (err: any) {
      console.error('Leave group error:', err);
      setToastMessage(err.response?.data?.error || 'Failed to leave group.');
      setLeavingGroup(false);
      setLeaveGroupOpen(false);
    }
  };

  const handleExportGroup = async (format: 'csv' | 'json') => {
    if (!group?.id) return;
    setExporting(true);
    try {
      const res = await groupApi.export(group.id);
      const exportData = res.data?.data;
      if (!exportData) throw new Error('No data received');

      const cleanName = (exportData.group?.name || 'group').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cleanName}_ledger_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setToastMessage('Ledger exported as JSON file!');
      } else {
        const headers = ['Date', 'Expense Title', 'Category', 'Paid By', 'Amount', 'Currency', 'Notes', 'Member Shares'];
        const rows = (exportData.expenses || []).map((exp: any) => {
          const dateStr = exp.date ? new Date(exp.date).toISOString().split('T')[0] : '';
          const title = `"${(exp.title || '').replace(/"/g, '""')}"`;
          const category = exp.category || 'GENERAL';
          const paidBy = `"${(exp.paidBy?.name || exp.paidBy?.email || '').replace(/"/g, '""')}"`;
          const amount = exp.amount;
          const currency = exp.currency || exportData.group?.currency || 'INR';
          const notes = `"${(exp.notes || '').replace(/"/g, '""')}"`;
          const splits = (exp.splits || [])
            .map((s: any) => `${s.user?.name || s.user?.email || 'User'}: ${s.amount}`)
            .join('; ');
          const splitWith = `"${splits.replace(/"/g, '""')}"`;
          return [dateStr, title, category, paidBy, amount, currency, notes, splitWith].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cleanName}_ledger_${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setToastMessage('Ledger exported as CSV spreadsheet!');
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setToastMessage(err.response?.data?.error || 'Failed to export group data.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout>
      {loading && !group ? (
        <GroupDetailSkeleton />
      ) : (
        <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 } }}>
        {/* Top Header Row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            mb: 3,
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <IconButton
              onClick={() => router.push('/groups')}
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2.5,
                mt: 0.25,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2.125rem' } }}>
                  {group?.name}
                </Typography>
                <Chip
                  label={group?.type?.toLowerCase() || 'friends'}
                  size="small"
                  sx={{
                    textTransform: 'capitalize',
                    fontWeight: 700,
                    height: 22,
                    fontSize: '0.7rem',
                    bgcolor: alpha('#0E6245', 0.1),
                    color: '#0E6245',
                  }}
                />
                {(group?.isPasswordProtected || group?.requireAdminApproval) && (
                  <Chip
                    icon={<Lock sx={{ fontSize: '13px !important' }} />}
                    label="Protected"
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      bgcolor: alpha(theme.palette.text.secondary, 0.08),
                      color: 'text.secondary',
                    }}
                  />
                )}
              </Box>
              {group?.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {group.description}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            {isGroupAdmin ? (
              <Button
                variant="outlined"
                startIcon={<Settings fontSize="small" />}
                onClick={() => setActiveTab(3)}
                className="glass-tertiary"
                sx={{
                  borderRadius: 2.5,
                  color: 'text.primary',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2,
                  py: 0.75,
                  '&:hover': {
                    borderColor: '#10B981',
                    bgcolor: alpha('#10B981', 0.08),
                  },
                }}
              >
                Settings
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Logout fontSize="small" />}
                onClick={() => setLeaveGroupOpen(true)}
                className="glass-tertiary"
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2,
                  py: 0.75,
                  color: 'text.secondary',
                  '&:hover': { color: 'error.main', borderColor: 'error.main' },
                }}
              >
                Leave
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<QrCode2 fontSize="small" />}
              onClick={() => setQrModalOpen(true)}
              className="glass-tertiary"
              sx={{
                borderRadius: 2.5,
                color: 'text.primary',
                fontWeight: 600,
                textTransform: 'none',
                px: 2,
                py: 0.75,
                '&:hover': {
                  borderColor: '#10B981',
                  bgcolor: alpha('#10B981', 0.08),
                },
              }}
            >
              Group QR
            </Button>
            {(!group?.onlyAdminInvite || isGroupAdmin) ? (
              <Button
                variant="outlined"
                startIcon={<Share fontSize="small" />}
                onClick={() => setInviteOpen(true)}
                className="glass-tertiary"
                sx={{
                  borderRadius: 2.5,
                  color: 'text.primary',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2,
                  py: 0.75,
                  '&:hover': {
                    borderColor: '#10B981',
                    bgcolor: alpha('#10B981', 0.08),
                  },
                }}
              >
                Invite People
              </Button>
            ) : (
              <Tooltip title="Only group administrators can invite new members">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<Share fontSize="small" />}
                    disabled
                    className="glass-tertiary"
                    sx={{
                      borderRadius: 2.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 2,
                      py: 0.75,
                      opacity: 0.6,
                    }}
                  >
                    Invite (Admin Only)
                  </Button>
                </span>
              </Tooltip>
            )}
            <Button
              variant="contained"
              startIcon={<Add fontSize="small" />}
              onClick={() => router.push(`/expenses/new?groupId=${group?.id}`)}
              className="glass-emerald-active"
              sx={{
                borderRadius: 2.5,
                fontWeight: 650,
                textTransform: 'none',
                bgcolor: '#0E6245',
                color: '#FFFFFF',
                px: 2.5,
                py: 0.75,
                '&:hover': { bgcolor: '#094A34' },
              }}
            >
              Add Expense
            </Button>
          </Box>
        </Box>

        {/* Financial Summary Cards for this Group */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
              }}
            >
              <Typography variant="caption" sx={{ color: theme.palette.mode === 'dark' ? '#34D399' : 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Group Spend
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', mt: 0.5, letterSpacing: '-0.02em' }}>
                {formatCurrency(totalSpent)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {group?.expenses?.length || 0} bills across {group?.members?.length || 0} members
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              className={myBalance > 0 ? "glass-secondary glass-specular-top glass-emerald-ambient" : "glass-secondary glass-specular-top"}
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                borderColor: myBalance > 0 ? 'rgba(16, 185, 129, 0.35) !important' : myBalance < 0 ? 'rgba(239, 68, 68, 0.35) !important' : undefined,
              }}
            >
              <Typography variant="caption" sx={{ color: myBalance > 0 ? '#34D399' : myBalance < 0 ? '#F87171' : 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your Group Balance
              </Typography>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  color: myBalance > 0 ? '#10B981' : myBalance < 0 ? '#EF4444' : 'text.primary',
                  mt: 0.5,
                  letterSpacing: '-0.02em',
                }}
              >
                {myBalance > 0 ? '+' : ''}{formatCurrency(myBalance)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                {myBalance > 0 ? (
                  <Chip label="You are owed" size="small" sx={{ height: 20, fontSize: '0.675rem', fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }} />
                ) : myBalance < 0 ? (
                  <Chip label="You owe" size="small" sx={{ height: 20, fontSize: '0.675rem', fontWeight: 700, bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)' }} />
                ) : (
                  <Chip label="Settled up" size="small" sx={{ height: 20, fontSize: '0.675rem', fontWeight: 700, bgcolor: alpha(theme.palette.text.secondary, 0.1), color: 'text.secondary' }} />
                )}
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="caption" sx={{ color: theme.palette.mode === 'dark' ? '#34D399' : 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Debt Simplification
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#10B981' }}>
                  {balances?.simplifiedDebts?.length || 0} Pending Debts
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Greedy cash-flow algorithm active
                </Typography>
              </Box>
              <Button
                size="small"
                variant="text"
                onClick={() => setActiveTab(1)}
                sx={{
                  color: '#10B981',
                  p: 0,
                  justifyContent: 'flex-start',
                  fontWeight: 700,
                  fontSize: '0.775rem',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                }}
              >
                Review Settlements →
              </Button>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Controls (Expenses | Balances & Settle Up | Members & Security) */}
        <Box
          className="glass-tertiary"
          sx={{
            borderRadius: 3,
            p: 0.5,
            mb: 3,
            display: 'flex',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 40,
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              '& .MuiTabs-scroller': {
                overflowX: 'auto !important',
              },
              '& .MuiTabs-indicator': {
                height: '100%',
                borderRadius: 2.5,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(14, 98, 69, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                zIndex: 0,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 1.75, sm: 2.5 },
                minHeight: 40,
                zIndex: 1,
                borderRadius: 2.5,
                transition: 'all 0.2s ease',
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: theme.palette.mode === 'dark' ? '#34D399' : '#0E6245',
                },
              },
            }}
          >
            <Tab label={`Expenses (${group?.expenses?.length || 0})`} />
            <Tab label={`Balances & Settle Up (${balances?.balances?.length || 0})`} />
            <Tab label={`Members (${group?.members?.length || 0})`} />
            <Tab label="Settings ⚙️" />
          </Tabs>
        </Box>

        {/* TAB 0: EXPENSES & COMMAND HUB */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Main Stream: Quick Add & Expenses List */}
            <Grid size={{ xs: 12, lg: 7.5, xl: 8 }}>
              {/* Smart Quick-Add Bar scoped to this group */}
              <SmartQuickAddBar
                initialGroupId={group?.id}
                onExpenseCreated={fetchGroup}
                placeholder={`⚡ Quick Add in ${group?.name || 'this group'}: e.g. "Dinner 1200" or "Taxi 350"`}
              />

              {/* Expense Stream Card */}
              <Card
                className="glass-secondary glass-specular-top"
                sx={{
                  borderRadius: 3.5,
                  overflow: 'hidden',
                  boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                }}
              >
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  {group?.expenses && group.expenses.length > 0 ? (
                    <Box sx={{ width: '100%' }}>
                      {Object.entries(groupedGroupExpenses).map(([monthKey, monthItems]) => (
                        <Box key={monthKey}>
                          <Box
                            sx={{
                              px: { xs: 2, sm: 3 },
                              py: 0.9,
                              bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              borderTop: `1px solid ${theme.palette.divider}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.725rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: isLight ? '#475569' : '#94A3B8',
                              }}
                            >
                              {monthKey}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                              {monthItems.length} {monthItems.length === 1 ? 'expense' : 'expenses'}
                            </Typography>
                          </Box>

                          {monthItems.map((exp: any, idx: number) => {
                            const canEdit = isGroupAdmin || (!group?.onlyAdminEdit && (isCurrentUser(exp.createdById) || isCurrentUser(exp.paidById)));
                            const canDelete = isGroupAdmin || (!group?.onlyAdminEdit && isCurrentUser(exp.createdById));

                            return (
                              <React.Fragment key={exp.id}>
                                <SplitwiseExpenseItem
                                  expense={exp}
                                  currentUserId={profile?.id || user?.id}
                                  currentSupabaseId={user?.id}
                                  currentUserEmail={user?.email || profile?.email}
                                  currency={group.currency || 'INR'}
                                  showGroupTag={false}
                                  canEdit={canEdit}
                                  canDelete={canDelete}
                                  onClick={() => router.push(`/expenses?id=${exp.id}`)}
                                  onEdit={() => router.push(`/expenses/new?edit=${exp.id}&groupId=${group.id}`)}
                                  onDelete={() => handleDeleteGroupExpense(exp.id)}
                                  onClone={() => router.push(`/expenses/new?clone=${exp.id}&groupId=${group.id}`)}
                                />
                                {idx < monthItems.length - 1 && (
                                  <Divider sx={{ borderColor: theme.palette.divider, opacity: 0.6, ml: { xs: 7.5, sm: 9 } }} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                      <ReceiptLong sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
                      <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
                        No expenses yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Use the Quick-Add bar above or tap below to record your first bill.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => router.push(`/expenses/new?groupId=${group?.id}`)}
                        sx={{
                          bgcolor: '#0E6245',
                          color: '#FFFFFF',
                          borderRadius: 2.5,
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#094A34' },
                        }}
                      >
                        Add First Expense
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Desktop Side Action Panel (Persistent & Sticky on Desktop) */}
            <Grid size={{ xs: 12, lg: 4.5, xl: 4 }}>
              <Box sx={{ position: { xs: 'static', lg: 'sticky' }, top: 84, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                
                {/* 1. Quick Settlement Hub */}
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{
                    p: 2.5,
                    borderRadius: 3.5,
                    boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                    border: myBalance > 0 ? '1px solid rgba(16, 185, 129, 0.35) !important' : myBalance < 0 ? '1px solid rgba(239, 68, 68, 0.35) !important' : undefined,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: myBalance > 0 ? '#10B981' : myBalance < 0 ? '#EF4444' : 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Your Standing
                    </Typography>
                    <Chip
                      size="small"
                      label={myBalance > 0 ? 'You are owed' : myBalance < 0 ? 'You owe' : 'Settled up'}
                      sx={{
                        height: 20,
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        bgcolor: myBalance > 0 ? alpha('#10B981', 0.15) : myBalance < 0 ? alpha('#EF4444', 0.15) : alpha(theme.palette.text.secondary, 0.1),
                        color: myBalance > 0 ? '#10B981' : myBalance < 0 ? '#EF4444' : 'text.secondary',
                      }}
                    />
                  </Box>

                  <Typography variant="h4" fontWeight={850} sx={{ color: myBalance > 0 ? '#10B981' : myBalance < 0 ? '#EF4444' : 'text.primary', letterSpacing: '-0.02em', mb: 1.5 }}>
                    {myBalance > 0 ? '+' : ''}{formatCurrency(myBalance)}
                  </Typography>

                  {/* If you owe someone: list them with 1-click UPI / Settle */}
                  {balances?.simplifiedDebts?.some((d: any) => isCurrentUser(d.from)) ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {balances.simplifiedDebts
                        .filter((d: any) => isCurrentUser(d.from))
                        .map((d: any, idx: number) => (
                          <Paper
                            key={idx}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              borderRadius: 2.5,
                              bgcolor: isLight ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                Pay {d.to?.name || 'Member'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 800 }}>
                                {formatCurrency(d.amount)}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleSettleUpi(d.to?.name, d.amount, d.to?.id)}
                              sx={{
                                bgcolor: '#0E6245',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                borderRadius: 2,
                                px: 1.5,
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#094A34' },
                              }}
                            >
                              ⚡ Settle
                            </Button>
                          </Paper>
                        ))}
                    </Box>
                  ) : myBalance > 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      You are in surplus! Group members will pay you according to the settlement rules.
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      You have zero pending debts in this group. All settled up!
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => setActiveTab(1)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.775rem',
                      }}
                    >
                      All Balances & UPI →
                    </Button>
                  </Box>
                </Card>

                {/* 2. Simplified Debts Preview */}
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{
                    p: 2.5,
                    borderRadius: 3.5,
                    boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }}>
                      Simplified Debts
                    </Typography>
                    <Chip
                      size="small"
                      label={`${balances?.simplifiedDebts?.length || 0} pending`}
                      sx={{
                        height: 20,
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        bgcolor: alpha('#10B981', 0.12),
                        color: '#10B981',
                      }}
                    />
                  </Box>

                  {balances?.simplifiedDebts && balances.simplifiedDebts.length > 0 ? (
                    <List disablePadding>
                      {balances.simplifiedDebts.slice(0, 4).map((d: any, idx: number) => {
                        const fromMe = isCurrentUser(d.from);
                        const toMe = isCurrentUser(d.to);
                        return (
                          <ListItem key={idx} disablePadding sx={{ py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                              <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: alpha(theme.palette.primary.main, 0.15), color: theme.palette.primary.main }}>
                                {d.from?.name?.charAt(0) || '?'}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontSize: '0.825rem' }} noWrap>
                                <strong>{fromMe ? 'You' : d.from?.name}</strong> owes <strong>{toMe ? 'You' : d.to?.name}</strong>
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={800} sx={{ color: fromMe ? '#EF4444' : toMe ? '#10B981' : 'text.primary', ml: 1, flexShrink: 0 }}>
                              {formatCurrency(d.amount)}
                            </Typography>
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No outstanding debts. Everyone is fully squared away!
                    </Typography>
                  )}
                </Card>

                {/* 3. Members Quick View & WhatsApp Admin Controls */}
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{
                    p: 2.5,
                    borderRadius: 3.5,
                    boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }}>
                      Members ({group?.members?.length || 0})
                    </Typography>
                    {(!group?.onlyAdminInvite || isGroupAdmin) && (
                      <Button
                        size="small"
                        startIcon={<PersonAdd sx={{ fontSize: 16 }} />}
                        onClick={() => setInviteOpen(true)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          p: 0,
                          minWidth: 'auto',
                          color: '#10B981',
                        }}
                      >
                        + Add
                      </Button>
                    )}
                  </Box>

                  <List disablePadding>
                    {(group?.members || []).slice(0, 5).map((m: any, idx: number) => {
                      const isSelf = isCurrentUser(m);
                      const memberName = m.user?.name || 'Member';
                      return (
                        <ListItem key={m.userId || idx} disablePadding sx={{ py: 0.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                            <Avatar src={m.user?.avatarUrl} sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              {memberName.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: 650 }} noWrap>
                              {memberName} {isSelf && '(You)'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            {m.role === 'ADMIN' && (
                              <Chip
                                label="👑 Admin"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.625rem',
                                  fontWeight: 750,
                                  bgcolor: alpha('#F59E0B', 0.15),
                                  color: '#D97706',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                              />
                            )}
                            {isGroupAdmin && !isSelf && (
                              <IconButton
                                size="small"
                                onClick={(e) => handleOpenMemberMenu(e, m)}
                                aria-label={`Options for ${memberName}`}
                                sx={{ p: 0.25 }}
                              >
                                <MoreVert sx={{ fontSize: 17 }} />
                              </IconButton>
                            )}
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>

                  {(group?.members?.length || 0) > 5 && (
                    <Button
                      fullWidth
                      variant="text"
                      size="small"
                      onClick={() => setActiveTab(2)}
                      sx={{ mt: 1, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}
                    >
                      View all {group.members.length} members →
                    </Button>
                  )}
                </Card>

              </Box>
            </Grid>
          </Grid>
        )}

        {/* TAB 1: BALANCES & SETTLE UP */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {/* Member Balances */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                className="glass-secondary glass-specular-top"
                sx={{
                  borderRadius: 3.5,
                  p: 3,
                  boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                }}
              >
                <Typography variant="h6" fontWeight={750} sx={{ mb: 2, color: 'text.primary' }}>
                  Individual Balances
                </Typography>
                <List disablePadding>
                  {balances?.balances?.map((b: any, i: number) => {
                    const isPositive = b.balance > 0;
                    const isZero = Math.abs(b.balance) < 1;

                    return (
                      <React.Fragment key={b.user.id}>
                        <ListItem disablePadding sx={{ py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar
                              src={b.user.avatarUrl || undefined}
                              className="glass-tertiary"
                              sx={{
                                width: 38,
                                height: 38,
                                bgcolor: isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                color: isPositive ? '#34D399' : '#F87171',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                              }}
                            >
                              {b.user.name?.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            disableTypography
                            primary={<Typography variant="body2" fontWeight={600}>{b.user.name}</Typography>}
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {isZero ? 'All settled' : isPositive ? 'Gets back' : 'Owes to group'}
                              </Typography>
                            }
                          />
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            sx={{
                              color: isZero ? 'text.secondary' : isPositive ? '#10B981' : '#EF4444',
                            }}
                          >
                            {isPositive ? '+' : ''}{formatCurrency(b.balance)}
                          </Typography>
                        </ListItem>
                        {i < balances.balances.length - 1 && (
                          <Divider component="li" sx={{ borderColor: theme.palette.divider }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Card>
            </Grid>

            {/* Splitwise Debt Simplification & Direct UPI Settle */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card
                className="glass-secondary glass-specular-top"
                sx={{
                  borderRadius: 3.5,
                  p: 3,
                  boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary' }}>
                      Simplified Debt Settlements
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Minimum transactions needed to settle all debts
                    </Typography>
                  </Box>
                  <Chip
                    label="Greedy Algorithm"
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(16, 185, 129, 0.15)',
                      color: '#34D399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  />
                </Box>

                {balances?.simplifiedDebts && balances.simplifiedDebts.length > 0 ? (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {balances.simplifiedDebts.map((debt: any, i: number) => {
                      const isMyDebt = user && (debt.from.id === user.id || debt.from.supabase_id === user.id);

                      return (
                        <Card
                          key={i}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            borderColor: theme.palette.divider,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 1.5,
                            bgcolor: isMyDebt ? alpha('#EF4444', 0.04) : 'background.paper',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={debt.from.avatarUrl || undefined}
                              sx={{ width: 34, height: 34, fontSize: '0.8rem', bgcolor: '#EF4444' }}
                            >
                              {debt.from.name?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                                {debt.from.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                owes {debt.to.name}
                              </Typography>
                            </Box>
                            <ArrowForward sx={{ fontSize: 18, color: 'text.secondary', mx: 0.5 }} />
                            <Avatar
                              src={debt.to.avatarUrl || undefined}
                              sx={{ width: 34, height: 34, fontSize: '0.8rem', bgcolor: '#0E6245' }}
                            >
                              {debt.to.name?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                              {debt.to.name}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0E6245' }}>
                              {formatCurrency(debt.amount)}
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<QrCode2 fontSize="small" />}
                              onClick={() => handleSettleUpi(debt.to.name, debt.amount, debt.to.id)}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: '0.775rem',
                                bgcolor: '#0E6245',
                                color: '#FFFFFF',
                                textTransform: 'none',
                                px: 2,
                                '&:hover': { bgcolor: '#094A34' },
                              }}
                            >
                              Pay UPI
                            </Button>
                          </Box>
                        </Card>
                      );
                    })}
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <Check sx={{ fontSize: 44, color: '#0E6245', mb: 1 }} />
                    <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary' }}>
                      All settled up!
                    </Typography>
                    <Typography variant="caption">No pending debts in this group right now.</Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 2: MEMBERS & SECURITY */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            {/* Members List */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card
                className="glass-secondary glass-specular-top"
                sx={{
                  borderRadius: 3.5,
                  p: 3,
                  boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary' }}>
                    Group Members ({group?.members?.length || 0})
                  </Typography>
                  {(!group?.onlyAdminInvite || isGroupAdmin) ? (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PersonAdd fontSize="small" />}
                      onClick={() => setInviteOpen(true)}
                      className="glass-tertiary"
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                    >
                      Add Member
                    </Button>
                  ) : (
                    <Chip
                      label="Admin-Only Invites"
                      size="small"
                      sx={{
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        bgcolor: alpha(theme.palette.text.secondary, 0.08),
                        color: 'text.secondary',
                      }}
                    />
                  )}
                </Box>

                <List disablePadding>
                  {group?.members?.map((m: any, i: number) => {
                    const memberId = m.userId || m.user?.id;
                    const isSelf = isCurrentUser(m);
                    const memberName = m.user?.name || 'Member';

                    return (
                      <React.Fragment key={memberId || i}>
                        <ListItem
                          disablePadding
                          sx={{
                            py: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                            <ListItemAvatar sx={{ minWidth: 'auto' }}>
                              <Avatar
                                src={m.user?.avatarUrl || undefined}
                                className="glass-tertiary"
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: 'rgba(16, 185, 129, 0.2)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: '#34D399',
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                }}
                              >
                                {memberName.charAt(0) || '?'}
                              </Avatar>
                            </ListItemAvatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                <Typography variant="body2" fontWeight={700} noWrap>
                                  {memberName} {isSelf && '(You)'}
                                </Typography>
                                {(m.user?.username || m.user?.email) && (
                                  <Chip
                                    label={`@${m.user?.username || m.user?.email?.split('@')[0]}`}
                                    size="small"
                                    sx={{
                                      height: 19,
                                      fontSize: '0.68rem',
                                      fontWeight: 650,
                                      bgcolor: 'rgba(59, 130, 246, 0.12)',
                                      color: '#60A5FA',
                                      border: '1px solid rgba(59, 130, 246, 0.25)',
                                      px: 0.3,
                                    }}
                                  />
                                )}
                              </Stack>
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                {m.user?.email || m.user?.phone || 'Member'}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                            <Chip
                              label={m.role === 'ADMIN' ? '👑 Admin' : 'Member'}
                              size="small"
                              sx={{
                                fontWeight: 650,
                                fontSize: '0.7rem',
                                bgcolor: m.role === 'ADMIN' ? alpha('#F59E0B', 0.12) : alpha(theme.palette.text.secondary, 0.08),
                                color: m.role === 'ADMIN' ? '#D97706' : 'text.secondary',
                                border: m.role === 'ADMIN' ? '1px solid rgba(245, 158, 11, 0.3)' : undefined,
                              }}
                            />

                            {/* WhatsApp-Style Admin Management Menu (Available if viewer is an Admin and member is not self) */}
                            {isGroupAdmin && !isSelf && (
                              <IconButton
                                size="small"
                                onClick={(e) => handleOpenMemberMenu(e, m)}
                                aria-label={`Options for ${memberName}`}
                                sx={{
                                  color: 'text.secondary',
                                  '&:hover': { color: 'text.primary', bgcolor: alpha(theme.palette.text.primary, 0.08) },
                                }}
                              >
                                <MoreVert fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </ListItem>
                        {i < group.members.length - 1 && (
                          <Divider component="li" sx={{ borderColor: theme.palette.divider }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </List>

                {/* WhatsApp-Style Member Management Menu — Perfectly Anchored */}
                <Menu
                  anchorEl={memberMenuAnchorEl}
                  open={Boolean(memberMenuAnchorEl && selectedMember)}
                  onClose={handleCloseMemberMenu}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  disableScrollLock
                  slotProps={{
                    paper: {
                      elevation: 0,
                      sx: {
                        minWidth: 200,
                        borderRadius: 3,
                        p: 0.75,
                        bgcolor: isLight ? '#FFFFFF' : '#0E131F',
                        border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'}`,
                        boxShadow: isLight
                          ? '0 16px 36px -4px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.05)'
                          : '0 24px 48px -6px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.06)',
                      },
                    },
                  }}
                >
                  {selectedMember?.role === 'ADMIN' ? (
                    <MenuItem
                      onClick={async () => {
                        const target = selectedMember;
                        handleCloseMemberMenu();
                        if (target) {
                          const targetId = target.userId || target.user?.id || target.id;
                          const targetName = target.user?.name || target.name || 'Member';
                          await handleUpdateMemberRole(targetId, targetName, 'MEMBER');
                        }
                      }}
                      sx={{ borderRadius: 2, py: 1, fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <ListItemIcon>
                        <Security fontSize="small" sx={{ color: 'text.secondary' }} />
                      </ListItemIcon>
                      Dismiss as Admin
                    </MenuItem>
                  ) : (
                    <MenuItem
                      onClick={async () => {
                        const target = selectedMember;
                        handleCloseMemberMenu();
                        if (target) {
                          const targetId = target.userId || target.user?.id || target.id;
                          const targetName = target.user?.name || target.name || 'Member';
                          await handleUpdateMemberRole(targetId, targetName, 'ADMIN');
                        }
                      }}
                      sx={{ borderRadius: 2, py: 1, fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <ListItemIcon>
                        <SupervisorAccount fontSize="small" sx={{ color: '#F59E0B' }} />
                      </ListItemIcon>
                      Make Group Admin 👑
                    </MenuItem>
                  )}
                  <Divider sx={{ my: 0.5, borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)' }} />
                  <MenuItem
                    onClick={() => {
                      const target = selectedMember;
                      handleCloseMemberMenu();
                      if (target) {
                        setRemoveConfirmMember(target);
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#EF4444',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
                    }}
                  >
                    <ListItemIcon>
                      <PersonRemove fontSize="small" sx={{ color: '#EF4444' }} />
                    </ListItemIcon>
                    Remove from Group
                  </MenuItem>
                </Menu>

                {/* Remove Member Confirmation Dialog */}
                <Dialog
                  open={Boolean(removeConfirmMember)}
                  onClose={() => setRemoveConfirmMember(null)}
                  slotProps={{
                    paper: {
                      elevation: 0,
                      sx: {
                        borderRadius: 3.5,
                        p: 1,
                        bgcolor: isLight ? '#FFFFFF' : '#0E131F',
                        border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'}`,
                        boxShadow: isLight
                          ? '0 20px 48px rgba(15, 23, 42, 0.12)'
                          : '0 28px 72px rgba(0, 0, 0, 0.85)',
                        maxWidth: 420,
                      },
                    },
                  }}
                >
                  <DialogTitle component="div" sx={{ pb: 1, pt: 2, px: 3 }}>
                    <Typography variant="h6" fontWeight={800} color="text.primary">
                      Remove Member?
                    </Typography>
                  </DialogTitle>
                  <DialogContent sx={{ px: 3, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Are you sure you want to remove{' '}
                      <strong>{removeConfirmMember?.user?.name || removeConfirmMember?.name || 'this member'}</strong> from the group?
                      They will no longer have access to group expenses or balances.
                    </Typography>
                  </DialogContent>
                  <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
                    <Button
                      onClick={() => setRemoveConfirmMember(null)}
                      sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={async () => {
                        const target = removeConfirmMember;
                        setRemoveConfirmMember(null);
                        if (target) {
                          const targetId = target.userId || target.user?.id || target.id;
                          const targetName = target.user?.name || target.name || 'Member';
                          await handleRemoveMember(targetId, targetName);
                        }
                      }}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                      Remove Member
                    </Button>
                  </DialogActions>
                </Dialog>
              </Card>
            </Grid>

            {/* Quick Invite & Security Info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                className="glass-secondary glass-specular-top"
                sx={{
                  borderRadius: 3.5,
                  p: 3,
                  boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                }}
              >
                <Typography variant="h6" fontWeight={750} sx={{ mb: 1.5, color: 'text.primary' }}>
                  Invite & Security
                </Typography>

                {(group?.isPasswordProtected || group?.requireAdminApproval) && (
                  <Box
                    className="glass-emerald-ambient"
                    sx={{
                      p: 2,
                      mb: 2.5,
                      borderRadius: 2.5,
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} color="#10B981" sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Security sx={{ fontSize: 16 }} /> Group Security Active
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {group.isPasswordProtected && '• Passcode required to join via link.\n'}
                      {group.requireAdminApproval && '• Admin approval required for joining.'}
                    </Typography>
                  </Box>
                )}

                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Shareable Invite Link
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={inviteLink}
                    slotProps={{ input: { readOnly: true } }}
                    className="glass-tertiary"
                  />
                  <Button
                    variant="contained"
                    onClick={handleCopyLink}
                    startIcon={copied ? <Check /> : <ContentCopy />}
                    className={copied ? undefined : "glass-emerald-active"}
                    sx={{
                      px: 2,
                      fontWeight: 700,
                      flexShrink: 0,
                      bgcolor: copied ? 'success.main' : '#0E6245',
                      color: '#FFFFFF',
                      textTransform: 'none',
                    }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </Box>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<WhatsApp sx={{ color: '#25D366' }} />}
                  onClick={handleShareWhatsApp}
                  className="glass-tertiary"
                  sx={{
                    py: 1,
                    borderRadius: 2.5,
                    fontWeight: 600,
                    borderColor: alpha('#25D366', 0.5),
                    color: theme.palette.text.primary,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#25D366', bgcolor: alpha('#25D366', 0.08) },
                  }}
                >
                  Share via WhatsApp
                </Button>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 3: GROUP SETTINGS (Admin Configurable & Financial Portability) */}
        {activeTab === 3 && (
          <Box className="animate-fade-in" sx={{ width: '100%' }}>
            {/* Role & Access Status Header Card */}
            <Card
              className={isGroupAdmin ? 'glass-secondary glass-specular-top glass-emerald-ambient' : 'glass-secondary glass-specular-top'}
              sx={{
                p: { xs: 2, sm: 2.75 },
                mb: 3,
                borderRadius: 3.5,
                border: isGroupAdmin ? '1px solid rgba(16, 185, 129, 0.35) !important' : `1px solid ${theme.palette.divider}`,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: isGroupAdmin ? 'rgba(16, 185, 129, 0.2)' : alpha(theme.palette.text.secondary, 0.12),
                      color: isGroupAdmin ? '#34D399' : 'text.secondary',
                      border: isGroupAdmin ? '1px solid rgba(16, 185, 129, 0.4)' : undefined,
                    }}
                  >
                    {isGroupAdmin ? <AdminPanelSettings sx={{ fontSize: 28 }} /> : <Shield sx={{ fontSize: 28 }} />}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
                        {isGroupAdmin ? 'Administrator Controls Active 👑' : 'Group Member View (Read-Only)'}
                      </Typography>
                      <Chip
                        label={isGroupAdmin ? 'Authorized Admin' : 'Member'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          bgcolor: isGroupAdmin ? alpha('#10B981', 0.15) : alpha(theme.palette.text.secondary, 0.1),
                          color: isGroupAdmin ? '#10B981' : 'text.secondary',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {isGroupAdmin
                        ? 'You have administrative control to modify group settings, privacy, currency, invite permissions, and ledger rules.'
                        : 'Group settings and security policies can only be adjusted by authorized group administrators.'}
                    </Typography>
                  </Box>
                </Box>
                {isGroupAdmin && (
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveGroup}
                    disabled={savingGroup || !editGroupForm.name.trim()}
                    className="glass-emerald-active"
                    sx={{
                      borderRadius: 2.5,
                      fontWeight: 700,
                      bgcolor: '#0E6245',
                      color: '#ffffff',
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      '&:hover': { bgcolor: '#094A34' },
                    }}
                  >
                    {savingGroup ? 'Saving...' : 'Save Settings'}
                  </Button>
                )}
              </Box>
            </Card>

            <Grid container spacing={3}>
              {/* Profile & Identity Card */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{
                    borderRadius: 3.5,
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={750} sx={{ mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                      Group Identity & Currency
                    </Typography>
                    <Stack spacing={2.5}>
                      <TextField
                        fullWidth
                        label="Group Name"
                        value={editGroupForm.name}
                        onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                        disabled={!isGroupAdmin}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                        helperText={isGroupAdmin ? 'Public name displayed to all members' : 'Locked for non-admins'}
                      />
                      <TextField
                        fullWidth
                        label="Description"
                        value={editGroupForm.description}
                        onChange={(e) => setEditGroupForm({ ...editGroupForm, description: e.target.value })}
                        disabled={!isGroupAdmin}
                        multiline
                        rows={2.5}
                        slotProps={{ htmlInput: { maxLength: 500 } }}
                        helperText="Purpose or guidelines for this group"
                      />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            select
                            label="Group Type"
                            value={editGroupForm.type}
                            onChange={(e) => setEditGroupForm({ ...editGroupForm, type: e.target.value })}
                            disabled={!isGroupAdmin}
                          >
                            {GROUP_TYPES.map((t) => (
                              <MenuItem key={t} value={t}>
                                {t.charAt(0) + t.slice(1).toLowerCase()}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            select
                            label="Base Currency"
                            value={editGroupForm.currency}
                            onChange={(e) => setEditGroupForm({ ...editGroupForm, currency: e.target.value.toUpperCase() })}
                            disabled={!isGroupAdmin}
                            helperText="Financial ledger unit"
                          >
                            {['INR', 'USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'CHF'].map((c) => (
                              <MenuItem key={c} value={c}>
                                {c}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Box>
                </Card>
              </Grid>

              {/* Permissions & Security Policies Card */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{
                    borderRadius: 3.5,
                    p: 3,
                    boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                  }}
                >
                  <Typography variant="h6" fontWeight={750} sx={{ mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    Security & Permission Policies
                  </Typography>

                  <Stack spacing={2}>
                    {/* Passcode Protection */}
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editGroupForm.isPasswordProtected}
                            onChange={(e) => setEditGroupForm({ ...editGroupForm, isPasswordProtected: e.target.checked })}
                            disabled={!isGroupAdmin}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={700}>Require Passcode to Join</Typography>
                            <Typography variant="caption" color="text.secondary">Invitees must enter this secret passcode to access group.</Typography>
                          </Box>
                        }
                      />
                      {editGroupForm.isPasswordProtected && isGroupAdmin && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Group Passcode (leave blank to retain current)"
                          type="password"
                          value={editGroupForm.password}
                          onChange={(e) => setEditGroupForm({ ...editGroupForm, password: e.target.value })}
                          sx={{ mt: 1.5 }}
                        />
                      )}
                    </Box>

                    {/* Require Admin Approval */}
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editGroupForm.requireAdminApproval}
                            onChange={(e) => setEditGroupForm({ ...editGroupForm, requireAdminApproval: e.target.checked })}
                            disabled={!isGroupAdmin}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={700}>Require Admin Approval</Typography>
                            <Typography variant="caption" color="text.secondary">Admins must review and approve join requests before member joins.</Typography>
                          </Box>
                        }
                      />
                    </Box>

                    {/* Admin-only Invites */}
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editGroupForm.onlyAdminInvite}
                            onChange={(e) => setEditGroupForm({ ...editGroupForm, onlyAdminInvite: e.target.checked })}
                            disabled={!isGroupAdmin}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={700}>Admin-Only Invites</Typography>
                            <Typography variant="caption" color="text.secondary">Only group administrators can generate invite links or add members.</Typography>
                          </Box>
                        }
                      />
                    </Box>

                    {/* Admin-only Expense Edit */}
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editGroupForm.onlyAdminEdit}
                            onChange={(e) => setEditGroupForm({ ...editGroupForm, onlyAdminEdit: e.target.checked })}
                            disabled={!isGroupAdmin}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={700}>Lock Expense Modifications</Typography>
                            <Typography variant="caption" color="text.secondary">Only administrators can edit or delete recorded bills and expenses.</Typography>
                          </Box>
                        }
                      />
                    </Box>

                    {/* Debt Simplification */}
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editGroupForm.simplifyDebts}
                            onChange={(e) => setEditGroupForm({ ...editGroupForm, simplifyDebts: e.target.checked })}
                            disabled={!isGroupAdmin}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={700}>Splitwise Debt Simplification</Typography>
                            <Typography variant="caption" color="text.secondary">Use greedy cash-flow algorithm to reduce the total number of transactions needed between members.</Typography>
                          </Box>
                        }
                      />
                    </Box>

                    {/* Require Payee Settlement Confirmation */}
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editGroupForm.requireSettlementConfirmation}
                            onChange={(e) => setEditGroupForm({ ...editGroupForm, requireSettlementConfirmation: e.target.checked })}
                            disabled={!isGroupAdmin}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={700}>Require Payee Confirmation for Settlements</Typography>
                            <Typography variant="caption" color="text.secondary">When enabled, recorded payments remain Pending until the receiver clicks Confirm Received. When disabled, payments settle instantly.</Typography>
                          </Box>
                        }
                      />
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              {/* Financial Ledger Portability & Export (Production-Ready) */}
              <Grid size={{ xs: 12 }}>
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{
                    borderRadius: 3.5,
                    p: 3,
                    boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TableChart sx={{ color: '#10B981' }} /> Financial Reports & Ledger Export
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Download complete ledger records for accounting, travel reimbursements, tax audits, or spreadsheet analysis in Excel and Google Sheets.
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
                      <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={() => handleExportGroup('csv')}
                        disabled={exporting}
                        className="glass-tertiary"
                        sx={{
                          borderRadius: 2.5,
                          fontWeight: 700,
                          textTransform: 'none',
                          color: 'text.primary',
                          px: 2.5,
                          py: 1,
                          flex: { xs: 1, sm: 'auto' },
                          '&:hover': { borderColor: '#10B981', bgcolor: alpha('#10B981', 0.08) },
                        }}
                      >
                        {exporting ? 'Exporting...' : 'Export CSV (Excel)'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={() => handleExportGroup('json')}
                        disabled={exporting}
                        className="glass-tertiary"
                        sx={{
                          borderRadius: 2.5,
                          fontWeight: 700,
                          textTransform: 'none',
                          color: 'text.primary',
                          px: 2.5,
                          py: 1,
                          flex: { xs: 1, sm: 'auto' },
                          '&:hover': { borderColor: '#10B981', bgcolor: alpha('#10B981', 0.08) },
                        }}
                      >
                        {exporting ? 'Exporting...' : 'Export JSON'}
                      </Button>
                    </Stack>
                  </Box>
                </Card>
              </Grid>

              {/* Danger Zone */}
              <Grid size={{ xs: 12 }}>
                <Card
                  sx={{
                    borderRadius: 3.5,
                    p: 3,
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    bgcolor: alpha('#EF4444', 0.03),
                    boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                  }}
                >
                  <Typography variant="h6" fontWeight={750} sx={{ color: '#EF4444', mb: 1 }}>
                    Danger Zone
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Actions here have permanent effects on your group participation and history.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                        Leave this group
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Remove yourself from this group. Historical expenses will remain intact.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Logout />}
                      onClick={() => setLeaveGroupOpen(true)}
                      sx={{
                        borderRadius: 2.5,
                        fontWeight: 700,
                        textTransform: 'none',
                        px: 3,
                        py: 0.85,
                        width: { xs: '100%', sm: 'auto' },
                      }}
                    >
                      Leave Group
                    </Button>
                  </Box>

                  {isGroupAdmin && (
                    <>
                      <Divider sx={{ my: 2, borderColor: alpha('#EF4444', 0.2) }} />
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#EF4444' }}>
                            Delete & Archive Group
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Permanently closes member invitations and archives the group from active dashboards.
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => setDeleteGroupOpen(true)}
                          sx={{
                            borderRadius: 2.5,
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3,
                            py: 0.85,
                            width: { xs: '100%', sm: 'auto' },
                          }}
                        >
                          Delete Group
                        </Button>
                      </Box>
                    </>
                  )}
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Invite Dialog */}
        <Dialog
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: { xs: 3, sm: 4 },
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                m: { xs: 1.5, sm: 3 },
                width: { xs: 'calc(100% - 24px)', sm: '100%' },
                maxWidth: { xs: 'calc(100% - 24px)', sm: '550px' },
              },
            },
          }}
        >
          <DialogTitle
            component="div"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              pb: 1,
              pt: { xs: 2, sm: 2.5 },
              px: { xs: 2, sm: 3 },
            }}
          >
            <Box>
              <Typography variant="h6" component="span" fontWeight={800} sx={{ color: 'text.primary' }}>
                Invite to {group?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Add friends via link, WhatsApp, email, or phone
              </Typography>
            </Box>
            <IconButton onClick={() => setInviteOpen(false)} size="small" className="glass-tertiary">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Shareable Link
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField fullWidth size="small" value={inviteLink} slotProps={{ input: { readOnly: true } }} />
                  <Button
                    variant="contained"
                    onClick={handleCopyLink}
                    startIcon={copied ? <Check /> : <ContentCopy />}
                    sx={{ px: 2.5, py: { xs: 1, sm: 'auto' }, fontWeight: 700, bgcolor: copied ? 'success.main' : '#0E6245', color: '#FFFFFF', textTransform: 'none', flexShrink: 0 }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </Box>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<WhatsApp sx={{ color: '#25D366' }} />}
                onClick={handleShareWhatsApp}
                sx={{
                  py: 1,
                  borderRadius: 2.5,
                  fontWeight: 600,
                  borderColor: alpha('#25D366', 0.5),
                  color: theme.palette.text.primary,
                  textTransform: 'none',
                }}
              >
                Share via WhatsApp
              </Button>

              <Divider>
                <Typography variant="caption" color="text.secondary">OR INVITE DIRECTLY</Typography>
              </Divider>

              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Add by Email or Phone Number
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="friend@email.com or +919876543210"
                    value={inviteContact}
                    onChange={(e) => setInviteContact(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleDirectInvite(); }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleDirectInvite}
                    disabled={!inviteContact.trim()}
                    startIcon={<PersonAdd />}
                    sx={{ px: 2.5, py: { xs: 1, sm: 'auto' }, fontWeight: 700, bgcolor: '#0E6245', color: '#FFFFFF', textTransform: 'none', flexShrink: 0 }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 } }}>
            <Button onClick={() => setInviteOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Group Dialog (Admin Only) */}
        <Dialog
          open={editGroupOpen}
          onClose={() => { setEditGroupOpen(false); setEditGroupError(''); }}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: { xs: 3, sm: 4 },
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                m: { xs: 1.5, sm: 3 },
                width: { xs: 'calc(100% - 24px)', sm: '100%' },
                maxWidth: { xs: 'calc(100% - 24px)', sm: '500px' },
              },
            },
          }}
        >
          <DialogTitle
            component="div"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 1,
              px: { xs: 2, sm: 3 },
              pt: { xs: 2, sm: 2.5 },
            }}
          >
            <Typography variant="h6" component="span" fontWeight={800} sx={{ color: 'text.primary' }}>
              Edit Group Settings
            </Typography>
            <IconButton onClick={() => { setEditGroupOpen(false); setEditGroupError(''); }} size="small" className="glass-tertiary">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {editGroupError && (
                <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>
                  ⚠️ {editGroupError}
                </Typography>
              )}
              <TextField
                fullWidth
                label="Group Name"
                value={editGroupForm.name}
                onChange={(e) => {
                  setEditGroupForm({ ...editGroupForm, name: e.target.value });
                  setEditGroupError('');
                }}
                slotProps={{ htmlInput: { maxLength: 100 } }}
                helperText="Between 1 and 100 characters"
                required
              />
              <TextField
                fullWidth
                label="Description (optional)"
                value={editGroupForm.description}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, description: e.target.value })}
                multiline
                rows={2}
                slotProps={{ htmlInput: { maxLength: 500 } }}
                helperText="Up to 500 characters"
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Group Type"
                    value={editGroupForm.type}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, type: e.target.value })}
                  >
                    {GROUP_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Currency"
                    value={editGroupForm.currency}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, currency: e.target.value.toUpperCase() })}
                    slotProps={{ htmlInput: { maxLength: 3 } }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 0.5 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={editGroupForm.isPasswordProtected}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, isPasswordProtected: e.target.checked })}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" fontWeight={600}>Require Passcode to Join</Typography>}
              />

              {editGroupForm.isPasswordProtected && (
                <TextField
                  fullWidth
                  size="small"
                  label="New Passcode (leave blank to keep current)"
                  type="password"
                  value={editGroupForm.password}
                  onChange={(e) => setEditGroupForm({ ...editGroupForm, password: e.target.value })}
                  slotProps={{ htmlInput: { maxLength: 50 } }}
                />
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={editGroupForm.requireAdminApproval}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, requireAdminApproval: e.target.checked })}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" fontWeight={600}>Require Admin Approval for New Members</Typography>}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editGroupForm.onlyAdminInvite}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, onlyAdminInvite: e.target.checked })}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" fontWeight={600}>Admin-Only Invites (Members Cannot Invite)</Typography>}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editGroupForm.onlyAdminEdit}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, onlyAdminEdit: e.target.checked })}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" fontWeight={600}>Lock Expense Modifications (Admin Only)</Typography>}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editGroupForm.simplifyDebts}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, simplifyDebts: e.target.checked })}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" fontWeight={600}>Splitwise Debt Simplification Active</Typography>}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
            <Button onClick={() => { setEditGroupOpen(false); setEditGroupError(''); }} sx={{ borderRadius: 2.5, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveGroup}
              disabled={savingGroup || !editGroupForm.name.trim()}
              className="glass-emerald-active"
              sx={{
                borderRadius: 2.5,
                px: 3.5,
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: '#0E6245',
                color: '#ffffff',
                '&:hover': { bgcolor: '#094A34' },
              }}
            >
              {savingGroup ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Leave Group Confirmation Dialog */}
        <Dialog
          open={leaveGroupOpen}
          onClose={() => setLeaveGroupOpen(false)}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: { borderRadius: 3.5, p: 1 },
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>
            Leave Group?
          </DialogTitle>
          <DialogContent>
            {isOnlyAdmin ? (
              <Alert severity="warning" sx={{ borderRadius: 2.5, mb: 1, fontWeight: 600 }}>
                You are currently the only administrator in this group. You must promote another member to Admin before leaving.
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Are you sure you want to leave &quot;{group?.name}&quot;? You will no longer receive group updates or split new expenses here. Any pending debts or credits will remain recorded on the ledger.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setLeaveGroupOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleLeaveGroup}
              disabled={leavingGroup || isOnlyAdmin}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
            >
              {leavingGroup ? 'Leaving...' : 'Yes, Leave Group'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Group Confirmation Dialog */}
        <Dialog
          open={deleteGroupOpen}
          onClose={() => setDeleteGroupOpen(false)}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: { borderRadius: 3.5, p: 1 },
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>
            Delete Group?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to delete and archive &quot;{group?.name}&quot;? All member invitations will be closed. Existing shared expenses will remain preserved for accounting.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteGroupOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteGroup}
              disabled={deletingGroup}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
            >
              {deletingGroup ? 'Deleting...' : 'Yes, Delete Group'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* UPI Payment Modal */}
        <UpiPaymentModal
          open={upiModal.open}
          onClose={() => setUpiModal({ ...upiModal, open: false })}
          payeeName={upiModal.payeeName}
          payeeUpiId={upiModal.payeeUpiId}
          amount={upiModal.amount}
          currency={group?.currency || 'INR'}
          onConfirmSettlement={async () => {
            const targetPayeeId = upiModal.payeeId;
            setUpiModal({ ...upiModal, open: false });
            if (targetPayeeId) {
              await handleRecordSettlement(targetPayeeId, upiModal.amount);
            } else {
              setToastMessage(`Payment of ${formatCurrency(upiModal.amount)} to ${upiModal.payeeName} marked as completed!`);
              fetchGroup();
            }
          }}
        />

        {/* Group Join QR Code Modal */}
        <QrCodeModal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title={`Join ${group?.name || 'Group'}`}
          subtitle="Scan this QR code with any smartphone camera or FairShare app to join this group instantly."
          value={inviteLink}
          badgeText="Instant Group Join"
          downloadFileName={`fairshare-group-${group?.name?.toLowerCase().replace(/\s+/g, '-') || 'invite'}-qr`}
        />

        {/* Feedback Snackbar */}
        <Snackbar
          open={Boolean(toastMessage)}
          autoHideDuration={3000}
          onClose={() => setToastMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ borderRadius: 3, fontWeight: 600 }}>
            {toastMessage}
          </Alert>
        </Snackbar>
        </Box>
      )}
    </AppLayout>
  );
}

export default function GroupDetailPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <GroupDetailSkeleton />
        </AppLayout>
      }
    >
      <GroupDetailContent />
    </Suspense>
  );
}
