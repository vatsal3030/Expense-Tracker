'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, keyframes, useTheme, alpha } from '@mui/material';
import {
  AttachMoney,
  Restaurant,
  Flight,
  Home,
  ShoppingCart,
  Movie,
  Bolt,
  CreditCard,
  AccountBalanceWallet,
} from '@mui/icons-material';

const pulseGlow = keyframes`
  0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { transform: scale(1.04); box-shadow: 0 0 24px 6px rgba(16, 185, 129, 0.25); }
  100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
`;

const iconPop = keyframes`
  0% { opacity: 0; transform: scale(0.7) rotate(-10deg); }
  60% { opacity: 1; transform: scale(1.12) rotate(4deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

interface CategoryItem {
  name: string;
  icon: React.ReactElement;
  color: string;
}

const CATEGORIES: CategoryItem[] = [
  { name: 'Splits & Cash', icon: <AttachMoney sx={{ fontSize: 32 }} />, color: '#10B981' },
  { name: 'Dining & Cafes', icon: <Restaurant sx={{ fontSize: 32 }} />, color: '#F59E0B' },
  { name: 'Trips & Travel', icon: <Flight sx={{ fontSize: 32 }} />, color: '#0EA5E9' },
  { name: 'Rent & Living', icon: <Home sx={{ fontSize: 32 }} />, color: '#8B5CF6' },
  { name: 'Groceries', icon: <ShoppingCart sx={{ fontSize: 32 }} />, color: '#10B981' },
  { name: 'Entertainment', icon: <Movie sx={{ fontSize: 32 }} />, color: '#EC4899' },
  { name: 'Bills & Utilities', icon: <Bolt sx={{ fontSize: 32 }} />, color: '#EAB308' },
  { name: 'Cards & Settle', icon: <CreditCard sx={{ fontSize: 32 }} />, color: '#06B6D4' },
];

const MESSAGES = [
  'Balancing group ledgers...',
  'Minimizing transaction paths...',
  'Calculating fair splits...',
  'Syncing debt simplifications...',
  'Ensuring zero-sum balance...',
];

interface CategoryCycleLoaderProps {
  fullPage?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryCycleLoader({
  fullPage = false,
  message,
  size = 'md',
}: CategoryCycleLoaderProps) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const iconInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % CATEGORIES.length);
    }, 450);

    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1800);

    return () => {
      clearInterval(iconInterval);
      clearInterval(msgInterval);
    };
  }, []);

  const current = CATEGORIES[index];
  const currentMsg = message || MESSAGES[msgIndex];

  const circleSize = size === 'sm' ? 48 : size === 'lg' ? 84 : 64;
  const iconScale = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : 1;

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        textAlign: 'center',
      }}
    >
      {/* Outer Cycling Ring */}
      <Box
        sx={{
          position: 'relative',
          width: circleSize,
          height: circleSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {/* Glow backdrop */}
        <Box
          sx={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            bgcolor: alpha(current.color, 0.15),
            animation: `${pulseGlow} 1.6s ease-in-out infinite`,
          }}
        />

        {/* Main Icon Orb */}
        <Box
          key={index}
          sx={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            bgcolor: theme.palette.mode === 'dark' ? '#16181F' : '#ffffff',
            border: `1.5px solid ${alpha(current.color, 0.5)}`,
            boxShadow: `0 8px 24px ${alpha(current.color, 0.25)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: current.color,
            animation: `${iconPop} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
            transform: `scale(${iconScale})`,
            zIndex: 1,
          }}
        >
          {current.icon}
        </Box>

        {/* Floating Mini Category Badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -6,
            right: -6,
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: current.color,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            zIndex: 2,
            border: `2px solid ${theme.palette.background.paper}`,
          }}
        >
          <AccountBalanceWallet sx={{ fontSize: 12 }} />
        </Box>
      </Box>

      {/* Dynamic Animated Status Text */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          color: theme.palette.text.primary,
          fontSize: size === 'sm' ? '0.8rem' : '0.925rem',
          letterSpacing: '-0.01em',
          transition: 'all 0.2s ease',
        }}
      >
        {currentMsg}
      </Typography>

      {/* Active Category Subtitle */}
      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          color: current.color,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontSize: '0.7rem',
          transition: 'color 0.3s ease',
        }}
      >
        {current.name}
      </Typography>

      {/* Subtle Progress Bar Shimmer */}
      <Box
        sx={{
          mt: 2,
          width: 120,
          height: 3,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.divider, 0.6),
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent, ${current.color}, transparent)`,
            backgroundSize: '200% 100%',
            animation: `${shimmer} 1.2s infinite linear`,
          }}
        />
      </Box>
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
}
