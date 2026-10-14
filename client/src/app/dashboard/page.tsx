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
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { dashboardApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#ef4444',
  TRANSPORT: '#3b82f6',
  ENTERTAINMENT: '#8b5cf6',
  SHOPPING: '#ec4899',
  UTILITIES: '#f59e0b',
  RENT: '#14b8a6',
  HEALTH: '#10b981',
  EDUCATION: '#6366f1',
  TRAVEL: '#f97316',
  GROCERIES: '#22c55e',
  SUBSCRIPTIONS: '#a855f7',
  GENERAL: '#64748b',
  OTHER: '#94a3b8',
  INSURANCE: '#0ea5e9',
  GIFTS: '#d946ef',
  DONATIONS: '#84cc16',
  INVESTMENTS: '#06b6d4',
  SALARY: '#10b981',
  FREELANCE: '#f472b6',
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

  const fetchDashboard = async () => {
    try {
      const [summaryRes, trendRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getSpendingTrend(),
      ]);
      setData(summaryRes.data.data);
      setTrendData(trendRes.data.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
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

  const summaryCards = [
    {
      title: 'Total Balance',
      value: data?.totalBalance ?? 0,
      icon: <AccountBalanceWallet />,
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      shadowColor: 'rgba(99,102,241,0.3)',
      positive: (data?.totalBalance ?? 0) >= 0,
    },
    {
      title: 'You Owe',
      value: data?.youOwe ?? 0,
      icon: <CallMade />,
      gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
      shadowColor: 'rgba(239,68,68,0.3)',
      positive: false,
    },
    {
      title: 'Owed to You',
      value: data?.owedToYou ?? 0,
      icon: <CallReceived />,
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      shadowColor: 'rgba(16,185,129,0.3)',
      positive: true,
    },
    {
      title: 'This Month',
      value: data?.thisMonth?.total ?? 0,
      icon: data?.thisMonth?.change && data.thisMonth.change > 0 ? <TrendingUp /> : <TrendingDown />,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      shadowColor: 'rgba(59,130,246,0.3)',
      change: data?.thisMonth?.change,
    },
  ];

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in">
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your financial overview at a glance
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {summaryCards.map((card, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                className="animate-slide-in-up stagger-item"
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: card.gradient,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {card.title}
                    </Typography>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2.5,
                        background: card.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: `0 4px 14px ${card.shadowColor}`,
                      }}
                    >
                      {card.icon}
                    </Box>
                  </Box>
                  {loading ? (
                    <Skeleton width="60%" height={40} />
                  ) : (
                    <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
                      {formatCurrency(card.value)}
                    </Typography>
                  )}
                  {card.change !== undefined && !loading && (
                    <Chip
                      size="small"
                      label={`${card.change > 0 ? '+' : ''}${card.change}% vs last month`}
                      sx={{
                        mt: 0.5,
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: alpha(card.change > 0 ? theme.palette.error.main : theme.palette.success.main, 0.1),
                        color: card.change > 0 ? theme.palette.error.main : theme.palette.success.main,
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Spending Trend */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Spending Trend
                </Typography>
                {loading ? (
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          background: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 12,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Spent']}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Category Breakdown */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Categories
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} height={20} />
                    ))}
                  </Box>
                ) : data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={data.categoryBreakdown.slice(0, 6)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="amount"
                        >
                          {data.categoryBreakdown.slice(0, 6).map((entry, i) => (
                            <Cell
                              key={i}
                              fill={CATEGORY_COLORS[entry.category] || '#94a3b8'}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            background: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 12,
                          }}
                          formatter={(value: any, name: any) => [formatCurrency(Number(value) || 0), String(name)]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ mt: 1 }}>
                      {data.categoryBreakdown.slice(0, 5).map((cat, i) => (
                        <Box
                          key={i}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 0.75,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: CATEGORY_COLORS[cat.category] || '#94a3b8',
                              }}
                            />
                            <Typography variant="body2" sx={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
                              {cat.category.toLowerCase()}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={600} fontSize="0.8rem">
                            {formatCurrency(cat.amount)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <Receipt sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">No expenses yet</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Stats & Recent Activity */}
        <Grid container spacing={3}>
          {/* Quick Stats */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Quick Stats
                </Typography>
                {[
                  { icon: <Receipt fontSize="small" />, label: 'Expenses this month', value: data?.thisMonth?.count ?? 0, color: '#6366f1' },
                  { icon: <Group fontSize="small" />, label: 'Active groups', value: data?.groupsCount ?? 0, color: '#10b981' },
                  { icon: <Handshake fontSize="small" />, label: 'Pending settlements', value: data?.pendingSettlements ?? 0, color: '#f59e0b' },
                ].map((stat, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      borderBottom: i < 2 ? `1px solid ${theme.palette.divider}` : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
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
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {loading ? <Skeleton width={30} /> : stat.value}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Recent Activity
                  </Typography>
                  <Tooltip title="View all">
                    <IconButton size="small" onClick={() => router.push('/activity')}>
                      <ArrowForward fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {loading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[1, 2, 3].map((i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} />
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
                        <ListItem disablePadding sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar
                              src={activity.user?.avatarUrl}
                              sx={{
                                width: 38,
                                height: 38,
                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                                color: theme.palette.primary.main,
                                fontSize: '0.85rem',
                              }}
                            >
                              {activity.user?.name?.charAt(0) || '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
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
                        {i < data.recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                    <Typography variant="body2">No recent activity</Typography>
                    <Typography variant="caption">Start by creating a group or adding an expense</Typography>
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
