'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Button, Typography, useTheme } from '@mui/material';

export default function CookieConsentBanner() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('fairshare_cookie_consent');
      if (!consent) {
        // Small delay so it appears smoothly after initial paint
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage may fail in private windows
    }
  }, []);

  const handleConsent = (status: 'accepted' | 'declined') => {
    try {
      localStorage.setItem('fairshare_cookie_consent', status);
    } catch {
      // Ignore storage errors
    }
    setVisible(false);
  };

  if (!visible) return null;

  const isLight = theme.palette.mode === 'light';

  return (
    <Box
      role="region"
      aria-label="Cookie consent banner"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1400,
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 1.75, sm: 1.5 },
        background: isLight
          ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.98) 100%)'
          : 'linear-gradient(180deg, rgba(13, 19, 33, 0.95) 0%, rgba(9, 13, 23, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.10)'}`,
        boxShadow: isLight
          ? '0 -8px 30px rgba(0, 0, 0, 0.06)'
          : '0 -10px 40px rgba(0, 0, 0, 0.60)',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 1.5, sm: 2 },
        animation: 'slideUpBanner 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        '@keyframes slideUpBanner': {
          from: { transform: 'translateY(100%)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: isLight ? '#334155' : '#94A3B8',
          fontSize: { xs: '0.815rem', sm: '0.875rem' },
          lineHeight: 1.55,
          fontWeight: 400,
          flex: 1,
        }}
      >
        We use cookies and essential local storage to keep your session secure, remember preferences, and analyze platform usage to provide the best expense-tracking experience.{' '}
        <Link
          href="/privacy"
          style={{
            color: isLight ? '#0E6245' : '#10B981',
            textDecoration: 'underline',
            fontWeight: 500,
          }}
        >
          Privacy Policy
        </Link>
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          flexShrink: 0,
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-end', sm: 'flex-end' },
        }}
      >
        <Button
          onClick={() => handleConsent('declined')}
          variant="outlined"
          size="small"
          sx={{
            textTransform: 'none',
            fontSize: '0.84rem',
            fontWeight: 600,
            borderRadius: '9999px',
            px: 2.25,
            py: 0.65,
            color: isLight ? '#475569' : '#CBD5E1',
            borderColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.18)',
            bgcolor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
            '&:hover': {
              borderColor: isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.35)',
              bgcolor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
            },
          }}
        >
          Decline
        </Button>

        <Button
          onClick={() => handleConsent('accepted')}
          variant="contained"
          size="small"
          sx={{
            textTransform: 'none',
            fontSize: '0.84rem',
            fontWeight: 600,
            borderRadius: '9999px',
            px: 2.75,
            py: 0.65,
            color: '#FFFFFF',
            bgcolor: isLight ? '#0E6245' : '#10B981',
            boxShadow: isLight
              ? '0 2px 8px rgba(14, 98, 69, 0.25)'
              : '0 2px 12px rgba(16, 185, 129, 0.35)',
            '&:hover': {
              bgcolor: isLight ? '#0b4f37' : '#059669',
              boxShadow: isLight
                ? '0 4px 14px rgba(14, 98, 69, 0.35)'
                : '0 4px 18px rgba(16, 185, 129, 0.45)',
            },
          }}
        >
          Accept
        </Button>
      </Box>
    </Box>
  );
}
