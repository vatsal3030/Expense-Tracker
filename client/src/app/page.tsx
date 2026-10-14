'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  Stack,
  Chip,
} from '@mui/material';
import {
  GroupWork as GroupIcon,
  TrendingUp as TrendingIcon,
  Receipt as ReceiptIcon,
  Savings as SavingsIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CurrencyExchange as CurrencyIcon,
  Notifications as NotifIcon,
} from '@mui/icons-material';
import { useAuth } from '@/providers/AuthProvider';

const features = [
  {
    icon: <GroupIcon sx={{ fontSize: 32 }} />,
    title: 'Group Splitting',
    desc: 'Split bills with friends, roommates, or travel buddies. Equal, percentage, or custom splits.',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
  },
  {
    icon: <TrendingIcon sx={{ fontSize: 32 }} />,
    title: 'Smart Analytics',
    desc: 'Visual dashboards with spending trends, category breakdowns, and monthly insights.',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
  },
  {
    icon: <ReceiptIcon sx={{ fontSize: 32 }} />,
    title: 'Receipt OCR',
    desc: 'Scan receipts and auto-fill expense details. No more manual entry.',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  },
  {
    icon: <SavingsIcon sx={{ fontSize: 32 }} />,
    title: 'Budget Planning',
    desc: 'Set budgets by category with smart alerts before you overspend.',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
  },
  {
    icon: <CurrencyIcon sx={{ fontSize: 32 }} />,
    title: 'Multi-Currency',
    desc: 'Real-time currency conversion. Track expenses in any currency worldwide.',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 32 }} />,
    title: 'Debt Simplification',
    desc: 'Smart algorithm minimizes the number of transactions needed to settle up.',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  },
  {
    icon: <NotifIcon sx={{ fontSize: 32 }} />,
    title: 'Smart Notifications',
    desc: 'Get notified about settlements, budget alerts, and recurring expenses.',
    gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 32 }} />,
    title: 'Bank-Level Security',
    desc: 'End-to-end encryption, JWT auth, and industry-standard security practices.',
    gradient: 'linear-gradient(135deg, #14b8a6, #5eead4)',
  },
];

export default function LandingPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 10, md: 16 },
          pb: { xs: 10, md: 14 },
        }}
      >
        {/* Gradient blobs */}
        <Box
          sx={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            top: -200,
            right: -200,
            filter: 'blur(40px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
            bottom: -100,
            left: -100,
            filter: 'blur(40px)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Nav */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: { xs: 8, md: 12 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                }}
              >
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>F</Typography>
              </Box>
              <Typography variant="h5" fontWeight={800}>
                FairShare
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={() => router.push('/auth/login')}
                sx={{ borderRadius: 3 }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                onClick={() => router.push('/auth/signup')}
                sx={{ borderRadius: 3 }}
              >
                Get Started — Free
              </Button>
            </Stack>
          </Box>

          {/* Hero Content */}
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
            <Chip
              label="✨ 100% Free — No Premium Needed"
              sx={{
                mb: 3,
                fontWeight: 600,
                background: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                fontSize: '0.85rem',
                height: 36,
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                fontWeight: 900,
                lineHeight: 1.1,
                mb: 3,
                letterSpacing: '-0.03em',
              }}
            >
              Split expenses,{' '}
              <Box
                component="span"
                className="gradient-text"
              >
                not friendships.
              </Box>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: 'auto', mb: 5, fontWeight: 400, lineHeight: 1.7 }}
            >
              Track shared expenses, settle debts with one tap, and get AI-powered spending insights.
              All the features others charge for — completely free.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/auth/signup')}
                sx={{
                  px: 5,
                  py: 1.5,
                  fontSize: '1.05rem',
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(99,102,241,0.45)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Start Splitting for Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ px: 5, py: 1.5, fontSize: '1.05rem', borderRadius: 4, borderWidth: 2 }}
              >
                See How It Works
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>
            Everything you need.{' '}
            <Box component="span" className="gradient-text">Nothing you don&apos;t.</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            Premium features that competitors charge for — all included for free.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {features.map((f, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Card
                className="animate-fade-in stagger-item"
                sx={{
                  height: '100%',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      background: f.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2.5,
                      color: '#fff',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                    {f.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          py: 4,
          borderTop: `1px solid ${theme.palette.divider}`,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2026 FairShare. Built with ❤️ by Vatsal. Open Source & Free Forever.
        </Typography>
      </Box>
    </Box>
  );
}
