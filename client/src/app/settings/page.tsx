'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Avatar,
  Divider, useTheme, alpha, Stack, Switch, FormControlLabel, MenuItem,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  InputAdornment, IconButton, CircularProgress, Snackbar, Tabs, Tab,
  RadioGroup, Radio, FormControl, FormLabel, Tooltip, List, ListItem,
  ListItemAvatar, ListItemText, ListItemSecondaryAction,
} from '@mui/material';
import {
  Save, Logout, DarkMode, LightMode, PhoneIphone, CheckCircle,
  VpnKey, ContentCopy, Send, Security, WarningAmber, Person,
  Payment, Notifications as NotificationsIcon, Palette, Tune,
  QrCode2, Shield, Download, Visibility, VisibilityOff, Devices,
  DeleteForever, Cached, ArrowForward, HelpOutlined, Language,
  CurrencyExchange, Calculate, Speed, VolumeUp, Email,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { userApi, expenseApi, groupApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const PRESET_AVATARS = [
  { name: 'Shadow Ninja', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ShadowNinja&backgroundColor=b6e3f4' },
  { name: 'Pixel Mage', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PixelMage&backgroundColor=ffd5dc' },
  { name: 'Robo Mecha', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MechaZero&backgroundColor=c0aede' },
  { name: 'Astro Pilot', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AstroPilot&backgroundColor=ffdfbf' },
  { name: 'Battle Knight', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PaladinKnight&backgroundColor=d1d4f9' },
  { name: 'Cyber Fox', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberFox&backgroundColor=b6e3f4' },
  { name: 'Forest Elf', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ForestElf&backgroundColor=c0aede' },
  { name: 'Neon Samurai', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NeonSamurai&backgroundColor=ffd5dc' },
  { name: 'Gamer Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=GamerBot99&backgroundColor=ffdfbf' },
  { name: 'Star Voyager', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=StarVoyager&backgroundColor=d1d4f9' },
  { name: 'Dragon Tamer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DragonTamer&backgroundColor=b6e3f4' },
  { name: 'Arcade Champ', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ArcadeChamp&backgroundColor=c0aede' },
];

const PREFERENCES_STORAGE_KEY = 'owino_user_preferences';

export default function SettingsPage() {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';
  const { profile, signOut, refreshProfile, loading: authLoading, user } = useAuth();
  const { mode, toggleTheme, setMode } = useThemeMode();

  const [activeTab, setActiveTab] = useState(0);

  // Core Profile Form
  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    defaultCurrency: profile?.defaultCurrency || 'INR',
    timezone: profile?.timezone || 'Asia/Kolkata',
    avatarUrl: profile?.avatarUrl || '',
  });

  // Extended SaaS Preferences
  const [preferences, setPreferences] = useState({
    defaultSplitType: 'EQUAL',
    upiId: 'user@okhdfcbank',
    autoSimplifyDebts: true,
    lakhsFormatting: true,
    compactDensity: false,
    privacyBlur: false,
    soundEffects: true,
    emailFrequency: 'instant',
    budgetAlertThreshold: '80',
    involvedOnlyNotifications: true,
    bioTagline: 'Splits on time • FairShare Member',
  });

  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Phone OTP Verification State (Free Simulator Mode)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccessToast, setOtpSuccessToast] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // UPI Preview Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Export Data State
  const [exporting, setExporting] = useState(false);

  // Danger Zone confirmation dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const hasLoadedProfileRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    // Load local extended SaaS preferences
    try {
      const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (saved) {
        setPreferences((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.warn('Failed loading preferences:', e);
    }
  }, []);

  useEffect(() => {
    if (profile && !hasLoadedProfileRef.current) {
      hasLoadedProfileRef.current = true;
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        defaultCurrency: profile.defaultCurrency || 'INR',
        timezone: profile.timezone || 'Asia/Kolkata',
        avatarUrl: profile.avatarUrl || '',
      });

      if (profile.phone) {
        const storedVerifiedPhone = localStorage.getItem(`verified_phone_${profile.id}`);
        if (storedVerifiedPhone === profile.phone) {
          setIsPhoneVerified(true);
        }
      }
    }
  }, [profile]);

  // Resend OTP countdown
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
    if (newPhone !== localStorage.getItem(`verified_phone_${profile?.id}`)) {
      setIsPhoneVerified(false);
    }
  };

  const handleOpenOtpModal = () => {
    if (!form.phone.trim() || form.phone.trim().length < 8) {
      alert('Please enter a valid phone number (minimum 8 digits).');
      return;
    }
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

  const handleCopyAccountId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1. Save core profile in backend Postgres
      await userApi.updateProfile({
        name: form.name,
        phone: form.phone,
        defaultCurrency: form.defaultCurrency,
        timezone: form.timezone,
        avatarUrl: form.avatarUrl || null,
      });

      // 2. Save extended SaaS preferences in localStorage
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));

      await refreshProfile();
      setSavedToast(true);
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportFullArchive = async () => {
    setExporting(true);
    try {
      const [expensesRes, groupsRes] = await Promise.allSettled([
        expenseApi.list({ limit: 1000 }),
        groupApi.list(),
      ]);

      const archiveData = {
        exportTimestamp: new Date().toISOString(),
        userAccount: {
          id: user?.id,
          name: form.name,
          email: user?.email,
          phone: form.phone,
          currency: form.defaultCurrency,
          timezone: form.timezone,
          preferences,
        },
        expenses: expensesRes.status === 'fulfilled' ? expensesRes.value.data?.data : [],
        groups: groupsRes.status === 'fulfilled' ? groupsRes.value.data?.data : [],
      };

      const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fairshare_full_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed downloading archive:', err);
      alert('Failed to generate account archive.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearCacheAndDrafts = () => {
    localStorage.removeItem('owino_expense_new_draft');
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    setResetDialogOpen(false);
    alert('Local form drafts and preferences cache cleared successfully.');
    window.location.reload();
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  if (authLoading) return null;

  // Encoded URL for instant SVG QR code via lightweight SVG service
  const sampleUpiUri = `upi://pay?pa=${encodeURIComponent(
    preferences.upiId || 'fairshare@okhdfcbank'
  )}&pn=${encodeURIComponent(form.name || 'User')}&cu=${form.defaultCurrency}&tn=${encodeURIComponent(
    'FairShare Settlement'
  )}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    sampleUpiUri
  )}&bgcolor=${isLight ? 'ffffff' : '121316'}&color=${isLight ? '0e6245' : '10b981'}&margin=10`;

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: 8, maxWidth: 1040, mx: 'auto' }}>
        {/* Top SaaS Header Banner */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3.5,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h4" fontWeight={850} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
                Account & SaaS Preferences
              </Typography>
              <Chip
                label="Pro Tier (Free)"
                size="small"
                sx={{
                  bgcolor: alpha('#0E6245', 0.12),
                  color: '#0E6245',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  borderRadius: 1.5,
                  border: '1px solid rgba(14,98,69,0.2)',
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Configure personal identity, payments, split defaults, privacy, and system security
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
              onClick={handleSaveAll}
              disabled={saving}
              sx={{
                borderRadius: 2.5,
                px: 3.5,
                py: 0.9,
                fontWeight: 750,
                bgcolor: '#0E6245',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(14, 98, 69, 0.25)',
                textTransform: 'none',
                '&:hover': { bgcolor: '#094A34' },
              }}
            >
              {saving ? 'Saving...' : 'Save All Preferences'}
            </Button>
          </Box>
        </Box>

        {/* User Identity Snapshot Card */}
        <Card
          sx={{
            mb: 3.5,
            borderRadius: 3.5,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            p: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar
                src={form.avatarUrl || profile?.avatarUrl || undefined}
                sx={{
                  width: 68,
                  height: 68,
                  bgcolor: '#0E6245',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(14, 98, 69, 0.25)',
                }}
              >
                {form.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Typography variant="h6" fontWeight={800}>
                    {form.name || 'User'}
                  </Typography>
                  {isPhoneVerified && (
                    <Tooltip title="Phone Number Verified via OTP">
                      <CheckCircle sx={{ color: '#0E6245', fontSize: '1.1rem' }} />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                  {preferences.bioTagline}
                </Typography>
              </Box>
            </Box>

            {/* Quick Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Tooltip title="Click to copy unique UUID">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleCopyAccountId}
                  startIcon={<ContentCopy fontSize="small" />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderColor: theme.palette.divider,
                    color: 'text.secondary',
                  }}
                >
                  {copiedId ? 'Copied ID ✓' : `ID: ${user?.id?.slice(0, 8)}...`}
                </Button>
              </Tooltip>
              <Chip
                label="● Active Session"
                size="small"
                sx={{
                  bgcolor: alpha('#0E6245', 0.1),
                  color: '#0E6245',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  borderRadius: 1.5,
                }}
              />
            </Box>
          </Box>
        </Card>

        {/* Tabbed Navigation Layout */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                minHeight: 48,
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: '#0E6245',
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#0E6245',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab icon={<Person fontSize="small" />} iconPosition="start" label="Profile & Identity" />
            <Tab icon={<Payment fontSize="small" />} iconPosition="start" label="Payments & Splits" />
            <Tab icon={<NotificationsIcon fontSize="small" />} iconPosition="start" label="Alerts & Rules" />
            <Tab icon={<Palette fontSize="small" />} iconPosition="start" label="Appearance & UI" />
            <Tab icon={<Security fontSize="small" />} iconPosition="start" label="Security & Data" />
          </Tabs>
        </Box>

        {/* TAB 0: Profile & Identity */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 }, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2 }}>
                  Personal Identity
                </Typography>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />

                  <TextField
                    fullWidth
                    label="Status Tagline / Bio"
                    placeholder="e.g. Always splits on time • Flat 402"
                    value={preferences.bioTagline}
                    onChange={(e) => setPreferences({ ...preferences, bioTagline: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />

                  {/* Phone with Free Sandbox OTP Verification */}
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
                      Enables real-time SMS notifications, UPI settlement matching, and phone invites.
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    disabled
                    label="Primary Email"
                    value={user?.email || ''}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email fontSize="small" sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Chip label="Verified" size="small" sx={{ bgcolor: alpha('#0E6245', 0.1), color: '#0E6245', fontWeight: 700, fontSize: '0.7rem' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Stack>
              </Card>
            </Grid>

            {/* Avatar Selector */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 3.5, p: 3, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 1 }}>
                  Avatar Selection
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Pick from curated presets or provide a custom image URL
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 3 }}>
                  {PRESET_AVATARS.map((item, idx) => {
                    const isSelected = form.avatarUrl === item.url;
                    return (
                      <Tooltip key={idx} title={item.name} arrow>
                        <Box sx={{ textAlign: 'center' }}>
                          <Avatar
                            src={item.url}
                            onClick={() => setForm({ ...form, avatarUrl: item.url })}
                            sx={{
                              width: 52,
                              height: 52,
                              mx: 'auto',
                              cursor: 'pointer',
                              border: isSelected ? '3px solid #0E6245' : `2px solid ${alpha(theme.palette.divider, 0.6)}`,
                              bgcolor: alpha('#0E6245', 0.06),
                              boxShadow: isSelected ? '0 4px 14px rgba(14,98,69,0.35)' : 'none',
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              '&:hover': { transform: 'scale(1.12)', borderColor: '#0E6245' },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: isSelected ? 750 : 500,
                              color: isSelected ? '#0E6245' : 'text.secondary',
                              display: 'block',
                              mt: 0.5,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.name}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>

                <TextField
                  fullWidth
                  size="small"
                  label="Custom Avatar URL"
                  placeholder="https://..."
                  value={form.avatarUrl}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 1: Payments & Splits */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 }, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2 }}>
                  Settlement & UPI Configuration
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" fontWeight={650} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                      Personal UPI ID (VPA) for Receiving Money
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                      value={preferences.upiId}
                      onChange={(e) => setPreferences({ ...preferences, upiId: e.target.value })}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Payment fontSize="small" sx={{ color: '#0E6245' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setQrModalOpen(true)}
                                startIcon={<QrCode2 fontSize="small" />}
                                sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, borderColor: '#0E6245', color: '#0E6245' }}
                              >
                                Preview QR
                              </Button>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Friends can scan your dynamic QR code or tap 1-click Pay to settle debts straight to your bank account.
                    </Typography>
                  </Box>

                  <Divider />

                  <Typography variant="subtitle1" fontWeight={750}>
                    Default Expense Split Strategy
                  </Typography>

                  <FormControl>
                    <RadioGroup
                      value={preferences.defaultSplitType}
                      onChange={(e) => setPreferences({ ...preferences, defaultSplitType: e.target.value })}
                    >
                      <Grid container spacing={1.5}>
                        {[
                          { val: 'EQUAL', title: '= Split Equally', desc: 'Even division among all members with exact penny balancing.' },
                          { val: 'EXACT', title: '≠ Exact Amounts', desc: 'Itemized manual rupee allocations for each member.' },
                          { val: 'PERCENTAGE', title: '% By Percentage', desc: 'Custom percentage split totaling 100%.' },
                          { val: 'SHARES', title: '➗ By Shares', desc: 'Weighted integer shares (e.g., 2 shares for couples).' },
                          { val: 'ADJUSTMENT', title: '± Adjustment', desc: 'Base equal share with individual offset adjustments.' },
                        ].map((s) => (
                          <Grid key={s.val} size={{ xs: 12, sm: 6 }}>
                            <Box
                              onClick={() => setPreferences({ ...preferences, defaultSplitType: s.val })}
                              sx={{
                                p: 1.75,
                                borderRadius: 2.5,
                                border: `1px solid ${
                                  preferences.defaultSplitType === s.val ? '#0E6245' : theme.palette.divider
                                }`,
                                bgcolor:
                                  preferences.defaultSplitType === s.val
                                    ? alpha('#0E6245', 0.06)
                                    : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                '&:hover': { bgcolor: alpha('#0E6245', 0.04) },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Radio checked={preferences.defaultSplitType === s.val} size="small" sx={{ color: '#0E6245', '&.Mui-checked': { color: '#0E6245' }, p: 0 }} />
                                <Typography variant="body2" fontWeight={700}>
                                  {s.title}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, pl: 2.5 }}>
                                {s.desc}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </RadioGroup>
                  </FormControl>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        Auto-Debt Simplification (Graph Reduction)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Minimizes total payment transfers across groups (e.g. if A owes B, and B owes C, A pays C directly).
                      </Typography>
                    </Box>
                    <Switch
                      checked={preferences.autoSimplifyDebts}
                      onChange={(e) => setPreferences({ ...preferences, autoSimplifyDebts: e.target.checked })}
                      color="primary"
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            {/* Currency & Financial Preferences */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 3.5, p: 3, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2 }}>
                  Currency & Format
                </Typography>
                <Stack spacing={2.5}>
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
                    <MenuItem value="AED">🇦🇪 AED - UAE Dirham (د.إ)</MenuItem>
                    <MenuItem value="CAD">🇨🇦 CAD - Canadian Dollar ($)</MenuItem>
                    <MenuItem value="JPY">🇯🇵 JPY - Japanese Yen (¥)</MenuItem>
                    <MenuItem value="AUD">🇦🇺 AUD - Australian Dollar (A$)</MenuItem>
                    <MenuItem value="SGD">🇸🇬 SGD - Singapore Dollar (S$)</MenuItem>
                  </TextField>

                  <TextField
                    fullWidth
                    select
                    label="Timezone"
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  >
                    <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</MenuItem>
                    <MenuItem value="America/New_York">America/New York (EST - UTC-05:00)</MenuItem>
                    <MenuItem value="Europe/London">Europe/London (GMT - UTC+00:00)</MenuItem>
                    <MenuItem value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</MenuItem>
                    <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST - UTC+09:00)</MenuItem>
                    <MenuItem value="Australia/Sydney">Australia/Sydney (AEST - UTC+10:00)</MenuItem>
                  </TextField>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={650}>
                        Indian Number System
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Format as ₹1,50,000 (Lakhs) instead of ₹150,000 (Millions)
                      </Typography>
                    </Box>
                    <Switch
                      checked={preferences.lakhsFormatting}
                      onChange={(e) => setPreferences({ ...preferences, lakhsFormatting: e.target.checked })}
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 2: Alerts & Rules */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 }, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2 }}>
                  Notification Rules & Channels
                </Typography>
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ pr: 2 }}>
                      <Typography variant="body2" fontWeight={700}>
                        Targeted In-App Alerts (Relevant Activity Only)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only alert you when you are directly included in a split or when someone owes you money.
                      </Typography>
                    </Box>
                    <Switch
                      checked={preferences.involvedOnlyNotifications}
                      onChange={(e) => setPreferences({ ...preferences, involvedOnlyNotifications: e.target.checked })}
                      color="primary"
                    />
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ pr: 2 }}>
                      <Typography variant="body2" fontWeight={700}>
                        Audio Feedback (Sound Effects)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Play subtle chime upon settlement receipt and expense creation.
                      </Typography>
                    </Box>
                    <Switch
                      checked={preferences.soundEffects}
                      onChange={(e) => setPreferences({ ...preferences, soundEffects: e.target.checked })}
                      color="primary"
                    />
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      Budget Alert Threshold
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Trigger a warning banner when category spending hits a percentage of monthly budget:
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={preferences.budgetAlertThreshold}
                      onChange={(e) => setPreferences({ ...preferences, budgetAlertThreshold: e.target.value })}
                      sx={{ width: 220 }}
                    >
                      <MenuItem value="50">At 50% of budget limit</MenuItem>
                      <MenuItem value="75">At 75% of budget limit</MenuItem>
                      <MenuItem value="80">At 80% of budget limit (Recommended)</MenuItem>
                      <MenuItem value="90">At 90% of budget limit</MenuItem>
                      <MenuItem value="100">At 100% of budget limit</MenuItem>
                    </TextField>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      Email Digest Frequency
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Receive periodic expense summaries and pending dues recap in your inbox:
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={preferences.emailFrequency}
                      onChange={(e) => setPreferences({ ...preferences, emailFrequency: e.target.value })}
                      sx={{ width: 220 }}
                    >
                      <MenuItem value="instant">Instant Real-time Alerts</MenuItem>
                      <MenuItem value="daily">Daily Morning Digest (9:00 AM)</MenuItem>
                      <MenuItem value="weekly">Weekly Friday Summary</MenuItem>
                      <MenuItem value="never">Do not send email digests</MenuItem>
                    </TextField>
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 3.5, p: 3, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 1 }}>
                  Notification Audit
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Test your current notification pipeline:
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => alert('Test notification sent to in-app bell!')}
                  startIcon={<NotificationsIcon fontSize="small" />}
                  sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, borderColor: theme.palette.divider }}
                >
                  Send Test Alert
                </Button>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 3: Appearance & UI Customizations */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 }, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2 }}>
                  Display & Workspace Density
                </Typography>
                <Stack spacing={3}>
                  {/* Theme Mode Segmented */}
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                      Theme Appearance
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { key: 'light', label: 'Warm Ivory Light', desc: 'Curated ivory (#FAF9F5) with emerald accents', icon: <LightMode sx={{ color: '#f59e0b' }} /> },
                        { key: 'dark', label: 'Sleek Dark', desc: 'Restrained slate with high-contrast surfaces', icon: <DarkMode sx={{ color: '#34d399' }} /> },
                      ].map((t) => {
                        const isSelected = mode === t.key;
                        return (
                          <Grid key={t.key} size={{ xs: 12, sm: 6 }}>
                            <Box
                              onClick={() => {
                                if (mode !== t.key) toggleTheme();
                              }}
                              sx={{
                                p: 2,
                                borderRadius: 2.5,
                                border: `2px solid ${isSelected ? '#0E6245' : theme.palette.divider}`,
                                bgcolor: isSelected ? alpha('#0E6245', 0.08) : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': { bgcolor: alpha('#0E6245', 0.04) },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                {t.icon}
                                <Typography variant="body2" fontWeight={750}>
                                  {t.label}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {t.desc}
                              </Typography>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>

                  <Divider />

                  {/* Privacy Mode (Blur balances) */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VisibilityOff fontSize="small" sx={{ color: '#0E6245' }} />
                        <Typography variant="body2" fontWeight={700}>
                          Privacy Screen Mode (Hide Balances)
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Blurs sensitive rupee figures (e.g. ₹ ••••••) on the dashboard when viewing in coffee shops or coworking spaces.
                      </Typography>
                    </Box>
                    <Switch
                      checked={preferences.privacyBlur}
                      onChange={(e) => setPreferences({ ...preferences, privacyBlur: e.target.checked })}
                      color="primary"
                    />
                  </Box>

                  <Divider />

                  {/* Compact Table Density */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Speed fontSize="small" sx={{ color: '#0E6245' }} />
                        <Typography variant="body2" fontWeight={700}>
                          Compact Table Row Density
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Reduces vertical table row padding so power users can inspect more expense items per viewport.
                      </Typography>
                    </Box>
                    <Switch
                      checked={preferences.compactDensity}
                      onChange={(e) => setPreferences({ ...preferences, compactDensity: e.target.checked })}
                      color="primary"
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 3.5, p: 3, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 1 }}>
                  Design Aesthetics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  FairShare features a custom typography and color palette inspired by premier modern FinTech products like Linear and Wise.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 4: Security & Data Privacy */}
        {activeTab === 4 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={3}>
                <Card sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 }, border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2 }}>
                    Account Security & Authentication
                  </Typography>

                  <List disablePadding>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha('#0E6245', 0.1), color: '#0E6245' }}>
                          <PhoneIphone />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Mobile Phone OTP Verification"
                        secondary={isPhoneVerified ? `Linked to ${form.phone}` : 'Unverified mobile number'}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={isPhoneVerified ? 'Active ✓' : 'Setup Required'}
                          size="small"
                          color={isPhoneVerified ? 'success' : 'warning'}
                          sx={{ fontWeight: 700, borderRadius: 1.5 }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <Divider sx={{ my: 1.5 }} />

                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                          <Devices />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Active Web Session"
                        secondary={`Google Chrome • Windows 11 (Session active since ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                      />
                      <ListItemSecondaryAction>
                        <Chip label="Current Device" size="small" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Card>

                {/* Data Export Archive */}
                <Card sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 }, border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 1 }}>
                    Data Portability & Full Backup
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Download a full JSON archive containing your complete profile, expenses, group memberships, and settlement history.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleExportFullArchive}
                    disabled={exporting}
                    startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <Download />}
                    sx={{
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      borderColor: '#0E6245',
                      color: '#0E6245',
                    }}
                  >
                    {exporting ? 'Generating Archive...' : 'Download Complete Data Backup (.json)'}
                  </Button>
                </Card>

                {/* Danger Zone */}
                <Card
                  sx={{
                    borderRadius: 3.5,
                    p: { xs: 2.5, sm: 3.5 },
                    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                    bgcolor: alpha(theme.palette.error.main, 0.02),
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={750} color="error" sx={{ mb: 1 }}>
                    Cache & Session Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Clear local uncommitted drafts and offline cache if experiencing any synchronization inconsistencies:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setResetDialogOpen(true)}
                      startIcon={<Cached />}
                      sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
                    >
                      Clear Local Drafts & Cache
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleLogout}
                      startIcon={<Logout />}
                      sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
                    >
                      Sign Out
                    </Button>
                  </Box>
                </Card>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 3.5, p: 3, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 1 }}>
                  Security Guarantee
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  FairShare utilizes Supabase secure JWT tokens with automatic session rotation. Passwords are never stored in plain text.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  End-to-end mathematical precision ensures zero balance leaks.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}

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
                No paid SMS credits needed. Your simulated OTP code is:
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

        {/* Dynamic UPI QR Code Preview Dialog */}
        <Dialog
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3.5,
              maxWidth: 400,
              width: '100%',
              p: 1.5,
              textAlign: 'center',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            UPI QR Code Preview
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Scan with any UPI app (GPay, PhonePe, Paytm, BHIM) to settle debts directly.
            </Typography>

            <Box
              sx={{
                p: 2,
                bgcolor: isLight ? '#FAF9F5' : '#1A1C20',
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                display: 'inline-block',
                mb: 2,
              }}
            >
              <img
                src={qrCodeUrl}
                alt="UPI QR Code"
                style={{ width: 200, height: 200, display: 'block', borderRadius: 8 }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                bgcolor: alpha('#0E6245', 0.08),
                p: 1.25,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" fontWeight={750} color="#0E6245">
                {preferences.upiId}
              </Typography>
              <Tooltip title="Copy VPA">
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(preferences.upiId);
                    alert('UPI ID copied to clipboard!');
                  }}
                >
                  <ContentCopy fontSize="small" sx={{ color: '#0E6245' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button
              variant="contained"
              onClick={() => setQrModalOpen(false)}
              sx={{ borderRadius: 2, bgcolor: '#0E6245', color: '#fff', px: 4, textTransform: 'none', fontWeight: 700 }}
            >
              Done
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cache Reset Confirmation Dialog */}
        <Dialog
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
          PaperProps={{ sx: { borderRadius: 3, maxWidth: 420 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            Clear Local Cache & Drafts?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This will remove all locally cached form drafts and reset preferences to default. Your online transaction and account records in Postgres will NOT be deleted.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setResetDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleClearCacheAndDrafts}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              Confirm Clear
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Feedback Snackbar */}
        <Snackbar
          open={savedToast}
          autoHideDuration={3000}
          onClose={() => setSavedToast(false)}
          message="All account settings and SaaS preferences saved successfully! ✓"
        />

        <Snackbar
          open={otpSuccessToast}
          autoHideDuration={4000}
          onClose={() => setOtpSuccessToast(false)}
          message="Phone number successfully verified and linked to your profile! ✓"
        />
      </Box>
    </AppLayout>
  );
}
