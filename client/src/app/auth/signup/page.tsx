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
  PersonOutlined,
  CheckCircle,
  SecurityOutlined,
  FlashOn,
  MarkEmailRead,
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

function SignupForm() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams?.get('ref');
  const redirectTarget = searchParams?.get('redirect') || '/dashboard';
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isLight = theme.palette.mode === 'light';

  useEffect(() => {
    if (refCode) {
      try {
        localStorage.setItem('fairshare_pending_invite', refCode);
      } catch {}
    }
  }, [refCode]);

  useEffect(() => {
    if (!authLoading && user) {
      if (refCode && refCode !== user.id) {
        router.push(`/friends?invite=${refCode}`);
      } else {
        router.push(redirectTarget || '/dashboard');
      }
    }
  }, [user?.id, authLoading, router, refCode, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, name);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setError('');
    const res = await signInWithGoogle();
    if (res.error) setError(res.error);
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
      {/* LEFT FORM PANEL */}
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
        <Box sx={{ width: '100%', maxWidth: 430 }}>
          {/* Header Brand Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5 }}>
            <BrandLogo size="md" asLink={false} />
            <Chip
              label="Free Forever"
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
          <Box sx={{ mb: 3 }}>
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
              {success ? 'Check your email' : 'Create your account'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
              {success
                ? `We sent an activation link to ${email}`
                : 'Join thousands of roommates and friends splitting expenses with zero math and instant UPI settlements.'}
            </Typography>
          </Box>

          {success ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 2.5,
                  borderRadius: '50%',
                  bgcolor: alpha('#10B981', 0.12),
                  color: '#10B981',
                  mb: 2.5,
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.2)',
                }}
              >
                <MarkEmailRead sx={{ fontSize: 52 }} />
              </Box>
              <Typography variant="body1" fontWeight={700} sx={{ mb: 1, color: 'text.primary' }}>
                Confirmation link sent!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, lineHeight: 1.6, fontSize: '0.85rem' }}>
                Click the link inside the email sent to <strong>{email}</strong> to activate your workspace. Check your spam folder if it doesn&apos;t arrive in 60 seconds.
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => router.push('/auth/login')}
                  sx={{
                    py: 1.3,
                    borderRadius: 2.5,
                    fontSize: '0.9rem',
                    fontWeight: 750,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                    textTransform: 'none',
                  }}
                >
                  Proceed to Sign In
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setSuccess(false)}
                  sx={{ fontSize: '0.8rem', color: 'text.secondary', textTransform: 'none' }}
                >
                  Entered wrong address? Try another email
                </Button>
              </Stack>
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5, fontSize: '0.84rem' }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Google OAuth Button */}
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleSignup}
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
                Sign up with Google
              </Button>

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2.5 }}>
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
                  OR REGISTER WITH EMAIL
                </Typography>
                <Divider sx={{ flex: 1, borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.09)' }} />
              </Box>

              {/* Registration Form */}
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" fontWeight={650} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Full Name
                    </Typography>
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      placeholder="Alex Chen"
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
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
                    <Typography variant="caption" fontWeight={650} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Email Address
                    </Typography>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
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
                    <Typography variant="caption" fontWeight={650} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Password (min. 8 characters)
                    </Typography>
                    <TextField
                      fullWidth
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
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

                  <Box>
                    <Typography variant="caption" fontWeight={650} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Confirm Password
                    </Typography>
                    <TextField
                      fullWidth
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
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
                    disabled={loading || !name || !email || !password || !confirmPassword}
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
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Free Account'}
                  </Button>
                </Stack>
              </Box>

              {/* Switch to Login */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Already have an account?{' '}
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
                        `/auth/login${redirectTarget !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`
                      )
                    }
                  >
                    Sign in here
                  </Typography>
                </Typography>
              </Box>

              {/* Security & Terms Footnote */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mt: 3.5,
                  pt: 2.5,
                  borderTop: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)'}`,
                }}
              >
                <SecurityOutlined sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.7 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', opacity: 0.8 }}>
                  By signing up you agree to FairShare Terms & Privacy Policy
                </Typography>
              </Box>
            </>
          )}
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
                  🚀
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                    Flat 402 Apartment Living
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    3 roommates • Equal splits with UPI
                  </Typography>
                </Box>
              </Box>
              <Chip
                icon={<FlashOn sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
                label="Auto Simplified"
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
                    Monthly Utility & Rent
                  </Typography>
                  <Typography variant="h5" fontWeight={850} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
                    ₹48,500
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                    Instant QR Ready
                  </Typography>
                  <Typography variant="h6" fontWeight={850} sx={{ color: '#10B981' }}>
                    0 Debts Left
                  </Typography>
                </Box>
              </Box>

              {/* Progress Bar */}
              <Box sx={{ width: '100%', height: 6, borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.15)', overflow: 'hidden' }}>
                <Box sx={{ width: '100%', height: '100%', bgcolor: '#10B981', borderRadius: 3 }} />
              </Box>
            </Box>

            {/* Members Split Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700 } }}>
                <Avatar sx={{ bgcolor: '#0E6245' }}>VC</Avatar>
                <Avatar sx={{ bgcolor: '#3B82F6' }}>PS</Avatar>
                <Avatar sx={{ bgcolor: '#8B5CF6' }}>RM</Avatar>
              </AvatarGroup>
              <Typography variant="caption" color="text.secondary" fontWeight={650}>
                Live balance auto-synchronized
              </Typography>
            </Box>
          </Paper>

          {/* Social Proof & Testimonial */}
          <Box sx={{ px: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, color: '#F59E0B' }}>
              {'★★★★★'}
              <Typography variant="caption" sx={{ ml: 1, fontWeight: 700, color: 'text.secondary' }}>
                5.0 rating on productivity
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
              &ldquo;The best part is how effortless it is. No sign-up friction, seamless QR codes for Indian UPI, and beautiful reports for our monthly reviews.&rdquo;
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Priya Sharma • Senior Designer
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<CategoryCycleLoader fullPage={true} />}>
      <SignupForm />
    </Suspense>
  );
}
