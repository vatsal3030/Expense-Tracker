'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Avatar,
  Divider, useTheme, alpha, Stack, Switch, FormControlLabel, MenuItem,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  InputAdornment, IconButton, CircularProgress, Snackbar,
} from '@mui/material';
import {
  Save, Logout, DarkMode, LightMode, PhoneIphone, CheckCircle,
  VpnKey, ContentCopy, Send, Security, WarningAmber,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { userApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, signOut, refreshProfile, loading: authLoading, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();

  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    defaultCurrency: profile?.defaultCurrency || 'INR',
    timezone: profile?.timezone || 'Asia/Kolkata',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Phone OTP Verification State (Free Simulator Mode)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccessToast, setOtpSuccessToast] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const hasLoadedProfileRef = React.useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    if (profile && !hasLoadedProfileRef.current) {
      hasLoadedProfileRef.current = true;
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        defaultCurrency: profile.defaultCurrency || 'INR',
        timezone: profile.timezone || 'Asia/Kolkata',
      });

      // Check if this phone number is verified in localStorage
      if (profile.phone) {
        const storedVerifiedPhone = localStorage.getItem(`verified_phone_${profile.id}`);
        if (storedVerifiedPhone === profile.phone) {
          setIsPhoneVerified(true);
        }
      }
    }
  }, [profile]);

  // Handle Resend Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpDialogOpen && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpDialogOpen, resendTimer]);

  const handlePhoneInputChange = (newPhone: string) => {
    setForm({ ...form, phone: newPhone });
    // If phone number changes, mark unverified until re-verified
    if (newPhone !== localStorage.getItem(`verified_phone_${profile?.id}`)) {
      setIsPhoneVerified(false);
    }
  };

  const handleOpenOtpModal = () => {
    if (!form.phone.trim() || form.phone.trim().length < 8) {
      alert('Please enter a valid phone number (minimum 8 digits).');
      return;
    }
    // Generate a random 6-digit OTP code for free simulation
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setOtpError('');
    setResendTimer(60);
    setOtpDialogOpen(true);
  };

  const handleVerifyOtp = async () => {
    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setOtpError('Invalid OTP code. Please enter the 6-digit code provided in the simulator box.');
      return;
    }

    try {
      setSaving(true);
      // Persist verified phone to backend
      await userApi.updateProfile({ phone: form.phone.trim() });
      if (profile?.id) {
        localStorage.setItem(`verified_phone_${profile.id}`, form.phone.trim());
      }
      setIsPhoneVerified(true);
      setOtpDialogOpen(false);
      setOtpSuccessToast(true);
      await refreshProfile();
    } catch (err) {
      console.error('Failed saving verified phone:', err);
      setOtpError('Failed to save verified phone. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await userApi.updateProfile(form);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Save profile error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
            Account & Security Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your profile, phone verification, and application preferences
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card
              sx={{
                borderRadius: 3.5,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                <Typography variant="h6" fontWeight={750} sx={{ mb: 3 }}>
                  Profile Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                  <Avatar
                    src={profile?.avatarUrl || undefined}
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: '#0E6245',
                      fontSize: '2rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(14, 98, 69, 0.25)',
                    }}
                  >
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={750}>
                      {profile?.name || 'User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile?.email}
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />

                  {/* Phone Number Field with OTP Verification Status */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                      <Typography variant="caption" fontWeight={650} color="text.secondary">
                        Mobile Phone Number
                      </Typography>
                      {form.phone && isPhoneVerified ? (
                        <Chip
                          icon={<CheckCircle fontSize="small" sx={{ color: '#0E6245 !important' }} />}
                          label="Verified ✓"
                          size="small"
                          sx={{
                            fontWeight: 750,
                            fontSize: '0.72rem',
                            bgcolor: alpha('#0E6245', 0.12),
                            color: '#0E6245',
                            borderRadius: 1.5,
                          }}
                        />
                      ) : form.phone ? (
                        <Chip
                          icon={<WarningAmber fontSize="small" sx={{ color: '#d97706 !important' }} />}
                          label="Unverified"
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            bgcolor: alpha('#d97706', 0.12),
                            color: '#b45309',
                            borderRadius: 1.5,
                          }}
                        />
                      ) : null}
                    </Box>

                    <TextField
                      fullWidth
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => handlePhoneInputChange(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIphone fontSize="small" sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                          endAdornment: form.phone ? (
                            <InputAdornment position="end">
                              {isPhoneVerified ? (
                                <Button
                                  type="button"
                                  size="small"
                                  disabled
                                  sx={{ textTransform: 'none', fontWeight: 600, color: '#0E6245' }}
                                >
                                  Linked
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="small"
                                  variant="contained"
                                  onClick={handleOpenOtpModal}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    bgcolor: '#0E6245',
                                    color: '#FFFFFF',
                                    borderRadius: 2,
                                    px: 1.5,
                                    '&:hover': { bgcolor: '#094A34' },
                                  }}
                                >
                                  Verify via OTP
                                </Button>
                              )}
                            </InputAdornment>
                          ) : null,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Required for instant SMS notifications, UPI settlement matching, and phone invites.
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Default Currency"
                        value={form.defaultCurrency}
                        onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                        slotProps={{ inputLabel: { shrink: true } }}
                      >
                        <MenuItem value="INR">🇮🇳 INR - Indian Rupee (₹)</MenuItem>
                        <MenuItem value="USD">🇺🇸 USD - US Dollar ($)</MenuItem>
                        <MenuItem value="EUR">🇪🇺 EUR - Euro (€)</MenuItem>
                        <MenuItem value="GBP">🇬🇧 GBP - British Pound (£)</MenuItem>
                        <MenuItem value="JPY">🇯🇵 JPY - Japanese Yen (¥)</MenuItem>
                        <MenuItem value="AUD">🇦🇺 AUD - Australian Dollar (A$)</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Timezone"
                        value={form.timezone}
                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                        slotProps={{ inputLabel: { shrink: true } }}
                      >
                        <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                        <MenuItem value="America/New_York">America/New York (EST)</MenuItem>
                        <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                        <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST)</MenuItem>
                        <MenuItem value="Australia/Sydney">Australia/Sydney (AEST)</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Stack>

                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      borderRadius: 2.5,
                      px: 4,
                      py: 1,
                      fontWeight: 700,
                      bgcolor: '#0E6245',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(14, 98, 69, 0.25)',
                      '&:hover': { bgcolor: '#094A34' },
                    }}
                  >
                    {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Preferences & System Info */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <Card
                sx={{
                  borderRadius: 3.5,
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={750} sx={{ mb: 2 }}>
                    Appearance & Theme
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {mode === 'dark' ? <DarkMode sx={{ color: '#34d399' }} /> : <LightMode sx={{ color: '#f59e0b' }} />}
                      <Typography variant="body2" fontWeight={600}>
                        {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </Typography>
                    </Box>
                    <Switch checked={mode === 'dark'} onChange={toggleTheme} color="primary" />
                  </Box>
                </CardContent>
              </Card>

              <Card
                sx={{
                  borderRadius: 3.5,
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={750} sx={{ mb: 2 }}>
                    Account Security
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<Logout />}
                    onClick={handleLogout}
                    sx={{ borderRadius: 2.5, fontWeight: 600, textTransform: 'none' }}
                  >
                    Sign Out of FairShare
                  </Button>
                </CardContent>
              </Card>

              <Card
                sx={{
                  borderRadius: 3.5,
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={750} sx={{ mb: 1 }}>
                    About FairShare
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Version 1.2.0 • Premium FinTech Release
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time fair debt simplification, exact mathematical splits, and multi-format ledger exports.
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* Free Sandbox Mobile OTP Verification Dialog */}
        <Dialog
          open={otpDialogOpen}
          onClose={() => setOtpDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3.5,
              maxWidth: 440,
              width: '100%',
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Security sx={{ color: '#0E6245' }} />
              Verify Phone Number
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Verifying <strong>{form.phone}</strong> for instant notifications & settlements.
            </Typography>

            {/* Free Sandbox Notice & Generated Code */}
            <Alert
              severity="info"
              sx={{
                mb: 2.5,
                borderRadius: 2.5,
                bgcolor: alpha('#0E6245', 0.08),
                color: '#0E6245',
                border: `1px solid ${alpha('#0E6245', 0.2)}`,
                '& .MuiAlert-icon': { color: '#0E6245' },
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
                FREE DEVELOPER SIMULATOR ACTIVE:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.825rem' }}>
                No paid SMS credits are needed. Your simulated OTP code is:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'background.paper',
                  p: 1,
                  px: 1.5,
                  borderRadius: 2,
                  mt: 1,
                  border: `1px dashed #0E6245`,
                }}
              >
                <Typography variant="h5" fontWeight={850} sx={{ letterSpacing: '0.25em', color: '#0E6245' }}>
                  {generatedOtp}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setEnteredOtp(generatedOtp)}
                  startIcon={<ContentCopy fontSize="small" />}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', color: '#0E6245' }}
                >
                  Auto-fill
                </Button>
              </Box>
            </Alert>

            {otpError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {otpError}
              </Alert>
            )}

            <TextField
              fullWidth
              autoFocus
              label="Enter 6-digit OTP Code"
              placeholder="e.g. 492015"
              value={enteredOtp}
              onChange={(e) => {
                setEnteredOtp(e.target.value);
                setOtpError('');
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKey fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Did not receive code?'}
              </Typography>
              {resendTimer === 0 && (
                <Button
                  size="small"
                  onClick={handleOpenOtpModal}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', color: '#0E6245' }}
                >
                  Generate New OTP
                </Button>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              variant="outlined"
              onClick={() => setOtpDialogOpen(false)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleVerifyOtp}
              disabled={enteredOtp.trim().length !== 6 || saving}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: '#0E6245',
                color: '#FFFFFF',
                px: 3,
                '&:hover': { bgcolor: '#094A34' },
              }}
            >
              {saving ? 'Verifying...' : 'Verify & Link Phone'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={otpSuccessToast}
          autoHideDuration={4000}
          onClose={() => setOtpSuccessToast(false)}
          message="Phone number successfully verified and linked to your FairShare profile! ✓"
        />
      </Box>
    </AppLayout>
  );
}
