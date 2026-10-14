'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Fab, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, Chip,
  IconButton, Avatar, List, ListItem, ListItemAvatar, ListItemText,
  ListItemSecondaryAction, Skeleton, useTheme, alpha, Stack, Tooltip,
  FormControl, InputLabel, Select, Divider, InputAdornment, Pagination,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  Add, FilterList, Delete, Edit, Receipt, CalendarToday,
  AttachMoney, Category, Close, Search,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { expenseApi, groupApi, userApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
  const { user, loading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterCategory, setFilterCategory] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);

  // Form state
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

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 15 };
      if (filterCategory) params.category = filterCategory;
      const res = await expenseApi.list(params);
      setExpenses(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error('Fetch expenses error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory]);

  useEffect(() => {
    if (user) fetchExpenses();
  }, [user, fetchExpenses]);

  useEffect(() => {
    if (user) {
      groupApi.list().then((res) => setGroups(res.data.data)).catch(console.error);
    }
  }, [user]);

  const handleCreate = async () => {
    if (!form.description || !form.amount) return;
    setSubmitting(true);
    try {
      const splits = splitUsers.length > 0
        ? splitUsers.map((userId) => ({ userId }))
        : [{ userId: user!.id }];

      // Make sure the payer is also in splits for equal split
      if (form.splitType === 'EQUAL' && !splits.find(s => s.userId === user!.id)) {
        splits.unshift({ userId: user!.id });
      }

      await expenseApi.create({
        ...form,
        amount: parseFloat(form.amount),
        groupId: form.groupId || null,
        date: new Date(form.date).toISOString(),
        splits,
      });
      setDialogOpen(false);
      setForm({
        description: '', amount: '', category: 'GENERAL', splitType: 'EQUAL',
        groupId: '', notes: '', date: new Date().toISOString().split('T')[0],
      });
      setSplitUsers([]);
      fetchExpenses();
    } catch (error: any) {
      console.error('Create expense error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await expenseApi.delete(id);
      fetchExpenses();
    } catch (error) {
      console.error('Delete expense error:', error);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Expenses</Typography>
            <Typography variant="body1" color="text.secondary">Track and manage your expenses</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              borderRadius: 3,
              px: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            }}
          >
            Add Expense
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ py: 2, px: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FilterList sx={{ color: 'text.secondary' }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {CATEGORY_EMOJI[cat]} {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {filterCategory && (
              <Chip
                label={filterCategory.toLowerCase()}
                onDelete={() => setFilterCategory('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </CardContent>
        </Card>

        {/* Expense List */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Skeleton variant="circular" width={44} height={44} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="40%" />
                      <Skeleton width="25%" />
                    </Box>
                    <Skeleton width={80} height={32} />
                  </Box>
                ))}
              </Box>
            ) : expenses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Receipt sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No expenses yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start tracking by adding your first expense
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
                  Add Expense
                </Button>
              </Box>
            ) : (
              <List disablePadding>
                {expenses.map((expense, i) => (
                  <React.Fragment key={expense.id}>
                    <ListItem
                      sx={{
                        px: 3,
                        py: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.04) },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            fontSize: '1.3rem',
                          }}
                        >
                          {CATEGORY_EMOJI[expense.category] || '📋'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {expense.description}
                            </Typography>
                            {expense.group && (
                              <Chip
                                label={expense.group.name}
                                size="small"
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Paid by {expense.paidBy?.name || 'Unknown'} •{' '}
                            {new Date(expense.date).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                            {' • '}
                            {expense.shares?.length || 0} people
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ mr: 1 }}>
                            {formatCurrency(Number(expense.amount))}
                          </Typography>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(expense.id)}
                              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {i < expenses.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
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

        {/* FAB for mobile */}
        <Fab
          color="primary"
          onClick={() => setDialogOpen(true)}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          }}
        >
          <Add />
        </Fab>

        {/* Add Expense Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" fontWeight={700}>Add Expense</Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Dinner at restaurant"
                required
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
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
                    InputLabelProps={{ shrink: true }}
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
                {groups.map((g: any) => (
                  <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Split Type"
                value={form.splitType}
                onChange={(e) => setForm({ ...form, splitType: e.target.value })}
              >
                <MenuItem value="EQUAL">Equal split</MenuItem>
                <MenuItem value="EXACT">Exact amounts</MenuItem>
                <MenuItem value="PERCENTAGE">By percentage</MenuItem>
                <MenuItem value="SHARES">By shares</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 3 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={submitting || !form.description || !form.amount}
              sx={{
                borderRadius: 3,
                px: 4,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              }}
            >
              {submitting ? 'Adding...' : 'Add Expense'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
