'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Chip,
  Skeleton,
  Stack,
  LinearProgress,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  PieChart as PieIcon,
  Download,
  ArrowUpward,
  AccountBalanceWallet,
  ReceiptLong,
  Lightbulb,
  CheckCircle,
  CalendarMonth,
  PersonOutlined,
  PaymentsOutlined,
  RestartAlt,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import CategoryCycleLoader from '@/components/common/CategoryCycleLoader';
import { groupApi } from '@/lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#0E6245',
  TRANSPORT: '#3B82F6',
  ENTERTAINMENT: '#F59E0B',
  SHOPPING: '#EC4899',
  UTILITIES: '#10B981',
  RENT: '#6366F1',
  TRAVEL: '#06B6D4',
  GROCERIES: '#22C55E',
  GENERAL: '#64748B',
  OTHER: '#94A3B8',
};

export default function AnalyticsPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { session, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | '1Y' | 'ALL'>('30D');
  const [groupId, setGroupId] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [viewType, setViewType] = useState<'share' | 'total'>('share');
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch available groups for filter dropdown
  useEffect(() => {
    if (!session?.access_token) return;
    groupApi
      .list()
      .then((res) => {
        if (res.data?.data) {
          setGroups(res.data.data.map((g: any) => ({ id: g.id, name: g.name })));
        }
      })
      .catch((err) => console.error('Failed to load groups for analytics filter:', err));
  }, [session?.access_token]);

  // Fetch telemetry data whenever filters change
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session?.access_token) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          timeframe,
          groupId,
          category,
          viewType,
        });
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/dashboard/analytics?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [session?.access_token, timeframe, groupId, category, viewType]);

  const handleExportCSV = () => {
    if (!data?.categoryBreakdown) return;
    const headers = 'Category,Amount,Count,Percentage\n';
    const rows = data.categoryBreakdown
      .map((c: any) => `${c.category},${c.amount},${c.count},${c.percentage}%`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairshare_analytics_${timeframe}_${viewType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (authLoading) {
    return <CategoryCycleLoader message="Loading financial telemetry..." />;
  }

  const daysCount = data?.daysCount || (timeframe === '7D' ? 7 : timeframe === '90D' ? 90 : timeframe === '1Y' ? 365 : timeframe === 'ALL' ? 365 : 30);
  const totalSpend = data?.totalSpend ?? data?.total30Days ?? 0;
  const dailyAverage = daysCount > 0 && totalSpend > 0 ? Math.round(totalSpend / daysCount) : 0;
  const categories = data?.categoryBreakdown || [];

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' } }}>
              Financial Telemetry
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Deep telemetry on your group expenses, cashflows, and spending habits
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Download fontSize="small" />}
            onClick={handleExportCSV}
            className="glass-tertiary"
            sx={{
              color: 'text.primary',
              borderRadius: 2.5,
              fontWeight: 600,
              textTransform: 'none',
              py: 0.75,
              px: 2,
              '&:hover': {
                borderColor: '#10B981',
                bgcolor: alpha('#10B981', 0.08),
              },
            }}
          >
            Export CSV
          </Button>
        </Box>

        {/* Filter Surface */}
        <Card
          className="glass-secondary glass-specular-top"
          sx={{
            borderRadius: 3.5,
            p: { xs: 2, sm: 2.25 },
            mb: 4,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', lg: 'center' },
              gap: 2,
            }}
          >
            {/* Left Controls: Timeframe & View Mode */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
              {/* Timeframe Pills */}
              <Box
                className="glass-control-surface"
                sx={{
                  borderRadius: 2.5,
                  p: 0.5,
                  display: 'flex',
                  gap: 0.5,
                }}
              >
                {(['7D', '30D', '90D', '1Y', 'ALL'] as const).map((tf) => {
                  const active = timeframe === tf;
                  return (
                    <Button
                      key={tf}
                      size="small"
                      onClick={() => setTimeframe(tf)}
                      className={active ? 'glass-emerald-active' : undefined}
                      sx={{
                        px: { xs: 1.25, sm: 1.75 },
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: active ? 750 : 600,
                        borderRadius: 2,
                        minWidth: 'auto',
                        color: active ? '#FFFFFF' : 'text.secondary',
                        bgcolor: active ? (isLight ? '#1A1D1F' : 'rgba(16, 185, 129, 0.25)') : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: active ? undefined : alpha(theme.palette.text.primary, 0.05),
                        },
                      }}
                    >
                      {tf}
                    </Button>
                  );
                })}
              </Box>

              {/* View Type Toggle: Personal Share vs Total Amount */}
              <Box
                className="glass-control-surface"
                sx={{
                  borderRadius: 2.5,
                  p: 0.5,
                  display: 'flex',
                  gap: 0.5,
                }}
              >
                <Button
                  size="small"
                  onClick={() => setViewType('share')}
                  startIcon={<PersonOutlined sx={{ fontSize: '0.9rem !important' }} />}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: viewType === 'share' ? 750 : 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    minWidth: 'auto',
                    color: viewType === 'share' ? '#FFFFFF' : 'text.secondary',
                    bgcolor: viewType === 'share' ? (isLight ? '#1A1D1F' : 'rgba(16, 185, 129, 0.25)') : 'transparent',
                    '&:hover': {
                      bgcolor: viewType === 'share' ? undefined : alpha(theme.palette.text.primary, 0.05),
                    },
                  }}
                >
                  My Share
                </Button>
                <Button
                  size="small"
                  onClick={() => setViewType('total')}
                  startIcon={<PaymentsOutlined sx={{ fontSize: '0.9rem !important' }} />}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: viewType === 'total' ? 750 : 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    minWidth: 'auto',
                    color: viewType === 'total' ? '#FFFFFF' : 'text.secondary',
                    bgcolor: viewType === 'total' ? (isLight ? '#1A1D1F' : 'rgba(16, 185, 129, 0.25)') : 'transparent',
                    '&:hover': {
                      bgcolor: viewType === 'total' ? undefined : alpha(theme.palette.text.primary, 0.05),
                    },
                  }}
                >
                  Total Volume
                </Button>
              </Box>
            </Box>

            {/* Right Controls: Group & Category Dropdowns */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                <InputLabel id="analytics-group-label" sx={{ fontSize: '0.8rem' }}>Group</InputLabel>
                <Select
                  labelId="analytics-group-label"
                  value={groupId}
                  label="Group"
                  onChange={(e) => setGroupId(e.target.value)}
                  sx={{
                    borderRadius: 2.5,
                    fontSize: '0.8rem',
                    bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <MenuItem value="all">All Groups</MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                <InputLabel id="analytics-category-label" sx={{ fontSize: '0.8rem' }}>Category</InputLabel>
                <Select
                  labelId="analytics-category-label"
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                  sx={{
                    borderRadius: 2.5,
                    fontSize: '0.8rem',
                    bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="FOOD">🍽️ Food & Dining</MenuItem>
                  <MenuItem value="TRANSPORT">🚗 Transport</MenuItem>
                  <MenuItem value="ENTERTAINMENT">🎬 Entertainment</MenuItem>
                  <MenuItem value="SHOPPING">🛍️ Shopping</MenuItem>
                  <MenuItem value="UTILITIES">⚡ Utilities</MenuItem>
                  <MenuItem value="RENT">🏠 Rent & Housing</MenuItem>
                  <MenuItem value="TRAVEL">✈️ Travel & Trips</MenuItem>
                  <MenuItem value="GROCERIES">🛒 Groceries</MenuItem>
                  <MenuItem value="GENERAL">📦 General</MenuItem>
                  <MenuItem value="OTHER">🏷️ Other</MenuItem>
                </Select>
              </FormControl>

              {(groupId !== 'all' || category !== 'all' || viewType !== 'share' || timeframe !== '30D') && (
                <Button
                  size="small"
                  onClick={() => {
                    setTimeframe('30D');
                    setGroupId('all');
                    setCategory('all');
                    setViewType('share');
                  }}
                  startIcon={<RestartAlt fontSize="small" />}
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': { color: '#EF4444' },
                  }}
                >
                  Reset
                </Button>
              )}
            </Box>
          </Box>
        </Card>

        {/* 4 Telemetry Metrics */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              className="glass-secondary glass-specular-top glass-accent-emerald"
              sx={{
                borderRadius: 3.5,
                p: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.mode === 'dark' ? '#34D399' : 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {timeframe === '7D' ? '7-Day' : timeframe === '90D' ? '90-Day' : timeframe === '1Y' ? '1-Year' : timeframe === 'ALL' ? 'All-Time' : '30-Day'} {viewType === 'total' ? 'Gross Spend' : 'Net Share'}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                    {loading ? <Skeleton width={100} /> : `₹${totalSpend.toLocaleString('en-IN')}`}
                  </Typography>
                </Box>
                <Box className="glass-tertiary" sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981' }}>
                  <AccountBalanceWallet fontSize="small" />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5 }}>
                <Chip
                  size="small"
                  label={viewType === 'total' ? 'Total bill volume' : 'Your personal share'}
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    height: 22,
                  }}
                />
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                p: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Daily Burn Rate
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                    {loading ? <Skeleton width={100} /> : `₹${dailyAverage.toLocaleString('en-IN')}`}
                  </Typography>
                </Box>
                <Box className="glass-tertiary" sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.15), border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981' }}>
                  <TrendingUp fontSize="small" />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}>
                Estimated monthly pace: ₹{(dailyAverage * 30).toLocaleString('en-IN')}
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                p: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Reimbursement Rate
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#10B981', mt: 0.5 }}>
                    94.2%
                  </Typography>
                </Box>
                <Box className="glass-tertiary" sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981' }}>
                  <CheckCircle fontSize="small" />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}>
                Friends settle within 1.4 days on avg
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                p: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Shared Bills
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                    {loading ? <Skeleton width={60} /> : categories.reduce((sum: number, c: any) => sum + c.count, 0)}
                  </Typography>
                </Box>
                <Box className="glass-tertiary" sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#F59E0B', 0.15), border: '1px solid rgba(245, 158, 11, 0.3)', color: '#FBBF24' }}>
                  <ReceiptLong fontSize="small" />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}>
                Across all friend & trip groups
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Row 1: Cumulative Spend Curve & Category Donut */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Daily Cumulative Spend Curve */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                p: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary' }}>
                    Daily Spending Velocity
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Cumulative spend curve ({viewType === 'total' ? 'gross total' : 'your share'}) across {timeframe === '7D' ? 'the past 7 days' : timeframe === '90D' ? 'the past 90 days' : timeframe === '1Y' ? 'the past year' : timeframe === 'ALL' ? 'all recorded history' : 'the past 30 days'}
                  </Typography>
                </Box>
                <Chip
                  label="Real-time"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 700,
                    height: 22,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>

              <Box sx={{ height: 320, width: '100%' }}>
                {loading || !data?.dailyTrends ? (
                  <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.dailyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.6)} vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke={theme.palette.text.secondary}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        interval={4}
                      />
                      <YAxis
                        stroke={theme.palette.text.secondary}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                          borderRadius: '12px',
                          color: theme.palette.text.primary,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                          fontSize: '0.8rem',
                        }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Cumulative']}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#emeraldGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Category Donut & Progress */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                p: 3,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary' }}>
                  Category Breakdown
                </Typography>
                <PieIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </Box>

              <Box sx={{ height: 180, width: '100%', position: 'relative' }}>
                {loading || categories.length === 0 ? (
                  <Skeleton variant="circular" width={160} height={160} sx={{ mx: 'auto' }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {categories.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[entry.category] || '#64748B'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '10px',
                          color: theme.palette.text.primary,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                          fontSize: '0.8rem',
                        }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Spend']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>

              {/* Category details list */}
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {categories.slice(0, 4).map((c: any) => (
                  <Box key={c.category}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: CATEGORY_COLORS[c.category] || '#64748B',
                          }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>
                          {c.category.charAt(0) + c.category.slice(1).toLowerCase()}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {c.percentage}% (₹{c.amount.toLocaleString()})
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={c.percentage}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: isLight ? '#E9ECEF' : 'rgba(255, 255, 255, 0.08)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: CATEGORY_COLORS[c.category] || '#64748B',
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Row 2: Cashflow (Inflow vs Outflow) & Day of Week */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Monthly Inflow vs Outflow */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                p: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary' }}>
                    Cashflow: Outflow vs Reimbursed
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Compares what you paid for groups vs what friends paid back
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: '#EF4444' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Paid Out</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: '#10B981' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Reimbursed</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ height: 260, width: '100%' }}>
                {loading || !data?.cashflow ? (
                  <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.cashflow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.6)} vertical={false} />
                      <XAxis dataKey="month" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                          borderRadius: '12px',
                          color: theme.palette.text.primary,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                          fontSize: '0.8rem',
                        }}
                      />
                      <Bar dataKey="paidOut" name="Paid Out" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="reimbursed" name="Reimbursed" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Day of Week Intensity */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                p: 3,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary' }}>
                    Weekly Spending Rhythm
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Distribution of expense activity by day
                  </Typography>
                </Box>
                <CalendarMonth sx={{ color: 'text.secondary', fontSize: 20 }} />
              </Box>

              <Box sx={{ height: 260, width: '100%' }}>
                {loading || !data?.dayOfWeekData ? (
                  <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dayOfWeekData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.6)} vertical={false} />
                      <XAxis dataKey="day" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                          borderRadius: '12px',
                          color: theme.palette.text.primary,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                          fontSize: '0.8rem',
                        }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Total Spend']}
                      />
                      <Bar dataKey="amount" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Smart Automated Financial Insights */}
        <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', mb: 2 }}>
          Automated Financial Intelligence
        </Typography>

        <Grid container spacing={2.5}>
          {(data?.insights || []).map((ins: any) => (
            <Grid size={{ xs: 12, md: 4 }} key={ins.id}>
              <Card
                className="glass-secondary glass-specular-top"
                sx={{
                  borderRadius: 3.5,
                  boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                  p: 3,
                  height: '100%',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.14) !important' : 'rgba(255, 255, 255, 0.22) !important',
                    boxShadow: isLight ? '0 12px 32px rgba(15, 23, 42, 0.08)' : '0 16px 40px -8px rgba(0, 0, 0, 0.65)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    className="glass-tertiary"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: ins.impact === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border: `1px solid ${ins.impact === 'HIGH' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      color: ins.impact === 'HIGH' ? '#EF4444' : '#10B981',
                      display: 'flex',
                    }}
                  >
                    <Lightbulb fontSize="small" />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.primary' }}>
                    {ins.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.825rem' }}>
                  {ins.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </AppLayout>
  );
}
