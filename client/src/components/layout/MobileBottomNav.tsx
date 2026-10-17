'use client';

import React from 'react';
import { Box, Paper, IconButton, Typography, useTheme, alpha } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Timeline as ActivityIcon,
  People as FriendsIcon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MobileBottomNav() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: <DashboardIcon sx={{ fontSize: 22 }} />, path: '/dashboard' },
    { label: 'Groups', icon: <GroupIcon sx={{ fontSize: 22 }} />, path: '/groups' },
    { label: 'Add', isAction: true },
    { label: 'Activity', icon: <ActivityIcon sx={{ fontSize: 22 }} />, path: '/activity' },
    { label: 'Friends', icon: <FriendsIcon sx={{ fontSize: 22 }} />, path: '/friends' },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    return pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        justifyContent: 'space-around',
        height: 64,
        px: 1,
        pb: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 1200,
        bgcolor: alpha(theme.palette.background.paper, 0.94),
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      {navItems.map((item, index) => {
        if (item.isAction) {
          return (
            <Box key={index} sx={{ position: 'relative', top: -14 }}>
              <IconButton
                component={Link}
                href="/expenses/new"
                prefetch={true}
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: 'primary.main',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                  border: `3px solid ${theme.palette.background.paper}`,
                  transition: 'transform 0.15s ease',
                  '&:active': { transform: 'scale(0.92)' },
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
                aria-label="Add expense"
              >
                <AddIcon sx={{ fontSize: 28 }} />
              </IconButton>
            </Box>
          );
        }

        const active = isActive(item.path);

        return (
          <Box
            key={item.label}
            component={Link}
            href={item.path || '/dashboard'}
            prefetch={true}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 0.8,
              px: { xs: 0.5, sm: 1.5 },
              borderRadius: 2,
              textDecoration: 'none',
              color: active ? 'primary.main' : 'text.secondary',
              transition: 'all 0.15s ease',
              '&:active': { transform: 'scale(0.95)' },
            }}
          >
            {item.icon}
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.68rem',
                fontWeight: active ? 700 : 500,
                mt: 0.3,
                letterSpacing: '-0.01em',
              }}
            >
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Paper>
  );
}
