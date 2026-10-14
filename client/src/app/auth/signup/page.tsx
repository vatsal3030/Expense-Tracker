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
  }, [user, authLoading, router]);

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
        py: 4,
      }}
    >
      {/* Decorations: Subtle Emerald Vignette */}
      <Box
        sx={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          top: -200,
          right: -100,
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
              Create your account
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Start splitting expenses for free
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>
              {success}
            </Alert>
          )}

          {/* OAuth */}
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => signInWithGoogle()}
              sx={{
                py: 1.3, borderRadius: 3, borderColor: theme.palette.divider,
                color: theme.palette.text.primary, fontWeight: 600,
                '&:hover': { borderColor: theme.palette.primary.main },
              }}
            >
              Sign up with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={() => signInWithGithub()}
              sx={{
                py: 1.3, borderRadius: 3, borderColor: theme.palette.divider,
                color: theme.palette.text.primary, fontWeight: 600,
                '&:hover': { borderColor: theme.palette.text.primary },
              }}
            >
              Sign up with GitHub
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
              OR
            </Typography>
          </Divider>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                autoFocus
              />
              <TextField
                fullWidth
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="At least 8 characters"
                autoComplete="new-password"
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
              <TextField
                fullWidth
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                error={confirmPassword.length > 0 && password !== confirmPassword}
                helperText={confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords don\'t match' : ''}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !email || !password || !name}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            Already have an account?{' '}
            <Typography
              component="span"
              variant="body2"
              color="primary"
              sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
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
