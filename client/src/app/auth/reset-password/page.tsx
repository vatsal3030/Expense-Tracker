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
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, LockReset } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import BrandLogo from '@/components/brand/BrandLogo';

export default function ResetPasswordPage() {
  const theme = useTheme();
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateErr } = await updatePassword(password);
    if (updateErr) {
      setError(updateErr);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login?reset=true');
      }, 2000);
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
              Set New Password
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Enter your new secure password below
            </Typography>
          </Box>

          {success ? (
            <Alert severity="success" sx={{ py: 1.5, px: 2, borderRadius: 2.5, fontSize: '0.85rem' }}>
              Password updated successfully! Redirecting you to sign in...
            </Alert>
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
                  id="new-password"
                  name="password"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoFocus
                  required
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

                <TextField
                  fullWidth
                  size="small"
                  id="confirm-new-password"
                  name="confirmPassword"
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={confirmPassword.length > 0 && password !== confirmPassword}
                  helperText={confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords do not match' : ''}
                  slotProps={{
                    htmlInput: { sx: { py: 1, fontSize: '0.85rem' } },
                    inputLabel: { sx: { fontSize: '0.85rem' } },
                  }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                  startIcon={!loading && <LockReset />}
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
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
