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
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'30D' | '90D' | '6M'>('30D');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session?.access_token) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/dashboard/analytics`,
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
  }, [session]);

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
    a.download = `fairshare_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalSpend = data?.total30Days || 0;
  const dailyAverage = totalSpend > 0 ? Math.round(totalSpend / 30) : 0;
  const categories = data?.categoryBreakdown || [];

  return (
    <AppLayout>
      <Box sx={{ pb: 6 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
              Financial Telemetry
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Deep telemetry on your group expenses, cashflows, and spending habits
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box
              sx={{
                bgcolor: isLight ? '#E9ECEF' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2.5,
                p: 0.5,
                display: 'flex',
                gap: 0.5,
              }}
            >
              {(['30D', '90D', '6M'] as const).map((tf) => (
                <Button
                  key={tf}
                  size="small"
                  onClick={() => setTimeframe(tf)}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    minWidth: 'auto',
                    color: timeframe === tf ? '#FFFFFF' : 'text.secondary',
                    bgcolor: timeframe === tf ? (isLight ? '#1A1D1F' : '#0E6245') : 'transparent',
                    '&:hover': {
                      bgcolor: timeframe === tf ? (isLight ? '#1A1D1F' : '#0E6245') : alpha(theme.palette.text.primary, 0.05),
                    },
                  }}
                >
                  {tf}
                </Button>
              ))}
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Download fontSize="small" />}
              onClick={handleExportCSV}
              sx={{
                borderColor: theme.palette.divider,
                color: 'text.primary',
                bgcolor: 'background.paper',
                borderRadius: 2.5,
                fontWeight: 600,
                textTransform: 'none',
                py: 0.75,
                px: 2,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* 4 Telemetry Metrics */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                p: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                    30-Day Spending
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                    {loading ? <Skeleton width={100} /> : `₹${totalSpend.toLocaleString('en-IN')}`}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#0E6245', 0.1), color: '#0E6245' }}>
                  <AccountBalanceWallet fontSize="small" />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5 }}>
                <Chip
                  size="small"
                  icon={<ArrowUpward sx={{ '&&': { fontSize: 12, color: '#0E6245' } }} />}
                  label="12% vs last month"
                  sx={{
                    bgcolor: alpha('#0E6245', 0.1),
                    color: '#0E6245',
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
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                p: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                    Daily Burn Rate
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                    {loading ? <Skeleton width={100} /> : `₹${dailyAverage.toLocaleString('en-IN')}`}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
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
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                p: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                    Reimbursement Rate
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0E6245', mt: 0.5 }}>
                    94.2%
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#0E6245', 0.1), color: '#0E6245' }}>
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
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                p: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                    Active Shared Bills
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                    {loading ? <Skeleton width={60} /> : categories.reduce((sum: number, c: any) => sum + c.count, 0)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B' }}>
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
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                p: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary' }}>
                    Daily Spending Velocity
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Cumulative spend curve across the past 30 days
                  </Typography>
                </Box>
                <Chip
                  label="Real-time"
                  size="small"
                  sx={{
                    bgcolor: alpha('#0E6245', 0.1),
                    color: '#0E6245',
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
                          <stop offset="5%" stopColor="#0E6245" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0E6245" stopOpacity={0.0} />
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
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '10px',
                          color: theme.palette.text.primary,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                          fontSize: '0.8rem',
                        }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Cumulative']}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#0E6245"
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
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
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
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                p: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary' }}>
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
                    <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: '#0E6245' }} />
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
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '10px',
                          color: theme.palette.text.primary,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                          fontSize: '0.8rem',
                        }}
                      />
                      <Bar dataKey="paidOut" name="Paid Out" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="reimbursed" name="Reimbursed" fill="#0E6245" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Day of Week Intensity */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3.5,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                p: 3,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary' }}>
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
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '10px',
                          color: theme.palette.text.primary,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
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
                sx={{
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3.5,
                  boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                  p: 3,
                  height: '100%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#0E6245',
                    boxShadow: '0 4px 12px rgba(14, 98, 69, 0.08)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: ins.impact === 'HIGH' ? alpha('#EF4444', 0.1) : alpha('#0E6245', 0.1),
                      color: ins.impact === 'HIGH' ? '#EF4444' : '#0E6245',
                      display: 'flex',
                    }}
                  >
                    <Lightbulb fontSize="small" />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary' }}>
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
