'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, Divider, Skeleton, useTheme, useMediaQuery, alpha,
  IconButton, Chip, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack, Tabs, Tab, Badge, InputAdornment, Tooltip,
  Snackbar, Alert, Grid, CircularProgress,
} from '@mui/material';
import {
  PersonAdd, Check, Close, People, Search, Delete,
  ContentCopy, WhatsApp, ReceiptLong, Share, ArrowForward, QrCode2,
  Visibility, HourglassEmpty, CheckCircle, WarningAmber, Group as GroupIcon,
  Shield, CurrencyRupee,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { friendApi, userApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import QrCodeModal from '@/components/common/QrCodeModal';

export default function FriendsPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');

  // Add friend dialog state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Friend Profile Dialog State (safe, non-confidential view)
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedFriendProfile, setSelectedFriendProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Remove friend confirmation dialog
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<{ id: string; name: string } | null>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Invite connection prompt from QR code or shared link
  const [inviteTargetUser, setInviteTargetUser] = useState<any>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const hasCheckedInviteRef = useRef(false);

  const hasLoadedFriendsRef = useRef(false);
  const isFetchingFriendsRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      if (typeof window !== 'undefined') {
        const p = new URLSearchParams(window.location.search);
        const inv = p.get('invite') || p.get('ref');
        if (inv) {
          try {
            localStorage.setItem('fairshare_pending_invite', inv);
          } catch {}
          router.push(`/auth/signup?ref=${inv}`);
          return;
        }
      }
      router.push('/auth/login');
    }
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    if (user?.id && !hasLoadedFriendsRef.current) {
      fetchData();
    }
  }, [user?.id]);

  // Handle incoming invite from QR scan or share link (?invite=... or localStorage)
  useEffect(() => {
    if (authLoading || !user?.id || hasCheckedInviteRef.current) return;

    let targetId: string | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      targetId = params.get('invite') || params.get('ref');
      if (!targetId) {
        try {
          targetId = localStorage.getItem('fairshare_pending_invite');
        } catch {}
      }
    }

    if (targetId) {
      hasCheckedInviteRef.current = true;
      try {
        localStorage.removeItem('fairshare_pending_invite');
      } catch {}

      if (targetId === user.id) {
        setToastSeverity('info');
        setToastMessage('This is your personal invite QR & link! Share this with your friends to connect.');
        return;
      }

      userApi.getPublicProfile(targetId)
        .then((res) => {
          if (res.data?.data) {
            setInviteTargetUser(res.data.data);
            setInviteModalOpen(true);
          }
        })
        .catch((err) => {
          console.warn('Unable to load friend invite details:', err);
        });
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fairshare_cached_friends');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFriends(parsed);
          setLoading(false);
          hasLoadedFriendsRef.current = true;
        }
      }
    } catch {}
  }, []);

  const fetchData = async () => {
    if (isFetchingFriendsRef.current) return;
    isFetchingFriendsRef.current = true;
    try {
      if (!hasLoadedFriendsRef.current && friends.length === 0) {
        setLoading(true);
      }
      const [friendsRes, pendingRes, sentRes] = await Promise.all([
        friendApi.list(),
        friendApi.pending(),
        friendApi.sent ? friendApi.sent().catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
      ]);
      const list = friendsRes.data?.data || [];
      setFriends(list);
      setPending(pendingRes.data?.data || []);
      setSentRequests(sentRes.data?.data || []);
      hasLoadedFriendsRef.current = true;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('fairshare_cached_friends', JSON.stringify(list));
        } catch {}
      }
    } catch (error) {
      console.error('Fetch friends error:', error);
    } finally {
      isFetchingFriendsRef.current = false;
      setLoading(false);
    }
  };

  // Debounced auto-search as the user types
  useEffect(() => {
    if (!searchOpen) return;
    const query = searchQuery.trim();

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await userApi.search(query);
        const list = (res.data?.data || []).filter((u: any) => u.id !== user?.id);
        setSearchResults(list);
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, searchOpen, user?.id]);

  const handleManualSearch = async () => {
    const query = searchQuery.trim();
    if (query.length < 2) return;
    setSearching(true);
    try {
      const res = await userApi.search(query);
      const list = (res.data?.data || []).filter((u: any) => u.id !== user?.id);
      setSearchResults(list);
      setHasSearched(true);
    } catch (error) {
      console.error('Manual search error:', error);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    if (friendId === user?.id) {
      setToastSeverity('warning');
      setToastMessage('You cannot add yourself as a friend.');
      return;
    }
    const previousSearchResults = [...searchResults];
    setSearchResults((prev) =>
      prev.map((u) => (u.id === friendId ? { ...u, friendshipStatus: 'REQUEST_SENT' } : u))
    );
    setToastSeverity('success');
    setToastMessage('Friend request sent! Awaiting their acceptance.');

    try {
      await friendApi.request(friendId);
      if (friendApi.sent) {
        friendApi.sent().then((res) => {
          if (res.data?.data) setSentRequests(res.data.data);
        }).catch(() => {});
      }
    } catch (error: any) {
      setSearchResults(previousSearchResults);
      setToastSeverity('error');
      setToastMessage(error.response?.data?.error || 'Failed to send friend request.');
    }
  };

  const handleDirectInvite = async () => {
    const query = searchQuery.trim();
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userPhone = (profile?.phone || '').replace(/\D/g, '');
    const cleanQueryPhone = query.replace(/\D/g, '');

    if (
      (userEmail && query.toLowerCase() === userEmail) ||
      (userPhone && cleanQueryPhone && userPhone === cleanQueryPhone)
    ) {
      setToastSeverity('warning');
      setToastMessage('You cannot send a friend invitation to yourself!');
      return;
    }

    if (query.includes('@')) {
      try {
        await friendApi.request({ email: query });
        setToastSeverity('success');
        setToastMessage(`Friend invitation sent to ${query}!`);
        setSearchQuery('');
        setSearchOpen(false);
        fetchData();
      } catch (err: any) {
        setToastSeverity('error');
        setToastMessage(err.response?.data?.error || 'Failed to send invite.');
      }
    } else if (/^\+?[0-9]{7,15}$/.test(query.replace(/[\s-]/g, ''))) {
      try {
        await friendApi.request({ phone: query });
        setToastSeverity('success');
        setToastMessage(`Friend invitation sent to ${query}!`);
        setSearchQuery('');
        setSearchOpen(false);
        fetchData();
      } catch (err: any) {
        setToastSeverity('error');
        setToastMessage(err.response?.data?.error || 'Failed to send invite.');
      }
    } else {
      handleManualSearch();
    }
  };

  const handleAccept = async (id: string) => {
    const acceptedReq = pending.find((r) => r.id === id);
    const previousPending = [...pending];
    const previousFriends = [...friends];

    setPending((prev) => prev.filter((r) => r.id !== id));
    if (acceptedReq) {
      const newFriendObj = {
        friendshipId: acceptedReq.id,
        status: 'ACCEPTED',
        friend: acceptedReq.user || { name: 'Friend', email: '' },
      };
      setFriends((prev) => [newFriendObj, ...prev]);
    }
    setToastSeverity('success');
    setToastMessage('Friend request accepted! You are now mutual friends.');

    try {
      await friendApi.accept(id);
    } catch (error) {
      console.error('Accept error:', error);
      setPending(previousPending);
      setFriends(previousFriends);
      setToastSeverity('error');
      setToastMessage('Failed to accept friend request. Reverted.');
    }
  };

  const handleCancelOrDecline = async (id: string, isSent = false) => {
    const previousPending = [...pending];
    const previousSent = [...sentRequests];

    if (isSent) {
      setSentRequests((prev) => prev.filter((r) => r.id !== id));
    } else {
      setPending((prev) => prev.filter((r) => r.id !== id));
    }
    setToastSeverity('info');
    setToastMessage(isSent ? 'Friend request cancelled.' : 'Friend request declined.');

    try {
      await friendApi.remove(id);
    } catch (error) {
      console.error('Cancel request error:', error);
      if (isSent) setSentRequests(previousSent);
      else setPending(previousPending);
      setToastSeverity('error');
      setToastMessage('Failed to update request. Reverted.');
    }
  };

  const confirmRemoveFriend = async () => {
    if (!friendToRemove) return;
    const removedId = friendToRemove.id;
    const removedName = friendToRemove.name;
    const previousFriends = [...friends];

    setFriends((prev) => prev.filter((f) => f.friendshipId !== removedId && f.id !== removedId));
    setToastSeverity('info');
    setToastMessage(`Removed ${removedName} from friends.`);
    setRemoveDialogOpen(false);
    setFriendToRemove(null);
    if (profileModalOpen) setProfileModalOpen(false);

    try {
      await friendApi.remove(removedId);
    } catch (error) {
      console.error('Remove friend error:', error);
      setFriends(previousFriends);
      setToastSeverity('error');
      setToastMessage('Failed to remove friend. Reverted.');
    }
  };

  const openFriendProfile = async (friendUserId: string) => {
    setProfileModalOpen(true);
    setProfileLoading(true);
    try {
      const res = await userApi.getPublicProfile(friendUserId);
      setSelectedFriendProfile(res.data?.data || null);
    } catch (error) {
      console.error('Failed to load friend profile:', error);
      setSelectedFriendProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const personalInviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/friends?invite=${user?.id || ''}`
    : 'https://fairshare.app/friends';

  const handleCopyInvite = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(personalInviteLink);
      setCopiedLink(true);
      setToastSeverity('success');
      setToastMessage('Personal invite link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! Join me on FairShare so we can easily split bills and track shared expenses: ${personalInviteLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredFriends = useMemo(() => {
    if (!searchFilter.trim()) return friends;
    const q = searchFilter.toLowerCase();
    return friends.filter(
      (f) =>
        f.friend?.name?.toLowerCase().includes(q) ||
        f.friend?.email?.toLowerCase().includes(q)
    );
  }, [friends, searchFilter]);


  return (
    <AppLayout>
      <Box sx={{ pb: { xs: 4, sm: 4 }, width: '100%', maxWidth: '100%', minWidth: 0 }}>
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
            <Typography fontWeight={700} sx={{ letterSpacing: '-0.025em', color: 'text.primary', fontSize: { xs: '1.2rem', sm: '1.45rem', md: '1.65rem' } }}>
              Friends & Connections
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, letterSpacing: '-0.01em', fontSize: { xs: '0.78rem', sm: '0.85rem' }, display: { xs: 'none', sm: 'block' } }}>
              Mutual friendship connections for direct 1-on-1 expenses and group splits
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              size="small"
              className="glass-tertiary"
              startIcon={<QrCode2 fontSize="small" />}
              onClick={() => setQrModalOpen(true)}
              sx={{
                flex: { xs: 1, sm: 'none' },
                borderRadius: 2.5,
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 0.6, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 600,
                color: 'text.primary',
                textTransform: 'none',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                '&:hover': {
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  bgcolor: 'rgba(16, 185, 129, 0.08)',
                },
              }}
            >
              My QR
            </Button>
            <Button
              variant="contained"
              size="small"
              className="glass-emerald-active"
              startIcon={<PersonAdd fontSize="small" />}
              onClick={() => {
                setSearchOpen(true);
                setSearchQuery('');
                setSearchResults([]);
                setHasSearched(false);
              }}
              sx={{
                flex: { xs: 1, sm: 'none' },
                borderRadius: 2.5,
                px: { xs: 1.75, sm: 3 },
                py: { xs: 0.6, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 650,
                color: '#FFFFFF',
                textTransform: 'none',
              }}
            >
              Add Friend
            </Button>
          </Box>
        </Box>

        {/* Personal Invite Banner (Liquid Glass Hero Capsule) */}
        <Card
          className="glass-secondary glass-specular-top glass-emerald-ambient"
          sx={{
            mb: { xs: 2, sm: 3.5 },
            p: { xs: 1.5, sm: 3 },
            borderRadius: { xs: 2.5, sm: 3.5 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 2 } }}>
                <Avatar
                  sx={{
                    width: { xs: 36, sm: 48 },
                    height: { xs: 36, sm: 48 },
                    bgcolor: 'rgba(16, 185, 129, 0.18)',
                    color: '#34D399',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  <Share fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary', letterSpacing: '-0.01em', fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                    Invite Friends to FairShare
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.72rem', sm: '0.75rem' }, display: { xs: 'none', sm: 'block' } }}>
                    Share your unique connection link to link balances instantly without manual searches
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
                <TextField
                  size="small"
                  value={personalInviteLink}
                  slotProps={{
                    input: {
                      readOnly: true,
                      sx: {
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        fontFamily: 'monospace',
                        borderRadius: 2.5,
                      },
                    },
                  }}
                  className="glass-tertiary"
                  sx={{
                    width: { xs: '100%', sm: 380 },
                    flexGrow: 1,
                    maxWidth: { sm: 440 },
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
                  <Button
                    variant="contained"
                    onClick={handleCopyInvite}
                    startIcon={copiedLink ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                    className={copiedLink ? '' : 'glass-emerald-active'}
                    sx={{
                      flex: { xs: 1, sm: 'none' },
                      borderRadius: 2.5,
                      fontWeight: 700,
                      bgcolor: copiedLink ? '#10B981' : undefined,
                      color: '#FFFFFF',
                      textTransform: 'none',
                      px: 2.5,
                      flexShrink: 0,
                    }}
                  >
                    {copiedLink ? 'Copied' : 'Copy'}
                  </Button>
                  <IconButton
                    onClick={handleShareWhatsApp}
                    title="Share on WhatsApp"
                    className="glass-tertiary"
                    sx={{
                      color: '#25D366',
                      borderRadius: 2.5,
                      border: '1px solid rgba(37, 211, 102, 0.25)',
                      '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.15)' },
                    }}
                  >
                    <WhatsApp fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => setQrModalOpen(true)}
                    title="Show QR Code"
                    className="glass-tertiary"
                    sx={{
                      color: '#34D399',
                      borderRadius: 2.5,
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      '&:hover': { bgcolor: 'rgba(52, 211, 153, 0.15)' },
                    }}
                  >
                    <QrCode2 fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Segmented Liquid Glass Tabs (Properly centered & fitting capsule width) */}
        <Box sx={{ width: '100%', mb: { xs: 2, sm: 3 }, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box
            className="glass-control-surface"
            sx={{
              display: 'inline-flex',
              mx: 'auto',
              p: 0.4,
              borderRadius: { xs: 2.5, sm: 3 },
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: '100%', sm: 'auto' },
              justifyContent: 'center',
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant={isMobile ? 'scrollable' : 'standard'}
              centered={!isMobile}
              scrollButtons={false}
              allowScrollButtonsMobile={isMobile}
              sx={{
                minHeight: { xs: 34, sm: 38 },
                width: { xs: '100%', sm: 'auto' },
                '& .MuiTabs-flexContainer': {
                  justifyContent: 'center',
                },
                '& .MuiTabs-indicator': {
                  height: '100%',
                  borderRadius: { xs: 2, sm: 2.5 },
                  bgcolor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  zIndex: 0,
                },
                '& .MuiTab-root': {
                  zIndex: 1,
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: { xs: '0.75rem', sm: '0.825rem' },
                  minHeight: { xs: 34, sm: 36 },
                  minWidth: { xs: 'auto', sm: 80 },
                  flex: { xs: 1, sm: 'none' },
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.35, sm: 0.6 },
                  borderRadius: { xs: 2, sm: 2.5 },
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    color: '#34D399',
                  },
                },
              }}
            >
              <Tab label={`Friends (${friends.length})`} />
              <Tab
                label={
                  <Badge
                    badgeContent={pending.length}
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 18, minWidth: 18 } }}
                  >
                    <Box sx={{ pr: pending.length > 0 ? 1.5 : 0 }}>Received ({pending.length})</Box>
                  </Badge>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <span>Sent</span>
                    {sentRequests.length > 0 && (
                      <Chip
                        label={sentRequests.length}
                        size="small"
                        sx={{
                          height: 18,
                          minWidth: 18,
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          bgcolor: 'rgba(245, 158, 11, 0.2)',
                          color: '#F59E0B',
                          px: 0.5,
                        }}
                      />
                    )}
                  </Box>
                }
              />
            </Tabs>
          </Box>
        </Box>

        {/* TAB 0: ALL FRIENDS */}
        {tab === 0 && (
          <Box>
            {/* Local Filter Bar */}
            {friends.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <TextField
                  size="small"
                  placeholder="Filter friends by name or email..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="glass-tertiary"
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
                    maxWidth: 360,
                    borderRadius: 2.5,
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                  }}
                />
              </Box>
            )}

            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {loading ? (
                  <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 2,
                          px: 1,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Skeleton variant="circular" width={44} height={44} animation="wave" />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton width="45%" height={22} animation="wave" />
                            <Skeleton width="30%" height={16} sx={{ mt: 0.5 }} animation="wave" />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Skeleton variant="rounded" width={80} height={28} sx={{ borderRadius: 2 }} animation="wave" />
                          <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: 2 }} animation="wave" />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : filteredFriends.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                    <People sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
                    <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
                      {searchFilter ? 'No matching friends found' : 'No friends added yet'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 3 }}>
                      {searchFilter
                        ? 'Try searching with a different name or email'
                        : 'Connect with friends to start splitting expenses directly, settle up balances, and share group trips.'}
                    </Typography>
                    {!searchFilter && (
                      <Button
                        variant="contained"
                        className="glass-emerald-active"
                        startIcon={<PersonAdd />}
                        onClick={() => {
                          setSearchOpen(true);
                          setSearchQuery('');
                          setSearchResults([]);
                          setHasSearched(false);
                        }}
                        sx={{
                          borderRadius: 2.5,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          textTransform: 'none',
                          px: 3,
                        }}
                      >
                        Add Your First Friend
                      </Button>
                    )}
                  </Box>
                ) : (
                  <List disablePadding>
                    {filteredFriends.map((f, i) => (
                      <React.Fragment key={f.friendshipId || i}>
                        <ListItem
                          sx={{
                            px: { xs: 2, sm: 3 },
                            py: 2,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: { xs: 1.5, sm: 2 },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0, width: '100%' }}>
                            <ListItemAvatar sx={{ minWidth: 'auto' }}>
                              <Avatar
                                src={f.friend?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(f.friend?.name || f.friend?.email || 'friend')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                                sx={{
                                  width: 44,
                                  height: 44,
                                  bgcolor: 'rgba(16, 185, 129, 0.2)',
                                  border: '1px solid rgba(52, 211, 153, 0.3)',
                                  fontSize: '0.95rem',
                                  fontWeight: 700,
                                  color: '#34D399',
                                }}
                              >
                                {f.friend?.name?.charAt(0) || '?'}
                              </Avatar>
                            </ListItemAvatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {f.friend?.name}
                                </Typography>
                                <Chip
                                  label="Mutual"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34D399',
                                    border: '1px solid rgba(52, 211, 153, 0.3)',
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.friend?.email || 'Verified mutual contact'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' }, mt: { xs: 0.5, sm: 0 } }}>
                            <Button
                              size="small"
                              variant="outlined"
                              className="glass-tertiary"
                              startIcon={<Visibility fontSize="small" />}
                              onClick={() => openFriendProfile(f.friend?.id)}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: '0.775rem',
                                textTransform: 'none',
                                color: 'text.primary',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                '&:hover': {
                                  borderColor: 'rgba(59, 130, 246, 0.4)',
                                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                                },
                              }}
                            >
                              Profile
                            </Button>

                            <Button
                              size="small"
                              variant="outlined"
                              className="glass-tertiary"
                              startIcon={<ReceiptLong fontSize="small" />}
                              onClick={() => router.push(`/expenses/new?friendId=${f.friend?.id}`)}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: '0.775rem',
                                textTransform: 'none',
                                color: 'text.primary',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                '&:hover': {
                                  borderColor: 'rgba(16, 185, 129, 0.4)',
                                  bgcolor: 'rgba(16, 185, 129, 0.08)',
                                },
                              }}
                            >
                              Split Bill
                            </Button>

                            <Tooltip title="Remove Friend">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setFriendToRemove({ id: f.friendshipId, name: f.friend?.name || 'Friend' });
                                  setRemoveDialogOpen(true);
                                }}
                                sx={{
                                  color: 'text.secondary',
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    color: '#EF4444',
                                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItem>
                        {i < filteredFriends.length - 1 && (
                          <Divider component="li" sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* TAB 1: RECEIVED PENDING REQUESTS */}
        {tab === 1 && (
          <Card
            className="glass-secondary glass-specular-top"
            sx={{
              borderRadius: 3.5,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {pending.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                  <Typography variant="body1" fontWeight={600} color="text.secondary">
                    No received friend requests
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    When someone sends you a connection request, you can approve or decline it here.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {pending.map((req, i) => (
                    <React.Fragment key={req.id || i}>
                      <ListItem
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: 2,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: { xs: 1.5, sm: 2 },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0, width: '100%' }}>
                          <ListItemAvatar sx={{ minWidth: 'auto' }}>
                            <Avatar
                              src={req.user?.avatarUrl || undefined}
                              sx={{
                                width: 44,
                                height: 44,
                                bgcolor: 'rgba(59, 130, 246, 0.2)',
                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: '#60A5FA',
                              }}
                            >
                              {req.user?.name?.charAt(0) || '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {req.user?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {req.user?.email || 'Sent you an invite to become mutual friends'}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
                          <Button
                            size="small"
                            variant="contained"
                            className="glass-emerald-active"
                            startIcon={<Check fontSize="small" />}
                            onClick={() => handleAccept(req.id)}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 700,
                              color: '#FFFFFF',
                              textTransform: 'none',
                              px: 2,
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            className="glass-tertiary"
                            onClick={() => handleCancelOrDecline(req.id, false)}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 600,
                              color: 'text.secondary',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              textTransform: 'none',
                              px: 2,
                              '&:hover': {
                                color: '#EF4444',
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                bgcolor: 'rgba(239, 68, 68, 0.08)',
                              },
                            }}
                          >
                            Decline
                          </Button>
                        </Box>
                      </ListItem>
                      {i < pending.length - 1 && (
                        <Divider component="li" sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 2: SENT REQUESTS (OUTGOING) */}
        {tab === 2 && (
          <Card
            className="glass-secondary glass-specular-top"
            sx={{
              borderRadius: 3.5,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {sentRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                  <HourglassEmpty sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
                  <Typography variant="body1" fontWeight={600} color="text.primary">
                    No active outgoing requests
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, maxWidth: 380, mx: 'auto' }}>
                    When you send a friend request, it stays in this tab until the recipient accepts your invitation.
                  </Typography>
                  <Button
                    variant="outlined"
                    className="glass-tertiary"
                    startIcon={<PersonAdd />}
                    onClick={() => {
                      setSearchOpen(true);
                      setSearchQuery('');
                      setSearchResults([]);
                      setHasSearched(false);
                    }}
                    sx={{
                      mt: 2.5,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 650,
                      color: 'text.primary',
                    }}
                  >
                    Send an Invite
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {sentRequests.map((req, i) => (
                    <React.Fragment key={req.id || i}>
                      <ListItem
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: 2,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: { xs: 1.5, sm: 2 },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0, width: '100%' }}>
                          <ListItemAvatar sx={{ minWidth: 'auto' }}>
                            <Avatar
                              src={req.friend?.avatarUrl || undefined}
                              sx={{
                                width: 44,
                                height: 44,
                                bgcolor: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: '#F59E0B',
                              }}
                            >
                              {req.friend?.name?.charAt(0) || '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {req.friend?.name}
                              </Typography>
                              <Chip
                                label="Awaiting Approval"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  bgcolor: 'rgba(245, 158, 11, 0.15)',
                                  color: '#F59E0B',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {req.friend?.email || 'Invited user'} • Sent {new Date(req.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
                          <Button
                            size="small"
                            variant="outlined"
                            className="glass-tertiary"
                            onClick={() => handleCancelOrDecline(req.id, true)}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 600,
                              color: 'text.secondary',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              textTransform: 'none',
                              fontSize: '0.775rem',
                              px: 2,
                              '&:hover': {
                                color: '#EF4444',
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                bgcolor: 'rgba(239, 68, 68, 0.08)',
                              },
                            }}
                          >
                            Cancel Request
                          </Button>
                        </Box>
                      </ListItem>
                      {i < sentRequests.length - 1 && (
                        <Divider component="li" sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search & Add Friend Dialog (With Realtime Debounced Search) */}
        <Dialog
          open={searchOpen}
          onClose={() => {
            setSearchOpen(false);
            setSearchResults([]);
            setSearchQuery('');
            setHasSearched(false);
          }}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: { xs: 3, sm: 4 },
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
                m: { xs: 1.5, sm: 3 },
                width: { xs: 'calc(100% - 24px)', sm: '100%' },
                maxWidth: { xs: 'calc(100% - 24px)', sm: '600px' },
                maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
              },
            },
          }}
        >
          <DialogTitle component="div" sx={{ pb: 1, pt: { xs: 2, sm: 2.5 }, px: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" component="span" fontWeight={800} sx={{ color: 'text.primary', display: 'block', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
              Add Friends
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
              Search across registered users by name, email, or phone number
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {/* Search Box */}
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: 'text.secondary' }}>
                  Enter Name, Email, or Phone
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    autoFocus
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-tertiary"
                    sx={{
                      borderRadius: 2.5,
                      '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleDirectInvite();
                      }
                    }}
                    slotProps={{
                      input: {
                        endAdornment: searching ? (
                          <InputAdornment position="end">
                            <CircularProgress size={18} sx={{ color: '#34D399' }} />
                          </InputAdornment>
                        ) : null,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleDirectInvite}
                    disabled={searching || searchQuery.trim().length < 2}
                    className="glass-emerald-active"
                    sx={{
                      borderRadius: 2.5,
                      px: 2.5,
                      color: '#FFFFFF',
                      fontWeight: 700,
                      textTransform: 'none',
                    }}
                  >
                    {searchQuery.includes('@') || /^\+?[0-9]{7,15}$/.test(searchQuery.replace(/[\s-]/g, '')) ? 'Invite' : <Search />}
                  </Button>
                </Box>
              </Box>

              {/* Informational tip on friendship model */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <CheckCircle sx={{ color: '#60A5FA', fontSize: 20 }} />
                <Typography variant="caption" sx={{ color: isLight ? '#1E40AF' : '#93C5FD', lineHeight: 1.4 }}>
                  <strong>Mutual Confirmation:</strong> Once you send an invitation, the recipient will review and accept it before you become mutual friends.
                </Typography>
              </Box>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    Matching Users ({searchResults.length})
                  </Typography>
                  <List disablePadding>
                    {searchResults.map((u) => (
                      <ListItem
                        key={u.id}
                        className="glass-tertiary"
                        sx={{
                          px: 1.5,
                          py: 1.5,
                          mb: 1,
                          borderRadius: 2.5,
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 'auto' }}>
                          <Avatar
                            src={u.avatarUrl || undefined}
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: 'rgba(16, 185, 129, 0.2)',
                              color: '#34D399',
                              border: '1px solid rgba(52, 211, 153, 0.3)',
                            }}
                          >
                            {u.name?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.email}
                          </Typography>
                        </Box>

                        {/* Status / Action */}
                        {u.friendshipStatus === 'FRIENDS' ? (
                          <Chip
                            label="Connected"
                            size="small"
                            icon={<Check sx={{ fontSize: 14 }} />}
                            sx={{
                              height: 26,
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                            }}
                          />
                        ) : u.friendshipStatus === 'REQUEST_SENT' ? (
                          <Chip
                            label="Invite Sent"
                            size="small"
                            sx={{
                              height: 26,
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                            }}
                          />
                        ) : u.friendshipStatus === 'REQUEST_RECEIVED' ? (
                          <Button
                            size="small"
                            variant="contained"
                            className="glass-emerald-active"
                            onClick={() => {
                              handleAccept(u.friendshipId);
                              setSearchOpen(false);
                            }}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              color: '#FFFFFF',
                            }}
                          >
                            Accept
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            className="glass-tertiary"
                            startIcon={<PersonAdd />}
                            onClick={() => handleSendRequest(u.id)}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 650,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              color: 'text.primary',
                              border: '1px solid rgba(255, 255, 255, 0.14)',
                              '&:hover': {
                                borderColor: 'rgba(16, 185, 129, 0.4)',
                                bgcolor: 'rgba(16, 185, 129, 0.08)',
                              },
                            }}
                          >
                            Add
                          </Button>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Clean Empty State only after search completes */}
              {hasSearched && searchResults.length === 0 && !searching && (
                <Box sx={{ textAlign: 'center', py: 2.5, px: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2.5 }}>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    No registered user matching "{searchQuery}".
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Enter their email address or phone number above and click "Invite" to send them a direct invitation.
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 } }}>
            <Button
              onClick={() => {
                setSearchOpen(false);
                setSearchResults([]);
                setSearchQuery('');
                setHasSearched(false);
              }}
              className="glass-tertiary"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                color: 'text.secondary',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Friend Profile Modal (Safe, Non-Confidential Data) */}
        <Dialog
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: { xs: 3, sm: 4 },
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
                p: { xs: 2.5, sm: 3 },
                m: { xs: 1.5, sm: 3 },
              },
            },
          }}
        >
          {profileLoading ? (
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
                <Skeleton variant="circular" width={64} height={64} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="50%" height={28} />
                  <Skeleton width="30%" height={18} sx={{ mt: 0.5 }} />
                </Box>
              </Box>
              <Skeleton variant="rounded" width="100%" height={90} sx={{ borderRadius: 3, mb: 2 }} />
              <Skeleton variant="rounded" width="100%" height={120} sx={{ borderRadius: 3 }} />
            </Box>
          ) : selectedFriendProfile ? (
            <Box>
              {/* Profile Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
                <Avatar
                  src={selectedFriendProfile.avatarUrl || undefined}
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    border: '2px solid rgba(52, 211, 153, 0.4)',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                  }}
                >
                  {selectedFriendProfile.name?.charAt(0) || '?'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
                    {selectedFriendProfile.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={`${selectedFriendProfile.fairScoreTier} Member`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        bgcolor: 'rgba(16, 185, 129, 0.15)',
                        color: '#34D399',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Member since {new Date(selectedFriendProfile.memberSince).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Net Balance Highlight */}
              <Card
                className="glass-tertiary"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  mb: 2.5,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  Direct Balance Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{
                      color:
                        selectedFriendProfile.netBalance > 0
                          ? '#10B981'
                          : selectedFriendProfile.netBalance < 0
                          ? '#EF4444'
                          : 'text.secondary',
                    }}
                  >
                    {selectedFriendProfile.netBalance > 0
                      ? `Owes you ₹${selectedFriendProfile.netBalance.toFixed(2)}`
                      : selectedFriendProfile.netBalance < 0
                      ? `You owe ₹${Math.abs(selectedFriendProfile.netBalance).toFixed(2)}`
                      : 'Settled Up (₹0.00)'}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    className="glass-tertiary"
                    onClick={() => {
                      setProfileModalOpen(false);
                      router.push('/settlements');
                    }}
                    sx={{
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 650,
                      textTransform: 'none',
                      color: 'text.primary',
                    }}
                  >
                    Settlement Center
                  </Button>
                </Box>
              </Card>

              {/* Mutual Groups */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.primary', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupIcon sx={{ fontSize: 18, color: '#34D399' }} />
                  Mutual Shared Groups ({selectedFriendProfile.mutualGroups?.length || 0})
                </Typography>
                {selectedFriendProfile.mutualGroups?.length > 0 ? (
                  <Stack spacing={1}>
                    {selectedFriendProfile.mutualGroups.map((g: any) => (
                      <Box
                        key={g.id}
                        className="glass-tertiary"
                        onClick={() => {
                          setProfileModalOpen(false);
                          router.push(`/groups/${g.id}`);
                        }}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 700 }}>
                            {g.name?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={650} sx={{ color: 'text.primary' }}>
                            {g.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {g.memberCount} members
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No mutual groups shared yet. You can add them to any of your groups.
                  </Typography>
                )}
              </Box>

              {/* Privacy Shield Disclaimer */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 3,
                }}
              >
                <Shield sx={{ fontSize: 18, color: '#10B981' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.725rem', lineHeight: 1.4 }}>
                  <strong>FairShare Privacy Shield:</strong> Confidential records (passwords, private personal budgets, and external transactions) are kept private and secure.
                </Typography>
              </Box>

              {/* Modal Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                <Button
                  color="error"
                  size="small"
                  startIcon={<Delete fontSize="small" />}
                  onClick={() => {
                    setFriendToRemove({ id: selectedFriendProfile.friendshipId, name: selectedFriendProfile.name });
                    setRemoveDialogOpen(true);
                  }}
                  sx={{ textTransform: 'none', fontWeight: 650, fontSize: '0.8rem' }}
                >
                  Remove Friend
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    className="glass-tertiary"
                    onClick={() => setProfileModalOpen(false)}
                    sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}
                  >
                    Close
                  </Button>
                  <Button
                    variant="contained"
                    className="glass-emerald-active"
                    startIcon={<ReceiptLong fontSize="small" />}
                    onClick={() => {
                      setProfileModalOpen(false);
                      router.push(`/expenses/new?friendId=${selectedFriendProfile.id}`);
                    }}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, color: '#FFFFFF' }}
                  >
                    Split Bill
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">Profile could not be retrieved.</Typography>
              <Button onClick={() => setProfileModalOpen(false)} sx={{ mt: 2 }}>Close</Button>
            </Box>
          )}
        </Dialog>

        {/* Remove Friend Confirmation Dialog */}
        <Dialog
          open={removeDialogOpen}
          onClose={() => {
            setRemoveDialogOpen(false);
            setFriendToRemove(null);
          }}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: 3.5,
                p: 2.5,
                border: '1px solid rgba(239, 68, 68, 0.25)',
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
              <WarningAmber />
            </Avatar>
            <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary' }}>
              Remove Friend
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Are you sure you want to remove <strong>{friendToRemove?.name}</strong> from your friends? Both of you will no longer appear in each other's direct friends list, though shared group expenses and balances will be preserved.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              onClick={() => {
                setRemoveDialogOpen(false);
                setFriendToRemove(null);
              }}
              className="glass-tertiary"
              sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmRemoveFriend}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Confirm Remove
            </Button>
          </Box>
        </Dialog>

        {/* Friend Invite Confirmation Dialog (from QR code or Share Link) */}
        <Dialog
          open={inviteModalOpen && Boolean(inviteTargetUser)}
          onClose={() => setInviteModalOpen(false)}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: { xs: 3, sm: 4 },
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
                p: { xs: 2.5, sm: 3 },
                m: 2,
              },
            },
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              src={inviteTargetUser?.avatarUrl || undefined}
              sx={{
                width: 72,
                height: 72,
                mx: 'auto',
                mb: 2,
                bgcolor: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                fontSize: '1.75rem',
                fontWeight: 700,
                border: '2px solid rgba(52, 211, 153, 0.4)',
              }}
            >
              {inviteTargetUser?.name?.charAt(0) || 'F'}
            </Avatar>
            <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5 }}>
              Connect with {inviteTargetUser?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You were invited to connect on FairShare. Add them as a friend to easily split bills and track shared expenses together.
            </Typography>

            <Stack spacing={1.5}>
              <Button
                variant="contained"
                fullWidth
                className="glass-emerald-active"
                startIcon={<PersonAdd />}
                onClick={async () => {
                  if (inviteTargetUser?.id) {
                    await handleSendRequest(inviteTargetUser.id);
                    setInviteModalOpen(false);
                  }
                }}
                sx={{
                  borderRadius: 2.5,
                  py: 1.25,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textTransform: 'none',
                }}
              >
                Send Friend Request
              </Button>
              <Button
                variant="text"
                fullWidth
                onClick={() => setInviteModalOpen(false)}
                sx={{
                  borderRadius: 2.5,
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Maybe Later
              </Button>
            </Stack>
          </Box>
        </Dialog>

        {/* Friend Connect QR Modal */}
        <QrCodeModal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title="Connect with Me"
          subtitle={`Scan with your camera or FairShare app to add ${profile?.name || user?.user_metadata?.name || 'me'} as a friend instantly.`}
          value={personalInviteLink}
          badgeText="Personal Connect"
          downloadFileName={`fairshare-connect-${(profile?.name || user?.user_metadata?.name || 'user').toLowerCase().replace(/\s+/g, '-')}-qr`}
        />

        {/* Global Feedback Snackbar */}
        <Snackbar
          open={Boolean(toastMessage)}
          autoHideDuration={3000}
          onClose={() => setToastMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={toastSeverity} sx={{ borderRadius: 3, fontWeight: 600 }}>
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
}
