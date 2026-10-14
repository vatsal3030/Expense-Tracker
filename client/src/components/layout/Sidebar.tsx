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
        bgcolor: isLight ? '#FFFFFF' : '#0B0C0E',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          px: collapsed && !isMobile ? 1.5 : 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          minHeight: 68,
          borderBottom: `1px solid ${theme.palette.divider}`,
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
              '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.05), color: 'text.primary' },
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
                            ? 'rgba(14, 98, 69, 0.08)' // Soft mint/sage pill (Bonsai style)
                            : 'rgba(16, 185, 129, 0.12)'
                          : 'transparent',
                        color: active
                          ? isLight
                            ? '#0E6245' // Deep forest green
                            : '#10B981'
                          : 'text.secondary',
                        border: active
                          ? `1px solid ${isLight ? 'rgba(14, 98, 69, 0.15)' : 'rgba(16, 185, 129, 0.25)'}`
                          : '1px solid transparent',
                        '&:hover': {
                          bgcolor: active
                            ? isLight
                              ? 'rgba(14, 98, 69, 0.12)'
                              : 'rgba(16, 185, 129, 0.16)'
                            : isLight
                            ? '#F4F5F7'
                            : 'rgba(255, 255, 255, 0.04)',
                          color: active
                            ? isLight
                              ? '#0E6245'
                              : '#10B981'
                            : 'text.primary',
                        },
                        transition: 'all 0.15s ease',
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
                      : '#10B981'
                    : 'text.secondary',
                  bgcolor: active
                    ? isLight
                      ? 'rgba(14, 98, 69, 0.08)'
                      : 'rgba(16, 185, 129, 0.12)'
                    : 'transparent',
                  '&:hover': {
                    bgcolor: isLight ? '#F4F5F7' : 'rgba(255, 255, 255, 0.04)',
                    color: 'text.primary',
                  },
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
              bgcolor: isLight ? '#F9FAFB' : '#121316',
              border: `1px solid ${isLight ? '#EAECF0' : '#1D1F24'}`,
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: isLight ? '#D0D5DD' : '#2A2D35',
                bgcolor: isLight ? '#F4F5F7' : '#16181D',
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
                  color: isLight ? '#0E6245' : '#10B981',
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
