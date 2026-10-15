'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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

  const hasLoadedActivitiesRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  const fetchActivities = useCallback(async () => {
    try {
      if (!hasLoadedActivitiesRef.current) {
        setLoading(true);
      }
      const res = await activityApi.list({ page, limit: 25 });
      setActivities(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      hasLoadedActivitiesRef.current = true;
    } catch (error) {
      console.error('Fetch activities error:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (user?.id) fetchActivities();
  }, [user?.id, fetchActivities]);

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
      <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Header */}
        <Box sx={{ mb: 3, width: '100%', maxWidth: '100%' }}>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: 'text.primary', fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' } }}>
            Activity Feed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, letterSpacing: '-0.01em', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Real-time audit log of shared expenses, settlements, and member interactions
          </Typography>
        </Box>

        {/* Category Filter Pills */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            WebkitOverflowScrolling: 'touch',
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
                className={active ? 'glass-emerald-active' : 'glass-tertiary'}
                sx={{
                  flexShrink: 0,
                  px: 1.25,
                  py: 1.8,
                  fontSize: '0.785rem',
                  fontWeight: active ? 700 : 550,
                  color: active ? '#FFFFFF' : 'text.secondary',
                  border: active
                    ? '1px solid rgba(52, 211, 153, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    color: active ? '#FFFFFF' : '#34D399',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    transform: 'translateY(-1px)',
                  },
                }}
              />
            );
          })}
        </Box>

        {/* Activity Timeline Card */}
        <Card
          className="glass-secondary glass-specular-top"
          sx={{
            borderRadius: 3.5,
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, py: 2 }}>
                    <Skeleton variant="circular" width={42} height={42} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="55%" height={24} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                      <Skeleton width="30%" height={18} sx={{ mt: 0.5, bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : filteredActivities.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <TimelineIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.25, mb: 1.5 }} />
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
                    color: '#10B981',
                    category: 'OTHER',
                  };

                  return (
                    <React.Fragment key={activity.id || i}>
                      <ListItem
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: 2.2,
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: alpha(cfg.color, 0.12),
                              color: cfg.color,
                              border: `1px solid ${alpha(cfg.color, 0.25)}`,
                            }}
                          >
                            {cfg.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          disableTypography
                          primary={
                            <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
                              <strong style={{ fontWeight: 650, color: '#FFFFFF' }}>{activity.user?.name || 'Someone'}</strong>{' '}
                              <span style={{ color: 'rgba(240, 246, 252, 0.75)' }}>{activity.message}</span>
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {formatDate(activity.createdAt)}
                              </Typography>
                              {activity.group && (
                                <Chip
                                  label={activity.group.name}
                                  size="small"
                                  className="glass-tertiary"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.675rem',
                                    fontWeight: 600,
                                    color: 'text.secondary',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                  }}
                                />
                              )}
                            </Box>
                          }
                        />

                        {activity.expense && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#10B981',
                              fontWeight: 650,
                              letterSpacing: '-0.02em',
                              fontSize: '0.925rem',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            ₹{Number(activity.expense.amount).toLocaleString('en-IN')}
                          </Typography>
                        )}
                      </ListItem>
                      {i < filteredActivities.length - 1 && (
                        <Divider component="li" sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
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
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  shape="rounded"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: 'text.secondary',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.06)',
                      },
                    },
                    '& .Mui-selected': {
                      bgcolor: 'rgba(16, 185, 129, 0.20) !important',
                      color: '#10B981 !important',
                      borderColor: 'rgba(16, 185, 129, 0.4) !important',
                      fontWeight: 650,
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
