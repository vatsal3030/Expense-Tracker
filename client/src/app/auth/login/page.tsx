'use client';

import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import BrandLogo from '@/components/brand/BrandLogo';

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithGithub, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/dashboard');
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
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 1.5, sm: 2 },
      }}
    >
      {/* Background decorations: Subtle Emerald Vignette */}
      <Box
        sx={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          top: -150,
          left: -100,
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="xs" disableGutters sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3.5,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 1.5 }}>
            <BrandLogo size="sm" className="justify-center mb-1" />
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.25rem' }}>
              Welcome back
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Sign in to your FairShare account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2, py: 0.25, fontSize: '0.78rem' }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Social OAuth in 2-column row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              startIcon={<GoogleIcon sx={{ fontSize: '18px !important' }} />}
              onClick={handleGoogleLogin}
              sx={{
                py: 0.7,
                borderRadius: 2,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '0.78rem',
                textTransform: 'none',
                '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.04) },
              }}
            >
              Google
            </Button>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              startIcon={<GitHubIcon sx={{ fontSize: '18px !important' }} />}
              onClick={handleGithubLogin}
              sx={{
                py: 0.7,
                borderRadius: 2,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '0.78rem',
                textTransform: 'none',
                '&:hover': { borderColor: theme.palette.text.primary },
              }}
            >
              GitHub
            </Button>
          </Box>

          <Divider sx={{ my: 1.2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontSize: '0.7rem' }}>
              OR WITH EMAIL
            </Typography>
          </Divider>

          {/* Email form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.4}>
              <TextField
                fullWidth
                size="small"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <TextField
                fullWidth
                size="small"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                slotProps={{
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
              onClick={() => router.push('/auth/signup')}
            >
              Create one for free
            </Typography>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
