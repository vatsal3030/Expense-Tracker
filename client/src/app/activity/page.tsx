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
  EXPENSE_CREATED: { icon: <ReceiptLong fontSize="small" />, color: '#EF4444', category: 'EXPENSES' },
  EXPENSE_UPDATED: { icon: <ReceiptLong fontSize="small" />, color: '#F59E0B', category: 'EXPENSES' },
  EXPENSE_DELETED: { icon: <ReceiptLong fontSize="small" />, color: '#EF4444', category: 'EXPENSES' },
  SETTLEMENT_CREATED: { icon: <Handshake fontSize="small" />, color: '#3B82F6', category: 'SETTLEMENTS' },
  SETTLEMENT_CONFIRMED: { icon: <CheckCircle fontSize="small" />, color: '#10B981', category: 'SETTLEMENTS' },
  GROUP_CREATED: { icon: <Group fontSize="small" />, color: '#8B5CF6', category: 'GROUPS' },
  GROUP_MEMBER_ADDED: { icon: <Group fontSize="small" />, color: '#0EA5E9', category: 'GROUPS' },
  GROUP_MEMBER_REMOVED: { icon: <Group fontSize="small" />, color: '#64748B', category: 'GROUPS' },
  BUDGET_CREATED: { icon: <Savings fontSize="small" />, color: '#10B981', category: 'BUDGETS' },
  BUDGET_ALERT: { icon: <Savings fontSize="small" />, color: '#DC2626', category: 'BUDGETS' },
};


export default function ActivityPage() {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';
  const { user, profile, loading: authLoading } = useAuth();

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'EXPENSES' | 'SETTLEMENTS' | 'GROUPS' | 'BUDGETS'>('ALL');

  const hasLoadedActivitiesRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fairshare_cached_activity');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActivities(parsed);
          setLoading(false);
          hasLoadedActivitiesRef.current = true;
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  const isFetchingActivitiesRef = useRef(false);

  const fetchActivities = useCallback(async () => {
    if (isFetchingActivitiesRef.current) return;
    isFetchingActivitiesRef.current = true;
    try {
      if (!hasLoadedActivitiesRef.current) {
        setLoading(true);
      }
      const res = await activityApi.list({ page, limit: 25 });
      const data = res.data?.data || [];
      setActivities(data);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      hasLoadedActivitiesRef.current = true;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('fairshare_cached_activity', JSON.stringify(data));
        } catch {}
      }
    } catch (error) {
      console.error('Fetch activities error:', error);
    } finally {
      isFetchingActivitiesRef.current = false;
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


  return (
    <AppLayout>
      <Box sx={{ pb: { xs: 4, sm: 4 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 1.25, sm: 1.75 }, width: '100%', maxWidth: '100%' }}>
          <Typography fontWeight={700} sx={{ letterSpacing: '-0.025em', color: 'text.primary', fontSize: { xs: '1.2rem', sm: '1.45rem', md: '1.65rem' } }}>
            Activity Feed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, letterSpacing: '-0.01em', fontSize: { xs: '0.78rem', sm: '0.85rem' }, display: { xs: 'none', sm: 'block' } }}>
            Real-time audit log of shared expenses, settlements, and member interactions
          </Typography>
        </Box>

        {/* Category Filter Pills */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 0.5, sm: 0.75 },
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            WebkitOverflowScrolling: 'touch',
            mb: { xs: 1.25, sm: 1.75 },
            py: 0.25,
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {(['ALL', 'EXPENSES', 'SETTLEMENTS', 'GROUPS', 'BUDGETS'] as const).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Chip
                key={cat}
                label={cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                size="small"
                onClick={() => setSelectedCategory(cat)}
                className={active ? 'glass-emerald-active' : 'glass-tertiary'}
                sx={{
                  flexShrink: 0,
                  px: { xs: 0.75, sm: 1.25 },
                  height: { xs: 26, sm: 30 },
                  fontSize: { xs: '0.72rem', sm: '0.785rem' },
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
                          px: { xs: 2, sm: 2.5 },
                          py: 1.35,
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
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
                            <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.865rem' }}>
                              <strong style={{ fontWeight: 650, color: '#FFFFFF' }}>{activity.user?.name || 'Someone'}</strong>{' '}
                              <span style={{ color: 'rgba(240, 246, 252, 0.75)' }}>{activity.message}</span>
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 0.25 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                                  {formatDate(activity.createdAt)}
                                </Typography>
                                {activity.group && (
                                  <Chip
                                    label={activity.group.name}
                                    size="small"
                                    className="glass-tertiary"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      color: 'text.secondary',
                                      border: '1px solid rgba(255, 255, 255, 0.08)',
                                    }}
                                  />
                                )}
                              </Box>

                              {/* Accountability Audit Trail: Exact diffs of who edited / deleted what */}
                              {activity.metadata?.changes && Object.keys(activity.metadata.changes).length > 0 && (
                                <Box sx={{ mt: 0.6, display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                                  {Object.entries(activity.metadata.changes).map(([field, val]: [string, any]) => (
                                    <Chip
                                      key={field}
                                      size="small"
                                      label={`${field}: ${typeof val?.from === 'object' ? JSON.stringify(val.from) : val?.from} → ${typeof val?.to === 'object' ? JSON.stringify(val.to) : val?.to}`}
                                      sx={{
                                        fontSize: '0.68rem',
                                        height: 19,
                                        bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                                        border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                                        color: isLight ? '#334155' : '#CBD5E1',
                                        fontFamily: 'monospace',
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                              {activity.metadata?.snapshot && (
                                <Box sx={{ mt: 0.6 }}>
                                  <Chip
                                    size="small"
                                    label={`Deleted Snapshot: ₹${Number(activity.metadata.snapshot.amount).toLocaleString('en-IN')} (${activity.metadata.snapshot.category || 'General'})`}
                                    sx={{
                                      fontSize: '0.68rem',
                                      height: 19,
                                      bgcolor: 'rgba(244,63,94,0.1)',
                                      border: '1px solid rgba(244,63,94,0.2)',
                                      color: '#F43F5E',
                                      fontWeight: 600,
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                          }
                        />

                        {activity.expense && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: isLight ? '#DC2626' : '#F87171',
                              fontWeight: 700,
                              letterSpacing: '-0.02em',
                              fontSize: '0.9rem',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            -₹{Number(activity.expense.amount).toLocaleString('en-IN')}
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
