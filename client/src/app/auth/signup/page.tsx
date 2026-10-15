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

export default function SignupPage() {
  const theme = useTheme();
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithGithub, user, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user?.id, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, name);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Account created! Check your email to verify, or sign in now.');
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setError('');
    const res = await signInWithGoogle();
    if (res.error) setError(res.error);
  };

  const handleGithubSignup = async () => {
    setError('');
    const res = await signInWithGithub();
    if (res.error) setError(res.error);
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
        overflowY: 'auto',
        px: { xs: 2, sm: 2 },
        py: { xs: 4, sm: 2 },
      }}
    >
      {/* Decorations: Subtle Emerald Vignette */}
      <Box
        sx={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          top: -150,
          right: -80,
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
              Create your account
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Start splitting expenses fairly
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2, py: 0.25, fontSize: '0.78rem' }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2, py: 0.25, fontSize: '0.78rem' }}>
              {success}
            </Alert>
          )}

          {/* Social OAuth in 2-column row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              startIcon={<GoogleIcon sx={{ fontSize: '18px !important' }} />}
              onClick={handleGoogleSignup}
              sx={{
                py: 0.7,
                borderRadius: 2,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '0.78rem',
                textTransform: 'none',
                '&:hover': { borderColor: theme.palette.primary.main },
              }}
            >
              Google
            </Button>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              startIcon={<GitHubIcon sx={{ fontSize: '18px !important' }} />}
              onClick={handleGithubSignup}
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

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.2}>
              <TextField
                fullWidth
                size="small"
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
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
                autoComplete="new-password"
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
              <TextField
                fullWidth
                size="small"
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                error={confirmPassword.length > 0 && password !== confirmPassword}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading || !email || !password || !name}
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
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Account'}
              </Button>
            </Stack>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.8, display: 'block', textAlign: 'center' }}>
            Already have an account?{' '}
            <Typography
              component="span"
              variant="caption"
              color="primary"
              sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => router.push('/auth/login')}
            >
              Sign in
            </Typography>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
