'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Avatar,
  AvatarGroup, Chip, Skeleton, useTheme, alpha, Stack, FormControlLabel, Switch,
  InputAdornment, Tooltip, Snackbar, Alert,
} from '@mui/material';
import {
  Add, Close, Home, Flight, Favorite, Business, People, FamilyRestroom,
  Work, MoreHoriz, ArrowForward, Lock, Security, Search, ContentCopy,
  Check, ReceiptLong, GroupAdd, AutoAwesome, SwapHoriz,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { groupApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import SplitwiseImportModal from '@/components/groups/SplitwiseImportModal';

const GROUP_TYPE_CONFIG: Record<string, { icon: React.ReactElement; color: string; label: string }> = {
  HOME: { icon: <Home fontSize="small" />, color: '#14B8A6', label: 'Home' },
  TRIP: { icon: <Flight fontSize="small" />, color: '#F59E0B', label: 'Trip' },
  COUPLE: { icon: <Favorite fontSize="small" />, color: '#EC4899', label: 'Couple' },
  OFFICE: { icon: <Business fontSize="small" />, color: '#3B82F6', label: 'Office' },
  FRIENDS: { icon: <People fontSize="small" />, color: '#10B981', label: 'Friends' },
  FAMILY: { icon: <FamilyRestroom fontSize="small" />, color: '#8B5CF6', label: 'Family' },
  PROJECT: { icon: <Work fontSize="small" />, color: '#6366F1', label: 'Project' },
  OTHER: { icon: <MoreHoriz fontSize="small" />, color: '#94A3B8', label: 'Other' },
};

export default function GroupsPage() {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';
  const { user, profile, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fairshare_cached_groups');
      if (saved) setGroups(JSON.parse(saved));
    } catch {}
  }, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [splitwiseModalOpen, setSplitwiseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [joinInput, setJoinInput] = useState('');

  const handleJoinGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!joinInput.trim()) return;
    const clean = joinInput.trim();
    const match = clean.match(/\/groups\/([a-zA-Z0-9_-]+)/);
    const targetId = match ? match[1] : clean;
    router.push(`/groups/${targetId}`);
  };

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

  const hasLoadedGroupsRef = useRef(false);

  const isFetchingGroupsRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    if (user?.id && !hasLoadedGroupsRef.current) fetchGroups();
  }, [user?.id]);

  const fetchGroups = async () => {
    if (isFetchingGroupsRef.current) return;
    isFetchingGroupsRef.current = true;
    try {
      if (!hasLoadedGroupsRef.current) {
        setLoading(true);
      }
      const res = await groupApi.list();
      if (res.data?.data) {
        setGroups(res.data.data);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('fairshare_cached_groups', JSON.stringify(res.data.data));
          } catch {}
        }
      }
      hasLoadedGroupsRef.current = true;
    } catch (error) {
      console.error('Fetch groups error:', error);
    } finally {
      isFetchingGroupsRef.current = false;
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      alert('Please enter a group name.');
      return;
    }
    if (form.name.trim().length > 100) {
      alert('Group name cannot exceed 100 characters.');
      return;
    }
    if (form.description.length > 500) {
      alert('Description cannot exceed 500 characters.');
      return;
    }
    setSubmitting(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticGroup = {
      id: tempId,
      name: form.name.trim(),
      description: form.description || null,
      type: form.type,
      currency: form.currency,
      members: [{ userId: user?.id, role: 'ADMIN', user: { name: user?.user_metadata?.full_name || 'You' } }],
      _count: { expenses: 0, members: 1 },
      createdAt: new Date().toISOString(),
    };

    const previousSnapshot = [...groups];
    setGroups((prev) => [optimisticGroup, ...prev]);
    setDialogOpen(false);
    setToastMessage('Group created successfully!');

    const currentForm = { ...form };
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

    try {
      const payload = {
        name: currentForm.name.trim(),
        description: currentForm.description || undefined,
        type: currentForm.type,
        currency: currentForm.currency,
        password: currentForm.isPasswordProtected ? currentForm.password : undefined,
        requireAdminApproval: currentForm.requireApproval,
      };
      const res = await groupApi.create(payload);
      if (res.data?.data) {
        setGroups((prev) => prev.map((g) => (g.id === tempId ? res.data.data : g)));
      }
      if (currentForm.inviteContacts && res.data?.data?.id) {
        const contacts = currentForm.inviteContacts.split(',').map((c) => c.trim()).filter(Boolean);
        for (const contact of contacts) {
          if (contact.includes('@')) {
            await groupApi.addMember(res.data.data.id, { email: contact }).catch(() => {});
          } else {
            await groupApi.addMember(res.data.data.id, { phone: contact }).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('Create group error:', error);
      setGroups(previousSnapshot);
      setToastMessage('Failed to create group. Reverted.');
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


  return (
    <AppLayout>
      <Box sx={{ pb: 4, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Header Row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            mb: 1.75,
            gap: 1.5,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: { xs: '1.35rem', sm: '1.65rem', md: '1.85rem' } }}>
              Expense Groups
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
              Split living costs, trips, and shared events with verified friends
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesome sx={{ color: '#10B981' }} />}
              onClick={() => setSplitwiseModalOpen(true)}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                borderRadius: 2.5,
                px: 2.5,
                py: 1,
                fontWeight: 700,
                color: '#10B981',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                bgcolor: 'rgba(16, 185, 129, 0.08)',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(16, 185, 129, 0.16)',
                  borderColor: '#10B981',
                },
              }}
            >
              Import from Splitwise
            </Button>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                borderRadius: 2.5,
                px: 3,
                py: 1,
                fontWeight: 700,
                bgcolor: isLight ? '#059669' : '#10B981',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: isLight ? '#047857' : '#059669',
                  boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
                },
              }}
            >
              Create New Group
            </Button>
          </Stack>
        </Box>

        {/* Top Summary Metrics Bar (Savexa FinTech style with Semantic Color Grading) */}
        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 2.5 }}>
          {/* Card 1: Total Groups (Emerald / Mint) */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: 2,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(6, 78, 59, 0.24)',
                border: isLight ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.32)',
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: isLight ? '#059669' : '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <People sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: isLight ? '#047857' : '#34D399', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Groups
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
                  {loading ? <Skeleton width={40} /> : groups.length}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Card 2: Connected Members (Sky / Blue) */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: 2,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: isLight ? 'rgba(56, 189, 248, 0.08)' : 'rgba(12, 74, 110, 0.24)',
                border: isLight ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(56, 189, 248, 0.32)',
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: isLight ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.18)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: isLight ? '#0284C7' : '#38BDF8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GroupAdd sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: isLight ? '#0284C7' : '#7DD3FC', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Connected Members
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
                  {loading ? <Skeleton width={40} /> : totalMembers}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Card 3: Shared Expenses (Violet / Purple) */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                p: 2,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: isLight ? 'rgba(168, 85, 247, 0.08)' : 'rgba(88, 28, 135, 0.22)',
                border: isLight ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid rgba(168, 85, 247, 0.32)',
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: isLight ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.18)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  color: isLight ? '#7E22CE' : '#C084FC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ReceiptLong sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: isLight ? '#7E22CE' : '#C084FC', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Shared Expenses
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
                  {loading ? <Skeleton width={40} /> : `${totalExpensesCount} recorded`}
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content: 2-Column Desktop Widescreen Layout */}
        <Grid container spacing={3}>
          {/* Left Column: Groups Ledger & Search */}
          <Grid size={{ xs: 12, lg: 8, xl: 8.5 }}>
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
                className="glass-tertiary"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#10B981', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  maxWidth: { xs: '100%', md: 360 },
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
                  maxWidth: '100%',
                  WebkitOverflowScrolling: 'touch',
                  '&::-webkit-scrollbar': { display: 'none' },
                  scrollbarWidth: 'none',
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
                      className={active ? 'glass-emerald-active' : 'glass-tertiary'}
                      sx={{
                        flexShrink: 0,
                        px: 1,
                        py: 1.75,
                        fontSize: '0.775rem',
                        fontWeight: active ? 700 : 500,
                        bgcolor: active
                          ? (isLight ? '#1A1D1F' : 'rgba(16, 185, 129, 0.2)')
                          : undefined,
                        color: active ? '#FFFFFF' : 'text.primary',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Groups Grid */}
            {loading ? (
              <Grid container spacing={2.5}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={i}>
                    <Card
                      className="glass-secondary"
                      sx={{
                        borderRadius: 3.5,
                        p: 3,
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Skeleton variant="circular" width={36} height={36} animation="wave" />
                          <Skeleton variant="rounded" width={56} height={22} sx={{ borderRadius: 1.5 }} animation="wave" />
                        </Box>
                        <Skeleton variant="rounded" width={28} height={28} sx={{ borderRadius: 1.5 }} animation="wave" />
                      </Box>
                      <Skeleton width="65%" height={26} sx={{ mb: 1 }} animation="wave" />
                      <Skeleton width="90%" height={16} animation="wave" />
                      <Skeleton width="60%" height={16} sx={{ mb: 2 }} animation="wave" />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Skeleton variant="circular" width={28} height={28} animation="wave" />
                          <Skeleton width={70} height={18} animation="wave" />
                        </Box>
                        <Skeleton width={50} height={18} animation="wave" />
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : filteredGroups.length === 0 ? (
              <Card
                className="glass-secondary"
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderRadius: 4,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <People sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
                <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary', mb: 0.5 }}>
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
                    bgcolor: isLight ? '#059669' : '#10B981',
                    color: '#FFFFFF',
                    borderRadius: 2.5,
                    px: 3,
                    py: 1.2,
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                    '&:hover': { bgcolor: isLight ? '#047857' : '#059669' },
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
                    <Grid size={{ xs: 12, sm: 6 }} key={group.id}>
                      <Card
                        className="glass-secondary glass-specular-top"
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 3.5,
                          boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                          border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'}`,
                          '&:hover': {
                            borderColor: isLight ? 'rgba(16, 185, 129, 0.4) !important' : 'rgba(16, 185, 129, 0.45) !important',
                            transform: 'translateY(-2px)',
                            boxShadow: isLight ? '0 12px 32px rgba(16, 185, 129, 0.12)' : '0 16px 40px -8px rgba(0, 0, 0, 0.65)',
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
                                  bgcolor: alpha(cfg.color, 0.12),
                                  border: `1px solid ${alpha(cfg.color, 0.25)}`,
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
                                  bgcolor: alpha(cfg.color, 0.1),
                                  border: `1px solid ${alpha(cfg.color, 0.2)}`,
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
                                    color: isCopied ? '#10B981' : 'text.secondary',
                                    bgcolor: isCopied ? alpha('#10B981', 0.12) : alpha(theme.palette.text.secondary, 0.05),
                                    '&:hover': { color: '#10B981', bgcolor: alpha('#10B981', 0.15) },
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

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: isLight ? '#059669' : '#34D399' }}>
                              <Typography variant="caption" fontWeight={750} sx={{ fontSize: '0.75rem' }}>
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
          </Grid>

          {/* Right Column: Sticky Quick Actions & Settlements Hub */}
          <Grid size={{ xs: 12, lg: 4, xl: 3.5 }}>
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 88 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Card 1: Quick Join by Invite / PIN */}
              <Card
                className="glass-secondary"
                sx={{
                  p: 2.75,
                  borderRadius: 3.5,
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.18)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: isLight ? '#059669' : '#34D399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GroupAdd sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.primary' }}>
                      Join Existing Group
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Paste an invite link or group ID
                    </Typography>
                  </Box>
                </Box>
                <Box component="form" onSubmit={handleJoinGroup} sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 50b145cc-... or link"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '0.825rem',
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!joinInput.trim()}
                    sx={{
                      bgcolor: isLight ? '#059669' : '#10B981',
                      color: '#FFF',
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 2.5,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      '&:hover': { bgcolor: isLight ? '#047857' : '#059669' },
                    }}
                  >
                    Join
                  </Button>
                </Box>
              </Card>

              {/* Card 2: Debt Simplification Hub */}
              <Card
                className="glass-secondary"
                sx={{
                  p: 2.75,
                  borderRadius: 3.5,
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  background: isLight
                    ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.04) 0%, rgba(255, 255, 255, 0.8) 100%)'
                    : 'linear-gradient(180deg, rgba(168, 85, 247, 0.08) 0%, rgba(18, 22, 32, 0.9) 100%)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        bgcolor: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        color: isLight ? '#7E22CE' : '#C084FC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AutoAwesome sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.primary' }}>
                        Debt Simplification Hub
                      </Typography>
                      <Typography variant="caption" sx={{ color: isLight ? '#7E22CE' : '#C084FC', fontWeight: 600 }}>
                        Greedy DAG Engine Active
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label="PRO"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(168, 85, 247, 0.2)',
                      color: isLight ? '#7E22CE' : '#C084FC',
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 2, lineHeight: 1.45 }}>
                  Multi-party bilateral debts are automatically condensed into minimum direct transfers across all your groups.
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => router.push('/settlements')}
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: 2.2,
                    borderColor: 'rgba(168, 85, 247, 0.4)',
                    color: isLight ? '#7E22CE' : '#C084FC',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 1,
                    '&:hover': {
                      borderColor: 'rgba(168, 85, 247, 0.7)',
                      bgcolor: 'rgba(168, 85, 247, 0.08)',
                    },
                  }}
                >
                  View Settlements & UPI
                </Button>
              </Card>

              {/* Card 3: Splitwise Migration */}
              <Card
                className="glass-secondary"
                sx={{
                  p: 2.75,
                  borderRadius: 3.5,
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: isLight ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.18)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: isLight ? '#0284C7' : '#38BDF8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SwapHoriz sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.primary' }}>
                      Switching from Splitwise?
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      1-click import with zero data loss
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 2, lineHeight: 1.45 }}>
                  Import groups, members, and historical expenses directly from your Splitwise export file.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setSplitwiseModalOpen(true)}
                  sx={{
                    bgcolor: isLight ? '#0284C7' : 'rgba(56, 189, 248, 0.2)',
                    color: isLight ? '#FFF' : '#38BDF8',
                    border: isLight ? 'none' : '1px solid rgba(56, 189, 248, 0.4)',
                    fontWeight: 700,
                    borderRadius: 2.2,
                    textTransform: 'none',
                    py: 1,
                    '&:hover': {
                      bgcolor: isLight ? '#0369A1' : 'rgba(56, 189, 248, 0.3)',
                    },
                  }}
                >
                  Import Splitwise Export
                </Button>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Create Group Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: { xs: 3, sm: 4 },
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                m: { xs: 1.5, sm: 3 },
                width: { xs: 'calc(100% - 24px)', sm: '100%' },
                maxWidth: { xs: 'calc(100% - 24px)', sm: '600px' },
                maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
              },
            },
          }}
        >
          <DialogTitle
            component="div"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 1,
              pt: { xs: 2, sm: 2.5 },
              px: { xs: 2, sm: 3 },
            }}
          >
            <Box>
              <Typography variant="h6" component="span" fontWeight={800} sx={{ color: 'text.primary', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                Create Expense Group
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                Setup shared expenses, privacy, and member permissions
              </Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
            <Stack spacing={2.25} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Group Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Goa Trip, Flat 402, Office Lunch"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { maxLength: 100 },
                }}
                helperText="Between 1 and 100 characters"
              />

              <TextField
                fullWidth
                label="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                multiline
                rows={2}
                placeholder="What is this group for?"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { maxLength: 500 },
                }}
                helperText="Up to 500 characters"
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
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
                <Grid size={{ xs: 12, sm: 6 }}>
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

          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2.5, sm: 3 }, pt: 1, gap: 1 }}>
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
                bgcolor: isLight ? '#059669' : '#10B981',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                textTransform: 'none',
                '&:hover': { bgcolor: isLight ? '#047857' : '#059669' },
              }}
            >
              {submitting ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Splitwise 1-Click Migration Modal */}
        <SplitwiseImportModal
          open={splitwiseModalOpen}
          onClose={() => setSplitwiseModalOpen(false)}
          onSuccess={() => fetchGroups()}
          currentUserName={profile?.name || user?.user_metadata?.full_name || 'You'}
        />

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
