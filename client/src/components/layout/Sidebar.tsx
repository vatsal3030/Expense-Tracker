'use client';

import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Avatar,
  Divider,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ExpenseIcon,
  Group as GroupIcon,
  AccountBalanceWallet as SettlementIcon,
  Savings as BudgetIcon,
  Timeline as ActivityIcon,
  People as FriendsIcon,
  Settings as SettingsIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Insights as AnalyticsIcon,
  EmojiEvents as FairScoreIcon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import BrandLogo from '@/components/brand/BrandLogo';

const DRAWER_WIDTH = 280;
const DRAWER_COLLAPSED_WIDTH = 80;

interface NavItem {
  label: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { label: 'FairScore', icon: <FairScoreIcon />, path: '/fairscore' },
  { label: 'Expenses', icon: <ExpenseIcon />, path: '/expenses' },
  { label: 'Groups', icon: <GroupIcon />, path: '/groups' },
  { label: 'Settlements', icon: <SettlementIcon />, path: '/settlements' },
  { label: 'Budgets', icon: <BudgetIcon />, path: '/budgets' },
  { label: 'Activity', icon: <ActivityIcon />, path: '/activity' },
  { label: 'Friends', icon: <FriendsIcon />, path: '/friends' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { profile } = useAuth();

  const drawerWidth = collapsed && !isMobile ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  const handleNavigate = (path: string) => {
    router.push(path);
    if (isMobile) onClose();
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Logo / Brand */}
      <Box
        sx={{
          p: collapsed && !isMobile ? 1.5 : 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          minHeight: 72,
        }}
      >
        <BrandLogo
          size={collapsed && !isMobile ? 'sm' : 'md'}
          showText={!collapsed || isMobile}
          asLink={false}
        />
        {!isMobile && (
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{
              ml: collapsed ? 0 : 'auto',
              mt: collapsed ? 1 : 0,
              color: 'text.secondary',
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected', color: 'primary.main' },
            }}
          >
            {collapsed ? <ExpandIcon fontSize="small" /> : <CollapseIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.5 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, py: 1.5, overflowY: 'auto', overflowX: 'hidden' }}>
        <List disablePadding>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Tooltip
                key={item.path}
                title={collapsed && !isMobile ? item.label : ''}
                placement="right"
                arrow
              >
                <ListItemButton
                  component={Link}
                  href={item.path}
                  prefetch={true}
                  onClick={() => { if (isMobile) onClose(); }}
                  sx={{
                    minHeight: 46,
                    px: collapsed && !isMobile ? 2.5 : 2.5,
                    mx: collapsed && !isMobile ? 1 : 1.5,
                    my: 0.3,
                    borderRadius: 2.5,
                    position: 'relative',
                    justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                    bgcolor: active
                      ? alpha(theme.palette.primary.main, 0.12)
                      : 'transparent',
                    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                    border: active ? `1px solid ${alpha(theme.palette.primary.main, 0.25)}` : '1px solid transparent',
                    '&:hover': {
                      bgcolor: active
                        ? alpha(theme.palette.primary.main, 0.16)
                        : alpha(theme.palette.action.hover, 0.08),
                      color: active ? theme.palette.primary.main : theme.palette.text.primary,
                      transform: 'translateX(2px)',
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed && !isMobile ? 0 : 44,
                      justifyContent: 'center',
                      color: 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {(!collapsed || isMobile) && (
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: active ? 600 : 500, fontSize: '0.9rem', color: 'inherit' }}>
                          {item.label}
                        </Typography>
                      }
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.5 }} />

      {/* Bottom Items */}
      <Box sx={{ py: 1 }}>
        <List disablePadding>
          {bottomNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Tooltip
                key={item.path}
                title={collapsed && !isMobile ? item.label : ''}
                placement="right"
                arrow
              >
                <ListItemButton
                  component={Link}
                  href={item.path}
                  prefetch={true}
                  onClick={() => { if (isMobile) onClose(); }}
                  sx={{
                    minHeight: 44,
                    px: collapsed && !isMobile ? 2.5 : 2.5,
                    mx: collapsed && !isMobile ? 1 : 1.5,
                    borderRadius: 2.5,
                    justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                    bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    border: active ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` : '1px solid transparent',
                    '&:hover': {
                      color: active ? theme.palette.primary.main : theme.palette.text.primary,
                      bgcolor: alpha(theme.palette.action.hover, 0.08),
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed && !isMobile ? 0 : 44,
                      justifyContent: 'center',
                      color: 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {(!collapsed || isMobile) && (
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: active ? 600 : 500, fontSize: '0.875rem', color: 'inherit' }}>
                          {item.label}
                        </Typography>
                      }
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* User Profile */}
      <Box
        sx={{
          p: collapsed && !isMobile ? 1.5 : 2,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            p: 1,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
          onClick={() => handleNavigate('/settings')}
        >
          <Avatar
            src={profile?.avatarUrl || undefined}
            sx={{
              width: 36,
              height: 36,
              bgcolor: theme.palette.primary.main,
              fontSize: '0.875rem',
            }}
          >
            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          {(!collapsed || isMobile) && (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {profile?.name || 'User'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                }}
              >
                {profile?.email || ''}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}

export { DRAWER_WIDTH, DRAWER_COLLAPSED_WIDTH };
