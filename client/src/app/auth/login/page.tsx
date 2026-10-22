'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Stack,
  Chip,
  Paper,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  EmailOutlined,
  LockOutlined,
  CheckCircle,
  SecurityOutlined,
  FlashOn,
  TrendingUp,
  ReceiptLong,
  ArrowForward,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import BrandLogo from '@/components/brand/BrandLogo';
import CategoryCycleLoader from '@/components/common/CategoryCycleLoader';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';
  const isVerified = searchParams.get('verified') === 'true';
  const isReset = searchParams.get('reset') === 'true';
  const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLight = theme.palette.mode === 'light';

  const getEffectiveRedirect = () => {
    if (redirectTarget && redirectTarget !== '/dashboard') return redirectTarget;
    try {
      const pendingInvite = typeof window !== 'undefined' ? localStorage.getItem('fairshare_pending_invite') : null;
      if (pendingInvite) return `/friends?invite=${pendingInvite}`;
    } catch {}
    return redirectTarget || '/dashboard';
  };

  useEffect(() => {
    if (!authLoading && user) {
      router.push(getEffectiveRedirect());
    }
  }, [user?.id, authLoading, router, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      router.push(getEffectiveRedirect());
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) setError(error);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: isLight ? '#F8FAFC' : '#070B11',
        overflow: 'hidden',
      }}
    >
      {/* LEFT FORM PANEL (Clean, High-Contrast SaaS Auth) */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '0 0 50%', lg: '0 0 46%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 5, md: 6, lg: 8 },
          position: 'relative',
          overflowY: 'auto',
          zIndex: 2,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Header Brand Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <BrandLogo size="md" asLink={false} />
            <Chip
              label="v2.4 Production"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.1)',
                color: isLight ? '#0E6245' : '#34D399',
                border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(52, 211, 153, 0.25)'}`,
                borderRadius: 1.5,
              }}
            />
          </Box>

          {/* Heading */}
          <Box sx={{ mb: 3.5 }}>
            <Typography
              variant="h4"
              fontWeight={850}
              sx={{
                fontSize: { xs: '1.65rem', sm: '1.95rem' },
                letterSpacing: '-0.03em',
                color: 'text.primary',
                lineHeight: 1.2,
                mb: 1,
              }}
            >
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
              Sign in to manage groups, split expenses, and settle balances seamlessly with your circle.
            </Typography>
          </Box>

          {/* Verification & Reset Banners */}
          {isVerified && (
            <Alert
              icon={<CheckCircle fontSize="inherit" />}
              severity="success"
              sx={{ mb: 2.5, borderRadius: 2.5, fontSize: '0.84rem' }}
            >
              Email verified successfully! You can now sign in to your workspace.
            </Alert>
          )}

          {isReset && (
            <Alert
              icon={<CheckCircle fontSize="inherit" />}
              severity="success"
              sx={{ mb: 2.5, borderRadius: 2.5, fontSize: '0.84rem' }}
            >
              Password updated successfully! Please sign in with your new password.
            </Alert>
          )}

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2.5, borderRadius: 2.5, fontSize: '0.84rem' }}
            >
              {error}
            </Alert>
          )}

          {/* One-Click Google SSO */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              py: 1.2,
              borderRadius: 2.5,
              borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.14)',
              bgcolor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)',
              color: 'text.primary',
              fontSize: '0.88rem',
              fontWeight: 650,
              textTransform: 'none',
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: isLight ? '#0E6245' : '#10B981',
                bgcolor: isLight ? 'rgba(14, 98, 69, 0.04)' : 'rgba(16, 185, 129, 0.08)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Continue with Google
          </Button>

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', my: 2.75 }}>
            <Divider sx={{ flex: 1, borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.09)' }} />
            <Typography
              variant="caption"
              sx={{
                px: 2,
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'text.secondary',
                letterSpacing: '0.06em',
              }}
            >
              OR CONTINUE WITH EMAIL
            </Typography>
            <Divider sx={{ flex: 1, borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.09)' }} />
          </Box>

          {/* Core Credentials Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.25}>
              <Box>
                <Typography variant="caption" fontWeight={650} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      bgcolor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)',
                    },
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                  <Typography variant="caption" fontWeight={650} color="text.secondary">
                    Password
                  </Typography>
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={() => router.push('/auth/forgot-password')}
                  >
                    Forgot password?
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            aria-label="toggle password visibility"
                          >
                            {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      bgcolor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)',
                    },
                  }}
                />
              </Box>

              {/* Submit CTA */}
              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading || !email || !password}
                endIcon={!loading && <ArrowForward fontSize="small" />}
                sx={{
                  mt: 1,
                  py: 1.35,
                  borderRadius: 2.5,
                  fontSize: '0.92rem',
                  fontWeight: 750,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #34D399 0%, #047857 100%)',
                    boxShadow: '0 10px 28px rgba(16, 185, 129, 0.45)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In to Workspace'}
              </Button>
            </Stack>
          </Box>

          {/* Switch to Signup */}
          <Box sx={{ mt: 3.5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Don&apos;t have an account?{' '}
              <Typography
                component="span"
                color="primary"
                sx={{
                  fontWeight: 750,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() =>
                  router.push(
                    `/auth/signup${redirectTarget !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`
                  )
                }
              >
                Create one for free
              </Typography>
            </Typography>
          </Box>

          {/* Compliance & Security Badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)'}`,
            }}
          >
            <SecurityOutlined sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.7 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', opacity: 0.8 }}>
              256-bit encryption • Supabase Cloud Auth • ISO/SOC2 aligned
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* RIGHT SHOWCASE HERO PANEL (Desktop Big Tech SaaS Showcase) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: { md: '0 0 50%', lg: '0 0 54%' },
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { md: 6, lg: 8 },
          overflow: 'hidden',
          background: isLight
            ? 'linear-gradient(145deg, #F0FDF4 0%, #E2E8F0 50%, #ECFDF5 100%)'
            : 'linear-gradient(145deg, #05080E 0%, #0A111E 50%, #061916 100%)',
          borderLeft: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
        }}
      >
        {/* Subtle Ambient Mesh Orbs */}
        <Box
          sx={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
            top: '-10%',
            right: '-10%',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
            bottom: '-5%',
            left: '-5%',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />

        {/* Content Container */}
        <Box sx={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
          {/* Live Product Card Mockup */}
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 4,
              bgcolor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(14, 20, 32, 0.92)',
              border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'}`,
              boxShadow: isLight
                ? '0 24px 48px -12px rgba(15, 23, 42, 0.15)'
                : '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              mb: 3.5,
            }}
          >
            {/* Mockup Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  🌴
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                    Goa Beach Villa Retreat
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    4 members • Auto debt simplified
                  </Typography>
                </Box>
              </Box>
              <Chip
                icon={<FlashOn sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
                label="UPI Settled"
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  fontWeight: 750,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              />
            </Box>

            {/* Split Metrics Row */}
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: isLight ? 'rgba(14, 98, 69, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.12)' : 'rgba(255, 255, 255, 0.06)'}`,
                mb: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Total Shared Spend
                  </Typography>
                  <Typography variant="h5" fontWeight={850} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
                    ₹36,000
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                    You Get Back
                  </Typography>
                  <Typography variant="h6" fontWeight={850} sx={{ color: '#10B981' }}>
                    +₹9,000
                  </Typography>
                </Box>
              </Box>

              {/* Progress Bar */}
              <Box sx={{ width: '100%', height: 6, borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.15)', overflow: 'hidden' }}>
                <Box sx={{ width: '75%', height: '100%', bgcolor: '#10B981', borderRadius: 3 }} />
              </Box>
            </Box>

            {/* Members Split Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700 } }}>
                <Avatar sx={{ bgcolor: '#0E6245' }}>VC</Avatar>
                <Avatar sx={{ bgcolor: '#3B82F6' }}>PS</Avatar>
                <Avatar sx={{ bgcolor: '#F59E0B' }}>AK</Avatar>
                <Avatar sx={{ bgcolor: '#8B5CF6' }}>RM</Avatar>
              </AvatarGroup>
              <Typography variant="caption" color="text.secondary" fontWeight={650}>
                3 of 4 debts cleared via QR
              </Typography>
            </Box>
          </Paper>

          {/* Social Proof & Testimonial */}
          <Box sx={{ px: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, color: '#F59E0B' }}>
              {'★★★★★'}
              <Typography variant="caption" sx={{ ml: 1, fontWeight: 700, color: 'text.secondary' }}>
                4.9/5 from 1,200+ groups
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '1rem',
                lineHeight: 1.5,
                mb: 1.5,
                fontStyle: 'italic',
              }}
            >
              &ldquo;FairShare completely eliminated our end-of-month roommate awkwardness. Settlements happen in 10 seconds through direct UPI.&rdquo;
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Alex Rivera • Lead Product Engineer
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<CategoryCycleLoader fullPage={true} />}>
      <LoginForm />
    </Suspense>
  );
}
