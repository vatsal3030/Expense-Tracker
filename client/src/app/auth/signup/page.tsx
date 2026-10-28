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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import Link from 'next/link';
import {
  Visibility,
  VisibilityOff,
  EmailOutlined,
  LockOutlined,
  PersonOutlined,
  SecurityOutlined,
  MarkEmailRead,
  ArrowForward,
  FormatQuote,
  ArrowBackIosNew,
  ArrowForwardIos,
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

const REVIEWS = [
  {
    quote: "FairShare completely removed the awkwardness of chasing flatmates for rent and utilities. 1-click UPI QR settlements make it effortless.",
    author: "Alex Rivera",
    role: "Software Engineer",
    location: "Mumbai • Flat 402",
    rating: 5,
    avatar: "AR",
    color: "#059669",
  },
  {
    quote: "We used FairShare for our 10-person Goa trip. The debt simplification is magic—it turned 45 messy transactions into just 3 clean settlements.",
    author: "Priya Sharma",
    role: "Product Designer",
    location: "Bangalore",
    rating: 5,
    avatar: "PS",
    color: "#3B82F6",
  },
  {
    quote: "No ads, snappy UI, and dark mode looks incredible. Having unique usernames makes adding friends and splitting bills seamless.",
    author: "Rohan Mehta",
    role: "Startup Founder",
    location: "Delhi",
    rating: 5,
    avatar: "RM",
    color: "#8B5CF6",
  },
  {
    quote: "The monthly PDF export and category breakdown saved our apartment hours at tax time. It's the most dependable financial utility we use.",
    author: "Kavita Patel",
    role: "Creative Director",
    location: "Pune",
    rating: 5,
    avatar: "KP",
    color: "#F59E0B",
  },
];

function SignupForm() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams?.get('ref');
  const rawRedirect = searchParams?.get('redirect');
  const redirectTarget = (rawRedirect && rawRedirect !== '/' && rawRedirect !== '/#') ? rawRedirect : '/dashboard';
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(1);

  const isLight = theme.palette.mode === 'light';

  // Auto-rotate reviews every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setReviewIdx((prev) => (prev + 1) % REVIEWS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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

    if (!agreedToTerms) {
      setError('You must read and agree to the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, name, { agreedToTerms: true });

    if (result.error) {
      setError(result.error);
    } else {
      // Record explicit user consent audit log locally
      try {
        localStorage.setItem(
          'fairshare_terms_consent',
          JSON.stringify({
            agreed: true,
            version: '2026.1',
            agreedAt: new Date().toISOString(),
            email: email.trim().toLowerCase(),
          })
        );
      } catch {}
      setSuccess(true);
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setError('');
    if (!agreedToTerms) {
      setError('Please accept the Terms of Service and Privacy Policy before continuing with Google.');
      return;
    }
    try {
      localStorage.setItem(
        'fairshare_terms_consent',
        JSON.stringify({
          agreed: true,
          version: '2026.1',
          agreedAt: new Date().toISOString(),
          provider: 'google',
        })
      );
    } catch {}
    const res = await signInWithGoogle();
    if (res.error) setError(res.error);
  };

  const currentReview = REVIEWS[reviewIdx];

  return (
    <Box
      sx={{
        height: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: isLight ? '#F8FAFC' : '#080C14',
        overflow: 'hidden',
      }}
    >
      {/* LEFT FORM PANEL (Compact, Zero-Scroll on Standard Displays) */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '0 0 50%', lg: '0 0 46%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 2.5, sm: 4, md: 5 },
          py: { xs: 2, sm: 2.5 },
          height: '100%',
          maxHeight: '100vh',
          boxSizing: 'border-box',
          overflowY: 'auto',
          zIndex: 2,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 380 }}>
          {/* Header Brand Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <BrandLogo size="sm" asLink={false} />
            <Chip
              label="Free Forever"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: isLight ? 'rgba(5, 150, 105, 0.08)' : 'rgba(16, 185, 129, 0.1)',
                color: isLight ? '#059669' : '#34D399',
                border: `1px solid ${isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(52, 211, 153, 0.25)'}`,
                borderRadius: 1.5,
              }}
            />
          </Box>

          {/* Heading */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h5"
              fontWeight={850}
              sx={{
                fontSize: { xs: '1.35rem', sm: '1.55rem' },
                letterSpacing: '-0.025em',
                color: 'text.primary',
                lineHeight: 1.2,
                mb: 0.5,
              }}
            >
              {success ? 'Check your email' : 'Create your account'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
              {success ? `We sent an activation link to ${email}` : 'Join thousands splitting expenses with zero math.'}
            </Typography>
          </Box>

          {success ? (
            <Box sx={{ textAlign: 'center', py: 1.5 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: alpha('#10B981', 0.12),
                  color: '#10B981',
                  mb: 2,
                }}
              >
                <MarkEmailRead sx={{ fontSize: 44 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5, fontSize: '0.82rem' }}>
                Click the confirmation link sent to <strong>{email}</strong> to activate your workspace.
              </Typography>
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => router.push('/auth/login')}
                  sx={{
                    py: 1,
                    borderRadius: 2,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#ffffff',
                    textTransform: 'none',
                  }}
                >
                  Go to Sign In
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setSuccess(false)}
                  sx={{ fontSize: '0.75rem', color: 'text.secondary', textTransform: 'none' }}
                >
                  Try another email address
                </Button>
              </Stack>
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 1.75, py: 0.25, px: 1.5, borderRadius: 2, fontSize: '0.78rem' }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Terms & Privacy Consent Checkbox (Explicit DPDP 2023 Statutory Consent) */}
              <Box
                sx={{
                  p: 1.1,
                  mb: 1.5,
                  borderRadius: 2,
                  bgcolor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${
                    !agreedToTerms && error.includes('Terms')
                      ? '#EF4444'
                      : isLight
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  transition: 'border-color 0.2s ease',
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (error.includes('Terms')) setError('');
                      }}
                      size="small"
                      sx={{
                        p: 0.4,
                        mr: 0.5,
                        color: isLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)',
                        '&.Mui-checked': {
                          color: isLight ? '#059669' : '#10B981',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ fontSize: '0.74rem', color: 'text.secondary', lineHeight: 1.4 }}>
                      I have read and agree to the{' '}
                      <Link
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: isLight ? '#059669' : '#34D399',
                          fontWeight: 700,
                          textDecoration: 'underline',
                        }}
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: isLight ? '#059669' : '#34D399',
                          fontWeight: 700,
                          textDecoration: 'underline',
                        }}
                      >
                        Privacy Policy
                      </Link>
                      .
                    </Typography>
                  }
                  sx={{ alignItems: 'flex-start', m: 0 }}
                />
              </Box>

              {/* Google OAuth Button */}
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleSignup}
                sx={{
                  py: 0.85,
                  borderRadius: 2,
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.15)',
                  bgcolor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.02)',
                  color: 'text.primary',
                  fontSize: '0.84rem',
                  fontWeight: 650,
                  textTransform: 'none',
                  transition: 'all 0.18s ease',
                  '&:hover': {
                    borderColor: isLight ? '#059669' : '#10B981',
                    bgcolor: isLight ? 'rgba(5, 150, 105, 0.04)' : 'rgba(16, 185, 129, 0.08)',
                  },
                }}
              >
                Sign up with Google
              </Button>

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', my: 1.75 }}>
                <Divider sx={{ flex: 1, borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)' }} />
                <Typography
                  variant="caption"
                  sx={{
                    px: 1.5,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'text.secondary',
                    letterSpacing: '0.05em',
                  }}
                >
                  OR WITH EMAIL
                </Typography>
                <Divider sx={{ flex: 1, borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)' }} />
              </Box>

              {/* Registration Form */}
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={1.25}>
                  <Box>
                    <Typography variant="caption" fontWeight={650} color="text.secondary" sx={{ display: 'block', mb: 0.3, fontSize: '0.74rem' }}>
                      Full Name
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
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
                              <PersonOutlined sx={{ fontSize: 17, color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: isLight ? '#FFFFFF' : '#0E1420',
                          fontSize: '0.85rem',
                          '& fieldset': { borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' },
                        },
                        '& input:-webkit-autofill': {
                          WebkitBoxShadow: isLight ? '0 0 0 1000px #ffffff inset !important' : '0 0 0 1000px #0E1420 inset !important',
                          WebkitTextFillColor: isLight ? '#0f172a !important' : '#ffffff !important',
                          caretColor: isLight ? '#0f172a' : '#ffffff',
                          borderRadius: 'inherit',
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" fontWeight={650} color="text.secondary" sx={{ display: 'block', mb: 0.3, fontSize: '0.74rem' }}>
                      Email Address
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
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
                              <EmailOutlined sx={{ fontSize: 17, color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: isLight ? '#FFFFFF' : '#0E1420',
                          fontSize: '0.85rem',
                          '& fieldset': { borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' },
                        },
                        '& input:-webkit-autofill': {
                          WebkitBoxShadow: isLight ? '0 0 0 1000px #ffffff inset !important' : '0 0 0 1000px #0E1420 inset !important',
                          WebkitTextFillColor: isLight ? '#0f172a !important' : '#ffffff !important',
                          caretColor: isLight ? '#0f172a' : '#ffffff',
                          borderRadius: 'inherit',
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box>
                      <Typography variant="caption" fontWeight={650} color="text.secondary" sx={{ display: 'block', mb: 0.3, fontSize: '0.74rem' }}>
                        Password
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: isLight ? '#FFFFFF' : '#0E1420',
                            fontSize: '0.85rem',
                            '& fieldset': { borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' },
                          },
                          '& input:-webkit-autofill': {
                            WebkitBoxShadow: isLight ? '0 0 0 1000px #ffffff inset !important' : '0 0 0 1000px #0E1420 inset !important',
                            WebkitTextFillColor: isLight ? '#0f172a !important' : '#ffffff !important',
                            caretColor: isLight ? '#0f172a' : '#ffffff',
                            borderRadius: 'inherit',
                          },
                        }}
                      />
                    </Box>

                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                        <Typography variant="caption" fontWeight={650} color="text.secondary" sx={{ fontSize: '0.74rem' }}>
                          Confirm
                        </Typography>
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          size="small"
                          sx={{ p: 0.2 }}
                        >
                          {showPassword ? <VisibilityOff sx={{ fontSize: 14 }} /> : <Visibility sx={{ fontSize: 14 }} />}
                        </IconButton>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: isLight ? '#FFFFFF' : '#0E1420',
                            fontSize: '0.85rem',
                            '& fieldset': { borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' },
                          },
                          '& input:-webkit-autofill': {
                            WebkitBoxShadow: isLight ? '0 0 0 1000px #ffffff inset !important' : '0 0 0 1000px #0E1420 inset !important',
                            WebkitTextFillColor: isLight ? '#0f172a !important' : '#ffffff !important',
                            caretColor: isLight ? '#0f172a' : '#ffffff',
                            borderRadius: 'inherit',
                          },
                        }}
                      />
                    </Box>
                  </Box>


                  {/* Submit CTA */}
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={loading || !name || !email || !password || !confirmPassword || !agreedToTerms}
                    endIcon={!loading && <ArrowForward sx={{ fontSize: 17 }} />}
                    sx={{
                      mt: 0.5,
                      py: 1.05,
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      fontWeight: 750,
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.18s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #34D399 0%, #047857 100%)',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                      },
                      '&.Mui-disabled': {
                        background: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                        color: isLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Account'}
                  </Button>
                </Stack>
              </Box>

              {/* Switch to Login */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
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
                    Sign in
                  </Typography>
                </Typography>
              </Box>

              {/* Security & Terms Footnote */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.75,
                  mt: 2,
                  pt: 1.5,
                  borderTop: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'}`,
                }}
              >
                <SecurityOutlined sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.7 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', opacity: 0.8 }}>
                  By registering you agree to FairShare Terms & Privacy Policy
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* RIGHT HERO PANEL (Animated Rotating Customer Review Cards) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: { md: '0 0 50%', lg: '0 0 54%' },
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { md: 5, lg: 7 },
          height: '100%',
          maxHeight: '100vh',
          boxSizing: 'border-box',
          overflow: 'hidden',
          background: isLight
            ? 'linear-gradient(145deg, #F0FDF4 0%, #E2E8F0 50%, #ECFDF5 100%)'
            : 'linear-gradient(145deg, #05080E 0%, #0A111E 50%, #061916 100%)',
          borderLeft: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
        }}
      >
        {/* Subtle Ambient Vignette */}
        <Box
          sx={{
            position: 'absolute',
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
            top: '-5%',
            right: '-5%',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />

        {/* Carousel Container */}
        <Box sx={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
          {/* Active Review Card with Smooth CSS Transition */}
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 3.5,
              bgcolor: isLight ? '#FFFFFF' : '#0E1422',
              border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.09)'}`,
              boxShadow: isLight
                ? '0 16px 36px -8px rgba(15, 23, 42, 0.1)'
                : '0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              minHeight: 220,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <FormatQuote
              sx={{
                position: 'absolute',
                top: 16,
                right: 20,
                fontSize: 36,
                color: isLight ? 'rgba(14, 98, 69, 0.12)' : 'rgba(52, 211, 153, 0.15)',
              }}
            />

            {/* Stars */}
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#F59E0B' }}>
                {'★★★★★'}
                <Typography variant="caption" sx={{ ml: 1, fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem' }}>
                  5.0 Verified User
                </Typography>
              </Box>
            </Box>

            {/* Quote Body */}
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '0.98rem',
                lineHeight: 1.55,
                mb: 2.5,
                fontStyle: 'normal',
              }}
            >
              &ldquo;{currentReview.quote}&rdquo;
            </Typography>

            {/* Reviewer Details */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: currentReview.color,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                {currentReview.avatar}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={750} sx={{ fontSize: '0.88rem', lineHeight: 1.2 }}>
                  {currentReview.author}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                  {currentReview.role} • {currentReview.location}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Carousel Pagination Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2.5, px: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {REVIEWS.map((_, i) => (
                <Box
                  key={i}
                  onClick={() => setReviewIdx(i)}
                  sx={{
                    width: i === reviewIdx ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: i === reviewIdx ? '#10B981' : isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setReviewIdx((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)}
                sx={{
                  bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                  p: 0.75,
                }}
              >
                <ArrowBackIosNew sx={{ fontSize: 13 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setReviewIdx((prev) => (prev + 1) % REVIEWS.length)}
                sx={{
                  bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                  p: 0.75,
                }}
              >
                <ArrowForwardIos sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
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
