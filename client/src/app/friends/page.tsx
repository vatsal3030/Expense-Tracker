'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, ListItemSecondaryAction, Divider,
  Skeleton, useTheme, alpha, IconButton, Chip, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Stack, Tabs, Tab, Badge,
  InputAdornment, Tooltip, Snackbar, Alert, Grid,
} from '@mui/material';
import {
  PersonAdd, Check, Close, People, Search, Delete,
  ContentCopy, WhatsApp, ReceiptLong, Share, ArrowForward, QrCode2,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { friendApi, userApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import QrCodeModal from '@/components/common/QrCodeModal';

export default function FriendsPage() {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';
  const { user, profile, loading: authLoading } = useAuth();

  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');

  // Add friend dialog state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const hasLoadedFriendsRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      if (!hasLoadedFriendsRef.current) {
        setLoading(true);
      }
      const [friendsRes, pendingRes] = await Promise.all([
        friendApi.list(),
        friendApi.pending(),
      ]);
      setFriends(friendsRes.data?.data || []);
      setPending(pendingRes.data?.data || []);
      hasLoadedFriendsRef.current = true;
    } catch (error) {
      console.error('Fetch friends error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const res = await userApi.search(searchQuery);
      setSearchResults(res.data?.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      await friendApi.request(friendId);
      setSearchResults((prev) => prev.filter((u) => u.id !== friendId));
      setToastMessage('Friend request sent!');
    } catch (error: any) {
      setToastMessage(error.response?.data?.error || 'Failed to send request.');
    }
  };

  const handleDirectInvite = async () => {
    if (searchQuery.includes('@')) {
      try {
        await friendApi.request({ email: searchQuery.trim() });
        setToastMessage(`Friend invitation sent to ${searchQuery}!`);
        setSearchQuery('');
        setSearchOpen(false);
        fetchData();
      } catch (err: any) {
        setToastMessage(err.response?.data?.error || 'Failed to send invite.');
      }
    } else if (/^\+?[0-9]{7,15}$/.test(searchQuery.replace(/[\s-]/g, ''))) {
      try {
        await friendApi.request({ phone: searchQuery.trim() });
        setToastMessage(`Friend invitation sent to ${searchQuery}!`);
        setSearchQuery('');
        setSearchOpen(false);
        fetchData();
      } catch (err: any) {
        setToastMessage(err.response?.data?.error || 'Failed to send invite.');
      }
    } else {
      handleSearch();
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await friendApi.accept(id);
      setToastMessage('Friend request accepted!');
      fetchData();
    } catch (error) {
      console.error('Accept error:', error);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await friendApi.remove(id);
      setToastMessage('Friend removed.');
      fetchData();
    } catch (error) {
      console.error('Remove error:', error);
    }
  };

  const personalInviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/signup?ref=${user?.id || ''}`
    : 'https://fairshare.app/auth/signup';

  const handleCopyInvite = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(personalInviteLink);
      setCopiedLink(true);
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
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: 'text.primary', fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' } }}>
              Friends & Connections
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, letterSpacing: '-0.01em', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Manage your personal contacts for direct 1-on-1 expenses and group splits
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              className="glass-tertiary"
              startIcon={<QrCode2 />}
              onClick={() => setQrModalOpen(true)}
              sx={{
                flex: { xs: 1, sm: 'none' },
                borderRadius: 2.5,
                px: 2.5,
                py: 1,
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
              My QR Code
            </Button>
            <Button
              variant="contained"
              className="glass-emerald-active"
              startIcon={<PersonAdd />}
              onClick={() => setSearchOpen(true)}
              sx={{
                flex: { xs: 1, sm: 'none' },
                borderRadius: 2.5,
                px: 3,
                py: 1,
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
            mb: 3.5,
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3.5,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  className="glass-tertiary"
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <Share fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary', letterSpacing: '-0.01em' }}>
                    Invite Friends to FairShare
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Share your unique connection link to link balances instantly without manual searches
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                <TextField
                  size="small"
                  value={personalInviteLink}
                  slotProps={{
                    input: {
                      readOnly: true,
                      sx: {
                        fontSize: '0.8rem',
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
                <Button
                  variant="contained"
                  onClick={handleCopyInvite}
                  startIcon={copiedLink ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                  className={copiedLink ? '' : 'glass-emerald-active'}
                  sx={{
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
            </Grid>
          </Grid>
        </Card>

        {/* Segmented Liquid Glass Tabs */}
        <Box sx={{ mb: 3 }}>
          <Box
            className="glass-tertiary"
            sx={{
              display: 'inline-flex',
              p: 0.5,
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                minHeight: 40,
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
              <Tab label={`All Friends (${friends.length})`} />
              <Tab
                label={
                  <Badge
                    badgeContent={pending.length}
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 18, minWidth: 18 } }}
                  >
                    <Box sx={{ pr: pending.length > 0 ? 1.5 : 0 }}>Pending Requests</Box>
                  </Badge>
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
                  <Box sx={{ p: 3 }}>
                    {[1, 2, 3].map((i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2, py: 2 }}>
                        <Skeleton variant="circular" width={44} height={44} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton width="40%" height={24} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                          <Skeleton width="25%" height={18} sx={{ mt: 0.5, bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : filteredFriends.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                    <People sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
                    <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
                      {searchFilter ? 'No friends match your search' : 'No friends yet'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {searchFilter
                        ? 'Try typing another name or clearing the filter.'
                        : 'Connect with friends to start splitting expenses directly.'}
                    </Typography>
                    <Button
                      variant="contained"
                      className="glass-emerald-active"
                      startIcon={<PersonAdd />}
                      onClick={() => setSearchOpen(true)}
                      sx={{
                        color: '#FFFFFF',
                        borderRadius: 2.5,
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                    >
                      Find Friends
                    </Button>
                  </Box>
                ) : (
                  <List disablePadding>
                    {filteredFriends.map((f, i) => (
                      <React.Fragment key={f.friendshipId || i}>
                        <ListItem
                          sx={{
                            px: 3,
                            py: 2,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.04)',
                            },
                          }}
                        >
                          <ListItemAvatar>
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
                          <ListItemText
                            disableTypography
                            primary={
                              <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary' }}>
                                {f.friend?.name}
                              </Typography>
                            }
                            secondary={f.friend?.email || f.friend?.phone || 'Verified friend'}
                          />

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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

                            <Tooltip title="Remove Connection">
                              <IconButton
                                size="small"
                                onClick={() => handleRemove(f.friendshipId)}
                                sx={{
                                  color: 'text.secondary',
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    color: '#EF4444',
                                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                                    transform: 'scale(1.08)',
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

        {/* TAB 1: PENDING REQUESTS */}
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
                    No pending friend requests
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    When someone sends you a connection request, it will appear here.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {pending.map((req, i) => (
                    <React.Fragment key={req.id || i}>
                      <ListItem sx={{ px: 3, py: 2 }}>
                        <ListItemAvatar>
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
                        <ListItemText
                          disableTypography
                          primary={
                            <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary' }}>
                              {req.user?.name}
                            </Typography>
                          }
                          secondary={req.user?.email || 'Wants to connect with you'}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
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
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              className="glass-tertiary"
                              onClick={() => handleRemove(req.id)}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                color: 'text.secondary',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                textTransform: 'none',
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
                        </ListItemSecondaryAction>
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

        {/* Search & Add Friend Dialog */}
        <Dialog
          open={searchOpen}
          onClose={() => {
            setSearchOpen(false);
            setSearchResults([]);
            setSearchQuery('');
          }}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
              },
            },
          }}
        >
          <DialogTitle component="div" sx={{ pb: 1, pt: 2.5, px: 3 }}>
            <Typography variant="h6" component="span" fontWeight={800} sx={{ color: 'text.primary', display: 'block' }}>
              Add Friends
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Search by name, email, or phone number
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 3 }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {/* Direct Search / Invite Box */}
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: 'text.secondary' }}>
                  Enter Name, Email, or Phone
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="friend@gmail.com or +919876543210 or name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-tertiary"
                    sx={{
                      borderRadius: 2.5,
                      '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (searchQuery.includes('@') || /^\+?[0-9]{7,15}$/.test(searchQuery.replace(/[\s-]/g, ''))) {
                          handleDirectInvite();
                        } else {
                          handleSearch();
                        }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleDirectInvite}
                    disabled={searching || searchQuery.length < 2}
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

              {/* Search Results */}
              {searchResults.length > 0 && (
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
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                      }}
                    >
                      <ListItemAvatar>
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
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>{u.name}</Typography>}
                        secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }}>{u.email}</Typography>}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        className="glass-tertiary"
                        startIcon={<PersonAdd />}
                        onClick={() => handleSendRequest(u.id)}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          color: 'text.primary',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          '&:hover': {
                            borderColor: 'rgba(16, 185, 129, 0.4)',
                            bgcolor: 'rgba(16, 185, 129, 0.08)',
                          },
                        }}
                      >
                        Add
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}

              {searchResults.length === 0 && searchQuery.length >= 2 && !searching && !searchQuery.includes('@') && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No registered user matching "{searchQuery}".
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tip: Enter their full email address or phone number to send an invitation.
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={() => {
                setSearchOpen(false);
                setSearchResults([]);
                setSearchQuery('');
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
          <Alert severity="success" sx={{ borderRadius: 3, fontWeight: 600 }}>
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
}
