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
  ContentCopy, WhatsApp, ReceiptLong, Share, ArrowForward,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { friendApi, userApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function FriendsPage() {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';
  const { user, loading: authLoading } = useAuth();

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
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
              Friends & Connections
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Manage your personal contacts for 1-on-1 expenses and group splits
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setSearchOpen(true)}
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
            Add Friend
          </Button>
        </Box>

        {/* Personal Invite Banner (Savexa & Ocupite style) */}
        <Card
          sx={{
            mb: 3.5,
            p: 2.5,
            borderRadius: 3.5,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    bgcolor: alpha('#0E6245', 0.1),
                    color: '#0E6245',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Share fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary' }}>
                    Invite Friends to FairShare
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Share your unique referral link to connect instantly without searching
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <TextField
                  size="small"
                  value={personalInviteLink}
                  slotProps={{ input: { readOnly: true } }}
                  sx={{
                    maxWidth: 300,
                    bgcolor: alpha(theme.palette.action.hover, 0.04),
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem' },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleCopyInvite}
                  startIcon={copiedLink ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    bgcolor: copiedLink ? 'success.main' : '#0E6245',
                    color: '#FFFFFF',
                    textTransform: 'none',
                    px: 2,
                    '&:hover': { bgcolor: copiedLink ? 'success.dark' : '#094A34' },
                  }}
                >
                  {copiedLink ? 'Copied' : 'Copy'}
                </Button>
                <IconButton
                  onClick={handleShareWhatsApp}
                  sx={{
                    bgcolor: alpha('#25D366', 0.1),
                    color: '#25D366',
                    borderRadius: 2,
                    '&:hover': { bgcolor: alpha('#25D366', 0.2) },
                  }}
                >
                  <WhatsApp fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Tabs: Friends vs Requests */}
        <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                minWidth: 120,
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
                    bgcolor: 'background.paper',
                    borderRadius: 2.5,
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                  }}
                />
              </Box>
            )}

            <Card
              sx={{
                borderRadius: 3.5,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {loading ? (
                  <Box sx={{ p: 3 }}>
                    {[1, 2, 3].map((i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2, py: 2 }}>
                        <Skeleton variant="circular" width={44} height={44} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton width="40%" height={24} />
                          <Skeleton width="25%" height={18} sx={{ mt: 0.5 }} />
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
                      startIcon={<PersonAdd />}
                      onClick={() => setSearchOpen(true)}
                      sx={{
                        bgcolor: '#0E6245',
                        color: '#FFFFFF',
                        borderRadius: 2.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#094A34' },
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
                            transition: 'all 0.15s ease',
                            '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.04) },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              src={f.friend?.avatarUrl || undefined}
                              sx={{
                                width: 44,
                                height: 44,
                                bgcolor: '#0E6245',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                              }}
                            >
                              {f.friend?.name?.charAt(0) || '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
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
                              startIcon={<ReceiptLong fontSize="small" />}
                              onClick={() => router.push(`/expenses/new?friendId=${f.friend?.id}`)}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: '0.775rem',
                                textTransform: 'none',
                                borderColor: theme.palette.divider,
                                color: 'text.primary',
                                '&:hover': { borderColor: '#0E6245', bgcolor: alpha('#0E6245', 0.04) },
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
                                  '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItem>
                        {i < filteredFriends.length - 1 && (
                          <Divider component="li" sx={{ borderColor: theme.palette.divider }} />
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
            sx={{
              borderRadius: 3.5,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
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
                            sx={{ width: 44, height: 44, bgcolor: '#3B82F6', fontSize: '0.95rem', fontWeight: 700 }}
                          >
                            {req.user?.name?.charAt(0) || '?'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
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
                              startIcon={<Check fontSize="small" />}
                              onClick={() => handleAccept(req.id)}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                bgcolor: '#0E6245',
                                color: '#FFFFFF',
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#094A34' },
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleRemove(req.id)}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                color: 'text.secondary',
                                borderColor: theme.palette.divider,
                                textTransform: 'none',
                                '&:hover': { color: 'error.main', borderColor: 'error.main' },
                              }}
                            >
                              Decline
                            </Button>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {i < pending.length - 1 && (
                        <Divider component="li" sx={{ borderColor: theme.palette.divider }} />
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
          slotProps={{ paper: { sx: { borderRadius: 4, bgcolor: 'background.paper' } } }}
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
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Enter Name, Email, or Phone
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="friend@gmail.com or +919876543210 or name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    sx={{
                      borderRadius: 2.5,
                      px: 2.5,
                      bgcolor: '#0E6245',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#094A34' },
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
                      sx={{
                        px: 1,
                        py: 1.5,
                        borderRadius: 2,
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.06) },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={u.avatarUrl || undefined} sx={{ width: 40, height: 40, bgcolor: '#0E6245' }}>
                          {u.name?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={<Typography variant="body2" fontWeight={700}>{u.name}</Typography>} secondary={u.email} />
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PersonAdd />}
                        onClick={() => handleSendRequest(u.id)}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'none',
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
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

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
