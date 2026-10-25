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
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  SportsEsportsOutlined,
} from '@mui/icons-material';
import { Chip, Button } from '@mui/material';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { useDataRefresh } from '@/lib/events';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import GlobalSearchModal from '@/components/search/GlobalSearchModal';

interface HeaderProps {
  onMenuToggle: () => void;
  drawerWidth: number;
}

export default function Header({ onMenuToggle, drawerWidth }: HeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const { startTour } = useOnboarding();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [notifications, setNotifications] = React.useState<any[]>([]);

  const fetchNotifs = React.useCallback(() => {
    if (profile) {
      import('@/lib/api').then(({ notificationApi }) => {
        notificationApi.list(20)
          .then((res) => {
            const serverNotifs = res.data?.data?.notifications;
            if (serverNotifs) {
              setNotifications(serverNotifs.map((n: any) => {
                let targetUrl = '/notifications';
                if (n.data?.groupId) {
                  targetUrl = `/groups/${n.data.groupId}`;
                } else if (n.type?.includes('EXPENSE')) {
                  targetUrl = '/expenses';
                } else if (n.type?.includes('SETTLEMENT')) {
                  targetUrl = '/settlements';
                } else if (n.type?.includes('FRIEND')) {
                  targetUrl = '/friends';
                } else if (n.type?.includes('BUDGET')) {
                  targetUrl = '/budgets';
                } else if (n.type?.includes('GROUP')) {
                  targetUrl = '/groups';
                }

                return {
                  id: n.id,
                  title: n.title,
                  message: n.message,
                  isRead: n.isRead,
                  type: n.type || 'SYSTEM',
                  data: n.data,
                  time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  actionUrl: targetUrl,
                };
              }));
            }
          })
          .catch(() => {});
      });
    }
  }, [profile?.id]);

  React.useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  useDataRefresh(fetchNotifs);

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

  const isLight = mode === 'light';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      className="glass-nav-island"
      sx={{
        top: { xs: 8, md: 12 },
        left: { xs: 8, md: `${drawerWidth + 16}px` },
        right: { xs: 8, md: 16 },
        width: 'auto',
        borderRadius: { xs: '16px', sm: '20px' },
        border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.14)'}`,
        borderTopColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.35)',
        borderLeftColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.22)',
        background: isLight
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(246, 248, 252, 0.65) 100%)'
          : 'linear-gradient(135deg, rgba(16, 22, 34, 0.75) 0%, rgba(10, 14, 22, 0.65) 100%)',
        backdropFilter: 'blur(28px) saturate(200%) contrast(106%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%) contrast(106%)',
        boxShadow: isLight
          ? 'inset 0 1px 0 rgba(255, 255, 255, 1), 0 14px 36px -8px rgba(15, 23, 42, 0.08), 0 3px 8px -1px rgba(15, 23, 42, 0.04)'
          : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.35), inset 0 -1px 0 0 rgba(0, 0, 0, 0.45), 0 20px 48px -10px rgba(0, 0, 0, 0.65), 0 4px 14px -2px rgba(0, 0, 0, 0.40)',
        color: theme.palette.text.primary,
        transition: theme.transitions.create(['left', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        zIndex: theme.zIndex.appBar,
      }}
    >
      {/* Hairline Specular Edge */}
      <Box
        role="presentation"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          borderTopLeftRadius: 'inherit',
          borderTopRightRadius: 'inherit',
          background: isLight
            ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
          pointerEvents: 'none',
        }}
      />

      <Toolbar sx={{ gap: { xs: 0.5, sm: 1 }, minHeight: { xs: 54, sm: 62 }, px: { xs: 1, sm: 2.25 } }}>
        {/* Mobile menu button */}
        <IconButton
          onClick={onMenuToggle}
          sx={{
            display: { md: 'none' },
            width: 36,
            height: 36,
            mr: { xs: 0.5, sm: 1 },
            color: 'text.secondary',
            bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '10px',
            p: 0.75,
          }}
          aria-label="Open mobile navigation menu"
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </IconButton>

        {/* Mobile Brand Logo — Only circular icon without long text */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, mr: { xs: 0.5, sm: 1.5 }, flexShrink: 0 }}>
          <BrandLogo size="sm" showText={false} />
        </Box>

        {/* Search Bar (Tertiary Glass Pill) — Click to open Elastic Search Modal */}
        <Box
          onClick={() => setSearchOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSearchOpen(true);
            }
          }}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            bgcolor: isLight ? 'rgba(255, 255, 255, 0.65)' : 'rgba(26, 34, 48, 0.45)',
            backdropFilter: 'blur(10px)',
            borderRadius: 9999,
            px: 2,
            py: 0.7,
            flexShrink: 0,
            width: { sm: 220, md: 320, lg: 380 },
            maxWidth: 440,
            cursor: 'pointer',
            userSelect: 'none',
            border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
            boxShadow: isLight
              ? 'inset 0 1px 1.5px rgba(255,255,255,0.9), 0 2px 6px rgba(0,0,0,0.02)'
              : 'inset 0 1px 1.5px rgba(255,255,255,0.14), 0 2px 8px rgba(0,0,0,0.25)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              bgcolor: isLight ? 'rgba(255, 255, 255, 0.90)' : 'rgba(32, 42, 60, 0.65)',
              borderColor: isLight ? '#0E6245' : '#10B981',
              boxShadow: `0 0 0 2px ${isLight ? 'rgba(14, 98, 69, 0.15)' : 'rgba(16, 185, 129, 0.20)'}`,
            },
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 19, flexShrink: 0 }} />
          <Typography
            noWrap
            sx={{
              flex: 1,
              fontSize: '0.85rem',
              color: 'text.secondary',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              mr: 1,
            }}
          >
            Search expenses, groups...
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              bgcolor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.10)'}`,
              px: 1,
              py: 0.25,
              borderRadius: 1.5,
              fontSize: '0.7rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            ⌘K
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 16 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          {/* Mobile Search Button */}
          <Tooltip title="Search">
            <IconButton
              onClick={() => setSearchOpen(true)}
              sx={{
                display: { xs: 'flex', sm: 'none' },
                bgcolor: isLight ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'}`,
                p: 1,
              }}
            >
              <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            </IconButton>
          </Tooltip>

          {/* Product Tour Launcher (Sleek Glass Pill) */}
          <Tooltip title="Interactive Product Tour (with Auto-Play Walkthrough)">
            <Box
              onClick={() => startTour(0, true)}
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1.1,
                px: 1.6,
                py: 0.65,
                borderRadius: 9999,
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.10)'}`,
                bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(14px)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  borderColor: isLight ? '#0E6245' : '#10B981',
                  bgcolor: isLight ? 'rgba(14, 98, 69, 0.06)' : 'rgba(16, 185, 129, 0.08)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <SportsEsportsOutlined sx={{ fontSize: 17, color: isLight ? '#0E6245' : '#34D399' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: isLight ? '#0E6245' : '#34D399' }}>
                Product Tour
              </Typography>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                }}
              />
            </Box>
          </Tooltip>

          {/* FairScore & Streak Badge (Tertiary Glass Pill) */}
          <Tooltip title="FairScore: 880 (Diamond Tier) • 14-day streak">
            <Box
              data-tour="fairscore-badge"
              onClick={() => router.push('/fairscore')}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1.25,
                px: 1.75,
                py: 0.6,
                borderRadius: 9999,
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.10)'}`,
                bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(14px)',
                boxShadow: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  borderColor: isLight ? '#0E6245' : '#10b981',
                  bgcolor: isLight ? 'rgba(14, 98, 69, 0.06)' : 'rgba(16, 185, 129, 0.08)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <Typography variant="caption" sx={{ color: isLight ? '#0E6245' : '#34d399', fontWeight: 700 }}>
                ⭐ 880
              </Typography>
              <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                🔥 14d
              </Typography>
            </Box>
          </Tooltip>

          {/* Theme Toggle (Glass Circle) */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton
              onClick={toggleTheme}
              sx={{
                bgcolor: isLight ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'}`,
                backdropFilter: 'blur(12px)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: isLight ? 'rgba(255, 255, 255, 0.90)' : 'rgba(255, 255, 255, 0.10)',
                  borderColor: isLight ? '#0E6245' : 'rgba(255, 255, 255, 0.20)',
                },
              }}
            >
              {mode === 'dark' ? (
                <LightModeIcon sx={{ color: '#fbbf24', fontSize: 20 }} />
              ) : (
                <DarkModeIcon sx={{ color: '#64748b', fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Notifications (Glass Circle) */}
          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotifOpen}
              sx={{
                bgcolor: isLight ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'}`,
                backdropFilter: 'blur(12px)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: isLight ? 'rgba(255, 255, 255, 0.90)' : 'rgba(255, 255, 255, 0.10)',
                  borderColor: isLight ? '#0E6245' : 'rgba(255, 255, 255, 0.20)',
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    height: 18,
                    minWidth: 18,
                    fontWeight: 700,
                  },
                }}
              >
                <NotificationsIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="Account">
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                ml: 0.5,
                p: 0.4,
                borderRadius: 9999,
                border: `1.5px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'}`,
                bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  borderColor: isLight ? '#0E6245' : '#10b981',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                },
              }}
            >
              <Avatar
                src={profile?.avatarUrl || undefined}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: isLight ? '#0E6245' : theme.palette.primary.main,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Redesigned Big Tech SaaS Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                mt: 1.5,
                minWidth: 270,
                borderRadius: 3.5,
                p: 1,
                bgcolor: isLight ? '#FFFFFF' : '#0E131F',
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.09)'}`,
                boxShadow: isLight
                  ? '0 16px 36px -4px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.05)'
                  : '0 24px 48px -6px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
              },
            },
          }}
        >
          {/* Account Profile Header */}
          <Box sx={{ p: 1.5, pb: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Avatar
                src={profile?.avatarUrl || undefined}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: isLight ? '#0E6245' : theme.palette.primary.main,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  border: `2px solid ${isLight ? '#0E6245' : '#10b981'}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
              >
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={750} noWrap sx={{ fontSize: '0.9rem', color: 'text.primary', lineHeight: 1.2 }}>
                  {profile?.name || 'User'}
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    display: 'block',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    color: isLight ? '#0E6245' : '#34D399',
                    mt: 0.25,
                  }}
                >
                  @{profile?.username || profile?.email?.split('@')[0] || 'member'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '0.72rem', opacity: 0.85 }}>
                  {profile?.email || ''}
                </Typography>
              </Box>
            </Box>

            {/* Plan / Workspace Status Chip */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.25,
                py: 0.6,
                borderRadius: 2,
                bgcolor: isLight ? 'rgba(14, 98, 69, 0.06)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.15)' : 'rgba(52, 211, 153, 0.2)'}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.68rem', color: isLight ? '#0E6245' : '#34D399' }}>
                  Personal Account
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                FairShare Free
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 0.5, borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)' }} />

          <MenuItem
            onClick={() => { handleMenuClose(); router.push('/settings'); }}
            sx={{
              borderRadius: 2,
              my: 0.35,
              py: 0.85,
              px: 1.5,
              '&:hover': { bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)' },
            }}
          >
            <ListItemIcon><PersonIcon fontSize="small" sx={{ color: isLight ? '#0E6245' : '#34D399' }} /></ListItemIcon>
            <ListItemText
              primary="Profile & Identity"
              primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 600 }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => { handleMenuClose(); router.push('/settings'); }}
            sx={{
              borderRadius: 2,
              my: 0.35,
              py: 0.85,
              px: 1.5,
              '&:hover': { bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)' },
            }}
          >
            <ListItemIcon><SettingsIcon fontSize="small" sx={{ color: isLight ? '#0E6245' : '#34D399' }} /></ListItemIcon>
            <ListItemText
              primary="Account Settings"
              primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 600 }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => { handleMenuClose(); router.push('/reports'); }}
            sx={{
              borderRadius: 2,
              my: 0.35,
              py: 0.85,
              px: 1.5,
              '&:hover': { bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)' },
            }}
          >
            <ListItemIcon><AssessmentIcon fontSize="small" sx={{ color: isLight ? '#0E6245' : '#34D399' }} /></ListItemIcon>
            <ListItemText
              primary="Reports & Exports"
              primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 600 }}
            />
          </MenuItem>

          {(profile as any)?.isAdmin && (
            <MenuItem
              onClick={() => { handleMenuClose(); router.push('/admin'); }}
              sx={{
                borderRadius: 2,
                my: 0.35,
                py: 0.85,
                px: 1.5,
                '&:hover': { bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)' },
              }}
            >
              <ListItemIcon><AdminIcon fontSize="small" sx={{ color: isLight ? '#0E6245' : '#34D399' }} /></ListItemIcon>
              <ListItemText
                primary="Admin Console"
                primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 600 }}
              />
            </MenuItem>
          )}

          <Divider sx={{ my: 0.5, borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)' }} />

          <MenuItem
            onClick={() => { handleMenuClose(); startTour(0, true); }}
            sx={{
              borderRadius: 2,
              my: 0.35,
              py: 0.85,
              px: 1.5,
              '&:hover': { bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)' },
            }}
          >
            <ListItemIcon><SportsEsportsOutlined fontSize="small" sx={{ color: isLight ? '#0E6245' : '#34D399' }} /></ListItemIcon>
            <ListItemText
              primary="Interactive Product Tour"
              secondary="Auto-play walkthrough of real features"
              primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: '0.7rem' }}
            />
          </MenuItem>

          <Divider sx={{ my: 0.5, borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)' }} />

          <MenuItem
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              my: 0.35,
              py: 0.85,
              px: 1.5,
              color: 'error.main',
              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) },
            }}
          >
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText
              primary="Sign Out"
              primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 700 }}
            />
          </MenuItem>
        </Menu>

        {/* Notifications Dropdown (Crisp Solid Surface - No Blur Distortion) */}
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                mt: 1.5,
                width: { xs: 320, sm: 380 },
                maxHeight: 480,
                borderRadius: 3.5,
                bgcolor: isLight ? '#FFFFFF' : '#0E131F',
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.09)'}`,
                boxShadow: isLight
                  ? '0 16px 36px -4px rgba(15, 23, 42, 0.12)'
                  : '0 24px 48px -6px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06)',
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
              py: 1.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'}`,
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
          <Box sx={{ p: 1.25, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Button
              size="small"
              fullWidth
              variant="contained"
              className="glass-emerald-active"
              onClick={() => {
                handleNotifClose();
                router.push('/notifications');
              }}
              sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'none', py: 0.6 }}
            >
              View All Notifications
            </Button>
            <Button
              size="small"
              fullWidth
              onClick={handleClearNotifs}
              sx={{ fontSize: '0.725rem', color: 'text.secondary', textTransform: 'none', py: 0.4 }}
            >
              Clear all notifications
            </Button>
          </Box>
        </Menu>
      </Toolbar>

      {/* Elastic Command Palette / Global Search Modal */}
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </AppBar>
  );
}
