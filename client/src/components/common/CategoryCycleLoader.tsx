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

// Smooth continuous orbital rotation for the outer halo ring
const orbitSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Gentle ambient pulse glow
const ambientBreathe = keyframes`
  0% { transform: scale(0.92); opacity: 0.25; }
  50% { transform: scale(1.08); opacity: 0.55; }
  100% { transform: scale(0.92); opacity: 0.25; }
`;

// Blinkit-style category item entrance: glide up from below with soft spring settle
const blinkitSlideUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(18px) scale(0.88);
  }
  60% {
    opacity: 1;
    transform: translateY(-2px) scale(1.03);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

// Smooth wave shimmer for progress indicator
const waveShimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

interface CategoryItem {
  name: string;
  icon: React.ReactElement;
  color: string;
  tagline: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    name: 'Splits & Cash',
    icon: <AttachMoney sx={{ fontSize: 34 }} />,
    color: '#10B981',
    tagline: 'Balancing equal & exact splits...',
  },
  {
    name: 'Dining & Cafes',
    icon: <Restaurant sx={{ fontSize: 34 }} />,
    color: '#F59E0B',
    tagline: 'Dividing meal tabs & tip bills...',
  },
  {
    name: 'Trips & Travel',
    icon: <Flight sx={{ fontSize: 34 }} />,
    color: '#0EA5E9',
    tagline: 'Minimizing flight & stay costs...',
  },
  {
    name: 'Rent & Living',
    icon: <Home sx={{ fontSize: 34 }} />,
    color: '#8B5CF6',
    tagline: 'Tracking shared apartment ledger...',
  },
  {
    name: 'Groceries & Mart',
    icon: <ShoppingCart sx={{ fontSize: 34 }} />,
    color: '#10B981',
    tagline: 'Zeroing cart & pantry splits...',
  },
  {
    name: 'Entertainment',
    icon: <Movie sx={{ fontSize: 34 }} />,
    color: '#EC4899',
    tagline: 'Settling movies & event passes...',
  },
  {
    name: 'Bills & Utilities',
    icon: <Bolt sx={{ fontSize: 34 }} />,
    color: '#EAB308',
    tagline: 'Syncing electricity & WiFi shares...',
  },
  {
    name: 'Cards & Settle',
    icon: <CreditCard sx={{ fontSize: 34 }} />,
    color: '#06B6D4',
    tagline: 'Generating zero-fee UPI links...',
  },
];

interface CategoryCycleLoaderProps {
  fullPage?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryCycleLoader({
  fullPage = true,
  message,
  size = 'md',
}: CategoryCycleLoaderProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [index, setIndex] = useState(0);

  // Calm, relaxed cadence (~2.6s per item) for smooth Blinkit-style flow
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % CATEGORIES.length);
    }, 2600);

    return () => clearInterval(timer);
  }, []);

  const current = CATEGORIES[index];
  const displayMessage = message || current.tagline;

  const circleSize = size === 'sm' ? 56 : size === 'lg' ? 92 : 72;

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: { xs: 4, sm: 6 },
        textAlign: 'center',
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
        overflow: 'visible',
      }}
    >
      {/* Outer Cycling Orb Container */}
      <Box
        sx={{
          position: 'relative',
          width: circleSize,
          height: circleSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.5,
          overflow: 'visible',
        }}
      >
        {/* Ambient colored background pulse */}
        <Box
          key={`glow-${index}`}
          sx={{
            position: 'absolute',
            inset: -14,
            borderRadius: '50%',
            bgcolor: alpha(current.color, isLight ? 0.20 : 0.28),
            filter: 'blur(16px)',
            animation: `${ambientBreathe} 2.6s ease-in-out infinite`,
            pointerEvents: 'none',
            transition: 'background-color 0.8s ease',
          }}
        />

        {/* Orbiting dashed border ring */}
        <Box
          sx={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: `2px dashed ${alpha(current.color, isLight ? 0.45 : 0.65)}`,
            animation: `${orbitSpin} 10s linear infinite`,
            pointerEvents: 'none',
            transition: 'border-color 0.6s ease',
          }}
        />

        {/* Main Central Icon Orb with smooth Blinkit glide transition */}
        <Box
          key={`orb-${index}`}
          sx={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            bgcolor: isLight ? '#FFFFFF' : '#121620',
            border: `2px solid ${alpha(current.color, isLight ? 0.5 : 0.7)}`,
            boxShadow: isLight
              ? `0 10px 28px -4px ${alpha(current.color, 0.35)}, inset 0 1px 0 rgba(255,255,255,1)`
              : `0 12px 32px -4px ${alpha(current.color, 0.45)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: current.color,
            animation: `${blinkitSlideUp} 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            zIndex: 1,
            transition: 'color 0.4s ease',
          }}
        >
          {current.icon}
        </Box>

        {/* Floating Mini Category Badge (Completely visible with solid border) */}
        <Box
          key={`badge-${index}`}
          sx={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: current.color,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
            zIndex: 3,
            border: `2px solid ${isLight ? '#FFFFFF' : '#0B0E14'}`,
            transition: 'background-color 0.5s ease',
            animation: `${blinkitSlideUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
          }}
        >
          <AccountBalanceWallet sx={{ fontSize: 13 }} />
        </Box>
      </Box>

      {/* Primary Animated Status Message */}
      <Typography
        key={`msg-${index}`}
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          color: theme.palette.text.primary,
          fontSize: { xs: '0.925rem', sm: '1.025rem' },
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
          minHeight: '1.5em',
          animation: `${blinkitSlideUp} 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        }}
      >
        {displayMessage}
      </Typography>

      {/* Active Category Chip / Pill */}
      <Box
        key={`chip-${index}`}
        sx={{
          mt: 1,
          px: 1.75,
          py: 0.4,
          borderRadius: 9999,
          bgcolor: alpha(current.color, isLight ? 0.12 : 0.16),
          border: `1px solid ${alpha(current.color, isLight ? 0.28 : 0.35)}`,
          display: 'inline-flex',
          alignItems: 'center',
          animation: `${blinkitSlideUp} 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: current.color,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '0.7rem',
          }}
        >
          {current.name}
        </Typography>
      </Box>

      {/* Dual-Color Wave Progress Bar (Full visibility with safe height & bottom clearance) */}
      <Box
        sx={{
          mt: 2.5,
          width: 140,
          height: 4,
          borderRadius: 9999,
          bgcolor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.10)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent 0%, ${current.color} 50%, transparent 100%)`,
            animation: `${waveShimmer} 1.8s ease-in-out infinite`,
            transition: 'background 0.5s ease',
          }}
        />
      </Box>
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100dvh',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: 9999,
          p: 2,
          overflow: 'hidden',
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {content}
    </Box>
  );
}
