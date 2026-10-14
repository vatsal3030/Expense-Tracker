'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Tooltip,
  useTheme,
  alpha,
  InputBase,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { Chip, Button } from '@mui/material';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';

interface HeaderProps {
  onMenuToggle: () => void;
  drawerWidth: number;
}

export default function Header({ onMenuToggle, drawerWidth }: HeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(null);

  const [notifications, setNotifications] = React.useState<any[]>([
    {
      id: '1',
      title: 'Settlement Confirmed',
      message: 'Sam Wilson confirmed receiving ₹4,200 via UPI.',
      time: '5m ago',
      isRead: false,
      type: 'SETTLEMENT',
      actionUrl: '/settlements',
    },
    {
      id: '2',
      title: 'New Expense Added',
      message: 'Alex added "Beach Villa 3 Nights" (₹16,000) to Goa Weekend Trip.',
      time: '1h ago',
      isRead: false,
      type: 'EXPENSE',
      actionUrl: '/expenses',
    },
    {
      id: '3',
      title: 'Group Join Request',
      message: 'Rahul Sharma requested to join "Flat 402".',
      time: '3h ago',
      isRead: false,
      type: 'GROUP',
      actionUrl: '/groups',
    },
    {
      id: '4',
      title: 'Budget Alert',
      message: 'You have reached 82% of your monthly Dining budget limit.',
      time: '1d ago',
      isRead: true,
      type: 'BUDGET',
      actionUrl: '/budgets',
    },
  ]);

  React.useEffect(() => {
    if (profile) {
      import('@/lib/api').then(({ notificationApi }) => {
        notificationApi.list(20)
          .then((res) => {
            const serverNotifs = res.data?.data?.notifications;
            if (serverNotifs && serverNotifs.length > 0) {
              setNotifications(serverNotifs.map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                isRead: n.isRead,
                type: n.type || 'SYSTEM',
                data: n.data,
                time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                actionUrl: n.type?.includes('EXPENSE') ? '/expenses' : n.type?.includes('SETTLEMENT') ? '/settlements' : '/groups',
              })));
            }
          })
          .catch(() => {});
      });
    }
  }, [profile?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => setNotifAnchorEl(null);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      const { notificationApi } = await import('@/lib/api');
      await notificationApi.markAllRead();
    } catch {}
  };

  const handleClearNotifs = async () => {
    setNotifications([]);
    handleNotifClose();
    try {
      const { notificationApi } = await import('@/lib/api');
      await notificationApi.clear();
    } catch {}
  };

  const handleNotifClick = async (item: any) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    handleNotifClose();
    try {
      const { notificationApi } = await import('@/lib/api');
      await notificationApi.markRead(item.id);
    } catch {}
    if (item.actionUrl) router.push(item.actionUrl);
  };

  const handleApproveJoin = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    try {
      const { groupApi, notificationApi } = await import('@/lib/api');
      if (item.data?.groupId && item.data?.requesterId) {
        await groupApi.addMember(item.data.groupId, { userId: item.data.requesterId });
      }
      await notificationApi.markRead(item.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id
            ? { ...n, isRead: true, message: `${n.message} (Approved)` }
            : n
        )
      );
    } catch (err: any) {
      console.error('Approve join error:', err);
    }
  };

  const handleRejectJoin = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    try {
      const { notificationApi } = await import('@/lib/api');
      await notificationApi.markRead(item.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id
            ? { ...n, isRead: true, message: `${n.message} (Declined)` }
            : n
        )
      );
    } catch (err: any) {
      console.error('Reject join error:', err);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
    router.push('/auth/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: alpha(theme.palette.background.default, 0.8),
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: 64, sm: 70 } }}>
        {/* Mobile menu button */}
        <IconButton
          edge="start"
          onClick={onMenuToggle}
          sx={{ display: { md: 'none' }, mr: 1, color: 'text.secondary' }}
        >
          <MenuIcon />
        </IconButton>

        {/* Mobile Brand Logo */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, mr: 2 }}>
          <BrandLogo size="sm" />
        </Box>

        {/* Search Bar */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            bgcolor: alpha(theme.palette.action.hover, 0.06),
            borderRadius: 3,
            px: 2,
            py: 0.5,
            flex: 1,
            maxWidth: 480,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            transition: 'all 0.2s ease',
            '&:focus-within': {
              bgcolor: alpha(theme.palette.action.hover, 0.1),
              borderColor: theme.palette.primary.main,
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
            },
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Search expenses, groups, friends..."
            sx={{ flex: 1, fontSize: '0.875rem' }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              bgcolor: alpha(theme.palette.action.hover, 0.1),
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          >
            ⌘K
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* FairScore & Streak Badge */}
          <Tooltip title="FairScore: 880 (Diamond Tier) • 14-day streak">
            <Box
              onClick={() => router.push('/fairscore')}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                mr: 1,
                borderRadius: 20,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'rgba(16,185,129,0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#10b981',
                  bgcolor: 'rgba(16,185,129,0.15)',
                },
              }}
            >
              <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 700 }}>
                ⭐ 880
              </Typography>
              <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                🔥 14d
              </Typography>
            </Box>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton
              onClick={toggleTheme}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'rotate(180deg)' },
              }}
            >
              {mode === 'dark' ? (
                <LightModeIcon sx={{ color: '#fbbf24' }} />
              ) : (
                <DarkModeIcon sx={{ color: '#64748b' }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton onClick={handleNotifOpen}>
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    height: 18,
                    minWidth: 18,
                  },
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="Account">
            <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 0.5 }}>
              <Avatar
                src={profile?.avatarUrl || undefined}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                minWidth: 220,
                borderRadius: 3,
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: `1px solid ${theme.palette.divider}`,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {profile?.name || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {profile?.email || ''}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleMenuClose(); router.push('/settings'); }}>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Profile" />
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); router.push('/settings'); }}>
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText primary="Sign Out" />
          </MenuItem>
        </Menu>

        {/* Notifications Dropdown */}
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                width: { xs: 320, sm: 380 },
                maxHeight: 480,
                borderRadius: 3,
                boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              },
            },
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} new`}
                  size="small"
                  color="primary"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={handleMarkAllRead}>
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  All caught up! No notifications.
                </Typography>
              </Box>
            ) : (
              notifications.map((item) => (
                <MenuItem
                  key={item.id}
                  onClick={() => handleNotifClick(item)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                    bgcolor: item.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                    whiteSpace: 'normal',
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      bgcolor:
                        item.type === 'SETTLEMENT'
                          ? alpha(theme.palette.success.main, 0.12)
                          : item.type === 'EXPENSE'
                          ? alpha(theme.palette.primary.main, 0.12)
                          : item.type === 'GROUP' || item.type === 'GROUP_INVITE'
                          ? alpha('#0ea5e9', 0.12)
                          : alpha(theme.palette.warning.main, 0.12),
                      color:
                        item.type === 'SETTLEMENT'
                          ? theme.palette.success.main
                          : item.type === 'EXPENSE'
                          ? theme.palette.primary.main
                          : item.type === 'GROUP' || item.type === 'GROUP_INVITE'
                          ? '#0ea5e9'
                          : theme.palette.warning.main,
                    }}
                  >
                    {item.type === 'SETTLEMENT' && <CheckCircleIcon sx={{ fontSize: 18 }} />}
                    {item.type === 'EXPENSE' && <ReceiptIcon sx={{ fontSize: 18 }} />}
                    {(item.type === 'GROUP' || item.type === 'GROUP_INVITE') && <GroupIcon sx={{ fontSize: 18 }} />}
                    {item.type === 'BUDGET' && <WarningIcon sx={{ fontSize: 18 }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                      <Typography variant="body2" fontWeight={item.isRead ? 600 : 700} sx={{ fontSize: '0.825rem' }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {item.time}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                      {item.message}
                    </Typography>
                    {item.type === 'GROUP_INVITE' && !item.isRead && item.data?.groupId && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={(e) => handleApproveJoin(e, item)}
                          sx={{ fontSize: '0.7rem', py: 0.25, px: 1.25, minHeight: 24, borderRadius: 1 }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          onClick={(e) => handleRejectJoin(e, item)}
                          sx={{ fontSize: '0.7rem', py: 0.25, px: 1.25, minHeight: 24, borderRadius: 1 }}
                        >
                          Decline
                        </Button>
                      </Box>
                    )}
                  </Box>
                  {!item.isRead && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 1, flexShrink: 0 }} />
                  )}
                </MenuItem>
              ))
            )}
          </Box>
          <Box sx={{ p: 1, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button size="small" fullWidth onClick={handleClearNotifs} sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Clear all notifications
            </Button>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
