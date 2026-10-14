'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, List, ListItem, ListItemAvatar,
  ListItemText, Divider, Skeleton, useTheme, alpha, Pagination, Chip,
} from '@mui/material';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { activityApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const ACTIVITY_ICONS: Record<string, string> = {
  EXPENSE_CREATED: '💸',
  EXPENSE_UPDATED: '✏️',
  EXPENSE_DELETED: '🗑️',
  SETTLEMENT_CREATED: '🤝',
  SETTLEMENT_CONFIRMED: '✅',
  GROUP_CREATED: '👥',
  GROUP_MEMBER_ADDED: '➕',
  GROUP_MEMBER_REMOVED: '➖',
  BUDGET_CREATED: '📊',
  BUDGET_ALERT: '⚠️',
};

export default function ActivityPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await activityApi.list({ page, limit: 20 });
      setActivities(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
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

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800}>Activity</Typography>
          <Typography variant="body1" color="text.secondary">Your recent activity timeline</Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, py: 2 }}>
                    <Skeleton variant="circular" width={44} height={44} />
                    <Box sx={{ flex: 1 }}><Skeleton width="60%" /><Skeleton width="30%" /></Box>
                  </Box>
                ))}
              </Box>
            ) : activities.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No activity yet</Typography>
                <Typography variant="body2" color="text.secondary">
                  Activities will appear here as you use FairShare
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {activities.map((activity, i) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 3, py: 2, transition: 'all 0.2s', '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.04) } }}>
                      <ListItemAvatar>
                        <Avatar
                          src={activity.user?.avatarUrl || undefined}
                          sx={{
                            width: 44, height: 44,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontSize: '0.9rem',
                          }}
                        >
                          {ACTIVITY_ICONS[activity.type] || activity.user?.name?.charAt(0) || '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            <strong>{activity.user?.name}</strong>{' '}{activity.message}
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
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        }
                      />
                      {activity.expense && (
                        <Typography variant="body2" fontWeight={700} color="primary">
                          ₹{Number(activity.expense.amount).toLocaleString('en-IN')}
                        </Typography>
                      )}
                    </ListItem>
                    {i < activities.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
