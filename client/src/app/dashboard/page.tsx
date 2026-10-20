'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  useTheme,
  alpha,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  CallMade,
  CallReceived,
  ArrowForward,
  Receipt,
  Group,
  Handshake,
  EmojiEvents,
  Insights,
  Add as AddIcon,
  CheckCircleOutlined,
  CalendarToday,
} from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { dashboardApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import CoinSplitLoader from '@/components/common/CoinSplitLoader';
import Link from 'next/link';
import SmartQuickAddBar from '@/components/expense/SmartQuickAddBar';

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#0E6245',
  TRANSPORT: '#3B82F6',
  ENTERTAINMENT: '#8B5CF6',
  SHOPPING: '#EC4899',
  UTILITIES: '#10B981',
  RENT: '#6366F1',
  HEALTH: '#EF4444',
  EDUCATION: '#14B8A6',
  TRAVEL: '#F59E0B',
  GROCERIES: '#22C55E',
  SUBSCRIPTIONS: '#64748B',
  GENERAL: '#94A3B8',
  OTHER: '#CBD5E1',
  INSURANCE: '#D97706',
  GIFTS: '#F43F5E',
  DONATIONS: '#059669',
  INVESTMENTS: '#047857',
  SALARY: '#10B981',
  FREELANCE: '#34D399',
};

interface DashboardData {
  youOwe: number;
  owedToYou: number;
  totalBalance: number;
  thisMonth: { total: number; count: number; change: number };
  categoryBreakdown: Array<{ category: string; amount: number; count: number }>;
  groupsCount: number;
  pendingSettlements: number;
  recentActivities: Array<any>;
}

export default function DashboardPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [trendData, setTrendData] = useState<Array<{ month: string; amount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'balances' | 'activity'>('overview');
  const [mounted, setMounted] = useState(false);

  const isLight = theme.palette.mode === 'light';

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('fairshare_cached_summary');
      if (saved) {
        setData(JSON.parse(saved));
        setLoading(false);
      }
      const savedTrend = localStorage.getItem('fairshare_cached_trend');
      if (savedTrend) setTrendData(JSON.parse(savedTrend));
    } catch {}
  }, []);

  const hasLoadedDashboardRef = React.useRef(false);

  useEffect(() => {
    if (!authLoading && !user && !profile) {
      router.push('/auth/login');
    }
  }, [user?.id, profile, authLoading, router]);

  useEffect(() => {
    if ((user?.id || profile?.id) && !hasLoadedDashboardRef.current) {
      hasLoadedDashboardRef.current = true;
      fetchDashboard();
    }
  }, [user?.id, profile?.id]);

  const fetchDashboard = async (retry = true) => {
    try {
      const [summaryRes, trendRes] = await Promise.allSettled([
        dashboardApi.getSummary(),
        dashboardApi.getSpendingTrend(),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value.data?.data) {
        setData(summaryRes.value.data.data);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('fairshare_cached_summary', JSON.stringify(summaryRes.value.data.data));
          } catch {}
        }
      }
      if (trendRes.status === 'fulfilled' && trendRes.value.data?.data) {
        setTrendData(trendRes.value.data.data || []);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('fairshare_cached_trend', JSON.stringify(trendRes.value.data.data));
          } catch {}
        }
      }

      if (retry && (summaryRes.status === 'rejected' || trendRes.status === 'rejected')) {
        setTimeout(() => fetchDashboard(false), 800);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      if (retry) {
        setTimeout(() => fetchDashboard(false), 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };


  const totalSpent = data?.categoryBreakdown?.reduce((acc, c) => acc + c.amount, 0) || 1;

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Header Row (Savexa & Ocupite style) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            mb: 3,
            gap: 2,
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <Box sx={{ maxWidth: '100%' }}>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' } }}>
              Financial Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Track personal equity, shared group expenses, and settlements
            </Typography>
          </Box>

          {/* Quick Action CTAs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              size="small"
              component={Link}
              href="/settlements"
              prefetch={true}
              startIcon={<CheckCircleOutlined fontSize="small" />}
              className="glass-tertiary"
              sx={{
                flex: { xs: 1, sm: 'none' },
                borderRadius: 2.5,
                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                color: 'text.primary',
                fontWeight: 600,
                textTransform: 'none',
                px: 2,
                py: 0.8,
                '&:hover': {
                  borderColor: isLight ? '#0E6245' : '#10b981',
                  bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Settle Up
            </Button>
            <Button
              variant="contained"
              size="small"
              component={Link}
              href="/expenses/new"
              prefetch={true}
              startIcon={<AddIcon fontSize="small" />}
              sx={{
                flex: { xs: 1, sm: 'none' },
                borderRadius: 2.5,
                bgcolor: isLight ? '#0E6245' : '#059669',
                color: '#FFFFFF',
                fontWeight: 600,
                textTransform: 'none',
                px: 2.5,
                py: 0.8,
                boxShadow: isLight
                  ? '0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)'
                  : '0 1px 3px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.25)',
                '&:hover': {
                  bgcolor: isLight ? '#0A4B35' : '#047857',
                  transform: 'translateY(-1px)',
                  boxShadow: isLight
                    ? '0 2px 8px rgba(0,0,0,0.20)'
                    : '0 2px 8px rgba(0,0,0,0.35)',
                },
              }}
            >
              Add Expense
            </Button>
          </Box>
        </Box>

        {/* Smart Natural Language Quick-Add Bar (Time-Saving Fast Mode) */}
        <SmartQuickAddBar onExpenseCreated={fetchDashboard} />

        {/* Segmented Control Pills (Floating Control Capsule - Layer 2: Z2) */}
        <Box
          className="glass-control-surface"
          sx={{
            display: { xs: 'flex', sm: 'inline-flex' },
            alignItems: 'center',
            p: 0.6,
            mb: 3.5,
            borderRadius: 9999,
            gap: 0.5,
            width: { xs: '100%', sm: 'auto' },
            maxWidth: '100%',
            minWidth: 0,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {(['overview', 'breakdown', 'balances', 'activity'] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <Button
                key={tab}
                size="small"
                onClick={() => setActiveTab(tab)}
                sx={{
                  borderRadius: 9999,
                  px: { xs: 1.75, sm: 2.5 },
                  py: { xs: 0.55, sm: 0.6 },
                  fontSize: { xs: '0.78rem', sm: '0.825rem' },
                  fontWeight: active ? 600 : 500,
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  color: active
                    ? (isLight ? '#0F172A' : '#FFFFFF')
                    : 'text.secondary',
                  bgcolor: active
                    ? (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.12)')
                    : 'transparent',
                  border: active
                    ? `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.14)'}`
                    : '1px solid transparent',
                  boxShadow: active
                    ? isLight
                      ? '0 1px 3px rgba(0, 0, 0, 0.06)'
                      : '0 2px 6px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    : 'none',
                  '&:hover': {
                    bgcolor: active
                      ? (isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)')
                      : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255, 255, 255, 0.04)',
                    color: active ? (isLight ? '#0F172A' : '#FFFFFF') : 'text.primary',
                  },
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {tab}
              </Button>
            );
          })}
        </Box>

        {/* Financial Metrics Cards (Apple visionOS Liquid Glass Panels) */}
        {(activeTab === 'overview' || activeTab === 'balances') && (
        <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: 4 }}>
          {/* Card 1: Net Balance (Primary Hero Metric with Ambient Emerald Reflection) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: { xs: 2, sm: 2.75 },
                height: '100%',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase' }}>
                  Net Balance
                </Typography>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2.5,
                    bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                    color: isLight ? '#0E6245' : '#34D399',
                    border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.15)' : 'rgba(16, 185, 129, 0.25)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccountBalanceWallet sx={{ fontSize: 19 }} />
                </Box>
              </Box>

              {loading ? (
                <Skeleton width="70%" height={40} />
              ) : (
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    letterSpacing: '-0.025em',
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"tnum"',
                    color: (data?.totalBalance ?? 0) >= 0 ? (isLight ? '#0E6245' : '#34D399') : '#EF4444',
                    mb: 0.5,
                  }}
                >
                  {formatCurrency(data?.totalBalance ?? 0)}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Chip
                  size="small"
                  label={(data?.totalBalance ?? 0) >= 0 ? 'Positive Equity' : 'Settlement Required'}
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: (data?.totalBalance ?? 0) >= 0
                      ? isLight ? 'rgba(14, 98, 69, 0.10)' : 'rgba(16, 185, 129, 0.14)'
                      : 'rgba(239, 68, 68, 0.12)',
                    color: (data?.totalBalance ?? 0) >= 0
                      ? isLight ? '#0E6245' : '#34D399'
                      : '#EF4444',
                    border: `1px solid ${(data?.totalBalance ?? 0) >= 0 ? (isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(16, 185, 129, 0.3)') : 'rgba(239, 68, 68, 0.25)'}`,
                  }}
                />
              </Box>
            </Card>
          </Grid>

          {/* Card 2: You Owe (Subtle Crimson Liquid Glass Reflection) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: { xs: 2, sm: 2.75 },
                height: '100%',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase' }}>
                  You Owe
                </Typography>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(239, 68, 68, 0.10)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CallMade sx={{ fontSize: 19 }} />
                </Box>
              </Box>

              {loading ? (
                <Skeleton width="60%" height={40} />
              ) : (
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    letterSpacing: '-0.025em',
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"tnum"',
                    color: '#F87171',
                    mb: 0.5,
                  }}
                >
                  {formatCurrency(data?.youOwe ?? 0)}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Chip
                  size="small"
                  label={data?.youOwe ? 'Pay to Friends' : 'All Clear'}
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(239, 68, 68, 0.10)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.22)',
                  }}
                />
              </Box>
            </Card>
          </Grid>

          {/* Card 3: Owed to You (Subtle Emerald Liquid Glass Reflection) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: { xs: 2, sm: 2.75 },
                height: '100%',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase' }}>
                  Owed to You
                </Typography>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2.5,
                    bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                    color: isLight ? '#0E6245' : '#34D399',
                    border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.18)' : 'rgba(16, 185, 129, 0.25)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CallReceived sx={{ fontSize: 19 }} />
                </Box>
              </Box>

              {loading ? (
                <Skeleton width="60%" height={40} />
              ) : (
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    letterSpacing: '-0.025em',
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"tnum"',
                    color: isLight ? '#0E6245' : '#34D399',
                    mb: 0.5,
                  }}
                >
                  {formatCurrency(data?.owedToYou ?? 0)}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Chip
                  size="small"
                  label={data?.owedToYou ? 'Receivable' : 'Settled'}
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: isLight ? 'rgba(14, 98, 69, 0.10)' : 'rgba(16, 185, 129, 0.14)',
                    color: isLight ? '#0E6245' : '#34D399',
                    border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(16, 185, 129, 0.28)'}`,
                  }}
                />
              </Box>
            </Card>
          </Grid>

          {/* Card 4: This Month */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: { xs: 2, sm: 2.75 },
                height: '100%',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase' }}>
                  This Month
                </Typography>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2.5,
                    bgcolor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                    color: 'text.secondary',
                    border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.09)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {data?.thisMonth?.change && data.thisMonth.change > 0 ? (
                    <TrendingUp sx={{ fontSize: 19, color: '#EF4444' }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 19, color: isLight ? '#0E6245' : '#34D399' }} />
                  )}
                </Box>
              </Box>

              {loading ? (
                <Skeleton width="60%" height={40} />
              ) : (
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    letterSpacing: '-0.025em',
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"tnum"',
                    color: 'text.primary',
                    mb: 0.5,
                  }}
                >
                  {formatCurrency(data?.thisMonth?.total ?? 0)}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                {data?.thisMonth?.change !== undefined ? (
                  <Chip
                    size="small"
                    label={`${data.thisMonth.change > 0 ? '+' : ''}${data.thisMonth.change}% vs last month`}
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: data.thisMonth.change > 0 ? 'rgba(239, 68, 68, 0.10)' : (isLight ? 'rgba(14, 98, 69, 0.10)' : 'rgba(16, 185, 129, 0.14)'),
                      color: data.thisMonth.change > 0 ? '#EF4444' : (isLight ? '#0E6245' : '#34D399'),
                      border: `1px solid ${data.thisMonth.change > 0 ? 'rgba(239, 68, 68, 0.22)' : (isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(16, 185, 129, 0.28)')}`,
                    }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {data?.thisMonth?.count ?? 0} transactions
                  </Typography>
                )}
              </Box>
            </Card>
          </Grid>
        </Grid>
        )}

        {/* Balances & Settlement Action Spotlight (Liquid Glass Banner) */}
        {activeTab === 'balances' && (
          <Card
            className="glass-secondary glass-specular-top glass-accent-emerald"
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 4,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  bgcolor: isLight ? 'rgba(14, 98, 69, 0.10)' : 'rgba(16, 185, 129, 0.15)',
                  color: isLight ? '#0E6245' : '#34D399',
                  border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(16, 185, 129, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Handshake sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary' }}>
                  Smart Debt Simplification & Direct Settlements
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem' }}>
                  {data?.pendingSettlements || 0} pending settlements. Settle directly with UPI QR codes in 1 click without extra transactions.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignSelf: { xs: 'stretch', md: 'center' } }}>
              <Button
                variant="contained"
                component={Link}
                href="/settlements"
                prefetch={true}
                startIcon={<CheckCircleOutlined fontSize="small" />}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 600,
                  bgcolor: isLight ? '#0E6245' : '#059669',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  px: 3,
                  boxShadow: isLight
                    ? '0 1px 3px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                    : '0 1px 3px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                  '&:hover': {
                    bgcolor: isLight ? '#0A4B35' : '#047857',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.30)',
                  },
                }}
              >
                Review & Settle Up
              </Button>
            </Box>
          </Card>
        )}

        {/* Karma & Telemetry Spotlight */}
        {activeTab === 'overview' && (
        <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: { xs: 2, sm: 2.75 },
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                cursor: 'pointer',
                border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                '&:hover': {
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.22)',
                  boxShadow: isLight ? '0 12px 32px rgba(15, 23, 42, 0.08)' : '0 16px 40px -8px rgba(0, 0, 0, 0.65)',
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={() => router.push('/fairscore')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    bgcolor: isLight ? 'rgba(14, 98, 69, 0.10)' : 'rgba(16, 185, 129, 0.15)',
                    color: isLight ? '#0E6245' : '#34D399',
                    border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(16, 185, 129, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EmojiEvents sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary' }}>
                      FairScore: 880 / 1000
                    </Typography>
                    <Chip
                      label="Diamond Tier"
                      size="small"
                      sx={{
                        bgcolor: isLight ? 'rgba(14, 98, 69, 0.10)' : 'rgba(16, 185, 129, 0.15)',
                        color: isLight ? '#0E6245' : '#34D399',
                        fontWeight: 700,
                        height: 20,
                        fontSize: '0.675rem',
                        border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(16, 185, 129, 0.3)'}`,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem' }}>
                    Top 8% of reliable friends. Zero delinquent settlements this quarter.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>
                    STREAK
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: '#F59E0B', fontWeight: 800 }}>
                    🔥 14 Days
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<ArrowForward fontSize="small" />}
                  className="glass-tertiary"
                  sx={{
                    borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                    color: 'text.primary',
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: isLight ? '#0E6245' : '#10B981',
                      bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                    },
                  }}
                >
                  View Karma
                </Button>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: { xs: 2, sm: 2.75 },
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '100%',
                cursor: 'pointer',
                border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                '&:hover': {
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.22)',
                  boxShadow: isLight ? '0 12px 32px rgba(15, 23, 42, 0.08)' : '0 16px 40px -8px rgba(0, 0, 0, 0.65)',
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={() => router.push('/analytics')}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Financial Velocity
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary', mt: 0.25 }}>
                  94.2% Settlement Rate
                </Typography>
                <Typography variant="caption" sx={{ color: isLight ? '#0E6245' : '#34D399', fontWeight: 700 }}>
                  2.4x faster debt resolution
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: isLight ? 'rgba(14, 98, 69, 0.10)' : 'rgba(16, 185, 129, 0.15)',
                  color: isLight ? '#0E6245' : '#34D399',
                  border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(16, 185, 129, 0.3)'}`,
                  display: 'flex',
                }}
              >
                <Insights />
              </Box>
            </Card>
          </Grid>
        </Grid>
        )}

        {/* Charts & Analytics Row (Liquid Glass Chart Containers) */}
        {(activeTab === 'overview' || activeTab === 'breakdown') && (
        <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }} sx={{ mb: 4 }}>
          {/* Spending Trend Chart */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                height: '100%',
                borderRadius: 4,
                border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
                      Spending Velocity
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Monthly transaction flow & shared obligations
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    component={Link}
                    href="/analytics"
                    prefetch={true}
                    endIcon={<ArrowForward fontSize="small" />}
                    sx={{ color: isLight ? '#0E6245' : '#34D399', fontWeight: 600, fontSize: '0.8rem', textTransform: 'none' }}
                  >
                    Deep Analytics
                  </Button>
                </Box>

                {loading ? (
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
                ) : trendData.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    <Receipt sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">No trend data available yet</Typography>
                  </Box>
                ) : mounted ? (
                  <ResponsiveContainer minWidth={100} width="100%" height={280}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="spendingCurve" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isLight ? '#0E6245' : '#10B981'} stopOpacity={0.28} />
                          <stop offset="95%" stopColor={isLight ? '#0E6245' : '#10B981'} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)'} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          background: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(16, 22, 32, 0.90)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.12)'}`,
                          borderRadius: 12,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                          fontSize: '0.8rem',
                          color: isLight ? '#111827' : '#F3F4F6',
                        }}
                        formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Amount']}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke={isLight ? '#0E6245' : '#10B981'}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#spendingCurve)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Spending Breakdown */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                height: '100%',
                borderRadius: 4,
                border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
                    Category Breakdown
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This Month
                  </Typography>
                </Box>

                {loading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <Box key={i}>
                        <Skeleton width="40%" height={20} />
                        <Skeleton width="100%" height={10} sx={{ mt: 1, borderRadius: 2 }} />
                      </Box>
                    ))}
                  </Box>
                ) : data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {data.categoryBreakdown.slice(0, 5).map((cat, i) => {
                      const percentage = Math.round((cat.amount / totalSpent) * 100);
                      const color = CATEGORY_COLORS[cat.category] || '#0E6245';
                      return (
                        <Box key={i}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: color,
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.825rem', textTransform: 'capitalize' }}>
                                {cat.category.toLowerCase()}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.825rem' }}>
                                {formatCurrency(cat.amount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', minWidth: 32, textAlign: 'right' }}>
                                {percentage}%
                              </Typography>
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: color,
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <Receipt sx={{ fontSize: 44, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">No category expenses yet</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        )}

        {/* Quick Stats & Recent Activity */}
        {(activeTab === 'overview' || activeTab === 'activity') && (
        <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
          {/* Quick Metrics */}
          {activeTab === 'overview' && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 4,
                border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
                height: '100%',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, letterSpacing: '-0.01em' }}>
                  Quick Summary
                </Typography>
                {[
                  { icon: <Receipt fontSize="small" />, label: 'Expenses this month', value: data?.thisMonth?.count ?? 0, color: isLight ? '#0E6245' : '#10B981' },
                  { icon: <Group fontSize="small" />, label: 'Active groups', value: data?.groupsCount ?? 0, color: '#3B82F6' },
                  { icon: <Handshake fontSize="small" />, label: 'Pending settlements', value: data?.pendingSettlements ?? 0, color: '#F59E0B' },
                ].map((stat, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.75,
                      borderBottom: i < 2 ? `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)'}` : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2.5,
                          bgcolor: alpha(stat.color, 0.12),
                          border: `1px solid ${alpha(stat.color, 0.25)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: stat.color,
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {stat.label}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {loading ? <Skeleton width={28} /> : stat.value}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          )}

          {/* Recent Activity */}
          <Grid size={{ xs: 12, md: activeTab === 'activity' ? 12 : 8 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 4,
                border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
                    Recent Activity
                  </Typography>
                  <Button
                    size="small"
                    component={Link}
                    href="/activity"
                    prefetch={true}
                    endIcon={<ArrowForward fontSize="small" />}
                    sx={{ color: isLight ? '#0E6245' : '#34D399', fontWeight: 600, fontSize: '0.8rem', textTransform: 'none' }}
                  >
                    View All
                  </Button>
                </Box>

                {loading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[1, 2, 3].map((i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2, py: 1 }}>
                        <Skeleton variant="circular" width={38} height={38} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton width="60%" />
                          <Skeleton width="30%" />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : data?.recentActivities && data.recentActivities.length > 0 ? (
                  <List disablePadding>
                    {data.recentActivities.map((activity: any, i: number) => (
                      <React.Fragment key={activity.id}>
                        <ListItem disablePadding sx={{ py: 1.25 }}>
                          <ListItemAvatar>
                            <Avatar
                              src={activity.user?.avatarUrl}
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: isLight ? 'rgba(14, 98, 69, 0.12)' : 'rgba(16, 185, 129, 0.15)',
                                color: isLight ? '#0E6245' : '#34D399',
                                border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(16, 185, 129, 0.3)'}`,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                              }}
                            >
                              {activity.user?.name?.charAt(0) || '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            disableTypography
                            primary={
                              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                <strong>{activity.user?.name}</strong> {activity.message}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {activity.group?.name ? `in ${activity.group.name} • ` : ''}
                                {new Date(activity.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {i < data.recentActivities.length - 1 && (
                          <Divider component="li" sx={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                    <Typography variant="body2">No recent transactions or activity</Typography>
                    <Typography variant="caption">Start by creating a group or recording an expense</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        )}
      </Box>
    </AppLayout>
  );
}
