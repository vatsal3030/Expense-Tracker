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

  const isLight = theme.palette.mode === 'light';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', position: 'relative', overflowX: 'hidden' }}>
      {/* Sophisticated Apple FinTech Atmospheric Canvas */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
          background: isLight
            ? `
                radial-gradient(ellipse 1100px 700px at 85% -5%, rgba(14, 98, 69, 0.035) 0%, transparent 65%),
                radial-gradient(ellipse 1000px 800px at 15% 105%, rgba(148, 163, 184, 0.08) 0%, transparent 70%)
              `
            : `
                radial-gradient(ellipse 1100px 700px at 85% -5%, rgba(16, 185, 129, 0.05) 0%, transparent 65%),
                radial-gradient(ellipse 1000px 800px at 15% 105%, rgba(30, 41, 59, 0.15) 0%, transparent 70%)
              `,
        }}
      />

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
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          mt: { xs: '68px', sm: '86px' },
          p: { xs: 1.25, sm: 2.5, md: 3 },
          pb: { xs: '140px', sm: '100px', md: 4 },
          maxWidth: '100vw',
          overflowX: 'hidden',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          minHeight: 'calc(100vh - 86px)',
        }}
      >
        {children}
      </Box>

      {/* PWA Mobile Bottom Navigation */}
      <MobileBottomNav />
    </Box>
  );
}
