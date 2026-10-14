'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, ListItemSecondaryAction, Divider,
  Skeleton, useTheme, alpha, IconButton, Chip, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Stack, Tabs, Tab, Badge,
} from '@mui/material';
import { PersonAdd, Check, Close, People, Search, Delete } from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { friendApi, userApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function FriendsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        friendApi.list(),
        friendApi.pending(),
      ]);
      setFriends(friendsRes.data.data);
      setPending(pendingRes.data.data);
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
      setSearchResults(res.data.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      await friendApi.request(friendId);
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
    } catch (error) {
      console.error('Send request error:', error);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await friendApi.accept(id);
      fetchData();
    } catch (error) {
      console.error('Accept error:', error);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await friendApi.remove(id);
      fetchData();
    } catch (error) {
      console.error('Remove error:', error);
    }
  };

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Friends</Typography>
            <Typography variant="body1" color="text.secondary">Manage your connections</Typography>
          </Box>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setSearchOpen(true)}
            sx={{
              borderRadius: 3, px: 3, fontWeight: 600,
              bgcolor: '#059669', color: '#ffffff',
              boxShadow: '0 4px 14px rgba(5,150,105,0.25)',
              '&:hover': { bgcolor: '#047857', boxShadow: '0 6px 20px rgba(5,150,105,0.35)' },
            }}>
            Add Friend
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Tab label={`Friends (${friends.length})`} />
            <Tab label={
              <Badge badgeContent={pending.length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 18, minWidth: 18 } }}>
                <Box sx={{ pr: pending.length > 0 ? 1.5 : 0 }}>Requests</Box>
              </Badge>
            } />
          </Tabs>
        </Card>

        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3].map(i => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, py: 2 }}>
                    <Skeleton variant="circular" width={44} height={44} />
                    <Box sx={{ flex: 1 }}><Skeleton width="40%" /><Skeleton width="25%" /></Box>
                  </Box>
                ))}
              </Box>
            ) : tab === 0 ? (
              friends.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <People sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No friends yet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Add friends to start splitting expenses
                  </Typography>
                  <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setSearchOpen(true)}>
                    Add Friend
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {friends.map((f, i) => (
                    <React.Fragment key={f.friendshipId}>
                      <ListItem sx={{ px: 3, py: 2 }}>
                        <ListItemAvatar>
                          <Avatar src={f.friend.avatarUrl || undefined} sx={{ width: 44, height: 44, bgcolor: theme.palette.primary.main, fontSize: '0.9rem' }}>
                            {f.friend.name?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body1" fontWeight={600}>{f.friend.name}</Typography>}
                          secondary={f.friend.email}
                        />
                        <ListItemSecondaryAction>
                          <IconButton size="small" onClick={() => handleRemove(f.friendshipId)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {i < friends.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )
            ) : (
              pending.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body1" color="text.secondary">No pending requests</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {pending.map((req, i) => (
                    <React.Fragment key={req.id}>
                      <ListItem sx={{ px: 3, py: 2 }}>
                        <ListItemAvatar>
                          <Avatar src={req.user.avatarUrl || undefined} sx={{ width: 44, height: 44, bgcolor: theme.palette.secondary.main, fontSize: '0.9rem' }}>
                            {req.user.name?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body1" fontWeight={600}>{req.user.name}</Typography>}
                          secondary={req.user.email}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" onClick={() => handleAccept(req.id)} sx={{ color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                              <Check fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleRemove(req.id)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {i < pending.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )
            )}
          </CardContent>
        </Card>

        {/* Search Dialog */}
        <Dialog open={searchOpen} onClose={() => { setSearchOpen(false); setSearchResults([]); setSearchQuery(''); }} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
          <DialogTitle>
            <Typography variant="h6" fontWeight={700}>Find Friends</Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField fullWidth size="small" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              <Button variant="contained" onClick={handleSearch} disabled={searching || searchQuery.length < 2} sx={{ borderRadius: 3, bgcolor: '#059669', color: '#ffffff', '&:hover': { bgcolor: '#047857' } }}>
                <Search />
              </Button>
            </Box>
            {searchResults.length > 0 && (
              <List disablePadding>
                {searchResults.map(u => (
                  <ListItem key={u.id} sx={{ px: 1, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.06) } }}>
                    <ListItemAvatar>
                      <Avatar src={u.avatarUrl || undefined} sx={{ width: 40, height: 40 }}>{u.name?.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={u.name} secondary={u.email} />
                    <Button size="small" variant="outlined" startIcon={<PersonAdd />} onClick={() => handleSendRequest(u.id)} sx={{ borderRadius: 2 }}>
                      Add
                    </Button>
                  </ListItem>
                ))}
              </List>
            )}
            {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                No users found
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => { setSearchOpen(false); setSearchResults([]); setSearchQuery(''); }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
