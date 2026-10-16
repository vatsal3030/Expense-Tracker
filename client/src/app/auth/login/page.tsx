'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import BrandLogo from '@/components/brand/BrandLogo';
import CategoryCycleLoader from '@/components/common/CategoryCycleLoader';

function LoginForm() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';
  const { signIn, signInWithGoogle, signInWithGithub, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleGithubLogin = async () => {
    const { error } = await signInWithGithub();
    if (error) setError(error);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: { xs: 3, sm: 2 },
        bgcolor: 'background.default',
        overflowY: 'auto',
      }}
    >
      <Container maxWidth="xs" disableGutters sx={{ maxHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            boxShadow: theme.palette.mode === 'dark' ? '0 12px 36px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,0,0,0.06)',
            width: '100%',
          }}
        >
          {/* Logo & Header */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Box sx={{ display: 'inline-flex', mb: 0.8 }}>
              <BrandLogo size="md" asLink={false} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.3 }}>
              Welcome back
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sign in to manage your shared expenses
            </Typography>
          </Box>

          {/* Social Logins */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.8 }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<GoogleIcon sx={{ fontSize: 17 }} />}
              onClick={handleGoogleLogin}
              sx={{
                py: 0.8,
                borderRadius: 2.5,
                borderColor: theme.palette.divider,
                color: 'text.primary',
                fontSize: '0.78rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<GitHubIcon sx={{ fontSize: 17 }} />}
              onClick={handleGithubLogin}
              sx={{
                py: 0.8,
                borderRadius: 2.5,
                borderColor: theme.palette.divider,
                color: 'text.primary',
                fontSize: '0.78rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              GitHub
            </Button>
          </Box>

          <Divider sx={{ my: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              OR CONTINUE WITH EMAIL
            </Typography>
          </Divider>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 1.5, py: 0.3, px: 1.5, borderRadius: 2, fontSize: '0.78rem' }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                slotProps={{
                  htmlInput: { sx: { py: 1, fontSize: '0.85rem' } },
                  inputLabel: { sx: { fontSize: '0.85rem' } },
                }}
              />
              <TextField
                fullWidth
                size="small"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{
                  htmlInput: { sx: { py: 1, fontSize: '0.85rem' } },
                  inputLabel: { sx: { fontSize: '0.85rem' } },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" aria-label="toggle password visibility">
                          {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading || !email || !password}
                sx={{
                  mt: 0.5,
                  py: 1,
                  borderRadius: 2.5,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  bgcolor: '#059669',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(5,150,105,0.25)',
                  '&:hover': {
                    bgcolor: '#047857',
                    boxShadow: '0 6px 20px rgba(5,150,105,0.35)',
                  },
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
              </Button>
            </Stack>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.8, display: 'block', textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Typography
              component="span"
              variant="caption"
              color="primary"
              sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => router.push(`/auth/signup${redirectTarget !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`)}
            >
              Create one for free
            </Typography>
          </Typography>
        </Paper>
      </Container>
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
