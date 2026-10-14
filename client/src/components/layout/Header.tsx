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
} from '@mui/icons-material';
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
                border: '1px solid #1e293b',
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
            <IconButton>
              <Badge
                badgeContent={3}
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
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); router.push('/settings'); }}>
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText>Sign Out</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
