'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Skeleton,
  useTheme,
  alpha,
  Stack,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Divider,
  InputAdornment,
  Pagination,
  Drawer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import {
  Add,
  FilterList,
  Delete,
  Receipt,
  Search,
  Close,
  Download,
  Sort,
  Clear,
  QrCode2,
  CheckCircle,
  HourglassEmpty,
  Group as GroupIcon,
  CalendarToday,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { expenseApi, groupApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import UpiPaymentModal from '@/components/settlement/UpiPaymentModal';

const CATEGORIES = [
  'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES', 'RENT',
  'HEALTH', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'SUBSCRIPTIONS', 'INSURANCE',
  'GIFTS', 'GENERAL', 'OTHER',
];

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: '🍔', TRANSPORT: '🚗', ENTERTAINMENT: '🎬', SHOPPING: '🛍️',
  UTILITIES: '💡', RENT: '🏠', HEALTH: '💊', EDUCATION: '📚',
  TRAVEL: '✈️', GROCERIES: '🛒', SUBSCRIPTIONS: '📱', INSURANCE: '🛡️',
  GIFTS: '🎁', GENERAL: '📋', OTHER: '📌',
  DONATIONS: '❤️', INVESTMENTS: '📈', SALARY: '💰', FREELANCE: '💻',
};

export default function ExpensesPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterSplitType, setFilterSplitType] = useState('');
  const [filterDatePreset, setFilterDatePreset] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Modals & Drawers
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{ name: string; amount: number; upiId?: string }>({
    name: '',
    amount: 0,
  });

  const [groups, setGroups] = useState<any[]>([]);

  // Add Expense Form state
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'GENERAL',
    splitType: 'EQUAL',
    groupId: '',
    notes: '',
    date: '',
  });
  const [splitUsers, setSplitUsers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm((f) => ({ ...f, date: new Date().toISOString().split('T')[0] }));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  // Fetch expenses with all active filters
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 15,
        sortBy,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filterCategory) params.category = filterCategory;
      if (filterGroup) params.groupId = filterGroup;
      if (filterSplitType) params.splitType = filterSplitType;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;

      // Date range calculation
      if (filterDatePreset !== 'all') {
        const now = new Date();
        if (filterDatePreset === 'today') {
          const start = new Date(now.setHours(0, 0, 0, 0));
          params.startDate = start.toISOString();
        } else if (filterDatePreset === 'week') {
          const start = new Date();
          start.setDate(now.getDate() - 7);
          params.startDate = start.toISOString();
        } else if (filterDatePreset === 'month') {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          params.startDate = start.toISOString();
        }
      }

      const res = await expenseApi.list(params);
      if (res.data?.data) {
        setExpenses(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || res.data.data.length);
      }
    } catch (error) {
      console.error('Fetch expenses error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filterCategory, filterGroup, filterSplitType, filterDatePreset, sortBy, minAmount, maxAmount]);

  useEffect(() => {
    if (user) fetchExpenses();
  }, [user, fetchExpenses]);

  useEffect(() => {
    if (user) {
      groupApi.list().then((res) => setGroups(res.data.data || [])).catch(console.error);
    }
  }, [user]);

  // Fast Optimistic UI Creation (0ms UI lag strategy)
  const handleCreate = async () => {
    if (!form.description || !form.amount) return;

    const currentUserId = profile?.id || user?.id || '';
    const numericAmount = parseFloat(form.amount);

    const splits = splitUsers.length > 0
      ? splitUsers.map((uid) => ({ userId: uid }))
      : [{ userId: currentUserId }];

    if (form.splitType === 'EQUAL' && !splits.find((s) => s.userId === currentUserId)) {
      splits.unshift({ userId: currentUserId });
    }

    const payload = {
      description: form.description,
      amount: numericAmount,
      category: form.category,
      splitType: form.splitType,
      groupId: form.groupId || null,
      notes: form.notes || null,
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      splits,
    };

    // Optimistic item
    const tempId = `optimistic-${Date.now()}`;
    const targetGroup = groups.find((g) => g.id === form.groupId);
    const optimisticExpense = {
      id: tempId,
      ...payload,
      paidById: currentUserId,
      paidBy: {
        id: currentUserId,
        name: profile?.name || user?.user_metadata?.full_name || 'You',
        avatarUrl: profile?.avatarUrl || null,
      },
      group: targetGroup ? { id: targetGroup.id, name: targetGroup.name } : null,
      shares: splits.map((s) => ({
        userId: s.userId,
        amount: numericAmount / splits.length,
        user: { id: s.userId, name: s.userId === currentUserId ? 'You' : 'Friend' },
      })),
      createdAt: new Date().toISOString(),
    };

    // 0ms instant UI update
    const previousSnapshot = [...expenses];
    setExpenses([optimisticExpense, ...expenses]);
    setDialogOpen(false);
    setForm({
      description: '',
      amount: '',
      category: 'GENERAL',
      splitType: 'EQUAL',
      groupId: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
    setSplitUsers([]);

    try {
      setSubmitting(true);
      const res = await expenseApi.create(payload);
      if (res.data?.data) {
        // Replace optimistic placeholder with authoritative server record
        setExpenses((prev) => prev.map((exp) => (exp.id === tempId ? res.data.data : exp)));
      }
    } catch (error) {
      console.error('Optimistic create expense error:', error);
      // Rollback to previous state on failure
      setExpenses(previousSnapshot);
      alert('Failed to save expense. Reverted optimistic change.');
    } finally {
      setSubmitting(false);
    }
  };

  // Fast Optimistic Delete (0ms UI lag)
  const handleDelete = async (id: string) => {
    const previousSnapshot = [...expenses];
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    if (selectedExpense?.id === id) setSelectedExpense(null);

    try {
      await expenseApi.delete(id);
    } catch (error) {
      console.error('Delete expense error:', error);
      // Rollback on network failure
      setExpenses(previousSnapshot);
      alert('Could not delete expense on server. Reverted.');
    }
  };

  // Export filtered expenses to CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = 'Description,Category,Amount,Currency,Paid By,Group,Date\n';
    const rows = expenses
      .map(
        (e) =>
          `"${e.description.replace(/"/g, '""')}",${e.category},${Number(e.amount)},${e.currency || 'INR'},"${
            e.paidBy?.name || ''
          }","${e.group?.name || 'Personal'}",${new Date(e.date).toISOString().split('T')[0]}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `owino_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const hasActiveFilters = Boolean(
    searchQuery || filterCategory || filterGroup || filterSplitType || filterDatePreset !== 'all' || minAmount || maxAmount
  );

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setFilterGroup('');
    setFilterSplitType('');
    setFilterDatePreset('all');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date_desc');
    setPage(1);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: 6 }}>
        {/* Page Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
              Expenses & Shared Transactions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Manage itemized bills, splits, and settlement statuses ({totalCount} total)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download fontSize="small" />}
              onClick={handleExportCSV}
              sx={{
                borderRadius: 2.5,
                borderColor: theme.palette.divider,
                color: 'text.primary',
                bgcolor: 'background.paper',
                fontWeight: 600,
                textTransform: 'none',
                py: 0.85,
                px: 2,
                '&:hover': { borderColor: '#0E6245', bgcolor: alpha('#0E6245', 0.04) },
              }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderRadius: 2.5,
                px: 2.5,
                py: 0.85,
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: '#0E6245',
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(14,98,69,0.25)',
                '&:hover': { bgcolor: '#094A34' },
              }}
            >
              Add Expense
            </Button>
          </Box>
        </Box>

        {/* Rich Search, Filter & Sort Control Panel */}
        <Card
          sx={{
            mb: 3,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              {/* Keyword Search */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search description, notes, receipts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2.5, bgcolor: theme.palette.mode === 'light' ? '#F4F5F7' : 'rgba(255,255,255,0.04)' },
                    },
                  }}
                />
              </Grid>

              {/* Category Filter */}
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filterCategory}
                    label="Category"
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setPage(1);
                    }}
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {CATEGORY_EMOJI[cat]} {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Group Filter */}
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Group</InputLabel>
                  <Select
                    value={filterGroup}
                    label="Group"
                    onChange={(e) => {
                      setFilterGroup(e.target.value);
                      setPage(1);
                    }}
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="">All Groups</MenuItem>
                    {groups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Date Presets */}
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date</InputLabel>
                  <Select
                    value={filterDatePreset}
                    label="Date"
                    onChange={(e) => {
                      setFilterDatePreset(e.target.value as any);
                      setPage(1);
                    }}
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">Past 7 Days</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Sorting */}
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="date_desc">Newest First</MenuItem>
                    <MenuItem value="date_asc">Oldest First</MenuItem>
                    <MenuItem value="amount_desc">Amount: High → Low</MenuItem>
                    <MenuItem value="amount_asc">Amount: Low → High</MenuItem>
                    <MenuItem value="desc_asc">Title: A → Z</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Active Filters Row */}
            {hasActiveFilters && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Active filters:
                </Typography>
                {searchQuery && (
                  <Chip
                    size="small"
                    label={`Search: "${searchQuery}"`}
                    onDelete={() => setSearchQuery('')}
                    sx={{ height: 24, fontSize: '0.75rem' }}
                  />
                )}
                {filterCategory && (
                  <Chip
                    size="small"
                    label={`Category: ${filterCategory}`}
                    onDelete={() => setFilterCategory('')}
                    sx={{ height: 24, fontSize: '0.75rem' }}
                  />
                )}
                {filterGroup && (
                  <Chip
                    size="small"
                    label={`Group: ${groups.find((g) => g.id === filterGroup)?.name || 'Selected'}`}
                    onDelete={() => setFilterGroup('')}
                    sx={{ height: 24, fontSize: '0.75rem' }}
                  />
                )}
                {filterDatePreset !== 'all' && (
                  <Chip
                    size="small"
                    label={`Date: ${filterDatePreset}`}
                    onDelete={() => setFilterDatePreset('all')}
                    sx={{ height: 24, fontSize: '0.75rem' }}
                  />
                )}
                <Button
                  size="small"
                  onClick={clearAllFilters}
                  startIcon={<Clear fontSize="small" />}
                  sx={{ fontSize: '0.75rem', textTransform: 'none', color: '#EF4444', ml: 'auto' }}
                >
                  Clear all
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Expenses List Card */}
        <Card
          sx={{
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {loading && expenses.length === 0 ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Skeleton variant="circular" width={44} height={44} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="40%" height={24} />
                      <Skeleton width="25%" height={16} />
                    </Box>
                    <Skeleton width={80} height={32} />
                  </Box>
                ))}
              </Box>
            ) : expenses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Receipt sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No matching expenses found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {hasActiveFilters ? 'Try adjusting your filters or search keywords.' : 'Start tracking by adding your first expense.'}
                </Typography>
                {hasActiveFilters ? (
                  <Button variant="outlined" onClick={clearAllFilters} sx={{ textTransform: 'none' }}>
                    Reset Filters
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={{ bgcolor: '#0E6245', '&:hover': { bgcolor: '#094A34' } }}
                  >
                    Add Expense
                  </Button>
                )}
              </Box>
            ) : (
              <List disablePadding>
                {expenses.map((expense, i) => (
                  <React.Fragment key={expense.id}>
                    <ListItem
                      onClick={() => setSelectedExpense(expense)}
                      sx={{
                        px: 3,
                        py: 2,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.04) },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: alpha('#0E6245', 0.1),
                            fontSize: '1.3rem',
                          }}
                        >
                          {CATEGORY_EMOJI[expense.category] || '📋'}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600} sx={{ color: 'text.primary' }}>
                              {expense.description}
                            </Typography>
                            {expense.group && (
                              <Chip
                                label={expense.group.name}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.675rem',
                                  bgcolor: alpha('#0E6245', 0.08),
                                  color: '#0E6245',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Paid by <strong>{expense.paidBy?.name || 'Someone'}</strong> •{' '}
                            {new Date(expense.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            • {expense.shares?.length || 1} people split ({expense.splitType?.toLowerCase() || 'equal'})
                          </Typography>
                        }
                      />

                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary' }}>
                            {formatCurrency(Number(expense.amount))}
                          </Typography>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(expense.id);
                              }}
                              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {i < expenses.length - 1 && <Divider component="li" sx={{ borderColor: theme.palette.divider }} />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Mobile FAB */}
        <Fab
          color="primary"
          onClick={() => setDialogOpen(true)}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#0E6245',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(14,98,69,0.35)',
            '&:hover': { bgcolor: '#094A34' },
          }}
        >
          <Add />
        </Fab>

        {/* Detailed Expense Drawer / Modal */}
        <Drawer
          anchor="right"
          open={Boolean(selectedExpense)}
          onClose={() => setSelectedExpense(null)}
          slotProps={{
            backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.3)' } },
            paper: {
              sx: {
                width: { xs: '100%', sm: 460 },
                bgcolor: 'background.paper',
                borderLeft: (th) => `1px solid ${th.palette.divider}`,
                p: 3,
              },
            },
          }}
        >
          {selectedExpense && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha('#0E6245', 0.1), width: 44, height: 44, fontSize: '1.3rem' }}>
                    {CATEGORY_EMOJI[selectedExpense.category] || '📋'}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                      {selectedExpense.category}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                      {selectedExpense.description}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setSelectedExpense(null)} size="small">
                  <Close fontSize="small" />
                </IconButton>
              </Box>

              <Divider sx={{ my: 1.5, borderColor: theme.palette.divider }} />

              {/* Total Amount Card */}
              <Card sx={{ p: 2.5, bgcolor: alpha('#0E6245', 0.06), borderRadius: 3, border: `1px solid ${alpha('#0E6245', 0.15)}`, mb: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  TOTAL EXPENSE AMOUNT
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ color: '#0E6245', my: 0.5 }}>
                  {formatCurrency(Number(selectedExpense.amount))}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Chip
                    size="small"
                    label={selectedExpense.group?.name || 'Personal Expense'}
                    sx={{ bgcolor: 'background.paper', fontWeight: 600, height: 22, fontSize: '0.7rem' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(selectedExpense.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Card>

              {/* Paid By info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Paid By
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2.5,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Avatar src={selectedExpense.paidBy?.avatarUrl} sx={{ width: 36, height: 36, bgcolor: alpha('#0E6245', 0.12), color: '#0E6245' }}>
                    {selectedExpense.paidBy?.name?.charAt(0) || 'P'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedExpense.paidBy?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedExpense.paidBy?.email || 'Group member'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Itemized Split Breakdown */}
              <Box sx={{ flex: 1, overflowY: 'auto', mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Split Breakdown ({selectedExpense.shares?.length || 0} participants)
                </Typography>
                <Card sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: theme.palette.mode === 'light' ? '#F9FAFB' : 'rgba(255,255,255,0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>MEMBER</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>SHARE</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>STATUS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedExpense.shares || []).map((share: any, idx: number) => {
                        const isPayer = share.userId === selectedExpense.paidById;
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: alpha('#0E6245', 0.1), color: '#0E6245' }}>
                                  {share.user?.name?.charAt(0) || '?'}
                                </Avatar>
                                <Typography variant="body2" fontSize="0.8rem" fontWeight={500}>
                                  {share.user?.name || 'Participant'} {isPayer && '(Paid)'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontSize="0.8rem" fontWeight={700}>
                                {formatCurrency(Number(share.amount))}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {isPayer ? (
                                <Chip label="Paid" size="small" sx={{ bgcolor: alpha('#0E6245', 0.1), color: '#0E6245', height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                              ) : (
                                <Chip label="Owes" size="small" sx={{ bgcolor: alpha('#F59E0B', 0.1), color: '#D97706', height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1.5, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<QrCode2 />}
                  onClick={() => {
                    setSettleTarget({
                      name: selectedExpense.paidBy?.name || 'Friend',
                      amount: Number(selectedExpense.amount) / (selectedExpense.shares?.length || 1),
                    });
                    setSettleModalOpen(true);
                  }}
                  sx={{
                    bgcolor: '#0E6245',
                    color: '#ffffff',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 1,
                    borderRadius: 2.5,
                    '&:hover': { bgcolor: '#094A34' },
                  }}
                >
                  Settle Your Share
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDelete(selectedExpense.id)}
                  sx={{ borderRadius: 2.5, textTransform: 'none' }}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          )}
        </Drawer>

        {/* Add Expense Dialog (Fixed component="div" to eliminate h6 in h2 hydration warning) */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 4 } } }}
        >
          <DialogTitle
            component="div"
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, fontWeight: 700 }}
          >
            <Typography variant="h6" component="span" fontWeight={700}>
              Add Expense
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Dinner with team"
                required
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  },
                }}
                required
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {CATEGORY_EMOJI[cat]} {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                select
                label="Group (optional)"
                value={form.groupId}
                onChange={(e) => setForm({ ...form, groupId: e.target.value })}
              >
                <MenuItem value="">No group (personal)</MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                multiline
                rows={2}
                placeholder="Add receipt notes or memo..."
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={submitting || !form.description || !form.amount}
              sx={{
                bgcolor: '#0E6245',
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2.5,
                px: 3,
                '&:hover': { bgcolor: '#094A34' },
              }}
            >
              {submitting ? 'Saving...' : 'Save Expense (0ms)'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* UPI Settlement Modal */}
        <UpiPaymentModal
          open={settleModalOpen}
          onClose={() => setSettleModalOpen(false)}
          payeeName={settleTarget.name}
          amount={settleTarget.amount}
          onConfirmSettlement={() => {
            fetchExpenses();
          }}
        />
      </Box>
    </AppLayout>
  );
}
