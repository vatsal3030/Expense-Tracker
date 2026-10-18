'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import { MarkEmailRead, ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import BrandLogo from '@/components/brand/BrandLogo';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const router = useRouter();
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setLoading(true);

    const { error: resetErr } = await resetPasswordForEmail(email);
    if (resetErr) {
      setError(resetErr);
    } else {
      setSent(true);
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
        px: 2,
        py: { xs: 3, sm: 2 },
        bgcolor: 'background.default',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
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
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            boxShadow: theme.palette.mode === 'dark' ? '0 12px 36px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,0,0,0.06)',
            width: '100%',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 2.5 }}>
            <Box sx={{ display: 'inline-flex', mb: 1 }}>
              <BrandLogo size="sm" asLink={false} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
              {sent ? 'Check your email' : 'Reset your password'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {sent
                ? 'We sent instructions to your inbox'
                : 'Enter your email address and we will send you a reset link'}
            </Typography>
          </Box>

          {sent ? (
            <Box sx={{ textAlign: 'center', py: 1.5 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              >
                <MarkEmailRead sx={{ fontSize: 44 }} />
              </Box>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                A password reset link was sent to <strong>{email}</strong>.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, lineHeight: 1.6 }}>
                Click the link in the email to set a new password. Make sure to check your spam folder if it doesn&apos;t arrive soon.
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => router.push('/auth/login')}
                  sx={{
                    py: 1,
                    borderRadius: 2.5,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    bgcolor: '#059669',
                    color: '#ffffff',
                    '&:hover': { bgcolor: '#047857' },
                  }}
                >
                  Back to Sign In
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setSent(false)}
                  sx={{ fontSize: '0.78rem', color: 'text.secondary' }}
                >
                  Need to try a different email?
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {error && (
                <Alert severity="error" sx={{ mb: 2, py: 0.3, px: 1.5, borderRadius: 2, fontSize: '0.78rem' }}>
                  {error}
                </Alert>
              )}

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  id="reset-email"
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  slotProps={{
                    htmlInput: { sx: { py: 1, fontSize: '0.85rem' } },
                    inputLabel: { sx: { fontSize: '0.85rem' } },
                  }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading || !email}
                  sx={{
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
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Send Reset Link'}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                  onClick={() => router.push('/auth/login')}
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  Back to Sign In
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
