'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Avatar,
  AvatarGroup, Chip, Skeleton, useTheme, alpha, Stack,
} from '@mui/material';
import {
  Add, Close, Home, Flight, Favorite, Business, People, FamilyRestroom,
  Work, MoreHoriz, ArrowForward,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { groupApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const GROUP_TYPE_CONFIG: Record<string, { icon: React.ReactElement; color: string }> = {
  HOME: { icon: <Home />, color: '#14b8a6' },
  TRIP: { icon: <Flight />, color: '#f59e0b' },
  COUPLE: { icon: <Favorite />, color: '#ec4899' },
  OFFICE: { icon: <Business />, color: '#3b82f6' },
  FRIENDS: { icon: <People />, color: '#0ea5e9' },
  FAMILY: { icon: <FamilyRestroom />, color: '#10b981' },
  PROJECT: { icon: <Work />, color: '#10b981' },
  OTHER: { icon: <MoreHoriz />, color: '#64748b' },
};

export default function GroupsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'FRIENDS', currency: 'INR' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      const res = await groupApi.list();
      setGroups(res.data.data);
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
      await groupApi.create(form);
      setDialogOpen(false);
      setForm({ name: '', description: '', type: 'FRIENDS', currency: 'INR' });
      fetchGroups();
    } catch (error) {
      console.error('Create group error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Groups</Typography>
            <Typography variant="body1" color="text.secondary">Manage your expense groups</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              borderRadius: 3, px: 3, fontWeight: 600,
              bgcolor: '#059669', color: '#ffffff',
              boxShadow: '0 4px 14px rgba(5,150,105,0.25)',
              '&:hover': { bgcolor: '#047857', boxShadow: '0 6px 20px rgba(5,150,105,0.35)' },
            }}
          >
            Create Group
          </Button>
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Card><CardContent sx={{ p: 3 }}>
                  <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                  <Skeleton width="60%" height={28} />
                  <Skeleton width="40%" />
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <People sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No groups yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create a group to start splitting expenses
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
                Create Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {groups.map((group, index) => {
              const config = GROUP_TYPE_CONFIG[group.type] || GROUP_TYPE_CONFIG.OTHER;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={group.id}>
                  <Card
                    className="animate-slide-in-up stagger-item"
                    sx={{
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""', position: 'absolute', top: 0, left: 0, right: 0,
                        height: 4, bgcolor: config.color,
                      },
                    }}
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box
                          sx={{
                            width: 48, height: 48, borderRadius: 3,
                            bgcolor: alpha(config.color, 0.12),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: config.color,
                          }}
                        >
                          {config.icon}
                        </Box>
                        <Chip
                          label={group.type.toLowerCase()}
                          size="small"
                          sx={{
                            textTransform: 'capitalize', height: 24, fontSize: '0.7rem',
                            bgcolor: alpha(config.color, 0.08), color: config.color, fontWeight: 600,
                          }}
                        />
                      </Box>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                        {group.name}
                      </Typography>
                      {group.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                          {group.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.75rem' } }}>
                          {group.members?.map((m: any) => (
                            <Avatar key={m.user.id} src={m.user.avatarUrl || undefined} sx={{ bgcolor: config.color }}>
                              {m.user.name?.charAt(0)}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                        <Typography variant="caption" color="text.secondary">
                          {group._count?.expenses || 0} expenses
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Create Group Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" fontWeight={700}>Create Group</Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField fullWidth label="Group Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Flatmates" />
              <TextField fullWidth label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {Object.entries(GROUP_TYPE_CONFIG).map(([key, cfg]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
                          {key.charAt(0) + key.slice(1).toLowerCase()}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                    <MenuItem value="INR">🇮🇳 INR</MenuItem>
                    <MenuItem value="USD">🇺🇸 USD</MenuItem>
                    <MenuItem value="EUR">🇪🇺 EUR</MenuItem>
                    <MenuItem value="GBP">🇬🇧 GBP</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 3 }}>Cancel</Button>
            <Button variant="contained" onClick={handleCreate} disabled={submitting || !form.name} sx={{ borderRadius: 3, px: 4, fontWeight: 600, bgcolor: '#059669', color: '#ffffff', '&:hover': { bgcolor: '#047857' } }}>
              {submitting ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
