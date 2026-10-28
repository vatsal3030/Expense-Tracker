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
  AdminPanelSettings as AdminIcon,
  Repeat as RecurringIcon,
  CurrencyExchange as CurrencyIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import BrandLogo from '@/components/brand/BrandLogo';

// Persistent scroll memory for the sidebar across route changes
let globalSidebarScrollTop = 0;

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
      { label: 'Recurring', icon: <RecurringIcon sx={{ fontSize: 20 }} />, path: '/recurring', badge: 'NEW' },
      { label: 'Currency', icon: <CurrencyIcon sx={{ fontSize: 20 }} />, path: '/currency' },
    ],
  },
  {
    title: 'CONNECTIONS',
    items: [
      { label: 'Friends', icon: <FriendsIcon sx={{ fontSize: 20 }} />, path: '/friends' },
      { label: 'Activity', icon: <ActivityIcon sx={{ fontSize: 20 }} />, path: '/activity' },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { label: 'Reports', icon: <ReportsIcon sx={{ fontSize: 20 }} />, path: '/reports' },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { label: 'Admin Portal', icon: <AdminIcon sx={{ fontSize: 20 }} />, path: '/admin', badge: 'OPS' },
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
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { profile } = useAuth();
  const isLight = theme.palette.mode === 'light';
  const drawerWidth = collapsed && !isMobile ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  const currentPath = pathname;

  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Restore scroll on navigation without jumping to top
  React.useEffect(() => {
    if (scrollContainerRef.current && globalSidebarScrollTop > 0) {
      scrollContainerRef.current.scrollTop = globalSidebarScrollTop;
    }
  }, [pathname]);

  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    globalSidebarScrollTop = e.currentTarget.scrollTop;
  };

  const isActive = (path: string) => {
    if (!currentPath) return false;
    if (currentPath === path) return true;
    if (path === '/dashboard') return false;
    return currentPath.startsWith(path + '/');
  };

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
        role="presentation"
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
          px: collapsed && !isMobile ? 1.25 : { xs: 1.5, sm: 2 },
          py: { xs: 1, sm: 1.25 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          minHeight: collapsed && !isMobile ? 56 : { xs: 52, sm: 56 },
          borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
        }}
      >
        <BrandLogo
          size={collapsed && !isMobile ? 'sm' : 'md'}
          showText={!collapsed || isMobile}
          asLink={true}
          href="/dashboard"
        />
        {!isMobile && (
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{
              color: 'text.secondary',
              p: 0.4,
              borderRadius: 1.75,
              bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)'}`,
              '&:hover': {
                bgcolor: isLight ? 'rgba(5, 150, 105, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                color: isLight ? '#059669' : '#34D399',
                borderColor: isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(16, 185, 129, 0.3)',
              },
            }}
          >
            {collapsed ? <ExpandIcon sx={{ fontSize: 16 }} /> : <CollapseIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        )}
      </Box>

      {/* Navigation Groups */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleSidebarScroll}
        data-tour="sidebar-nav"
        sx={{ flex: 1, py: { xs: 0.5, sm: 0.85 }, overflowY: 'auto', overflowX: 'hidden' }}
      >
        {navSections.map((section, sIdx) => (
          <Box key={section.title} sx={{ mb: { xs: 0.45, sm: 0.75 } }}>
            {(!collapsed || isMobile) && (
              <Typography
                variant="caption"
                sx={{
                  px: { xs: 1.75, sm: 2 },
                  pt: sIdx === 0 ? 0.25 : { xs: 0.6, sm: 0.8 },
                  pb: 0.2,
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

            <List disablePadding sx={{ px: collapsed && !isMobile ? 0.75 : { xs: 0.85, sm: 1.15 } }}>
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
                      scroll={false}
                      prefetch={true}
                      onMouseEnter={() => {
                        try {
                          router.prefetch(item.path);
                        } catch {}
                      }}
                      onClick={() => {
                        if (isMobile) onClose();
                      }}
                      sx={{
                        minHeight: { xs: 34, sm: 38 },
                        px: collapsed && !isMobile ? 1 : { xs: 1.15, sm: 1.4 },
                        py: { xs: 0.45, sm: 0.55 },
                        my: 0.18,
                        borderRadius: 2,
                        position: 'relative',
                        justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                        bgcolor: active
                          ? isLight
                            ? 'rgba(5, 150, 105, 0.08)'
                            : 'rgba(16, 185, 129, 0.14)'
                          : 'transparent',
                        color: active
                          ? isLight
                            ? '#059669'
                            : '#34D399'
                          : 'text.secondary',
                        border: active
                          ? `1px solid ${isLight ? 'rgba(5, 150, 105, 0.22)' : 'rgba(16, 185, 129, 0.32)'}`
                          : '1px solid transparent',
                        boxShadow: active
                          ? isLight
                            ? 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 1px 4px rgba(5, 150, 105, 0.06)'
                            : 'inset 0 1px 1px rgba(255, 255, 255, 0.14), 0 2px 8px rgba(16, 185, 129, 0.18)'
                          : 'none',
                        '&::before': active ? {
                          content: '""',
                          position: 'absolute',
                          left: 5,
                          width: 3,
                          height: 15,
                          borderRadius: 2,
                          bgcolor: isLight ? '#059669' : '#34D399',
                          boxShadow: isLight ? 'none' : '0 0 6px #10B981',
                        } : undefined,
                        '&:hover': {
                          bgcolor: active
                            ? isLight
                              ? 'rgba(5, 150, 105, 0.12)'
                              : 'rgba(16, 185, 129, 0.20)'
                            : isLight
                            ? 'rgba(0, 0, 0, 0.03)'
                            : 'rgba(255, 255, 255, 0.04)',
                          color: active
                            ? isLight
                              ? '#059669'
                              : '#34D399'
                            : isLight
                            ? '#1E293B'
                            : '#E2E8F0',
                        },
                        '&.Mui-focusVisible, &:focus-visible': {
                          outline: 'none',
                          bgcolor: active
                            ? (isLight ? 'rgba(5, 150, 105, 0.12)' : 'rgba(16, 185, 129, 0.20)')
                            : 'transparent',
                        },
                        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed && !isMobile ? 0 : { xs: 28, sm: 32 },
                          justifyContent: 'center',
                          color: active ? (isLight ? '#059669' : '#34D399') : 'inherit',
                          '& .MuiSvgIcon-root': { fontSize: { xs: 18, sm: 19 } },
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
                                  fontSize: { xs: '0.8rem', sm: '0.84rem' },
                                  color: 'inherit',
                                  letterSpacing: '-0.01em',
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {item.label}
                              </Typography>
                              {item.badge && (
                                <Chip
                                  label={item.badge}
                                  size="small"
                                  sx={{
                                    height: { xs: 15, sm: 16 },
                                    fontSize: { xs: '0.55rem', sm: '0.6rem' },
                                    fontWeight: 700,
                                    bgcolor: isLight ? 'rgba(5, 150, 105, 0.1)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isLight ? '#059669' : '#10B981',
                                    borderRadius: 1,
                                    px: 0.4,
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
      <Box sx={{ p: collapsed && !isMobile ? 0.75 : { xs: 0.75, sm: 1 }, borderTop: `1px solid ${theme.palette.divider}` }}>
        <List disablePadding>
          {bottomNavItems
            .filter((item) => item.path !== '/admin' || (profile as any)?.isAdmin)
            .map((item) => {
            const active = isActive(item.path);
            return (
              <ListItemButton
                key={item.path}
                component={Link}
                href={item.path}
                scroll={false}
                prefetch={true}
                onMouseEnter={() => {
                  try {
                    router.prefetch(item.path);
                  } catch {}
                }}
                onClick={() => {
                  if (isMobile) onClose();
                }}
                sx={{
                  minHeight: { xs: 34, sm: 38 },
                  px: collapsed && !isMobile ? 1 : { xs: 1.15, sm: 1.4 },
                  py: { xs: 0.45, sm: 0.55 },
                  my: 0.18,
                  borderRadius: 2,
                  position: 'relative',
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                  color: active
                    ? isLight
                      ? '#059669'
                      : '#34D399'
                    : 'text.secondary',
                  bgcolor: active
                    ? isLight
                      ? 'rgba(5, 150, 105, 0.08)'
                      : 'rgba(16, 185, 129, 0.14)'
                    : 'transparent',
                  border: active
                    ? `1px solid ${isLight ? 'rgba(5, 150, 105, 0.22)' : 'rgba(16, 185, 129, 0.32)'}`
                    : '1px solid transparent',
                  boxShadow: active
                    ? isLight
                      ? 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 1px 4px rgba(5, 150, 105, 0.06)'
                      : 'inset 0 1px 1px rgba(255, 255, 255, 0.14), 0 2px 8px rgba(16, 185, 129, 0.18)'
                    : 'none',
                  '&::before': active ? {
                    content: '""',
                    position: 'absolute',
                    left: 5,
                    width: 3,
                    height: 15,
                    borderRadius: 2,
                    bgcolor: isLight ? '#059669' : '#34D399',
                    boxShadow: isLight ? 'none' : '0 0 6px #10B981',
                  } : undefined,
                  '&:hover': {
                    bgcolor: active
                      ? isLight
                        ? 'rgba(5, 150, 105, 0.12)'
                        : 'rgba(16, 185, 129, 0.20)'
                      : isLight
                      ? 'rgba(0, 0, 0, 0.03)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: active ? (isLight ? '#059669' : '#34D399') : (isLight ? '#1E293B' : '#E2E8F0'),
                  },
                  '&.Mui-focusVisible, &:focus-visible': {
                    outline: 'none',
                    bgcolor: active
                      ? (isLight ? 'rgba(5, 150, 105, 0.12)' : 'rgba(16, 185, 129, 0.20)')
                      : 'transparent',
                  },
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed && !isMobile ? 0 : { xs: 26, sm: 30 },
                    justifyContent: 'center',
                    color: active ? (isLight ? '#059669' : '#34D399') : 'inherit',
                    '& .MuiSvgIcon-root': { fontSize: { xs: 17, sm: 18 } },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {(!collapsed || isMobile) && (
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: active ? 600 : 500, fontSize: { xs: '0.76rem', sm: '0.8125rem' }, color: 'inherit' }}>
                        {item.label}
                      </Typography>
                    }
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
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
          autoFocus={false}
          disableAutoFocus={true}
          disableEnforceFocus={true}
          ModalProps={{
            keepMounted: true,
            disableRestoreFocus: true,
            disableAutoFocus: true,
            disableEnforceFocus: true,
          }}
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
