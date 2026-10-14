'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, List, ListItem, ListItemAvatar,
  ListItemText, Divider, Skeleton, useTheme, alpha, Pagination, Chip,
} from '@mui/material';
import {
  Timeline as TimelineIcon, ReceiptLong, Handshake, Group,
  Savings, CheckCircle, SwapHoriz,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { activityApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const ACTIVITY_TYPE_CONFIG: Record<string, { icon: React.ReactElement; color: string; category: string }> = {
  EXPENSE_CREATED: { icon: <ReceiptLong fontSize="small" />, color: '#0E6245', category: 'EXPENSES' },
  EXPENSE_UPDATED: { icon: <ReceiptLong fontSize="small" />, color: '#059669', category: 'EXPENSES' },
  EXPENSE_DELETED: { icon: <ReceiptLong fontSize="small" />, color: '#EF4444', category: 'EXPENSES' },
  SETTLEMENT_CREATED: { icon: <Handshake fontSize="small" />, color: '#F59E0B', category: 'SETTLEMENTS' },
  SETTLEMENT_CONFIRMED: { icon: <CheckCircle fontSize="small" />, color: '#10B981', category: 'SETTLEMENTS' },
  GROUP_CREATED: { icon: <Group fontSize="small" />, color: '#3B82F6', category: 'GROUPS' },
  GROUP_MEMBER_ADDED: { icon: <Group fontSize="small" />, color: '#0EA5E9', category: 'GROUPS' },
  GROUP_MEMBER_REMOVED: { icon: <Group fontSize="small" />, color: '#64748B', category: 'GROUPS' },
  BUDGET_CREATED: { icon: <Savings fontSize="small" />, color: '#8B5CF6', category: 'BUDGETS' },
  BUDGET_ALERT: { icon: <Savings fontSize="small" />, color: '#DC2626', category: 'BUDGETS' },
};

export default function ActivityPage() {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';
  const { user, loading: authLoading } = useAuth();

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'EXPENSES' | 'SETTLEMENTS' | 'GROUPS' | 'BUDGETS'>('ALL');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await activityApi.list({ page, limit: 25 });
      setActivities(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Fetch activities error:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (user) fetchActivities();
  }, [user, fetchActivities]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredActivities = useMemo(() => {
    if (selectedCategory === 'ALL') return activities;
    return activities.filter((act) => {
      const config = ACTIVITY_TYPE_CONFIG[act.type];
      return config && config.category === selectedCategory;
    });
  }, [activities, selectedCategory]);

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: 6 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
            Activity Feed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time audit log of shared expenses, settlements, and member interactions
          </Typography>
        </Box>

        {/* Category Filter Pills */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            mb: 3,
            py: 0.5,
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {(['ALL', 'EXPENSES', 'SETTLEMENTS', 'GROUPS', 'BUDGETS'] as const).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Chip
                key={cat}
                label={cat === 'ALL' ? 'All Activity' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                size="small"
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  px: 1,
                  py: 1.75,
                  fontSize: '0.775rem',
                  fontWeight: active ? 700 : 500,
                  bgcolor: active
                    ? (isLight ? '#1A1D1F' : '#0E6245')
                    : 'background.paper',
                  color: active ? '#FFFFFF' : 'text.primary',
                  border: `1px solid ${active ? 'transparent' : theme.palette.divider}`,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: active
                      ? (isLight ? '#1A1D1F' : '#0E6245')
                      : alpha(theme.palette.text.primary, 0.05),
                  },
                }}
              />
            );
          })}
        </Box>

        {/* Activity Timeline Card */}
        <Card
          sx={{
            borderRadius: 3.5,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, py: 2 }}>
                    <Skeleton variant="circular" width={42} height={42} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="55%" height={24} />
                      <Skeleton width="30%" height={18} sx={{ mt: 0.5 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : filteredActivities.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <TimelineIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
                  No activity found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCategory !== 'ALL'
                    ? `No ${selectedCategory.toLowerCase()} recorded in this period.`
                    : 'Activities will automatically appear here as you create expenses and record settlements.'}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredActivities.map((activity, i) => {
                  const cfg = ACTIVITY_TYPE_CONFIG[activity.type] || {
                    icon: <TimelineIcon fontSize="small" />,
                    color: '#0E6245',
                    category: 'OTHER',
                  };

                  return (
                    <React.Fragment key={activity.id || i}>
                      <ListItem
                        sx={{
                          px: 3,
                          py: 2,
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.04) },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                              bgcolor: alpha(cfg.color, 0.1),
                              color: cfg.color,
                            }}
                          >
                            {cfg.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                              <strong style={{ fontWeight: 700 }}>{activity.user?.name || 'Someone'}</strong>{' '}
                              <span style={{ color: theme.palette.text.secondary }}>{activity.message}</span>
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(activity.createdAt)}
                              </Typography>
                              {activity.group && (
                                <Chip
                                  label={activity.group.name}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.675rem',
                                    fontWeight: 600,
                                    bgcolor: alpha(theme.palette.action.hover, 0.06),
                                    color: 'text.secondary',
                                  }}
                                />
                              )}
                            </Box>
                          }
                        />

                        {activity.expense && (
                          <Typography variant="body2" fontWeight={800} sx={{ color: '#0E6245' }}>
                            ₹{Number(activity.expense.amount).toLocaleString('en-IN')}
                          </Typography>
                        )}
                      </ListItem>
                      {i < filteredActivities.length - 1 && (
                        <Divider component="li" sx={{ borderColor: theme.palette.divider }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            )}

            {totalPages > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  py: 2.5,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  shape="rounded"
                  sx={{
                    '& .Mui-selected': {
                      bgcolor: '#0E6245 !important',
                      color: '#FFFFFF !important',
                      fontWeight: 700,
                    },
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
