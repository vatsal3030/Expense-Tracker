'use client';

import React from 'react';
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
  Chip,
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
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import BrandLogo from '@/components/brand/BrandLogo';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 76;

interface NavItem {
  label: string;
  icon: React.ReactElement;
  path: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'MAIN MENU',
    items: [
      { label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 20 }} />, path: '/dashboard' },
      { label: 'Expenses', icon: <ExpenseIcon sx={{ fontSize: 20 }} />, path: '/expenses' },
      { label: 'Groups', icon: <GroupIcon sx={{ fontSize: 20 }} />, path: '/groups' },
      { label: 'Analytics', icon: <AnalyticsIcon sx={{ fontSize: 20 }} />, path: '/analytics' },
      { label: 'FairScore', icon: <FairScoreIcon sx={{ fontSize: 20 }} />, path: '/fairscore', badge: 'PRO' },
    ],
  },
  {
    title: 'FINANCES',
    items: [
      { label: 'Settlements', icon: <SettlementIcon sx={{ fontSize: 20 }} />, path: '/settlements' },
      { label: 'Budgets', icon: <BudgetIcon sx={{ fontSize: 20 }} />, path: '/budgets' },
    ],
  },
  {
    title: 'CONNECTIONS',
    items: [
      { label: 'Friends', icon: <FriendsIcon sx={{ fontSize: 20 }} />, path: '/friends' },
      { label: 'Activity', icon: <ActivityIcon sx={{ fontSize: 20 }} />, path: '/activity' },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', icon: <SettingsIcon sx={{ fontSize: 20 }} />, path: '/settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { profile } = useAuth();

  const isLight = theme.palette.mode === 'light';
  const drawerWidth = collapsed && !isMobile ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'transparent',
        position: 'relative',
      }}
    >
      {/* Specular Edge Line */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: isLight
            ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Brand Header */}
      <Box
        sx={{
          px: collapsed && !isMobile ? 1.5 : 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          minHeight: 68,
          borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
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
              color: 'text.secondary',
              p: 0.5,
              borderRadius: 2,
              bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)'}`,
              '&:hover': {
                bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                color: isLight ? '#0E6245' : '#34D399',
                borderColor: isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(16, 185, 129, 0.3)',
              },
            }}
          >
            {collapsed ? <ExpandIcon sx={{ fontSize: 18 }} /> : <CollapseIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        )}
      </Box>

      {/* Navigation Groups */}
      <Box sx={{ flex: 1, py: 1.5, overflowY: 'auto', overflowX: 'hidden' }}>
        {navSections.map((section, sIdx) => (
          <Box key={section.title} sx={{ mb: 1.5 }}>
            {(!collapsed || isMobile) && (
              <Typography
                variant="caption"
                sx={{
                  px: 2.5,
                  pt: sIdx === 0 ? 0.5 : 1.5,
                  pb: 0.5,
                  display: 'block',
                  fontSize: '0.675rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: isLight ? '#9CA3AF' : '#6B7280',
                  textTransform: 'uppercase',
                }}
              >
                {section.title}
              </Typography>
            )}

            <List disablePadding sx={{ px: collapsed && !isMobile ? 1 : 1.5 }}>
              {section.items.map((item) => {
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
                      onClick={() => {
                        if (isMobile) onClose();
                      }}
                      sx={{
                        minHeight: 42,
                        px: collapsed && !isMobile ? 1.5 : 1.75,
                        my: 0.25,
                        borderRadius: 2.5,
                        justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                        bgcolor: active
                          ? isLight
                            ? 'rgba(0, 0, 0, 0.05)'
                            : 'rgba(255, 255, 255, 0.08)'
                          : 'transparent',
                        color: active
                          ? isLight
                            ? '#0E6245'
                            : '#F8FAFC'
                          : 'text.secondary',
                        border: active
                          ? `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'}`
                          : '1px solid transparent',
                        boxShadow: active
                          ? isLight
                            ? 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 1px 3px rgba(0, 0, 0, 0.04)'
                            : 'inset 0 1px 1px rgba(255, 255, 255, 0.14), 0 2px 6px rgba(0, 0, 0, 0.25)'
                          : 'none',
                        backdropFilter: active ? 'blur(14px)' : 'none',
                        '&:hover': {
                          bgcolor: active
                            ? isLight
                              ? 'rgba(0, 0, 0, 0.07)'
                              : 'rgba(255, 255, 255, 0.12)'
                            : isLight
                            ? 'rgba(0, 0, 0, 0.03)'
                            : 'rgba(255, 255, 255, 0.04)',
                          color: active
                            ? isLight
                              ? '#0E6245'
                              : '#F8FAFC'
                            : 'text.primary',
                        },
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed && !isMobile ? 0 : 36,
                          justifyContent: 'center',
                          color: 'inherit',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>

                      {(!collapsed || isMobile) && (
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography
                                sx={{
                                  fontWeight: active ? 600 : 500,
                                  fontSize: '0.85rem',
                                  color: 'inherit',
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                {item.label}
                              </Typography>
                              {item.badge && (
                                <Chip
                                  label={item.badge}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.625rem',
                                    fontWeight: 700,
                                    bgcolor: isLight ? 'rgba(14, 98, 69, 0.1)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isLight ? '#0E6245' : '#10B981',
                                    borderRadius: 1,
                                    px: 0.5,
                                  }}
                                />
                              )}
                            </Box>
                          }
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Settings & Bottom Items */}
      <Box sx={{ p: collapsed && !isMobile ? 1 : 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        <List disablePadding>
          {bottomNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItemButton
                key={item.path}
                component={Link}
                href={item.path}
                prefetch={true}
                onClick={() => {
                  if (isMobile) onClose();
                }}
                sx={{
                  minHeight: 40,
                  px: collapsed && !isMobile ? 1.5 : 1.75,
                  borderRadius: 2.5,
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                  color: active
                    ? isLight
                      ? '#0E6245'
                      : '#F8FAFC'
                    : 'text.secondary',
                  bgcolor: active
                    ? isLight
                      ? 'rgba(0, 0, 0, 0.05)'
                      : 'rgba(255, 255, 255, 0.08)'
                    : 'transparent',
                  border: active
                    ? `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'}`
                    : '1px solid transparent',
                  boxShadow: active
                    ? isLight
                      ? 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 1px 3px rgba(0, 0, 0, 0.04)'
                      : 'inset 0 1px 1px rgba(255, 255, 255, 0.14), 0 2px 6px rgba(0, 0, 0, 0.25)'
                    : 'none',
                  '&:hover': {
                    bgcolor: active
                      ? isLight
                        ? 'rgba(0, 0, 0, 0.07)'
                        : 'rgba(255, 255, 255, 0.12)'
                      : isLight
                      ? 'rgba(0, 0, 0, 0.03)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: active ? (isLight ? '#0E6245' : '#F8FAFC') : 'text.primary',
                  },
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed && !isMobile ? 0 : 36,
                    justifyContent: 'center',
                    color: 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {(!collapsed || isMobile) && (
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: active ? 600 : 500, fontSize: '0.85rem', color: 'inherit' }}>
                        {item.label}
                      </Typography>
                    }
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>

        {/* User Card */}
        {(!collapsed || isMobile) && (
          <Box
            component={Link}
            href="/settings"
            prefetch={true}
            onClick={() => { if (isMobile) onClose(); }}
            sx={{
              mt: 1,
              p: 1.25,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              textDecoration: 'none',
              bgcolor: isLight ? 'rgba(255, 255, 255, 0.65)' : 'rgba(20, 26, 38, 0.45)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.10)'}`,
              boxShadow: isLight
                ? 'inset 0 1px 1.5px rgba(255, 255, 255, 0.95), 0 2px 8px rgba(0, 0, 0, 0.03)'
                : 'inset 0 1px 1.5px rgba(255, 255, 255, 0.14), 0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                borderColor: isLight ? '#0E6245' : 'rgba(16, 185, 129, 0.35)',
                bgcolor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(26, 34, 48, 0.60)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            <Avatar
              src={profile?.avatarUrl || undefined}
              sx={{
                width: 32,
                height: 32,
                bgcolor: isLight ? '#0E6245' : '#10B981',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: `1.5px solid ${isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(16, 185, 129, 0.4)'}`,
              }}
            >
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {profile?.name || 'User'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isLight ? '#0E6245' : '#34D399',
                  fontWeight: 600,
                  fontSize: '0.675rem',
                  display: 'block',
                }}
              >
                Free SaaS Tier
              </Typography>
            </Box>
          </Box>
        )}
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
