'use client';

import React from 'react';
import { Box, Typography, keyframes, useTheme, alpha } from '@mui/material';

const spinClockwise = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulseScale = keyframes`
  0% { transform: scale(0.97); }
  50% { transform: scale(1.03); }
  100% { transform: scale(0.97); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

interface CoinSplitLoaderProps {
  fullPage?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CoinSplitLoader({
  fullPage = false,
  message = 'Calculating fair splits...',
  size = 'md',
}: CoinSplitLoaderProps) {
  const theme = useTheme();

  const dimensions = {
    sm: { size: 44, stroke: 2.5, fontSize: '0.8rem' },
    md: { size: 68, stroke: 3, fontSize: '0.9rem' },
    lg: { size: 92, stroke: 3.5, fontSize: '1rem' },
  }[size];

  const primaryColor = theme.palette.mode === 'light' ? '#0E6245' : '#10B981';

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
      {/* Revolving Coin Glyph Container */}
      <Box
        sx={{
          position: 'relative',
          width: dimensions.size,
          height: dimensions.size,
          mb: 2.5,
          animation: `${pulseScale} 2s ease-in-out infinite`,
        }}
      >
        {/* Revolving Circulation Arrow Rings */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            animation: `${spinClockwise} 3s linear infinite`,
          }}
        >
          <svg
            width={dimensions.size}
            height={dimensions.size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Outer Curved Arrow */}
            <path
              d="M20 50C20 33.4315 33.4315 20 50 20C63.2 20 74.4 28.5 78.4 40.5"
              stroke={primaryColor}
              strokeWidth={dimensions.stroke}
              strokeLinecap="round"
            />
            <path
              d="M71 40L79 41L83 33"
              stroke={primaryColor}
              strokeWidth={dimensions.stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Bottom Outer Curved Arrow */}
            <path
              d="M80 50C80 66.5685 66.5685 80 50 80C36.8 80 25.6 71.5 21.6 59.5"
              stroke={primaryColor}
              strokeWidth={dimensions.stroke}
              strokeLinecap="round"
            />
            <path
              d="M29 60L21 59L17 67"
              stroke={primaryColor}
              strokeWidth={dimensions.stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>

        {/* Center Coin Glyph */}
        <Box
          sx={{
            position: 'absolute',
            inset: '16%',
            borderRadius: '50%',
            bgcolor: theme.palette.mode === 'light' ? '#FFFFFF' : '#121316',
            border: `2px solid ${alpha(primaryColor, 0.35)}`,
            boxShadow: `0 4px 16px ${alpha(primaryColor, 0.15)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="60%"
            height="60%"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Inner Coin Rim */}
            <circle
              cx="20"
              cy="20"
              r="17"
              stroke={primaryColor}
              strokeWidth="2.5"
              strokeDasharray="4 3"
            />
            {/* Central Currency Symbol */}
            <path
              d="M20 10V30M16 14C16 12.5 17.8 11.5 20 11.5C22.2 11.5 24 12.5 24 14C24 17 16 18 16 22C16 24 17.8 25.5 20 25.5C22.2 25.5 24 24 24 22"
              stroke={primaryColor}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </svg>
        </Box>
      </Box>

      {/* Trust Message */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          color: theme.palette.text.primary,
          fontSize: dimensions.fontSize,
          letterSpacing: '-0.01em',
        }}
      >
        {message}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          color: 'text.secondary',
          fontWeight: 500,
          fontSize: '0.72rem',
        }}
      >
        FairShare • Debt Simplification Engine
      </Typography>

      {/* Shimmer Line */}
      <Box
        sx={{
          mt: 2,
          width: 96,
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
            background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
            backgroundSize: '200% 100%',
            animation: `${shimmer} 1.4s infinite linear`,
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
