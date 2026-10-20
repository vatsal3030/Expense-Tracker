'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
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
  Paper,
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
  Menu,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
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
  TableChart,
  Code,
  Print,
  KeyboardArrowDown,
  Description,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { expenseApi, groupApi, settlementApi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import UpiPaymentModal from '@/components/settlement/UpiPaymentModal';
import SplitwiseExpenseItem from '@/components/expense/SplitwiseExpenseItem';
import SmartQuickAddBar from '@/components/expense/SmartQuickAddBar';
import { useDataRefresh, triggerDataRefresh } from '@/lib/events';

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

function ExpensesContent() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialGroup = searchParams.get('groupId') || '';
  const initialPage = parseInt(searchParams.get('page') || '1') || 1;
  const initialSearch = searchParams.get('search') || '';

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fairshare_cached_expenses');
      if (saved) setExpenses(JSON.parse(saved));
    } catch {}
  }, []);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [filterGroup, setFilterGroup] = useState(initialGroup);
  const [filterSplitType, setFilterSplitType] = useState('');
  const [filterDatePreset, setFilterDatePreset] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Sync state changes with URL query string
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (filterCategory) params.set('category', filterCategory);
    if (filterGroup) params.set('groupId', filterGroup);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    const queryStr = params.toString();
    const newUrl = queryStr ? `/expenses?${queryStr}` : '/expenses';
    window.history.replaceState(null, '', newUrl);
  }, [page, filterCategory, filterGroup, searchQuery]);

  // Modals & Drawers
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{ name: string; amount: number; upiId?: string; payeeId?: string; groupId?: string }>({
    name: '',
    amount: 0,
  });

  const [groups, setGroups] = useState<any[]>([]);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

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

  const hasLoadedExpensesRef = React.useRef(false);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  // Fetch expenses with all active filters
  const fetchExpenses = useCallback(async () => {
    try {
      if (!hasLoadedExpensesRef.current) {
        setLoading(true);
      }
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
        if (typeof window !== 'undefined' && page === 1 && !filterCategory && !filterGroup && !searchQuery) {
          try {
            localStorage.setItem('fairshare_cached_expenses', JSON.stringify(res.data.data));
          } catch {}
        }
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || res.data.data.length);
      }
      hasLoadedExpensesRef.current = true;
    } catch (error) {
      console.error('Fetch expenses error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filterCategory, filterGroup, filterSplitType, filterDatePreset, sortBy, minAmount, maxAmount]);

  useEffect(() => {
    if (user?.id) fetchExpenses();
  }, [user?.id, fetchExpenses]);

  useDataRefresh(useCallback(() => {
    fetchExpenses();
  }, [fetchExpenses]));

  useEffect(() => {
    if (user?.id) {
      groupApi.list().then((res) => setGroups(res.data.data || [])).catch(console.error);
    }
  }, [user?.id]);

  // Splitwise style grouping by month & year
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, any[]> = {};
    expenses.forEach((exp) => {
      const d = exp.date ? new Date(exp.date) : new Date();
      const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(exp);
    });
    return groups;
  }, [expenses]);

  // Fast Optimistic UI Creation (0ms UI lag strategy)
  const handleCreate = async () => {
    if (!form.description.trim()) {
      alert('Please enter an expense description.');
      return;
    }
    if (form.description.trim().length > 150) {
      alert('Expense description cannot exceed 150 characters.');
      return;
    }
    const numericAmount = parseFloat(form.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a positive amount greater than ₹0.');
      return;
    }
    if (numericAmount > 10000000) {
      alert('Expense amount cannot exceed ₹10,000,000.');
      return;
    }

    const currentUserId = profile?.id || user?.id || '';

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

  // Multi-format Export Handlers
  const handleExportCSV = () => {
    setExportAnchorEl(null);
    if (expenses.length === 0) return;
    const headers = 'Description,Category,Amount,Currency,Paid By,Group,Split Type,Date\n';
    const rows = expenses
      .map(
        (e) =>
          `"${(e.description || '').replace(/"/g, '""')}",${e.category},${Number(e.amount)},${e.currency || 'INR'},"${
            (e.paidBy?.name || '').replace(/"/g, '""')
          }","${(e.group?.name || 'Personal').replace(/"/g, '""')}",${e.splitType || 'EQUAL'},${new Date(e.date).toISOString().split('T')[0]}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairshare_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    setExportAnchorEl(null);
    if (expenses.length === 0) return;
    const exportData = {
      exportDate: new Date().toISOString(),
      totalExpenses: expenses.length,
      records: expenses.map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        currency: e.currency || 'INR',
        category: e.category,
        splitType: e.splitType,
        date: e.date,
        notes: e.notes,
        paidBy: e.paidBy ? { id: e.paidBy.id, name: e.paidBy.name } : null,
        group: e.group ? { id: e.group.id, name: e.group.name } : null,
        shares: (e.shares || []).map((s: any) => ({
          userId: s.userId,
          amount: Number(s.amount),
          userName: s.user?.name,
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairshare_expenses_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportTXT = () => {
    setExportAnchorEl(null);
    if (expenses.length === 0) return;
    const totalSum = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const header = `====================================================\nFAIRSHARE EXPENSE STATEMENT\nGenerated: ${new Date().toLocaleString()}\nTotal Records: ${expenses.length} | Total Value: ₹${totalSum.toFixed(2)}\n====================================================\n\n`;
    const lines = expenses
      .map((e, idx) => {
        const d = new Date(e.date).toLocaleDateString();
        const paid = e.paidBy?.name || 'Unknown';
        const grp = e.group?.name || 'Personal';
        return `${idx + 1}. [${d}] ${e.description.padEnd(25)} | ₹${Number(e.amount).toFixed(2).padStart(9)} | ${e.category.padEnd(12)} | Paid: ${paid} | Group: ${grp}`;
      })
      .join('\n');
    const footer = `\n\n====================================================\nEnd of Statement\n====================================================`;
    const blob = new Blob([header + lines + footer], { type: 'text/plain;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairshare_statement_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrintStatement = () => {
    setExportAnchorEl(null);
    window.print();
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


  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
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
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' } }}>
              Expenses & Shared Transactions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Manage itemized bills, splits, and settlement statuses ({totalCount} total)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download fontSize="small" />}
              endIcon={<KeyboardArrowDown fontSize="small" />}
              onClick={(e) => setExportAnchorEl(e.currentTarget)}
              className="glass-tertiary"
              sx={{
                borderRadius: 2.5,
                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                color: 'text.primary',
                fontWeight: 600,
                textTransform: 'none',
                py: 0.85,
                px: 2,
                '&:hover': {
                  borderColor: isLight ? '#0E6245' : '#10b981',
                  bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Export Data
            </Button>
            <Menu
              anchorEl={exportAnchorEl}
              open={Boolean(exportAnchorEl)}
              onClose={() => setExportAnchorEl(null)}
              slotProps={{
                paper: {
                  className: 'glass-deep',
                  sx: {
                    borderRadius: 3.5,
                    minWidth: 220,
                    p: 0.75,
                    border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.12)'}`,
                    mt: 1,
                  },
                },
              }}
            >
              <MenuItem onClick={handleExportCSV} sx={{ borderRadius: 2, my: 0.25 }}>
                <ListItemIcon>
                  <TableChart fontSize="small" sx={{ color: isLight ? '#0E6245' : '#34D399' }} />
                </ListItemIcon>
                <ListItemText primary="Export CSV" secondary="Excel / Spreadsheet (.csv)" />
              </MenuItem>
              <MenuItem onClick={handleExportJSON} sx={{ borderRadius: 2, my: 0.25 }}>
                <ListItemIcon>
                  <Code fontSize="small" sx={{ color: '#0284c7' }} />
                </ListItemIcon>
                <ListItemText primary="Export JSON" secondary="Structured data (.json)" />
              </MenuItem>
              <MenuItem onClick={handleExportTXT} sx={{ borderRadius: 2, my: 0.25 }}>
                <ListItemIcon>
                  <Description fontSize="small" sx={{ color: '#b45309' }} />
                </ListItemIcon>
                <ListItemText primary="Export Summary" secondary="Plain text ledger (.txt)" />
              </MenuItem>
              <Divider sx={{ my: 0.5, borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }} />
              <MenuItem onClick={handlePrintStatement} sx={{ borderRadius: 2, my: 0.25 }}>
                <ListItemIcon>
                  <Print fontSize="small" sx={{ color: theme.palette.text.primary }} />
                </ListItemIcon>
                <ListItemText primary="Print Statement" secondary="PDF / Printable statement" />
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderRadius: 2.5,
                px: 2.75,
                py: 0.85,
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: isLight ? '#0E6245' : '#059669',
                color: '#ffffff',
                boxShadow: isLight
                  ? '0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)'
                  : '0 1px 3px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.25)',
                '&:hover': {
                  bgcolor: isLight ? '#0A4B35' : '#047857',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.30)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Add Expense
            </Button>
          </Box>
        </Box>

        {/* Smart Quick-Add Bar (Time-Saving Fast Mode) */}
        <SmartQuickAddBar onExpenseCreated={fetchExpenses} />

        {/* Rich Search, Filter & Sort Control Panel (Floating Control Surface - Layer 2: Z2) */}
        <Card
          className="glass-filter-surface glass-specular-top"
          sx={{
            mb: 3.5,
            borderRadius: 4,
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
          className="glass-secondary glass-specular-top"
          sx={{
            borderRadius: 3.5,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' ? '0 18px 45px rgba(0,0,0,0.45)' : '0 10px 30px rgba(0,0,0,0.05)',
          }}
        >
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
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
                  <Button variant="outlined" onClick={clearAllFilters} sx={{ textTransform: 'none', borderRadius: 2.5 }}>
                    Reset Filters
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={{
                      bgcolor: isLight ? '#0E6245' : '#059669',
                      color: '#ffffff',
                      textTransform: 'none',
                      borderRadius: 2.5,
                      fontWeight: 600,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
                      '&:hover': { bgcolor: isLight ? '#0A4B35' : '#047857' },
                    }}
                  >
                    Add Expense
                  </Button>
                )}
              </Box>
            ) : (
              <Box sx={{ width: '100%' }}>
                {Object.entries(groupedExpenses).map(([monthKey, monthItems]) => (
                  <Box key={monthKey}>
                    {/* Splitwise Month Header Banner */}
                    <Box
                      sx={{
                        px: { xs: 2, sm: 3 },
                        py: 0.9,
                        bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.725rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          color: isLight ? '#475569' : '#94A3B8',
                        }}
                      >
                        {monthKey}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                        {monthItems.length} {monthItems.length === 1 ? 'expense' : 'expenses'}
                      </Typography>
                    </Box>

                    {/* Month's Expense Items */}
                    {monthItems.map((expense, idx) => {
                      const canEdit = expense.createdById === user?.id || expense.paidById === user?.id || (user as any)?.isAdmin;
                      const canDelete = expense.createdById === user?.id || (user as any)?.isAdmin;

                      return (
                        <React.Fragment key={expense.id}>
                          <SplitwiseExpenseItem
                            expense={expense}
                            currentUserId={profile?.id || user?.id}
                            currency={expense.group?.currency || 'INR'}
                            showGroupTag={true}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            onClick={() => setSelectedExpense(expense)}
                            onEdit={() => {
                              const editUrl = expense.groupId
                                ? `/expenses/new?edit=${expense.id}&groupId=${expense.groupId}`
                                : `/expenses/new?edit=${expense.id}`;
                              router.push(editUrl);
                            }}
                            onDelete={() => handleDelete(expense.id)}
                            onClone={() => {
                              const cloneUrl = expense.groupId
                                ? `/expenses/new?clone=${expense.id}&groupId=${expense.groupId}`
                                : `/expenses/new?clone=${expense.id}`;
                              router.push(cloneUrl);
                            }}
                          />
                          {idx < monthItems.length - 1 && (
                            <Divider sx={{ borderColor: theme.palette.divider, opacity: 0.6, ml: { xs: 7.5, sm: 9 } }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </Box>
                ))}
              </Box>
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

        {/* Mobile FAB positioned safely above bottom navigation */}
        <Fab
          color="primary"
          onClick={() => setDialogOpen(true)}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            position: 'fixed',
            bottom: { xs: 84, sm: 24 },
            right: 20,
            bgcolor: '#0E6245',
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
            zIndex: 1100,
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
          sx={{ zIndex: 1400 }}
          slotProps={{
            backdrop: { sx: { zIndex: 1400, bgcolor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' } },
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                zIndex: 1401,
                width: { xs: '100%', sm: 480 },
                p: 3,
                borderLeft: (th) => `1px solid ${th.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: '-10px 0 40px rgba(0,0,0,0.4)',
              },
            },
          }}
        >
          {selectedExpense && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar className="glass-tertiary" sx={{ bgcolor: alpha('#10B981', 0.12), border: '1px solid rgba(16,185,129,0.3)', width: 44, height: 44, fontSize: '1.3rem' }}>
                    {CATEGORY_EMOJI[selectedExpense.category] || '📋'}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {selectedExpense.category}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                      {selectedExpense.description}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setSelectedExpense(null)} size="small" className="glass-tertiary">
                  <Close fontSize="small" />
                </IconButton>
              </Box>

              <Divider sx={{ my: 1.5, borderColor: theme.palette.divider }} />

              {/* Total Amount Card with Liquid Emerald Glow */}
              <Card
                className="glass-emerald-ambient glass-specular-top"
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  mb: 3,
                  boxShadow: '0 8px 30px rgba(16,185,129,0.12)',
                }}
              >
                <Typography variant="caption" sx={{ color: theme.palette.mode === 'dark' ? '#34D399' : '#0E6245', fontWeight: 700, letterSpacing: '0.04em' }}>
                  TOTAL EXPENSE AMOUNT
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.mode === 'dark' ? '#10B981' : '#0E6245', my: 0.5 }}>
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
                    const myShare = selectedExpense.shares?.find((s: any) => s.userId === user?.id || s.userId === profile?.id);
                    const amountToSettle = myShare ? Number(myShare.amount) : Number(selectedExpense.amount) / (selectedExpense.shares?.length || 1);
                    setSettleTarget({
                      name: selectedExpense.paidBy?.name || 'Friend',
                      amount: amountToSettle,
                      payeeId: selectedExpense.paidById,
                      groupId: selectedExpense.groupId,
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
                  Settle
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Edit fontSize="small" />}
                  onClick={() => {
                    const editUrl = selectedExpense.groupId
                      ? `/expenses/new?edit=${selectedExpense.id}&groupId=${selectedExpense.groupId}`
                      : `/expenses/new?edit=${selectedExpense.id}`;
                    router.push(editUrl);
                  }}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'text.primary',
                    borderColor: 'rgba(255,255,255,0.2)',
                    '&:hover': { borderColor: '#10B981', color: '#10B981' },
                  }}
                >
                  Edit
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
          slotProps={{
            paper: {
              className: 'glass-deep glass-specular-top',
              sx: {
                borderRadius: { xs: 3, sm: 4 },
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                m: { xs: 1.5, sm: 3 },
                width: { xs: 'calc(100% - 24px)', sm: '100%' },
                maxWidth: { xs: 'calc(100% - 24px)', sm: '600px' },
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
              px: { xs: 2, sm: 3 },
              pt: { xs: 2, sm: 2.5 },
              pb: 1,
              fontWeight: 700,
            }}
          >
            <Typography variant="h6" component="span" fontWeight={700}>
              Add Expense
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Dinner with team"
                slotProps={{ htmlInput: { maxLength: 150 } }}
                helperText="Max 150 characters"
                required
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                slotProps={{
                  htmlInput: { min: 0.01, max: 10000000, step: 'any' },
                  input: {
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  },
                }}
                helperText="Range: ₹0.01 to ₹10,000,000"
                required
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
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
                <Grid size={{ xs: 12, sm: 6 }}>
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

          <DialogActions sx={{ p: { xs: 2, sm: 2.5 } }}>
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
          onConfirmSettlement={async () => {
            if (settleTarget.payeeId) {
              try {
                await settlementApi.create({
                  payeeId: settleTarget.payeeId,
                  amount: settleTarget.amount,
                  groupId: settleTarget.groupId || null,
                  notes: `Settled for expense: ${selectedExpense?.description || ''}`,
                });
              } catch (e) {
                console.error('Failed to create settlement:', e);
              }
            }
            setSettleModalOpen(false);
            fetchExpenses();
          }}
        />
      </Box>
    </AppLayout>
  );
}

function ExpensesPageSkeleton() {
  return (
    <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 4 } }}>
      {/* Header Skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Skeleton width={180} height={36} />
          <Skeleton width={240} height={20} sx={{ mt: 0.5 }} />
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Skeleton variant="rounded" width={100} height={40} sx={{ borderRadius: 2.5 }} />
          <Skeleton variant="rounded" width={130} height={40} sx={{ borderRadius: 2.5 }} />
        </Stack>
      </Box>

      {/* Filter and Search Bar Skeleton */}
      <Paper className="glass-card" sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Skeleton variant="rounded" width="60%" height={42} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width="20%" height={42} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width="20%" height={42} sx={{ borderRadius: 2 }} />
        </Stack>
      </Paper>

      {/* Expenses Table Skeleton */}
      <Paper className="glass-card" sx={{ p: 2, borderRadius: 3 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Skeleton variant="circular" width={44} height={44} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="40%" height={22} />
              <Skeleton width="25%" height={16} sx={{ mt: 0.5 }} />
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Skeleton width={80} height={24} />
              <Skeleton width={60} height={14} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <ExpensesPageSkeleton />
        </AppLayout>
      }
    >
      <ExpensesContent />
    </Suspense>
  );
}
