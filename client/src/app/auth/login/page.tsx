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
        bgcolor: '#090d16',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorations: Subtle Emerald Vignette */}
      <Box
        sx={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          top: -150,
          left: -150,
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            border: '1px solid #1e293b',
            bgcolor: '#0f172a',
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <BrandLogo size="lg" className="justify-center mb-4" />
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: '#f8fafc' }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Sign in to your FairShare account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* OAuth */}
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              sx={{
                py: 1.3,
                borderRadius: 3,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                fontWeight: 600,
                '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.04) },
              }}
            >
              Continue with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={handleGithubLogin}
              sx={{
                py: 1.3,
                borderRadius: 3,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                fontWeight: 600,
                '&:hover': { borderColor: theme.palette.text.primary, bgcolor: alpha(theme.palette.action.hover, 0.08) },
              }}
            >
              Continue with GitHub
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
              OR
            </Typography>
          </Divider>

          {/* Email form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !email || !password}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Typography
              component="span"
              variant="body2"
              color="primary"
              sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
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
