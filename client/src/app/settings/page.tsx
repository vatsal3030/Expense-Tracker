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
  CurrencyExchange, Calculate, Speed, VolumeUp, Email, LockReset, Gavel,
  OpenInNew, ContactMail, VerifiedUser,
} from '@mui/icons-material';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { userApi, expenseApi, groupApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

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
  const { profile, signOut, refreshProfile, loading: authLoading, user, updatePassword } = useAuth();
  const { mode, toggleTheme, setMode } = useThemeMode();

  const [activeTab, setActiveTab] = useState(0);

  // Core Profile Form
  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
  const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';

  const [form, setForm] = useState({
    name: profile?.name || googleName || '',
    username: profile?.username || '',
    phone: profile?.phone || '',
    defaultCurrency: profile?.defaultCurrency || 'INR',
    timezone: profile?.timezone || 'Asia/Kolkata',
    avatarUrl: profile?.avatarUrl || googleAvatar || '',
  });

  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    isCurrent?: boolean;
    message?: string;
  }>({ checking: false });

  // Extended User Preferences
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
  const [saveErrorToast, setSaveErrorToast] = useState<string | null>(null);
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
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [generatingQr, setGeneratingQr] = useState<boolean>(true);

  // Export Data State
  const [exporting, setExporting] = useState(false);

  // Danger Zone confirmation dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordToast({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordToast({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      setPasswordToast({ type: 'error', message: error });
    } else {
      setPasswordToast({ type: 'success', message: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmNewPassword('');
    }
    setUpdatingPassword(false);
  };

  const hasLoadedProfileRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    // Load local extended user preferences
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
      const gAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
      const gName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
      setForm({
        name: profile.name || gName || '',
        username: profile.username || '',
        phone: profile.phone || '',
        defaultCurrency: profile.defaultCurrency || 'INR',
        timezone: profile.timezone || 'Asia/Kolkata',
        avatarUrl: profile.avatarUrl || gAvatar || '',
      });

      if (profile.phone) {
        const storedVerifiedPhone = localStorage.getItem(`verified_phone_${profile.id}`);
        if (storedVerifiedPhone === profile.phone) {
          setIsPhoneVerified(true);
        }
      }
    }
  }, [profile, user]);

  // Debounced Username Availability Check
  useEffect(() => {
    const raw = form.username?.trim().toLowerCase();
    if (!raw) {
      setUsernameStatus({ checking: false, message: 'Username cannot be blank' });
      return;
    }
    if (profile?.username && raw === profile.username.toLowerCase()) {
      setUsernameStatus({ checking: false, available: true, isCurrent: true, message: 'Current handle' });
      return;
    }
    if (raw.length < 3 || raw.length > 30) {
      setUsernameStatus({ checking: false, available: false, message: 'Must be 3-30 characters' });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(raw)) {
      setUsernameStatus({ checking: false, available: false, message: 'Letters, numbers & underscore only' });
      return;
    }

    setUsernameStatus({ checking: true });
    const timer = setTimeout(async () => {
      try {
        const res = await userApi.checkUsername(raw);
        if (res.data?.success && res.data?.data) {
          setUsernameStatus({
            checking: false,
            available: res.data.data.available,
            isCurrent: res.data.data.isCurrent,
            message: res.data.data.message,
          });
        }
      } catch (err: any) {
        setUsernameStatus({ checking: false, available: false, message: 'Failed to verify availability' });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form.username, profile?.username]);

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
    if (usernameStatus.available === false && !usernameStatus.isCurrent) {
      setSaveErrorToast(usernameStatus.message || 'Please choose a valid and available username.');
      return;
    }

    setSaving(true);
    setSaveErrorToast(null);
    try {
      // 1. Save core profile in backend Postgres
      await userApi.updateProfile({
        name: form.name?.trim() || undefined,
        username: form.username?.trim().toLowerCase() || undefined,
        phone: form.phone?.trim() || null,
        defaultCurrency: form.defaultCurrency,
        timezone: form.timezone,
        avatarUrl: form.avatarUrl?.trim() || null,
      });

      // 2. Save extended preferences in localStorage
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));

      await refreshProfile();
      setSavedToast(true);
    } catch (error: any) {
      console.error('Save profile error:', error);
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save settings. Please ensure your connection is active and try again.';
      setSaveErrorToast(msg);
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


  // Standard UPI URI format
  const sampleUpiUri = `upi://pay?pa=${encodeURIComponent(
    preferences.upiId || 'fairshare@okhdfcbank'
  )}&pn=${encodeURIComponent(form.name || 'User')}&cu=${form.defaultCurrency}&tn=${encodeURIComponent(
    'FairShare Settlement'
  )}`;

  useEffect(() => {
    if (!sampleUpiUri) return;
    let isMounted = true;
    setGeneratingQr(true);

    QRCode.toDataURL(sampleUpiUri, {
      width: 440,
      margin: 2,
      color: {
        dark: isLight ? '#0F172A' : '#34D399',
        light: isLight ? '#FFFFFF' : '#141821',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setQrCodeUrl(url);
          setGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate local QR:', err);
        if (isMounted) setGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sampleUpiUri, isLight]);

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: 8, maxWidth: { xs: '100%', md: 1040 }, mx: 'auto', width: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Header Banner */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3.5,
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <Box sx={{ maxWidth: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="h4" fontWeight={850} sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2.125rem' } }}>
                Account Preferences
              </Typography>
              <Chip
                label="Personal Account"
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
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Configure personal identity, payments, split defaults, privacy, and system security
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
              onClick={handleSaveAll}
              disabled={saving}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                borderRadius: 2.5,
                px: 3.5,
                py: 1,
                fontWeight: 650,
                color: '#ffffff',
                textTransform: 'none',
              }}
            >
              {saving ? 'Saving...' : 'Save All Preferences'}
            </Button>
          </Box>
        </Box>

        {/* User Identity Snapshot Card */}
        <Card
          className="glass-secondary glass-specular-top glass-emerald-ambient"
          sx={{
            mb: 3.5,
            borderRadius: 3.5,
            p: { xs: 2, sm: 3 },
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: 'wrap',
              gap: 2.5,
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: '100%' }}>
              <Avatar
                src={form.avatarUrl || profile?.avatarUrl || undefined}
                sx={{
                  width: { xs: 54, sm: 68 },
                  height: { xs: 54, sm: 68 },
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  fontSize: { xs: '1.4rem', sm: '1.75rem' },
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {form.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                  <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.01em', color: 'text.primary', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                    {form.name || 'User'}
                  </Typography>
                  {(form.username || profile?.username) && (
                    <Chip
                      label={`@${form.username || profile?.username}`}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        bgcolor: 'rgba(52, 211, 153, 0.1)',
                        color: '#34D399',
                        border: '1px solid rgba(52, 211, 153, 0.25)',
                      }}
                    />
                  )}
                  {isPhoneVerified && (
                    <Tooltip title="Phone Number Verified via OTP">
                      <CheckCircle sx={{ color: '#34D399', fontSize: '1.1rem' }} />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' }, wordBreak: 'break-all' }}>
                  {user?.email}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                  {preferences.bioTagline}
                </Typography>
              </Box>
            </Box>

            {/* Quick Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
              <Tooltip title="Click to copy unique UUID">
                <Button
                  size="small"
                  variant="outlined"
                  className="glass-tertiary"
                  onClick={handleCopyAccountId}
                  startIcon={<ContentCopy fontSize="small" />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      borderColor: 'rgba(16, 185, 129, 0.4)',
                      color: '#34D399',
                    },
                  }}
                >
                  {copiedId ? 'Copied ID ✓' : `ID: ${user?.id?.slice(0, 8)}...`}
                </Button>
              </Tooltip>
              <Chip
                label="● Active Session"
                size="small"
                className="glass-tertiary"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34D399',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  borderRadius: 2,
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                }}
              />
            </Box>
          </Box>
        </Card>

        {/* Segmented Liquid Glass Tabs */}
        <Box sx={{ mb: 3, width: '100%', maxWidth: '100%', minWidth: 0 }}>
          <Box
            className="glass-tertiary"
            sx={{
              display: 'flex',
              p: 0.5,
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 40,
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                '& .MuiTabs-scroller': {
                  overflowX: 'auto !important',
                },
                '& .MuiTabs-indicator': {
                  height: '100%',
                  borderRadius: 2.5,
                  bgcolor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  zIndex: 0,
                },
                '& .MuiTab-root': {
                  zIndex: 1,
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '0.85rem',
                  minHeight: 38,
                  px: 2.5,
                  borderRadius: 2.5,
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    color: '#34D399',
                  },
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
        </Box>

        {/* TAB 0: Profile & Identity */}
        {activeTab === 0 && (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card
                className="glass-secondary glass-specular-top"
                sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 } }}
              >
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2, color: 'text.primary', letterSpacing: '-0.01em' }}>
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

                  {/* Unique Username Handle */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                      <Typography variant="caption" fontWeight={650} color="text.secondary">
                        Unique Username Handle
                      </Typography>
                      {usernameStatus.checking ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <CircularProgress size={12} color="inherit" />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                            Checking...
                          </Typography>
                        </Box>
                      ) : usernameStatus.isCurrent ? (
                        <Chip
                          label="Current handle ✓"
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            bgcolor: 'rgba(52, 211, 153, 0.12)',
                            color: '#34D399',
                            borderRadius: 1.5,
                            border: '1px solid rgba(52, 211, 153, 0.3)',
                          }}
                        />
                      ) : usernameStatus.available ? (
                        <Chip
                          icon={<CheckCircle fontSize="small" sx={{ color: '#34D399 !important', fontSize: '14px !important' }} />}
                          label="Available ✓"
                          size="small"
                          sx={{
                            fontWeight: 750,
                            fontSize: '0.7rem',
                            bgcolor: 'rgba(16, 185, 129, 0.15)',
                            color: '#34D399',
                            borderRadius: 1.5,
                            border: '1px solid rgba(52, 211, 153, 0.3)',
                          }}
                        />
                      ) : (
                        <Chip
                          icon={<WarningAmber fontSize="small" sx={{ color: '#EF4444 !important', fontSize: '14px !important' }} />}
                          label={usernameStatus.message || 'Unavailable'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            bgcolor: 'rgba(239, 68, 68, 0.12)',
                            color: '#EF4444',
                            borderRadius: 1.5,
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                          }}
                        />
                      )}
                    </Box>
                    <TextField
                      fullWidth
                      placeholder="e.g. alex_chen"
                      value={form.username}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                        })
                      }
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.95rem' }}>
                                @
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                      }}
                      helperText="Your unique handle. Friends can search, mention, and split expenses with you using @username."
                    />
                  </Box>

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
                          icon={<CheckCircle fontSize="small" sx={{ color: '#34D399 !important' }} />}
                          label="Verified ✓"
                          size="small"
                          className="glass-tertiary"
                          sx={{
                            fontWeight: 750,
                            fontSize: '0.72rem',
                            bgcolor: 'rgba(16, 185, 129, 0.15)',
                            color: '#34D399',
                            borderRadius: 2,
                            border: '1px solid rgba(52, 211, 153, 0.3)',
                          }}
                        />
                      ) : form.phone ? (
                        <Chip
                          icon={<WarningAmber fontSize="small" sx={{ color: '#F59E0B !important' }} />}
                          label="Unverified"
                          size="small"
                          className="glass-tertiary"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            bgcolor: 'rgba(245, 158, 11, 0.12)',
                            color: '#F59E0B',
                            borderRadius: 2,
                            border: '1px solid rgba(245, 158, 11, 0.3)',
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
                                  sx={{ textTransform: 'none', fontWeight: 600, color: '#34D399' }}
                                >
                                  Linked
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="small"
                                  variant="contained"
                                  className="glass-emerald-active"
                                  onClick={handleOpenOtpModal}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    color: '#FFFFFF',
                                    borderRadius: 2,
                                    px: 1.75,
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
                            <Chip
                              label="Verified"
                              size="small"
                              className="glass-tertiary"
                              sx={{
                                bgcolor: 'rgba(16, 185, 129, 0.15)',
                                color: '#34D399',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                border: '1px solid rgba(52, 211, 153, 0.25)',
                              }}
                            />
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
              <Card
                className="glass-secondary glass-specular-top"
                sx={{ borderRadius: 3.5, p: 3 }}
              >
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 1, color: 'text.primary' }}>
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
                              border: isSelected ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.12)',
                              bgcolor: 'rgba(255, 255, 255, 0.04)',
                              boxShadow: isSelected ? '0 0 0 2px rgba(16, 185, 129, 0.35)' : 'none',
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                borderColor: '#10B981',
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: isSelected ? 750 : 500,
                              color: isSelected ? '#34D399' : 'text.secondary',
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
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card
                className="glass-secondary glass-specular-top"
                sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 } }}
              >
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2, color: 'text.primary', letterSpacing: '-0.01em' }}>
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
                              <Payment fontSize="small" sx={{ color: '#34D399' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                size="small"
                                variant="outlined"
                                className="glass-tertiary"
                                onClick={() => setQrModalOpen(true)}
                                startIcon={<QrCode2 fontSize="small" />}
                                sx={{
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  color: '#34D399',
                                  border: '1px solid rgba(52, 211, 153, 0.3)',
                                  '&:hover': {
                                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                                  },
                                }}
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

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                  <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary' }}>
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
                              className="glass-tertiary"
                              sx={{
                                p: 1.75,
                                borderRadius: 2.5,
                                border: preferences.defaultSplitType === s.val
                                  ? '1px solid rgba(16, 185, 129, 0.45)'
                                  : '1px solid rgba(255, 255, 255, 0.08)',
                                bgcolor: preferences.defaultSplitType === s.val
                                  ? 'rgba(16, 185, 129, 0.10)'
                                  : undefined,
                                cursor: 'pointer',
                                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                                '&:hover': {
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Radio
                                  checked={preferences.defaultSplitType === s.val}
                                  size="small"
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.3)',
                                    '&.Mui-checked': { color: '#34D399' },
                                    p: 0,
                                  }}
                                />
                                <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
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

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
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
              <Card
                className="glass-secondary glass-specular-top"
                sx={{ borderRadius: 3.5, p: 3 }}
              >
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2, color: 'text.primary' }}>
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

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={650} sx={{ color: 'text.primary' }}>
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
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card
                className="glass-secondary glass-specular-top"
                sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 } }}
              >
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2, color: 'text.primary', letterSpacing: '-0.01em' }}>
                  Notification Rules & Channels
                </Typography>
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ pr: 2 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
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

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ pr: 2 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
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

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5, color: 'text.primary' }}>
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
                      sx={{ width: 240 }}
                    >
                      <MenuItem value="50">At 50% of budget limit</MenuItem>
                      <MenuItem value="75">At 75% of budget limit</MenuItem>
                      <MenuItem value="80">At 80% of budget limit (Recommended)</MenuItem>
                      <MenuItem value="90">At 90% of budget limit</MenuItem>
                      <MenuItem value="100">At 100% of budget limit</MenuItem>
                    </TextField>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5, color: 'text.primary' }}>
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
                      sx={{ width: 240 }}
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
              <Card
                className="glass-secondary glass-specular-top"
                sx={{ borderRadius: 3.5, p: 3 }}
              >
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 1, color: 'text.primary' }}>
                  Notification Audit
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Test your current notification pipeline:
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  className="glass-tertiary"
                  onClick={() => alert('Test notification sent to in-app bell!')}
                  startIcon={<NotificationsIcon fontSize="small" />}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2.5,
                    fontWeight: 650,
                    color: 'text.primary',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    '&:hover': {
                      borderColor: 'rgba(16, 185, 129, 0.4)',
                      color: '#34D399',
                    },
                  }}
                >
                  Send Test Alert
                </Button>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 3: Appearance & UI Customizations */}
        {activeTab === 3 && (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card
                className="glass-secondary glass-specular-top"
                sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 } }}
              >
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2, color: 'text.primary', letterSpacing: '-0.01em' }}>
                  Display & Workspace Density
                </Typography>
                <Stack spacing={3}>
                  {/* Theme Mode Segmented */}
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: 'text.primary' }}>
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
                              className="glass-tertiary"
                              sx={{
                                p: 2,
                                borderRadius: 2.5,
                                border: isSelected
                                  ? '1px solid rgba(16, 185, 129, 0.45)'
                                  : '1px solid rgba(255, 255, 255, 0.08)',
                                bgcolor: isSelected ? 'rgba(16, 185, 129, 0.10)' : undefined,
                                cursor: 'pointer',
                                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                                '&:hover': {
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                {t.icon}
                                <Typography variant="body2" fontWeight={750} sx={{ color: 'text.primary' }}>
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

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                  {/* Privacy Mode (Blur balances) */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VisibilityOff fontSize="small" sx={{ color: '#34D399' }} />
                        <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
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

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                  {/* Compact Table Density */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Speed fontSize="small" sx={{ color: '#34D399' }} />
                        <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
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
              <Card
                className="glass-secondary glass-specular-top"
                sx={{ borderRadius: 3.5, p: 3 }}
              >
                <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 1, color: 'text.primary' }}>
                  Design Aesthetics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  FairShare features a custom Apple visionOS and macOS-inspired Liquid Glass design language with emerald ambient lighting and layered specular depth.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* TAB 4: Security & Data Privacy */}
        {activeTab === 4 && (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={3}>
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 } }}
                >
                  <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 2, color: 'text.primary', letterSpacing: '-0.01em' }}>
                    Account Security & Authentication
                  </Typography>

                  <List disablePadding>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                          <PhoneIphone />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>Mobile Phone OTP Verification</Typography>}
                        secondary={isPhoneVerified ? `Linked to ${form.phone}` : 'Unverified mobile number'}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={isPhoneVerified ? 'Active ✓' : 'Setup Required'}
                          size="small"
                          className="glass-tertiary"
                          sx={{
                            fontWeight: 700,
                            borderRadius: 2,
                            color: isPhoneVerified ? '#34D399' : '#F59E0B',
                            bgcolor: isPhoneVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            border: `1px solid ${isPhoneVerified ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                          <Devices />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>Active Web Session</Typography>}
                        secondary={`Google Chrome • Windows 11 (Session active since ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label="Current Device"
                          size="small"
                          className="glass-tertiary"
                          sx={{ fontWeight: 700, borderRadius: 2, color: 'text.secondary', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Card>

                {/* Password & Security Card */}
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 } }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <LockReset sx={{ color: '#34D399' }} />
                    <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary' }}>
                      Change Password
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Update your account password. Must be at least 8 characters long.
                  </Typography>

                  {passwordToast && (
                    <Alert
                      severity={passwordToast.type}
                      onClose={() => setPasswordToast(null)}
                      sx={{ mb: 2.5, borderRadius: 2.5 }}
                    >
                      {passwordToast.message}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleChangePassword}>
                    <Stack spacing={2} sx={{ maxWidth: 440 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  edge="end"
                                  size="small"
                                >
                                  {showNewPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Confirm New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        error={confirmNewPassword.length > 0 && newPassword !== confirmNewPassword}
                        helperText={confirmNewPassword.length > 0 && newPassword !== confirmNewPassword ? 'Passwords do not match' : ''}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={updatingPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                        sx={{
                          py: 0.9,
                          borderRadius: 2.5,
                          fontWeight: 700,
                          bgcolor: '#059669',
                          color: '#ffffff',
                          width: 'fit-content',
                          '&:hover': { bgcolor: '#047857' },
                        }}
                      >
                        {updatingPassword ? <CircularProgress size={18} color="inherit" /> : 'Update Password'}
                      </Button>
                    </Stack>
                  </Box>
                </Card>

                {/* Data Export Archive */}
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{ borderRadius: 3.5, p: { xs: 2.5, sm: 3.5 } }}
                >
                  <Typography variant="subtitle1" fontWeight={750} sx={{ mb: 1, color: 'text.primary' }}>
                    Data Portability & Full Backup
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Download a full JSON archive containing your complete profile, expenses, group memberships, and settlement history.
                  </Typography>
                  <Button
                    variant="outlined"
                    className="glass-tertiary"
                    onClick={handleExportFullArchive}
                    disabled={exporting}
                    startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <Download />}
                    sx={{
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      color: '#34D399',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      '&:hover': {
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                      },
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
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    bgcolor: 'rgba(239, 68, 68, 0.04)',
                    backdropFilter: 'blur(20px)',
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
                      sx={{
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
                      }}
                    >
                      Clear Local Drafts & Cache
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleLogout}
                      startIcon={<Logout />}
                      sx={{
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: '#DC2626',
                        '&:hover': { bgcolor: '#B91C1C' },
                      }}
                    >
                      Sign Out
                    </Button>
                  </Box>
                </Card>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={2.5}>
                {/* Legal & Regulatory Compliance Center */}
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{
                    borderRadius: 3.5,
                    p: 2.75,
                    border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(52, 211, 153, 0.25)'}`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle top indicator bar */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: 'linear-gradient(90deg, #10B981, #3B82F6, #8B5CF6)',
                    }}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedUser sx={{ color: '#10B981', fontSize: 22 }} />
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'text.primary', letterSpacing: '-0.01em' }}>
                        Legal & Compliance Center
                      </Typography>
                    </Box>
                    <Chip
                      label="Statutory Consent Active"
                      size="small"
                      icon={<CheckCircle sx={{ fontSize: '13px !important', color: '#10B981 !important' }} />}
                      sx={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                        color: isLight ? '#0E6245' : '#34D399',
                        border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(52, 211, 153, 0.25)'}`,
                      }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem', lineHeight: 1.6 }}>
                    FairShare is governed under the <strong>Digital Personal Data Protection Act, 2023</strong> and the <strong>Information Technology Act, 2000</strong> (Republic of India). Review binding legal policies below:
                  </Typography>

                  <Stack spacing={1.5}>
                    {/* Terms of Service Nav Card */}
                    <Box
                      component={Link}
                      href="/terms"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: isLight ? 'rgba(0, 0, 0, 0.025)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: isLight ? '#0E6245' : '#10B981',
                          bgcolor: isLight ? 'rgba(14, 98, 69, 0.05)' : 'rgba(16, 185, 129, 0.08)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isLight ? 'rgba(14, 98, 69, 0.1)' : 'rgba(16, 185, 129, 0.15)',
                            color: isLight ? '#0E6245' : '#34D399',
                          }}
                        >
                          <Gavel sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={750} sx={{ fontSize: '0.84rem' }}>
                            Terms of Service
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                            P2P ledger, UPI disclaimers & jurisdiction
                          </Typography>
                        </Box>
                      </Box>
                      <OpenInNew sx={{ fontSize: 15, color: 'text.secondary', opacity: 0.7 }} />
                    </Box>

                    {/* Privacy & DPDP Act Nav Card */}
                    <Box
                      component={Link}
                      href="/privacy"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: isLight ? 'rgba(0, 0, 0, 0.025)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: isLight ? '#1D4ED8' : '#60A5FA',
                          bgcolor: isLight ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.08)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)',
                            color: isLight ? '#1D4ED8' : '#60A5FA',
                          }}
                        >
                          <Security sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={750} sx={{ fontSize: '0.84rem' }}>
                            Privacy & DPDP Notice
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                            Data Principal rights (Sec 11-14) & zero-ad policy
                          </Typography>
                        </Box>
                      </Box>
                      <OpenInNew sx={{ fontSize: 15, color: 'text.secondary', opacity: 0.7 }} />
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 2, borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)' }} />

                  {/* Statutory Grievance Redressal Officer Info */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)'}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <ContactMail sx={{ fontSize: 16, color: '#34D399' }} />
                      <Typography variant="caption" fontWeight={750} sx={{ fontSize: '0.74rem', color: 'text.primary' }}>
                        Data Protection & Grievance Officer
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem', lineHeight: 1.5 }}>
                      Maintainer: Vatsal Vadgama • <a href="mailto:vatsalvadgama04@gmail.com" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>vatsalvadgama04@gmail.com</a>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.67rem', opacity: 0.8 }}>
                      Statutory SLA: 30-day response under DPDP Rules. Escalation: Data Protection Board of India.
                    </Typography>
                  </Box>
                </Card>

                {/* Security Architecture Card */}
                <Card
                  className="glass-secondary glass-specular-top"
                  sx={{ borderRadius: 3.5, p: 2.5 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Shield sx={{ fontSize: 20, color: '#10B981' }} />
                    <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.primary' }}>
                      Security Architecture
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.78rem', lineHeight: 1.55 }}>
                    Protected by Supabase JWT cryptographic session verification, TLS 1.3 in transit, and AES-256 encrypted storage. Passwords and credentials never touch plain-text database tables.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', opacity: 0.85 }}>
                    Zero balance leakage guaranteed by greedy DAG net cash flow minimization.
                  </Typography>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        )}

        {/* Free Sandbox Mobile OTP Verification Dialog */}
        <Dialog
          open={otpDialogOpen}
          onClose={() => setOtpDialogOpen(false)}
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: { xs: 3, sm: 4 },
                m: { xs: 1.5, sm: 3 },
                maxWidth: { xs: 'calc(100% - 24px)', sm: 440 },
                width: { xs: 'calc(100% - 24px)', sm: '100%' },
                p: { xs: 0.5, sm: 1 },
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
              },
            },
          }}
        >
          <DialogTitle component="div" sx={{ fontWeight: 800, pb: 1, px: { xs: 2, sm: 3 }, color: 'text.primary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Security sx={{ color: '#34D399' }} />
              Verify Phone Number
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Verifying <strong>{form.phone}</strong> for instant notifications & settlements.
            </Typography>

            <Alert
              severity="info"
              className="glass-tertiary"
              sx={{
                mb: 2.5,
                borderRadius: 2.5,
                color: '#34D399',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                '& .MuiAlert-icon': { color: '#34D399' },
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
                FREE DEVELOPER SIMULATOR ACTIVE:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.825rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                No paid SMS credits needed. Your simulated OTP code is:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  p: 1,
                  px: 1.5,
                  borderRadius: 2,
                  mt: 1,
                  border: '1px dashed rgba(52, 211, 153, 0.4)',
                }}
              >
                <Typography variant="h5" fontWeight={850} sx={{ letterSpacing: '0.25em', color: '#34D399' }}>
                  {generatedOtp}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setEnteredOtp(generatedOtp)}
                  startIcon={<ContentCopy fontSize="small" />}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', color: '#34D399' }}
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
              className="glass-tertiary"
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
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', color: '#34D399' }}
                >
                  Generate New OTP
                </Button>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2.5 }}>
            <Button
              variant="outlined"
              className="glass-tertiary"
              onClick={() => setOtpDialogOpen(false)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              className="glass-emerald-active"
              onClick={handleVerifyOtp}
              disabled={enteredOtp.trim().length !== 6 || saving}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                color: '#FFFFFF',
                px: 3,
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
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: { xs: 3, sm: 4 },
                m: { xs: 1.5, sm: 3 },
                maxWidth: { xs: 'calc(100% - 24px)', sm: 400 },
                width: { xs: 'calc(100% - 24px)', sm: '100%' },
                p: 1.5,
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
              },
            },
          }}
        >
          <DialogTitle component="div" sx={{ fontWeight: 800, color: 'text.primary', px: { xs: 2, sm: 3 } }}>
            UPI QR Code Preview
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Scan with any UPI app (GPay, PhonePe, Paytm, BHIM) to settle debts directly.
            </Typography>

            <Box
              className="glass-tertiary"
              sx={{
                p: 2,
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'inline-block',
                mb: 2,
              }}
            >
              {generatingQr || !qrCodeUrl ? (
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    bgcolor: isLight ? '#f1f5f9' : '#141821',
                  }}
                >
                  <CircularProgress size={36} sx={{ color: '#10B981' }} />
                </Box>
              ) : (
                <img
                  src={qrCodeUrl}
                  alt="UPI QR Code"
                  style={{ width: 200, height: 200, display: 'block', borderRadius: 12 }}
                />
              )}
            </Box>

            <Box
              className="glass-tertiary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                p: 1.25,
                borderRadius: 2,
                border: '1px solid rgba(52, 211, 153, 0.3)',
              }}
            >
              <Typography variant="body2" fontWeight={750} sx={{ color: '#34D399', fontFamily: 'monospace' }}>
                {preferences.upiId}
              </Typography>
              <Tooltip title="Copy VPA">
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(preferences.upiId);
                    alert('UPI ID copied to clipboard!');
                  }}
                  sx={{ color: '#34D399' }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button
              variant="contained"
              className="glass-emerald-active"
              onClick={() => setQrModalOpen(false)}
              sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 700, color: '#fff' }}
            >
              Done
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cache Reset Confirmation Dialog */}
        <Dialog
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: { xs: 3, sm: 3.5 },
                m: { xs: 1.5, sm: 3 },
                maxWidth: { xs: 'calc(100% - 24px)', sm: 420 },
                width: { xs: 'calc(100% - 24px)', sm: '100%' },
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
              },
            },
          }}
        >
          <DialogTitle component="div" sx={{ fontWeight: 800, color: 'text.primary', px: { xs: 2, sm: 3 } }}>
            Clear Local Cache & Drafts?
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" color="text.secondary">
              This will remove all locally cached form drafts and reset preferences to default. Your online transaction and account records in Postgres will NOT be deleted.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2.5 }}>
            <Button
              onClick={() => setResetDialogOpen(false)}
              className="glass-tertiary"
              sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleClearCacheAndDrafts}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#EF4444' }}
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
          message="All account settings and preferences saved successfully! ✓"
        />

        <Snackbar
          open={otpSuccessToast}
          autoHideDuration={4000}
          onClose={() => setOtpSuccessToast(false)}
          message="Phone number successfully verified and linked to your profile! ✓"
        />

        {/* Error Feedback Snackbar */}
        <Snackbar
          open={Boolean(saveErrorToast)}
          autoHideDuration={6000}
          onClose={() => setSaveErrorToast(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setSaveErrorToast(null)} sx={{ borderRadius: 2, width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            {saveErrorToast}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
}
