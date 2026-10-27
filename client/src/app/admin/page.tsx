'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Avatar, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, InputAdornment, Skeleton, IconButton,
  Tabs, Tab, Tooltip, Snackbar, Alert, CircularProgress, useTheme,
  Switch, FormControlLabel, Stack,
} from '@mui/material';
import {
  AdminPanelSettings, People, Group as GroupIcon, ReceiptLong,
  AccountBalanceWallet, CheckCircle, Warning, Search, Refresh,
  Timeline, Bolt, Dns, Security, TrendingUp, PersonOff, Person,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { adminApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import CategoryCycleLoader from '@/components/common/CategoryCycleLoader';

export default function AdminPage() {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';
  const { user, profile, loading: authLoading } = useAuth();

  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Tab: 0 = Users, 1 = Platform Audit Feed, 2 = System Health
  const [tab, setTab] = useState(0);

  // Search and Pagination for Users Table
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Feedback Snackbar
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'info' | 'error'>('success');
  const hasLoadedAdminRef = React.useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    if (user?.id && !hasLoadedAdminRef.current) {
      hasLoadedAdminRef.current = true;
      fetchOverview();
      fetchUsers(0, rowsPerPage, searchQuery);
    }
  }, [user?.id]);

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await adminApi.getOverview();
      setOverview(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
      setToastSeverity('error');
      setToastMessage('Failed to load platform overview metrics.');
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchUsers = async (p = page, limit = rowsPerPage, q = searchQuery) => {
    setLoadingUsers(true);
    try {
      const res = await adminApi.getUsers({ page: p + 1, limit, q });
      setUsers(res.data?.data?.users || []);
      setTotalUsersCount(res.data?.data?.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchActivities = async () => {
    setLoadingActivity(true);
    try {
      const res = await adminApi.getActivity();
      setActivities(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load audit activity:', err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleTabChange = (_: any, newTab: number) => {
    setTab(newTab);
    if (newTab === 1 && activities.length === 0) {
      fetchActivities();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers(0, rowsPerPage, searchQuery);
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      await adminApi.toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u))
      );
      setToastSeverity('success');
      setToastMessage(`User status successfully updated.`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setToastSeverity('error');
      setToastMessage('Failed to update user status.');
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m`;
  };

  if (profile && !(profile as any).isAdmin) {
    return (
      <AppLayout>
        <Box sx={{ maxWidth: 480, mx: 'auto', mt: { xs: 4, md: 8 }, textAlign: 'center', p: 4, borderRadius: 3.5 }} className="glass-secondary">
          <Security sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
          <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', mb: 1 }}>
            Access Restricted
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This portal is strictly restricted to platform administrators. Your account does not have administrative permissions.
          </Typography>
          <Button
            variant="contained"
            className="glass-emerald-active"
            onClick={() => router.push('/dashboard')}
            sx={{ borderRadius: 2.5, fontWeight: 700, color: '#FFFFFF', textTransform: 'none', px: 3 }}
          >
            Return to Dashboard
          </Button>
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 }, width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {/* Header Row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 3.5,
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <AdminPanelSettings sx={{ color: '#34D399', fontSize: { xs: 26, sm: 30 } }} />
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.025em', color: 'text.primary', fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' } }}>
                Platform Control Center
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: '-0.01em', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Real-time platform telemetry, user management, and system health monitoring
            </Typography>
          </Box>

          <Button
            variant="outlined"
            className="glass-tertiary"
            startIcon={<Refresh />}
            onClick={() => {
              fetchOverview();
              fetchUsers();
              if (tab === 1) fetchActivities();
            }}
            sx={{
              borderRadius: 2.5,
              px: 2.5,
              py: 0.8,
              fontWeight: 650,
              textTransform: 'none',
              color: 'text.primary',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            Refresh Telemetry
          </Button>
        </Box>

        {/* Telemetry Metric KPI Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          {/* Total Users */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card className="glass-secondary glass-specular-top" sx={{ p: 2.5, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                  Registered Users
                </Typography>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
                  <People sx={{ fontSize: 18 }} />
                </Avatar>
              </Box>
              {loadingOverview ? (
                <Skeleton width="60%" height={38} />
              ) : (
                <Box>
                  <Typography variant="h4" fontWeight={850} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
                    {overview?.stats?.totalUsers || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 13, color: '#10B981' }} />
                    <strong style={{ color: '#10B981' }}>{overview?.stats?.activeUsers || 0}</strong> active accounts
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Total Groups */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card className="glass-secondary glass-specular-top" sx={{ p: 2.5, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                  Active Groups
                </Typography>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                  <GroupIcon sx={{ fontSize: 18 }} />
                </Avatar>
              </Box>
              {loadingOverview ? (
                <Skeleton width="60%" height={38} />
              ) : (
                <Box>
                  <Typography variant="h4" fontWeight={850} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
                    {overview?.stats?.totalGroups || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Collaborative expense rooms
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Platform Expense Volume */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card className="glass-secondary glass-specular-top" sx={{ p: 2.5, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                  Platform Volume
                </Typography>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                  <ReceiptLong sx={{ fontSize: 18 }} />
                </Avatar>
              </Box>
              {loadingOverview ? (
                <Skeleton width="60%" height={38} />
              ) : (
                <Box>
                  <Typography variant="h4" fontWeight={850} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
                    ₹{(overview?.stats?.totalVolume || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Across <strong>{overview?.stats?.totalExpenses || 0}</strong> tracked expenses
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Total Settled Volume */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card className="glass-secondary glass-specular-top" sx={{ p: 2.5, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                  Settled Volume
                </Typography>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' }}>
                  <AccountBalanceWallet sx={{ fontSize: 18 }} />
                </Avatar>
              </Box>
              {loadingOverview ? (
                <Skeleton width="60%" height={38} />
              ) : (
                <Box>
                  <Typography variant="h4" fontWeight={850} sx={{ color: '#10B981', letterSpacing: '-0.02em' }}>
                    ₹{(overview?.stats?.settledVolume || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Across <strong>{overview?.stats?.totalSettlements || 0}</strong> completed settlements
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* Tab Controls Capsule (Proper width on desktop) */}
        <Box sx={{ mb: 3 }}>
          <Box
            className="glass-control-surface"
            sx={{
              display: { xs: 'flex', sm: 'inline-flex' },
              p: 0.5,
              borderRadius: 3,
              width: { xs: '100%', sm: 'auto' },
              maxWidth: '100%',
              overflowX: 'auto',
            }}
          >
            <Tabs
              value={tab}
              onChange={handleTabChange}
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
              <Tab label="User Directory" />
              <Tab label="System Audit Activity" />
              <Tab label="Engine Telemetry" />
            </Tabs>
          </Box>
        </Box>

        {/* TAB 0: USER DIRECTORY */}
        {tab === 0 && (
          <Card className="glass-secondary glass-specular-top" sx={{ borderRadius: 3.5, overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary', fontSize: '1.05rem' }}>
                  Platform Registered Users ({totalUsersCount})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Browse, search, and manage platform user accounts
                </Typography>
              </Box>

              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
                <TextField
                  size="small"
                  placeholder="Filter by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-tertiary"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ width: { xs: '100%', sm: 300 }, borderRadius: 2.5 }}
                />
                <Button type="submit" variant="contained" className="glass-emerald-active" sx={{ borderRadius: 2.5, color: '#FFFFFF', fontWeight: 650, textTransform: 'none', px: 2 }}>
                  Search
                </Button>
              </form>
            </Box>

            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>User</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Contact Info</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Groups</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Expenses</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Joined</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingUsers ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Skeleton variant="circular" width={36} height={36} animation="wave" />
                            <Box>
                              <Skeleton variant="text" width={100} height={18} animation="wave" />
                              <Skeleton variant="text" width={70} height={14} animation="wave" />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell><Skeleton variant="text" width={130} height={18} animation="wave" /></TableCell>
                        <TableCell><Skeleton variant="rounded" width={60} height={22} sx={{ borderRadius: 1 }} animation="wave" /></TableCell>
                        <TableCell><Skeleton variant="rounded" width={55} height={22} sx={{ borderRadius: 1 }} animation="wave" /></TableCell>
                        <TableCell><Skeleton variant="text" width={40} height={18} animation="wave" /></TableCell>
                        <TableCell><Skeleton variant="text" width={80} height={18} animation="wave" /></TableCell>
                        <TableCell align="right"><Skeleton variant="circular" width={28} height={28} sx={{ ml: 'auto' }} animation="wave" /></TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                        No users matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={u.avatarUrl || undefined}
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: 'rgba(16, 185, 129, 0.2)',
                                color: '#34D399',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                              }}
                            >
                              {u.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                                {u.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {u.id.substring(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {u.email}
                          </Typography>
                          {u.phone && (
                            <Typography variant="caption" color="text.secondary">
                              {u.phone}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={u.groupsCount} size="small" sx={{ fontWeight: 700, height: 22 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={650}>
                            {u.expensesCount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.isActive ? 'Active' : 'Suspended'}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 750,
                              bgcolor: u.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: u.isActive ? '#34D399' : '#EF4444',
                              border: `1px solid ${u.isActive ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            className="glass-tertiary"
                            onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                            sx={{
                              borderRadius: 2,
                              fontSize: '0.725rem',
                              textTransform: 'none',
                              fontWeight: 650,
                              color: u.isActive ? 'text.secondary' : '#34D399',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                            }}
                          >
                            {u.isActive ? 'Suspend' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalUsersCount}
              page={page}
              onPageChange={(_, newPage) => {
                setPage(newPage);
                fetchUsers(newPage, rowsPerPage, searchQuery);
              }}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                const newRows = parseInt(e.target.value, 10);
                setRowsPerPage(newRows);
                setPage(0);
                fetchUsers(0, newRows, searchQuery);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
            />
          </Card>
        )}

        {/* TAB 1: SYSTEM AUDIT ACTIVITY */}
        {tab === 1 && (
          <Card className="glass-secondary glass-specular-top" sx={{ p: 3, borderRadius: 3.5 }}>
            <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary' }}>
                  Platform Audit Log
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time events across groups, settlements, and member activities
                </Typography>
              </Box>
              <Button size="small" variant="outlined" className="glass-tertiary" onClick={fetchActivities} sx={{ borderRadius: 2 }}>
                Refresh Feed
              </Button>
            </Box>

            {loadingActivity ? (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={32} sx={{ color: '#34D399' }} />
              </Box>
            ) : activities.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Timeline sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No activity entries logged yet.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {activities.map((act) => (
                  <Box
                    key={act.id}
                    className="glass-tertiary"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                      <Avatar
                        src={act.user?.avatarUrl || undefined}
                        sx={{ width: 36, height: 36, bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', fontSize: '0.85rem' }}
                      >
                        {act.user?.name?.charAt(0) || '?'}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                          {act.message || act.type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {act.user?.name} {act.group ? `• Group: ${act.group.name}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(act.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Card>
        )}

        {/* TAB 2: ENGINE TELEMETRY */}
        {tab === 2 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass-secondary glass-specular-top" sx={{ p: 3, borderRadius: 3.5, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Dns sx={{ color: '#34D399' }} />
                  <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary' }}>
                    Server Runtime Telemetry
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <Typography variant="body2" color="text.secondary">Server Status</Typography>
                    <Chip label="OPERATIONAL" size="small" color="success" sx={{ fontWeight: 800, height: 22 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <Typography variant="body2" color="text.secondary">Server Uptime</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                      {overview?.system?.uptimeSeconds ? formatUptime(overview.system.uptimeSeconds) : 'Calculating...'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <Typography variant="body2" color="text.secondary">Node Runtime</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                      {overview?.system?.nodeVersion || process.version || 'v20.x'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <Typography variant="body2" color="text.secondary">Operating OS</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                      {overview?.system?.platform || 'Linux (AWS EC2)'}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass-secondary glass-specular-top" sx={{ p: 3, borderRadius: 3.5, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Security sx={{ color: '#60A5FA' }} />
                  <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary' }}>
                    Database & Cache Health
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <Typography variant="body2" color="text.secondary">PostgreSQL (Supabase Pooler)</Typography>
                    <Chip label="CONNECTED" size="small" color="success" sx={{ fontWeight: 800, height: 22 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <Typography variant="body2" color="text.secondary">Auth Engine</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                      Supabase Cloud Auth v2
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <Typography variant="body2" color="text.secondary">Mutual Connections Ratio</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#10B981' }}>
                      {overview?.stats?.totalFriendships || 0} confirmed / {overview?.stats?.pendingFriendships || 0} pending
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <Typography variant="body2" color="text.secondary">Security Envelope</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#34D399' }}>
                      Strict Glass Cryptographic Headers
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

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
