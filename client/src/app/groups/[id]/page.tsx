'use client';

import React, { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Avatar, AvatarGroup, Chip,
  List, ListItem, ListItemAvatar, ListItemText, Divider, Button,
  Skeleton, useTheme, alpha, IconButton, Tooltip, Stack, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab,
  Alert, Snackbar,
} from '@mui/material';
import {
  ArrowBack, Add, Edit, Delete, Share, ContentCopy,
  WhatsApp, PersonAdd, Check, Lock, Security,
  AccountBalanceWallet, ArrowForward, QrCode2,
  TrendingUp, TrendingDown, ReceiptLong, People, Close,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { groupApi, settlementApi, expenseApi } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import UpiPaymentModal from '@/components/settlement/UpiPaymentModal';
import QrCodeModal from '@/components/common/QrCodeModal';
import CategoryCycleLoader from '@/components/common/CategoryCycleLoader';

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
      await settlementApi.create({
        payeeId: toUserId,
        amount,
        groupId: group.id,
        notes: 'Group settlement via FairShare',
      });
      setToastMessage('Settlement recorded successfully!');
      fetchGroup();
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Failed to record settlement.');
    }
  };

  if (authLoading || (loading && !group)) {
    return <CategoryCycleLoader message="Loading group details & split balance..." />;
  }

  return (
    <AppLayout>
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
                <List disablePadding>
                  {group.expenses.map((exp: any, i: number) => (
                    <React.Fragment key={exp.id}>
                      <ListItem
                        sx={{
                          px: 3,
                          py: 2,
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                          },
                        }}
                        onClick={() => router.push(`/expenses?id=${exp.id}`)}
                      >
                        <ListItemAvatar>
                          <Avatar
                            className="glass-tertiary"
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : alpha('#0E6245', 0.1),
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              fontSize: '1.25rem',
                            }}
                          >
                            {CATEGORY_EMOJI[exp.category] || '📋'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          disableTypography
                          primary={
                            <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary' }}>
                              {exp.description}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Paid by <strong>{exp.paidBy?.name}</strong> •{' '}
                              {new Date(exp.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              • {exp.splitType}
                            </Typography>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'text.primary' }}>
                              {formatCurrency(Number(exp.amount))}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {exp.shares?.length || group.members?.length || 1} shares
                            </Typography>
                          </Box>
                          {(isGroupAdmin || exp.createdById === user?.id || exp.paidById === user?.id) && (
                            <Box sx={{ display: 'flex', gap: 0.5, ml: 0.5 }}>
                              <Tooltip title="Edit Expense">
                                <IconButton
                                  size="small"
                                  onClick={() => router.push(`/expenses/new?edit=${exp.id}&groupId=${group.id}`)}
                                  sx={{
                                    color: 'text.secondary',
                                    '&:hover': { color: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.1)' },
                                  }}
                                >
                                  <Edit sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Expense">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteGroupExpense(exp.id)}
                                  sx={{
                                    color: 'text.secondary',
                                    '&:hover': { color: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.1)' },
                                  }}
                                >
                                  <Delete sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>
                      </ListItem>
                      {i < group.expenses.length - 1 && (
                        <Divider component="li" sx={{ borderColor: theme.palette.divider }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
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
                </Box>

                <List disablePadding>
                  {group?.members?.map((m: any, i: number) => (
                    <React.Fragment key={m.user?.id || i}>
                      <ListItem disablePadding sx={{ py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar
                            src={m.user?.avatarUrl || undefined}
                            className="glass-tertiary"
                            sx={{ width: 40, height: 40, bgcolor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34D399', fontSize: '0.9rem', fontWeight: 700 }}
                          >
                            {m.user?.name?.charAt(0) || '?'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          disableTypography
                          primary={<Typography variant="body2" fontWeight={700}>{m.user?.name}</Typography>}
                          secondary={m.user?.email || m.user?.phone || 'Member'}
                        />
                        <Chip
                          label={m.role === 'ADMIN' ? '👑 Admin' : 'Member'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            bgcolor: m.role === 'ADMIN' ? alpha('#F59E0B', 0.1) : alpha(theme.palette.text.secondary, 0.08),
                            color: m.role === 'ADMIN' ? '#D97706' : 'text.secondary',
                          }}
                        />
                      </ListItem>
                      {i < group.members.length - 1 && (
                        <Divider component="li" sx={{ borderColor: theme.palette.divider }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
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
    </AppLayout>
  );
}

export default function GroupDetailPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }
    >
      <GroupDetailContent />
    </Suspense>
  );
}
