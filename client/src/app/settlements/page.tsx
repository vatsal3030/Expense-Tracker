'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Skeleton,
  useTheme,
  alpha,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Pagination,
  Grid,
} from '@mui/material';
import {
  Check,
  Close,
  ArrowForward,
  Handshake,
  QrCode2,
  AutoAwesome,
  TrendingFlat,
  WhatsApp,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { settlementApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import UpiPaymentModal from '@/components/settlement/UpiPaymentModal';

export default function SettlementsPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [simplifiedData, setSimplifiedData] = useState<{
    simplifiedDebts: Array<{ from: any; to: any; amount: number }>;
    currentUserBalance: number;
    savingsCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [upiModal, setUpiModal] = useState<{
    open: boolean;
    payeeName: string;
    amount: number;
    settlementId?: string;
  }>({
    open: false,
    payeeName: '',
    amount: 0,
  });

  const hasLoadedSettlementsRef = React.useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  const statusFilter = ['', 'PENDING', 'CONFIRMED'][tab];

  const isFetchingSettlementsRef = useRef(false);

  const fetchSettlements = useCallback(async () => {
    if (isFetchingSettlementsRef.current) return;
    isFetchingSettlementsRef.current = true;
    try {
      if (!hasLoadedSettlementsRef.current) {
        setLoading(true);
      }
      const params: Record<string, any> = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;

      const [listRes, simplifiedRes] = await Promise.allSettled([
        settlementApi.list(params),
        settlementApi.getSimplified(),
      ]);

      if (listRes.status === 'fulfilled') {
        setSettlements(listRes.value.data?.data || []);
        setTotalPages(listRes.value.data?.pagination?.totalPages || 1);
      }
      if (simplifiedRes.status === 'fulfilled') {
        setSimplifiedData(simplifiedRes.value.data?.data || null);
      }
      hasLoadedSettlementsRef.current = true;
    } catch (error) {
      console.error('Fetch settlements error:', error);
    } finally {
      isFetchingSettlementsRef.current = false;
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (user?.id) fetchSettlements();
  }, [user?.id, fetchSettlements]);

  // Fast optimistic confirmation (0ms UI lag)
  const handleConfirm = async (id: string) => {
    const previousSnapshot = [...settlements];
    setSettlements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'CONFIRMED' } : s))
    );

    try {
      await settlementApi.confirm(id);
    } catch (error) {
      console.error('Confirm error:', error);
      setSettlements(previousSnapshot);
    }
  };

  // Fast optimistic rejection
  const handleReject = async (id: string) => {
    const previousSnapshot = [...settlements];
    setSettlements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'REJECTED' } : s))
    );

    try {
      await settlementApi.reject(id);
    } catch (error) {
      console.error('Reject error:', error);
      setSettlements(previousSnapshot);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const statusConfig: Record<string, { color: 'warning' | 'success' | 'error'; label: string }> = {
    PENDING: { color: 'warning', label: 'Pending' },
    CONFIRMED: { color: 'success', label: 'Confirmed' },
    REJECTED: { color: 'error', label: 'Rejected' },
  };


  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' } }}>
            Settlements & Debt Simplification
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Verify completed UPI payments and eliminate redundant group transfers
          </Typography>
        </Box>

        {/* Splitwise-style Debt Simplification Spotlight Card */}
        <Card
          className="glass-secondary glass-specular-top glass-emerald-ambient"
          sx={{
            mb: 4,
            borderRadius: 3.5,
            p: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box
                className="glass-tertiary"
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AutoAwesome fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                  Splitwise Min-Cash-Flow Simplification
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  If A owes B ₹100 and B owes C ₹100, Owino routes A → C directly.
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${simplifiedData?.savingsCount || 0} Redundant Transfers Eliminated`}
              size="small"
              sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Box>

          {simplifiedData?.simplifiedDebts && simplifiedData.simplifiedDebts.length > 0 ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {simplifiedData.simplifiedDebts.map((debt, idx) => {
                const isUserPaying = debt.from.id === (profile?.id || user?.id);
                const isUserReceiving = debt.to.id === (profile?.id || user?.id);

                return (
                  <Grid size={{ xs: 12, md: 6 }} key={idx}>
                    <Box
                      className="glass-tertiary"
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        borderColor: isUserPaying ? 'rgba(239, 68, 68, 0.35) !important' : isUserReceiving ? 'rgba(16, 185, 129, 0.35) !important' : undefined,
                        bgcolor: isUserPaying ? 'rgba(239, 68, 68, 0.06)' : isUserReceiving ? 'rgba(16, 185, 129, 0.06)' : undefined,
                        display: 'flex',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 1.5, sm: 0 },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: isUserPaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: isUserPaying ? '#EF4444' : '#10B981', fontSize: '0.8rem', fontWeight: 700 }}>
                          {debt.from.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                            {debt.from.name} {isUserPaying && '(You)'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            owes {debt.to.name} {isUserReceiving && '(You)'}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' }, width: { xs: '100%', sm: 'auto' }, gap: 1.5 }}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: isUserPaying ? '#EF4444' : '#10B981' }}>
                          {formatCurrency(debt.amount)}
                        </Typography>
                        {isUserPaying && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<QrCode2 fontSize="small" />}
                            onClick={() =>
                              setUpiModal({
                                open: true,
                                payeeName: debt.to.name,
                                amount: debt.amount,
                              })
                            }
                            className="glass-emerald-active"
                            sx={{
                              bgcolor: '#0E6245',
                              color: '#FFFFFF',
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              borderRadius: 2,
                              py: 0.5,
                              px: 1.5,
                              '&:hover': { bgcolor: '#094A34' },
                            }}
                          >
                            Pay UPI
                          </Button>
                        )}
                        {isUserReceiving && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<WhatsApp fontSize="small" sx={{ color: '#25D366' }} />}
                            onClick={() => {
                              const shareText = encodeURIComponent(
                                `Hi ${debt.from.name}, friendly reminder to settle the balance of ₹${debt.amount} on FairShare: ${typeof window !== 'undefined' ? window.location.origin : ''}/settlements`
                              );
                              window.open(`https://wa.me/?text=${shareText}`, '_blank');
                            }}
                            sx={{
                              borderColor: 'rgba(37, 211, 102, 0.4)',
                              color: '#25D366',
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              borderRadius: 2,
                              py: 0.5,
                              px: 1.5,
                              '&:hover': {
                                bgcolor: 'rgba(37, 211, 102, 0.1)',
                                borderColor: '#25D366',
                              },
                            }}
                          >
                            Remind
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              All balances are currently settled or balanced. No active simplified debts.
            </Typography>
          )}
        </Card>

        {/* Tab Filter (Floating Control Layer - Z2) */}
        <Box
          className="glass-control-surface"
          sx={{
            mb: 3,
            borderRadius: 3,
            p: 0.5,
            display: { xs: 'flex', sm: 'inline-flex' },
            width: { xs: '100%', sm: 'auto' },
            maxWidth: '100%',
            overflowX: 'auto',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              setPage(1);
            }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 40,
              maxWidth: '100%',
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
            <Tab label="All Settlements" />
            <Tab label="Pending Confirmation" />
            <Tab label="Confirmed" />
          </Tabs>
        </Box>

        {/* Settlements Log */}
        <Card
          className="glass-secondary glass-specular-top"
          sx={{
            borderRadius: 3.5,
            boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {loading && settlements.length === 0 ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, py: 2 }}>
                    <Skeleton variant="circular" width={44} height={44} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="50%" />
                      <Skeleton width="30%" />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : settlements.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Handshake sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No settlements found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Record payments to balance out group or friend ledgers.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {settlements.map((s, i) => {
                  const isPayee = s.payeeId === (profile?.id || user?.id);
                  const isPayer = s.payerId === (profile?.id || user?.id);
                  const canConfirm = isPayee && s.status === 'PENDING';
                  const cfg = statusConfig[s.status] || statusConfig.PENDING;

                  return (
                    <React.Fragment key={s.id}>
                      <ListItem
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: 2,
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: { xs: 1.5, sm: 0 },
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' }, flex: 1 }}>
                          <ListItemAvatar sx={{ minWidth: { xs: 44, sm: 56 } }}>
                            <Avatar
                              className="glass-tertiary"
                              sx={{
                                width: 44,
                                height: 44,
                                bgcolor: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#10B981',
                              }}
                            >
                              <Handshake />
                            </Avatar>
                          </ListItemAvatar>

                          <ListItemText
                            disableTypography
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {s.payer?.name} {isPayer && '(You)'}
                                </Typography>
                                <ArrowForward sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body1" fontWeight={600}>
                                  {s.payee?.name} {isPayee && '(You)'}
                                </Typography>
                                <Chip
                                  label={cfg.label}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.675rem',
                                    fontWeight: 700,
                                    bgcolor:
                                      s.status === 'CONFIRMED'
                                        ? alpha('#0E6245', 0.1)
                                        : s.status === 'PENDING'
                                        ? alpha('#F59E0B', 0.1)
                                        : alpha('#EF4444', 0.1),
                                    color:
                                      s.status === 'CONFIRMED'
                                        ? '#0E6245'
                                        : s.status === 'PENDING'
                                        ? '#D97706'
                                        : '#EF4444',
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {s.group?.name ? `${s.group.name} • ` : ''}
                                {new Date(s.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                                {s.notes ? ` • ${s.notes}` : ''}
                              </Typography>
                            }
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' }, width: { xs: '100%', sm: 'auto' }, gap: 1.5, pl: { xs: 7, sm: 0 } }}>
                          <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary' }}>
                            {formatCurrency(Number(s.amount))}
                          </Typography>

                          {s.status === 'PENDING' && isPayer && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<QrCode2 fontSize="small" />}
                              onClick={() =>
                                setUpiModal({
                                  open: true,
                                  payeeName: s.payee?.name || 'Friend',
                                  amount: Number(s.amount),
                                  settlementId: s.id,
                                })
                              }
                              sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                py: 0.5,
                                px: 1.5,
                                bgcolor: '#0E6245',
                                color: '#ffffff',
                                '&:hover': { bgcolor: '#094A34' },
                              }}
                            >
                              Pay UPI
                            </Button>
                          )}

                          {canConfirm && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleConfirm(s.id)}
                                sx={{ color: '#0E6245', bgcolor: alpha('#0E6245', 0.1) }}
                              >
                                <Check fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleReject(s.id)}
                                sx={{ color: '#EF4444', bgcolor: alpha('#EF4444', 0.1) }}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </ListItem>
                      {i < settlements.length - 1 && <Divider component="li" sx={{ borderColor: theme.palette.divider }} />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* UPI Payment Modal */}
        <UpiPaymentModal
          open={upiModal.open}
          onClose={() => setUpiModal((prev) => ({ ...prev, open: false }))}
          payeeName={upiModal.payeeName}
          amount={upiModal.amount}
          onConfirmSettlement={() => {
            if (upiModal.settlementId) {
              handleConfirm(upiModal.settlementId);
            }
          }}
        />
      </Box>
    </AppLayout>
  );
}
