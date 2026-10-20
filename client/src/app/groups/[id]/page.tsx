'use client';

import React, { Suspense, useEffect, useState, useMemo, useRef } from 'react';
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
      });
    }
  }, [group]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    if (user?.id && params.id) fetchGroup();
  }, [user?.id, params.id]);

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
    try {
      const isEmail = inviteContact.includes('@');
      await groupApi.addMember(group.id, isEmail ? { email: inviteContact.trim() } : { phone: inviteContact.trim() });
      setToastMessage(`Member added/invited: ${inviteContact}!`);
      setInviteContact('');
      fetchGroup();
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Failed to add member.');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: group?.currency || 'INR', maximumFractionDigits: 0 }).format(amount);

  const totalSpent = useMemo(() => {
    if (!group?.expenses) return 0;
    return group.expenses.reduce((acc: number, exp: any) => acc + Number(exp.amount || 0), 0);
  }, [group]);

  const myBalance = useMemo(() => {
    if (!balances?.balances || !user) return 0;
    const currentMember = balances.balances.find((b: any) => b.user.id === user.id || b.user.supabase_id === user.id);
    return currentMember ? currentMember.balance : 0;
  }, [balances, user]);

  const isGroupAdmin = useMemo(() => {
    if (!group?.members || !user) return false;
    const member = group.members.find((m: any) => m.userId === user.id || m.user?.id === user.id);
    return member?.role === 'ADMIN';
  }, [group, user]);

  const [memberMenuAnchor, setMemberMenuAnchor] = useState<{ el: HTMLElement; member: any } | null>(null);

  // Group expenses by Month & Year
  const groupedGroupExpenses = useMemo(() => {
    if (!group?.expenses) return {};
    const groups: Record<string, any[]> = {};
    group.expenses.forEach((exp: any) => {
      const d = exp.date ? new Date(exp.date) : new Date();
      const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(exp);
    });
    return groups;
  }, [group?.expenses]);

  // WhatsApp-style Multiple Admin Role Toggle
  const handleUpdateMemberRole = async (targetUserId: string, targetName: string, newRole: 'ADMIN' | 'MEMBER') => {
    if (!group?.id) return;
    const prevMembers = [...(group.members || [])];
    setGroup((prev: any) => ({
      ...prev,
      members: prev.members.map((m: any) =>
        (m.userId === targetUserId || m.user?.id === targetUserId)
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
    if (!confirm(`Are you sure you want to remove ${targetName} from the group?`)) return;
    const prevMembers = [...(group.members || [])];
    setGroup((prev: any) => ({
      ...prev,
      members: prev.members.filter((m: any) => m.userId !== targetUserId && m.user?.id !== targetUserId),
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
    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      setGroup((prev: any) => ({ ...prev, expenses: prevExpenses }));
      setToastMessage(err.response?.data?.error || 'Failed to delete expense. Reverted.');
    }
  };

  const handleSettleUpi = (payeeName: string, amount: number) => {
    setUpiModal({
      open: true,
      payeeName,
      amount,
      payeeUpiId: `${payeeName.toLowerCase().replace(/\s+/g, '')}@okaxis`,
    });
  };

  const handleRecordSettlement = async (toUserId: string, amount: number) => {
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
      setToastMessage('Settlement recorded successfully!');
      fetchGroup();
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Failed to record settlement.');
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
      setToastMessage('Group settings updated successfully!');
      setEditGroupOpen(false);
    } catch (err: any) {
      console.error('Update group error:', err);
      const msg = err.response?.data?.error || 'Failed to update group settings.';
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

        {/* TAB 0: EXPENSES */}
        {activeTab === 0 && (
          <Card
            className="glass-secondary glass-specular-top"
            sx={{
              borderRadius: 3.5,
              overflow: 'hidden',
              boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
            }}
          >
            <CardContent sx={{ p: 0 }}>
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
                        const canEdit = isGroupAdmin || (!group?.onlyAdminEdit && (exp.createdById === user?.id || exp.paidById === user?.id));
                        const canDelete = isGroupAdmin || (!group?.onlyAdminEdit && exp.createdById === user?.id);

                        return (
                          <React.Fragment key={exp.id}>
                            <SplitwiseExpenseItem
                              expense={exp}
                              currentUserId={user?.id}
                              currency={group.currency || 'INR'}
                              showGroupTag={false}
                              canEdit={canEdit}
                              canDelete={canDelete}
                              onClick={() => router.push(`/expenses?id=${exp.id}`)}
                              onEdit={() => router.push(`/expenses/new?edit=${exp.id}&groupId=${group.id}`)}
                              onDelete={() => handleDeleteGroupExpense(exp.id)}
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
                    Record your first group bill or expense to start splitting.
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
                              onClick={() => handleSettleUpi(debt.to.name, debt.amount)}
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
                    const isSelf = memberId === user?.id;
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
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {memberName} {isSelf && '(You)'}
                              </Typography>
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
                                onClick={(e) => setMemberMenuAnchor({ el: e.currentTarget, member: m })}
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

                {/* WhatsApp-Style Member Management Menu */}
                <Menu
                  anchorEl={memberMenuAnchor?.el}
                  open={Boolean(memberMenuAnchor)}
                  onClose={() => setMemberMenuAnchor(null)}
                  slotProps={{
                    paper: {
                      className: 'glass-deep',
                      sx: {
                        minWidth: 195,
                        borderRadius: 2.5,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
                        border: `1px solid ${theme.palette.divider}`,
                      },
                    },
                  }}
                >
                  {memberMenuAnchor?.member?.role === 'ADMIN' ? (
                    <MenuItem
                      onClick={() => {
                        const m = memberMenuAnchor?.member;
                        if (m) {
                          handleUpdateMemberRole(m.userId || m.user?.id, m.user?.name || 'Member', 'MEMBER');
                        }
                        setMemberMenuAnchor(null);
                      }}
                    >
                      <ListItemIcon>
                        <Security fontSize="small" />
                      </ListItemIcon>
                      Dismiss as Admin
                    </MenuItem>
                  ) : (
                    <MenuItem
                      onClick={() => {
                        const m = memberMenuAnchor?.member;
                        if (m) {
                          handleUpdateMemberRole(m.userId || m.user?.id, m.user?.name || 'Member', 'ADMIN');
                        }
                        setMemberMenuAnchor(null);
                      }}
                    >
                      <ListItemIcon>
                        <SupervisorAccount fontSize="small" sx={{ color: '#F59E0B' }} />
                      </ListItemIcon>
                      Make Group Admin 👑
                    </MenuItem>
                  )}
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem
                    onClick={() => {
                      const m = memberMenuAnchor?.member;
                      if (m) {
                        handleRemoveMember(m.userId || m.user?.id, m.user?.name || 'Member');
                      }
                      setMemberMenuAnchor(null);
                    }}
                    sx={{ color: 'error.main' }}
                  >
                    <ListItemIcon>
                      <PersonRemove fontSize="small" sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    Remove from Group
                  </MenuItem>
                </Menu>
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
          onConfirmSettlement={() => {
            setUpiModal({ ...upiModal, open: false });
            setToastMessage(`Payment of ${formatCurrency(upiModal.amount)} to ${upiModal.payeeName} initiated!`);
            fetchGroup();
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
