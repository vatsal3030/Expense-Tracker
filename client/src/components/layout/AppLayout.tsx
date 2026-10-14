'use client';

import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar, { DRAWER_WIDTH, DRAWER_COLLAPSED_WIDTH } from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import { useAuth } from '@/providers/AuthProvider';
import CategoryCycleLoader from '@/components/common/CategoryCycleLoader';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`;
      router.push(redirectUrl);
    }
  }, [user?.id, loading, pathname, router]);

  // While auth session is restoring from Supabase, show the animated category loader
  if (loading) {
    return <CategoryCycleLoader fullPage={true} />;
  }

  // If unauthenticated, keep showing loader while redirect finishes
  if (!user) {
    return <CategoryCycleLoader fullPage={true} message="Authenticating session..." />;
  }

  const drawerWidth = collapsed && !isMobile ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <Header
        onMenuToggle={() => setMobileOpen(!mobileOpen)}
        drawerWidth={drawerWidth}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          mt: { xs: '64px', sm: '70px' },
          p: { xs: 2, sm: 3 },
          pb: { xs: '84px', md: 3 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          minHeight: 'calc(100vh - 70px)',
        }}
      >
        {children}
      </Box>

      {/* PWA Mobile Bottom Navigation */}
      <MobileBottomNav />
    </Box>
  );
}
