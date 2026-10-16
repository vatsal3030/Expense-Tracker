'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Avatar,
  Badge,
  Skeleton,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  DoneAll,
  Delete,
  CheckCircle,
  AccountBalanceWallet,
  PersonAdd,
  Group as GroupIcon,
  ReceiptLong,
  Info,
  Close,
  ArrowForward,
  FilterList,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { notificationApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); // 0 = All, 1 = Unread, 2 = Friends, 3 = Settlements, 4 = Groups/Expenses
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'info' | 'error'>('success');

  const hasLoadedRef = useRef(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    if (user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchNotifications();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await notificationApi.list(100);
      const data = res.data?.data;
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setToastSeverity('success');
      setToastMessage('All notifications marked as read.');
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDeleteItem = async (id: string, wasUnread: boolean) => {
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
      setToastSeverity('info');
      setToastMessage('Notification removed.');
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationApi.clear();
      setNotifications([]);
      setUnreadCount(0);
      setClearDialogOpen(false);
      setToastSeverity('info');
      setToastMessage('All notifications cleared.');
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (tab === 1) return notifications.filter((n) => !n.isRead);
    if (tab === 2) return notifications.filter((n) => n.type === 'FRIEND_REQUEST');
    if (tab === 3)
      return notifications.filter(
        (n) =>
          n.type === 'SETTLEMENT_REQUEST' ||
          n.type === 'SETTLEMENT_CONFIRMED' ||
          n.type === 'SETTLEMENT_REJECTED'
      );
    if (tab === 4)
      return notifications.filter(
        (n) => n.type === 'EXPENSE_ADDED' || n.type === 'GROUP_INVITE'
      );
    return notifications;
  }, [notifications, tab]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return <PersonAdd sx={{ fontSize: 20, color: '#34D399' }} />;
      case 'SETTLEMENT_REQUEST':
      case 'SETTLEMENT_CONFIRMED':
        return <AccountBalanceWallet sx={{ fontSize: 20, color: '#F59E0B' }} />;
      case 'GROUP_INVITE':
        return <GroupIcon sx={{ fontSize: 20, color: '#60A5FA' }} />;
      case 'EXPENSE_ADDED':
        return <ReceiptLong sx={{ fontSize: 20, color: '#A855F7' }} />;
      default:
        return <Info sx={{ fontSize: 20, color: '#9CA3AF' }} />;
    }
  };

  const handleActionClick = (n: any) => {
    if (!n.isRead) handleMarkAsRead(n.id);
    switch (n.type) {
      case 'FRIEND_REQUEST':
        router.push('/friends');
        break;
      case 'SETTLEMENT_REQUEST':
      case 'SETTLEMENT_CONFIRMED':
        router.push('/settlements');
        break;
      case 'GROUP_INVITE':
        if (n.data?.groupId) router.push(`/groups/${n.data.groupId}`);
        else router.push('/groups');
        break;
      case 'EXPENSE_ADDED':
        router.push('/expenses');
        break;
      default:
        break;
    }
  };

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 }, width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {/* Header Row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 3,
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <NotificationsIcon sx={{ color: '#34D399', fontSize: { xs: 24, sm: 28 } }} />
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: 'text.primary', fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' } }}>
                Notification Center
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: '-0.01em', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Real-time alerts for friend requests, settlement confirmations, and group bill splits
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              className="glass-tertiary"
              startIcon={<DoneAll fontSize="small" />}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              sx={{
                flex: { xs: 1, sm: 'none' },
                borderRadius: 2.5,
                px: 2,
                py: 0.8,
                fontWeight: 650,
                fontSize: '0.8rem',
                textTransform: 'none',
                color: 'text.primary',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              Mark all read
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete fontSize="small" />}
              onClick={() => setClearDialogOpen(true)}
              disabled={notifications.length === 0}
              sx={{
                flex: { xs: 1, sm: 'none' },
                borderRadius: 2.5,
                px: 2,
                py: 0.8,
                fontWeight: 650,
                fontSize: '0.8rem',
                textTransform: 'none',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
              }}
            >
              Clear all
            </Button>
          </Box>
        </Box>

        {/* Tab Controls Capsule (Proper width on desktop) */}
        <Box sx={{ mb: 3 }}>
          <Box
            className="glass-control-surface"
            sx={{
              display: { xs: 'flex', sm: 'inline-flex' },
              p: 0.5,
              borderRadius: 3,
              width: { xs: '100%', sm: 'auto' },
              maxWidth: '100%',
              overflowX: 'auto',
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 40,
                '& .MuiTabs-indicator': {
                  height: '100%',
                  borderRadius: 2.5,
                  bgcolor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  zIndex: 0,
                },
                '& .MuiTab-root': {
                  zIndex: 1,
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '0.825rem',
                  minHeight: 38,
                  px: 2,
                  borderRadius: 2.5,
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    color: '#34D399',
                  },
                },
              }}
            >
              <Tab label={`All (${notifications.length})`} />
              <Tab
                label={
                  <Badge
                    badgeContent={unreadCount}
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 18, minWidth: 18 } }}
                  >
                    <Box sx={{ pr: unreadCount > 0 ? 1.5 : 0 }}>Unread</Box>
                  </Badge>
                }
              />
              <Tab label="Friend Requests" />
              <Tab label="Settlements" />
              <Tab label="Groups & Expenses" />
            </Tabs>
          </Box>
        </Box>

        {/* Notification List Container */}
        <Card className="glass-secondary glass-specular-top" sx={{ borderRadius: 3.5, overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, py: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="45%" height={22} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                      <Skeleton width="75%" height={16} sx={{ mt: 0.5, bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : filteredNotifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <CheckCircle sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
                <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary', mb: 0.5 }}>
                  {tab === 1 ? 'You are all caught up!' : 'No notifications in this category'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                  {tab === 1
                    ? 'No unread notifications right now. Check back when friends interact or send payment requests.'
                    : 'Activity and alerts will automatically appear here as they occur on FairShare.'}
                </Typography>
              </Box>
            ) : (
              <Box>
                {filteredNotifications.map((item, idx) => (
                  <React.Fragment key={item.id || idx}>
                    <Box
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        display: 'flex',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 2,
                        bgcolor: item.isRead ? 'transparent' : isLight ? 'rgba(16, 185, 129, 0.04)' : 'rgba(52, 211, 153, 0.05)',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
                        },
                      }}
                    >
                      {/* Category Icon */}
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)',
                          border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'}`,
                        }}
                      >
                        {getNotificationIcon(item.type)}
                      </Avatar>

                      {/* Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          <Typography variant="body2" fontWeight={item.isRead ? 650 : 800} sx={{ color: 'text.primary' }}>
                            {item.title || 'Notification'}
                          </Typography>
                          {!item.isRead && (
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem', lineHeight: 1.4 }}>
                          {item.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.725rem' }}>
                          {new Date(item.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          className="glass-tertiary"
                          endIcon={<ArrowForward fontSize="small" />}
                          onClick={() => handleActionClick(item)}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 650,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            color: 'text.primary',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: { xs: 'none', sm: 'inline-flex' },
                          }}
                        >
                          View
                        </Button>

                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteItem(item.id, !item.isRead)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { color: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.08)' },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    {idx < filteredNotifications.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
                    )}
                  </React.Fragment>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Clear All Confirmation Modal */}
        <Dialog
          open={clearDialogOpen}
          onClose={() => setClearDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep',
              sx: { borderRadius: 3.5, p: 2.5, border: '1px solid rgba(239, 68, 68, 0.25)' },
            },
          }}
        >
          <DialogTitle sx={{ p: 0, mb: 1, fontWeight: 750 }}>Clear All Notifications?</DialogTitle>
          <DialogContent sx={{ p: 0, mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              This action will permanently delete all {notifications.length} notifications from your history. This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 0, gap: 1 }}>
            <Button onClick={() => setClearDialogOpen(false)} className="glass-tertiary" sx={{ borderRadius: 2, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={handleClearAll} sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
              Clear All
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Snackbar */}
        <Snackbar
          open={Boolean(toastMessage)}
          autoHideDuration={3000}
          onClose={() => setToastMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={toastSeverity} sx={{ borderRadius: 3, fontWeight: 600 }}>
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
}
