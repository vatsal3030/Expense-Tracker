'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Avatar,
  AvatarGroup, Chip, Skeleton, useTheme, alpha, Stack, FormControlLabel, Switch,
  InputAdornment, Tooltip, Snackbar, Alert,
} from '@mui/material';
import {
  Add, Close, Home, Flight, Favorite, Business, People, FamilyRestroom,
  Work, MoreHoriz, ArrowForward, Lock, Security, Search, ContentCopy,
  Check, ReceiptLong, GroupAdd,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { groupApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const GROUP_TYPE_CONFIG: Record<string, { icon: React.ReactElement; color: string; label: string }> = {
  HOME: { icon: <Home fontSize="small" />, color: '#0E6245', label: 'Home' },
  TRIP: { icon: <Flight fontSize="small" />, color: '#F59E0B', label: 'Trip' },
  COUPLE: { icon: <Favorite fontSize="small" />, color: '#EC4899', label: 'Couple' },
  OFFICE: { icon: <Business fontSize="small" />, color: '#3B82F6', label: 'Office' },
  FRIENDS: { icon: <People fontSize="small" />, color: '#10B981', label: 'Friends' },
  FAMILY: { icon: <FamilyRestroom fontSize="small" />, color: '#8B5CF6', label: 'Family' },
  PROJECT: { icon: <Work fontSize="small" />, color: '#059669', label: 'Project' },
  OTHER: { icon: <MoreHoriz fontSize="small" />, color: '#64748B', label: 'Other' },
};

export default function GroupsPage() {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'FRIENDS',
    currency: 'INR',
    requireApproval: false,
    isPasswordProtected: false,
    password: '',
    inviteContacts: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await groupApi.list();
      setGroups(res.data?.data || []);
    } catch (error) {
      console.error('Fetch groups error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        type: form.type,
        currency: form.currency,
        password: form.isPasswordProtected ? form.password : undefined,
        requireAdminApproval: form.requireApproval,
      };
      const res = await groupApi.create(payload);
      if (form.inviteContacts && res.data?.data?.id) {
        const contacts = form.inviteContacts.split(',').map((c) => c.trim()).filter(Boolean);
        for (const contact of contacts) {
          if (contact.includes('@')) {
            await groupApi.addMember(res.data.data.id, { email: contact }).catch(() => {});
          } else {
            await groupApi.addMember(res.data.data.id, { phone: contact }).catch(() => {});
          }
        }
      }
      setDialogOpen(false);
      setForm({
        name: '',
        description: '',
        type: 'FRIENDS',
        currency: 'INR',
        requireApproval: false,
        isPasswordProtected: false,
        password: '',
        inviteContacts: '',
      });
      setToastMessage('Group created successfully!');
      fetchGroups();
    } catch (error) {
      console.error('Create group error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyInvite = (e: React.MouseEvent, groupId: string, groupName: string) => {
    e.stopPropagation();
    const link = typeof window !== 'undefined'
      ? `${window.location.origin}/groups/join/${groupId}`
      : `https://fairshare.app/groups/join/${groupId}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedId(groupId);
      setToastMessage(`Invite link for "${groupName}" copied to clipboard!`);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'ALL' || g.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [groups, searchQuery, selectedType]);

  const totalMembers = useMemo(() => {
    return groups.reduce((acc, g) => acc + (g.members?.length || 0), 0);
  }, [groups]);

  const totalExpensesCount = useMemo(() => {
    return groups.reduce((acc, g) => acc + (g._count?.expenses || 0), 0);
  }, [groups]);

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: 6 }}>
        {/* Header Row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            mb: 3,
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
              Expense Groups
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Split living costs, trips, and shared events with verified friends
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              borderRadius: 2.5,
              px: 3,
              py: 1,
              fontWeight: 700,
              bgcolor: '#0E6245',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(14, 98, 69, 0.25)',
              textTransform: 'none',
              '&:hover': { bgcolor: '#094A34', boxShadow: '0 4px 14px rgba(14, 98, 69, 0.35)' },
            }}
          >
            Create New Group
          </Button>
        </Box>

        {/* Top Summary Metrics Bar (Savexa FinTech style) */}
        <Grid container spacing={2} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: alpha('#0E6245', 0.1),
                  color: '#0E6245',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <People sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Groups
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
                  {loading ? <Skeleton width={40} /> : groups.length}
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: alpha('#3B82F6', 0.1),
                  color: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GroupAdd sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Connected Members
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
                  {loading ? <Skeleton width={40} /> : totalMembers}
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: alpha('#F59E0B', 0.1),
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ReceiptLong sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Shared Expenses
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
                  {loading ? <Skeleton width={40} /> : `${totalExpensesCount} recorded`}
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Search & Filter Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            mb: 3,
            gap: 2,
          }}
        >
          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search groups by name or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              maxWidth: { xs: '100%', md: 360 },
              bgcolor: 'background.paper',
              borderRadius: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
              },
            }}
          />

          {/* Type Filter Pills */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              py: 0.5,
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {['ALL', 'FRIENDS', 'TRIP', 'HOME', 'OFFICE', 'COUPLE'].map((typeKey) => {
              const active = selectedType === typeKey;
              return (
                <Chip
                  key={typeKey}
                  label={typeKey === 'ALL' ? 'All Types' : typeKey.charAt(0) + typeKey.slice(1).toLowerCase()}
                  size="small"
                  onClick={() => setSelectedType(typeKey)}
                  sx={{
                    px: 1,
                    py: 1.75,
                    fontSize: '0.775rem',
                    fontWeight: active ? 700 : 500,
                    bgcolor: active
                      ? (isLight ? '#1A1D1F' : '#0E6245')
                      : 'background.paper',
                    color: active ? '#FFFFFF' : 'text.primary',
                    border: `1px solid ${active ? 'transparent' : theme.palette.divider}`,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: active
                        ? (isLight ? '#1A1D1F' : '#0E6245')
                        : alpha(theme.palette.text.primary, 0.05),
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Groups Grid */}
        {loading ? (
          <Grid container spacing={2.5}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Card sx={{ borderRadius: 3.5, p: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <Skeleton variant="circular" width={44} height={44} sx={{ mb: 2 }} />
                  <Skeleton width="65%" height={26} />
                  <Skeleton width="45%" height={20} sx={{ mt: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Skeleton width={80} height={28} />
                    <Skeleton width={60} height={28} />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : filteredGroups.length === 0 ? (
          <Card
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 4,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
            }}
          >
            <People sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
              {searchQuery || selectedType !== 'ALL' ? 'No matching groups found' : 'No groups yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              {searchQuery || selectedType !== 'ALL'
                ? 'Try adjusting your search query or switching to another category.'
                : 'Create your first expense group to start splitting bills and tracking settlements effortlessly.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                bgcolor: '#0E6245',
                color: '#FFFFFF',
                borderRadius: 2.5,
                px: 3,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: '#094A34' },
              }}
            >
              Create Group
            </Button>
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            {filteredGroups.map((group) => {
              const cfg = GROUP_TYPE_CONFIG[group.type] || GROUP_TYPE_CONFIG.OTHER;
              const isCopied = copiedId === group.id;

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={group.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 3.5,
                      bgcolor: 'background.paper',
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                      '&:hover': {
                        borderColor: '#0E6245',
                        boxShadow: '0 4px 16px rgba(14, 98, 69, 0.08)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    <CardContent sx={{ p: 2.75 }}>
                      {/* Top Row: Type Pill, Security Badge, Copy Action */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              bgcolor: alpha(cfg.color, 0.1),
                              color: cfg.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {cfg.icon}
                          </Box>
                          <Chip
                            label={cfg.label}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.675rem',
                              fontWeight: 700,
                              bgcolor: alpha(cfg.color, 0.08),
                              color: cfg.color,
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {(group.isPasswordProtected || group.requireAdminApproval) && (
                            <Tooltip title={group.isPasswordProtected ? 'PIN Protected' : 'Admin Approval Required'}>
                              <Chip
                                icon={<Lock sx={{ fontSize: '13px !important' }} />}
                                label="Secure"
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  bgcolor: alpha(theme.palette.text.secondary, 0.08),
                                  color: 'text.secondary',
                                }}
                              />
                            </Tooltip>
                          )}
                          <Tooltip title="Copy Invite Link">
                            <IconButton
                              size="small"
                              onClick={(e) => handleCopyInvite(e, group.id, group.name)}
                              sx={{
                                color: isCopied ? 'success.main' : 'text.secondary',
                                bgcolor: isCopied ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.text.secondary, 0.05),
                                '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) },
                              }}
                            >
                              {isCopied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Group Title & Description */}
                      <Typography
                        variant="h6"
                        fontWeight={750}
                        sx={{
                          color: 'text.primary',
                          letterSpacing: '-0.01em',
                          mb: 0.75,
                          fontSize: '1.05rem',
                        }}
                      >
                        {group.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.825rem',
                          lineHeight: 1.45,
                          minHeight: 38,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 2.5,
                        }}
                      >
                        {group.description || 'No description provided.'}
                      </Typography>

                      {/* Bottom Row: Member Avatars and Expense Counter */}
                      <Box
                        sx={{
                          pt: 2,
                          borderTop: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AvatarGroup
                            max={4}
                            sx={{
                              '& .MuiAvatar-root': {
                                width: 28,
                                height: 28,
                                fontSize: '0.725rem',
                                border: `2px solid ${theme.palette.background.paper}`,
                              },
                            }}
                          >
                            {group.members?.map((m: any) => (
                              <Avatar
                                key={m.user?.id || Math.random()}
                                src={m.user?.avatarUrl || undefined}
                                sx={{ bgcolor: cfg.color }}
                              >
                                {m.user?.name?.charAt(0) || '?'}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                            {group.members?.length || 0} members
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#0E6245' }}>
                          <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem' }}>
                            {group._count?.expenses || 0} bills
                          </Typography>
                          <ArrowForward sx={{ fontSize: 14 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Create Group Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 4, bgcolor: 'background.paper' } } }}
        >
          <DialogTitle
            component="div"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 1,
              pt: 2.5,
              px: 3,
            }}
          >
            <Box>
              <Typography variant="h6" component="span" fontWeight={800} sx={{ color: 'text.primary' }}>
                Create Expense Group
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                Setup shared expenses, privacy, and member permissions
              </Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 1.5 }}>
            <Stack spacing={2.25} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Group Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Goa Trip, Flat 402, Office Lunch"
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                fullWidth
                label="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                multiline
                rows={2}
                placeholder="What is this group for?"
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Group Category"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  >
                    {Object.entries(GROUP_TYPE_CONFIG).map(([key, cfg]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</Box>
                          <Typography variant="body2" fontWeight={500}>{cfg.label}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Currency"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  >
                    <MenuItem value="INR">🇮🇳 INR (₹)</MenuItem>
                    <MenuItem value="USD">🇺🇸 USD ($)</MenuItem>
                    <MenuItem value="EUR">🇪🇺 EUR (€)</MenuItem>
                    <MenuItem value="GBP">🇬🇧 GBP (£)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {/* Access & Protection Options */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.action.hover, 0.04),
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}
                >
                  <Security sx={{ fontSize: 18, color: '#0E6245' }} />
                  Access & Security Settings
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.requireApproval}
                      onChange={(e) => setForm({ ...form, requireApproval: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Require Admin Approval</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Prevent unknown people; new joins must be approved by group admin
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', mb: 1.5 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isPasswordProtected}
                      onChange={(e) => setForm({ ...form, isPasswordProtected: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Group Passcode / PIN</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Require secret passcode to join via shared link
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start' }}
                />

                {form.isPasswordProtected && (
                  <TextField
                    fullWidth
                    size="small"
                    label="Group Passcode"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter 4-6 digit PIN or secret password"
                    sx={{ mt: 1.5 }}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              </Box>

              {/* Direct Invite by Email / Phone */}
              <TextField
                fullWidth
                label="Invite Initial Members (optional)"
                placeholder="friend@gmail.com, +919876543210"
                value={form.inviteContacts}
                onChange={(e) => setForm({ ...form, inviteContacts: e.target.value })}
                helperText="Enter emails or phone numbers separated by commas"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={submitting || !form.name}
              sx={{
                borderRadius: 2.5,
                px: 3.5,
                fontWeight: 700,
                bgcolor: '#0E6245',
                color: '#FFFFFF',
                textTransform: 'none',
                '&:hover': { bgcolor: '#094A34' },
              }}
            >
              {submitting ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Global Feedback Toast */}
        <Snackbar
          open={Boolean(toastMessage)}
          autoHideDuration={3000}
          onClose={() => setToastMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ borderRadius: 3, fontWeight: 600 }}>
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
}
