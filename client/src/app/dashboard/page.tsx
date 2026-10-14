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
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [trendData, setTrendData] = useState<Array<{ month: string; amount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'balances' | 'activity'>('overview');

  const isLight = theme.palette.mode === 'light';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  const fetchDashboard = async (retry = true) => {
    try {
      const [summaryRes, trendRes] = await Promise.allSettled([
        dashboardApi.getSummary(),
        dashboardApi.getSpendingTrend(),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setData(summaryRes.value.data?.data);
      }
      if (trendRes.status === 'fulfilled') {
        setTrendData(trendRes.value.data?.data || []);
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

  if (authLoading) return null;

  const totalSpent = data?.categoryBreakdown?.reduce((acc, c) => acc + c.amount, 0) || 1;

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: 6 }}>
        {/* Top Header Row (Savexa & Ocupite style) */}
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
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
              Financial Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track personal equity, shared group expenses, and settlements
            </Typography>
          </Box>

          {/* Quick Action CTAs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              component={Link}
              href="/settlements"
              prefetch={true}
              startIcon={<CheckCircleOutlined fontSize="small" />}
              sx={{
                borderRadius: 2.5,
                borderColor: theme.palette.divider,
                color: 'text.primary',
                bgcolor: 'background.paper',
                fontWeight: 600,
                textTransform: 'none',
                px: 2,
                py: 0.75,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              Settle Up
            </Button>
            <Button
              variant="contained"
              size="small"
              component={Link}
              href="/expenses"
              prefetch={true}
              startIcon={<AddIcon fontSize="small" />}
              sx={{
                borderRadius: 2.5,
                bgcolor: '#0E6245',
                color: '#FFFFFF',
                fontWeight: 600,
                textTransform: 'none',
                px: 2.5,
                py: 0.75,
                boxShadow: '0 2px 6px rgba(14, 98, 69, 0.25)',
                '&:hover': {
                  bgcolor: '#094A34',
                },
              }}
            >
              Add Expense
            </Button>
          </Box>
        </Box>

        {/* Segmented Control Pills (Savexa style: Overview | Breakdown | Balances | Activity) */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            p: 0.5,
            mb: 3.5,
            bgcolor: isLight ? '#E9ECEF' : 'rgba(255, 255, 255, 0.06)',
            borderRadius: 3,
            gap: 0.5,
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
                  borderRadius: 2.5,
                  px: 2.25,
                  py: 0.5,
                  fontSize: '0.825rem',
                  fontWeight: active ? 700 : 500,
                  textTransform: 'capitalize',
                  color: active
                    ? '#FFFFFF'
                    : 'text.secondary',
                  bgcolor: active
                    ? (isLight ? '#1A1D1F' : '#0E6245')
                    : 'transparent',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  '&:hover': {
                    bgcolor: active
                      ? (isLight ? '#1A1D1F' : '#0E6245')
                      : alpha(theme.palette.text.primary, 0.05),
                    color: active ? '#FFFFFF' : 'text.primary',
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                {tab}
              </Button>
            );
          })}
        </Box>

        {/* Financial Metrics Cards (Savexa & Ocupite clean white surface style) */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {/* Card 1: Net Balance */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                p: 2.5,
                height: '100%',
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase' }}>
                  Net Balance
                </Typography>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: alpha('#0E6245', 0.08),
                    color: '#0E6245',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccountBalanceWallet sx={{ fontSize: 18 }} />
                </Box>
              </Box>

              {loading ? (
                <Skeleton width="70%" height={40} />
              ) : (
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', mb: 0.5 }}>
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
                    bgcolor: (data?.totalBalance ?? 0) >= 0 ? alpha('#0E6245', 0.1) : alpha('#EF4444', 0.1),
                    color: (data?.totalBalance ?? 0) >= 0 ? '#0E6245' : '#EF4444',
                  }}
                />
              </Box>
            </Card>
          </Grid>

          {/* Card 2: You Owe */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                p: 2.5,
                height: '100%',
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase' }}>
                  You Owe
                </Typography>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: alpha('#EF4444', 0.08),
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CallMade sx={{ fontSize: 18 }} />
                </Box>
              </Box>

              {loading ? (
                <Skeleton width="60%" height={40} />
              ) : (
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: '#EF4444', mb: 0.5 }}>
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
                    bgcolor: alpha('#EF4444', 0.1),
                    color: '#DC2626',
                  }}
                />
              </Box>
            </Card>
          </Grid>

          {/* Card 3: Owed to You */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                p: 2.5,
                height: '100%',
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase' }}>
                  Owed to You
                </Typography>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: alpha('#0E6245', 0.08),
                    color: '#0E6245',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CallReceived sx={{ fontSize: 18 }} />
                </Box>
              </Box>

              {loading ? (
                <Skeleton width="60%" height={40} />
              ) : (
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: '#0E6245', mb: 0.5 }}>
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
                    bgcolor: alpha('#0E6245', 0.1),
                    color: '#0E6245',
                  }}
                />
              </Box>
            </Card>
          </Grid>

          {/* Card 4: This Month */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                p: 2.5,
                height: '100%',
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase' }}>
                  This Month
                </Typography>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.text.secondary, 0.08),
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {data?.thisMonth?.change && data.thisMonth.change > 0 ? (
                    <TrendingUp sx={{ fontSize: 18, color: '#EF4444' }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 18, color: '#0E6245' }} />
                  )}
                </Box>
              </Box>

              {loading ? (
                <Skeleton width="60%" height={40} />
              ) : (
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', mb: 0.5 }}>
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
                      fontWeight: 600,
                      bgcolor: alpha(data.thisMonth.change > 0 ? '#EF4444' : '#0E6245', 0.1),
                      color: data.thisMonth.change > 0 ? '#DC2626' : '#0E6245',
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

        {/* Karma & Telemetry Spotlight (Replaces generic dark cards with crisp white FinTech cards) */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#0E6245',
                  boxShadow: '0 4px 12px rgba(14, 98, 69, 0.08)',
                },
              }}
              onClick={() => router.push('/fairscore')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: alpha('#0E6245', 0.1),
                    color: '#0E6245',
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
                        bgcolor: alpha('#0E6245', 0.1),
                        color: '#0E6245',
                        fontWeight: 700,
                        height: 20,
                        fontSize: '0.675rem',
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
                  sx={{
                    borderColor: theme.palette.divider,
                    color: 'text.primary',
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#0E6245', bgcolor: alpha('#0E6245', 0.04) },
                  }}
                >
                  View Karma
                </Button>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
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
                <Typography variant="caption" sx={{ color: '#0E6245', fontWeight: 600 }}>
                  2.4x faster debt resolution
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 2.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  display: 'flex',
                }}
              >
                <Insights />
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Charts & Analytics Row (Savexa Area Curve + Ocupite Progress Breakdown) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Spending Trend Chart */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              sx={{
                height: '100%',
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
              }}
            >
              <CardContent sx={{ p: 3 }}>
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
                    sx={{ color: '#0E6245', fontWeight: 600, fontSize: '0.8rem', textTransform: 'none' }}
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
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="spendingCurve" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E6245" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0E6245" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.6)} vertical={false} />
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
                          background: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 10,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                          fontSize: '0.8rem',
                        }}
                        formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Amount']}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#0E6245"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#spendingCurve)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Spending Breakdown (Ocupite Progress Bar & Categories Style) */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                height: '100%',
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
              }}
            >
              <CardContent sx={{ p: 3 }}>
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
                              bgcolor: isLight ? '#E9ECEF' : 'rgba(255, 255, 255, 0.08)',
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

        {/* Quick Stats & Recent Activity */}
        <Grid container spacing={3}>
          {/* Quick Metrics */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, letterSpacing: '-0.01em' }}>
                  Quick Summary
                </Typography>
                {[
                  { icon: <Receipt fontSize="small" />, label: 'Expenses this month', value: data?.thisMonth?.count ?? 0, color: '#0E6245' },
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
                      borderBottom: i < 2 ? `1px solid ${theme.palette.divider}` : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          bgcolor: alpha(stat.color, 0.1),
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

          {/* Recent Activity */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
              }}
            >
              <CardContent sx={{ p: 3 }}>
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
                    sx={{ color: '#0E6245', fontWeight: 600, fontSize: '0.8rem', textTransform: 'none' }}
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
                                bgcolor: alpha('#0E6245', 0.12),
                                color: '#0E6245',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                              }}
                            >
                              {activity.user?.name?.charAt(0) || '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
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
                        {i < data.recentActivities.length - 1 && <Divider component="li" sx={{ borderColor: theme.palette.divider }} />}
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
      </Box>
    </AppLayout>
  );
}
