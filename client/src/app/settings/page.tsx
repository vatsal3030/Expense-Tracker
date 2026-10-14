'use client';

import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Avatar,
  Divider, useTheme, alpha, Stack, Switch, FormControlLabel, MenuItem,
} from '@mui/material';
import { Save, Logout, DarkMode, LightMode } from '@mui/icons-material';
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

  React.useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        defaultCurrency: profile.defaultCurrency || 'INR',
        timezone: profile.timezone || 'Asia/Kolkata',
      });
    }
  }, [profile]);

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
      <Box className="animate-fade-in">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800}>Settings</Typography>
          <Typography variant="body1" color="text.secondary">Manage your account preferences</Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Profile Information</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                  <Avatar
                    src={profile?.avatarUrl || undefined}
                    sx={{
                      width: 80, height: 80,
                      bgcolor: theme.palette.primary.main,
                      fontSize: '2rem', fontWeight: 700,
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{profile?.name || 'User'}</Typography>
                    <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
                  </Box>
                </Box>

                <Stack spacing={2.5}>
                  <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <TextField fullWidth label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField fullWidth select label="Default Currency" value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}>
                        <MenuItem value="INR">🇮🇳 INR - Indian Rupee</MenuItem>
                        <MenuItem value="USD">🇺🇸 USD - US Dollar</MenuItem>
                        <MenuItem value="EUR">🇪🇺 EUR - Euro</MenuItem>
                        <MenuItem value="GBP">🇬🇧 GBP - British Pound</MenuItem>
                        <MenuItem value="JPY">🇯🇵 JPY - Japanese Yen</MenuItem>
                        <MenuItem value="AUD">🇦🇺 AUD - Australian Dollar</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField fullWidth select label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                        <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                        <MenuItem value="America/New_York">America/New York (EST)</MenuItem>
                        <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                        <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST)</MenuItem>
                        <MenuItem value="Australia/Sydney">Australia/Sydney (AEST)</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Stack>

                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      borderRadius: 3, px: 4, fontWeight: 600,
                      bgcolor: '#059669',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(5,150,105,0.25)',
                      '&:hover': { bgcolor: '#047857', boxShadow: '0 6px 20px rgba(5,150,105,0.35)' },
                    }}
                  >
                    {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Preferences */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Appearance</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {mode === 'dark' ? <DarkMode sx={{ color: '#818cf8' }} /> : <LightMode sx={{ color: '#f59e0b' }} />}
                      <Typography variant="body2">{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Typography>
                    </Box>
                    <Switch checked={mode === 'dark'} onChange={toggleTheme} color="primary" />
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Account</Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<Logout />}
                    onClick={handleLogout}
                    sx={{ borderRadius: 3 }}
                  >
                    Sign Out
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>About FairShare</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Version 1.0.0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Built with ❤️ by Vatsal. Open source and free forever.
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </AppLayout>
  );
}
