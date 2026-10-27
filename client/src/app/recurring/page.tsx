'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Stack,
  Chip, useTheme, alpha, Skeleton, Tooltip, Switch, FormControlLabel,
  LinearProgress,
} from '@mui/material';
import {
  Add, Close, Delete, Edit, Repeat, PlayArrow, Pause,
  CalendarMonth, Schedule, TrendingUp, NotificationsActive,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { recurringApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES', 'RENT',
  'HEALTH', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'SUBSCRIPTIONS', 'GENERAL', 'OTHER',
];

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: '🍔', TRANSPORT: '🚗', ENTERTAINMENT: '🎬', SHOPPING: '🛍️',
  UTILITIES: '💡', RENT: '🏠', HEALTH: '💊', EDUCATION: '📚',
  TRAVEL: '✈️', GROCERIES: '🛒', SUBSCRIPTIONS: '📱', GENERAL: '📋', OTHER: '📦',
};

const FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export default function RecurringPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'SUBSCRIPTIONS',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  const fetchRules = useCallback(async () => {
    try {
      const res = await recurringApi.list();
      setRules(res.data.data || []);
    } catch (error) {
      console.error('Fetch recurring error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) fetchRules();
  }, [user?.id, fetchRules]);

  const handleCreate = async () => {
    if (!form.description.trim()) { setFormError('Description is required.'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setFormError('Amount must be positive.'); return; }

    setFormError('');
    setSubmitting(true);
    const prevRules = [...rules];

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const optimisticRule = {
      id: tempId,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      frequency: form.frequency,
      startDate: form.startDate,
      nextDueDate: form.startDate,
      isActive: true,
      daysUntilDue: 0,
      isDueSoon: false,
      isOverdue: false,
      totalGenerated: 0,
    };
    setRules((prev) => [optimisticRule, ...prev]);
    setDialogOpen(false);

    try {
      await recurringApi.create({
        ...form,
        amount: parseFloat(form.amount),
        endDate: form.endDate || null,
      });
      fetchRules();
    } catch (error: any) {
      console.error('Create recurring error:', error);
      setRules(prevRules);
      alert(error.response?.data?.error || 'Failed to create recurring expense.');
    } finally {
      setSubmitting(false);
      setForm({ description: '', amount: '', category: 'SUBSCRIPTIONS', frequency: 'MONTHLY', startDate: new Date().toISOString().slice(0, 10), endDate: '' });
    }
  };

  const handleToggle = async (rule: any) => {
    const prevRules = [...rules];
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r)));

    try {
      await recurringApi.update(rule.id, { isActive: !rule.isActive });
    } catch {
      setRules(prevRules);
    }
  };

  const handleDelete = async (id: string) => {
    const prevRules = [...rules];
    setRules((prev) => prev.filter((r) => r.id !== id));

    try {
      await recurringApi.delete(id);
    } catch {
      setRules(prevRules);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const getStatusColor = (rule: any) => {
    if (!rule.isActive) return theme.palette.text.disabled;
    if (rule.isOverdue) return '#EF4444';
    if (rule.isDueSoon) return '#F59E0B';
    return isLight ? '#059669' : '#10B981';
  };

  const getStatusLabel = (rule: any) => {
    if (!rule.isActive) return 'Paused';
    if (rule.isOverdue) return 'Overdue';
    if (rule.isDueSoon) return 'Due Soon';
    return 'Active';
  };

  // Stats
  const activeRules = rules.filter((r) => r.isActive);
  const totalMonthly = activeRules.reduce((acc, r) => {
    const amt = Number(r.amount);
    switch (r.frequency) {
      case 'DAILY': return acc + amt * 30;
      case 'WEEKLY': return acc + amt * 4.33;
      case 'BIWEEKLY': return acc + amt * 2.17;
      case 'MONTHLY': return acc + amt;
      case 'QUARTERLY': return acc + amt / 3;
      case 'YEARLY': return acc + amt / 12;
      default: return acc + amt;
    }
  }, 0);

  return (
    <AppLayout>
      <Box sx={{ pb: { xs: 4, sm: 4 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.35rem', sm: '1.65rem', md: '1.85rem' } }}>
              Recurring Expenses
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
              Set and forget — auto-logged on schedule
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2.5, px: 3, fontWeight: 700,
              bgcolor: isLight ? '#059669' : '#10B981', color: '#ffffff', textTransform: 'none',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              '&:hover': { bgcolor: isLight ? '#047857' : '#059669' },
            }}
          >
            Add Rule
          </Button>
        </Box>

        {/* Summary Cards */}
        {!loading && rules.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Active Rules', value: activeRules.length, icon: <Repeat sx={{ fontSize: 20 }} />, color: isLight ? '#059669' : '#10B981' },
              { label: 'Est. Monthly', value: formatCurrency(totalMonthly), icon: <TrendingUp sx={{ fontSize: 20 }} />, color: '#3B82F6' },
              { label: 'Due Soon', value: rules.filter((r) => r.isDueSoon).length, icon: <NotificationsActive sx={{ fontSize: 20 }} />, color: '#F59E0B' },
            ].map((stat) => (
              <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
                <Card
                  className="glass-secondary"
                  sx={{
                    borderRadius: 3, border: `1px solid ${theme.palette.divider}`,
                    boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 40, height: 40, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha(stat.color, 0.1), color: stat.color,
                      }}>
                        {stat.icon}
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: '1.15rem' }}>
                          {stat.value}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Rules List */}
        {loading ? (
          <Grid container spacing={2.5}>
            {[1, 2, 3].map((i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Card className="glass-secondary"><CardContent><Skeleton height={130} /></CardContent></Card>
              </Grid>
            ))}
          </Grid>
        ) : rules.length === 0 ? (
          <Card
            className="glass-secondary glass-specular-top"
            sx={{ borderRadius: 3.5, boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)' }}
          >
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Repeat sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No recurring expenses</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Set up auto-logging for rent, subscriptions, and fixed bills
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setDialogOpen(true)}
                sx={{ bgcolor: isLight ? '#059669' : '#10B981', color: '#fff', textTransform: 'none', borderRadius: 2.5, fontWeight: 700, boxShadow: '0 4px 14px rgba(16,185,129,0.3)', '&:hover': { bgcolor: isLight ? '#047857' : '#059669' } }}
              >
                Add Recurring Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
            {rules.map((rule) => {
              const statusColor = getStatusColor(rule);
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={rule.id}>
                  <Card
                    className="glass-secondary glass-specular-top"
                    sx={{
                      borderRadius: 3.5, position: 'relative', overflow: 'hidden',
                      boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                      opacity: rule.isActive ? 1 : 0.6,
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': { borderColor: 'rgba(16, 185, 129, 0.5) !important' },
                      '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: statusColor },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 48, height: 48, borderRadius: 2.75,
                            bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                            border: `1.5px solid ${theme.palette.divider}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.75rem', flexShrink: 0,
                          }}>
                            {CATEGORY_EMOJI[rule.category] || '📋'}
                          </Box>
                          <Box>
                            <Typography variant="body1" fontWeight={750} sx={{ color: 'text.primary' }}>
                              {rule.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {rule.frequency?.toLowerCase()} • {rule.category?.toLowerCase()}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <Tooltip title={rule.isActive ? 'Pause' : 'Resume'}>
                            <IconButton size="small" onClick={() => handleToggle(rule)} sx={{ color: 'text.secondary' }}>
                              {rule.isActive ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(rule.id)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Amount & Next Due */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary' }}>
                          {formatCurrency(Number(rule.amount))}
                        </Typography>
                        <Chip
                          label={getStatusLabel(rule)}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.7rem', fontWeight: 700,
                            bgcolor: alpha(statusColor, 0.12),
                            color: statusColor,
                            border: `1px solid ${alpha(statusColor, 0.3)}`,
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                        <CalendarMonth sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Next: {rule.nextDueDate ? new Date(rule.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </Typography>
                      </Box>
                      {rule.totalGenerated > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {rule.totalGenerated} expense{rule.totalGenerated > 1 ? 's' : ''} auto-logged
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Create Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setFormError(''); }}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                borderRadius: { xs: 3, sm: 4 },
                bgcolor: isLight ? '#FFFFFF' : '#0E131F',
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'}`,
                boxShadow: isLight
                  ? '0 20px 48px rgba(15, 23, 42, 0.12)'
                  : '0 28px 72px rgba(0,0,0,0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                m: { xs: 1.5, sm: 3 },
                width: { xs: 'calc(100% - 24px)', sm: '100%' },
                maxWidth: { xs: 'calc(100% - 24px)', sm: '500px' },
              },
            },
          }}
        >
          <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}>
            <Typography variant="h6" component="span" fontWeight={800} sx={{ color: 'text.primary' }}>
              Add Recurring Rule
            </Typography>
            <IconButton onClick={() => { setDialogOpen(false); setFormError(''); }} size="small" className="glass-tertiary">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {formError && (
                <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>
                  ⚠️ {formError}
                </Typography>
              )}
              <TextField
                fullWidth label="Description" placeholder="e.g. Flat Rent, Netflix, Electricity"
                value={form.description}
                onChange={(e) => { setForm({ ...form, description: e.target.value }); setFormError(''); }}
                required
              />
              <TextField
                fullWidth label="Amount (₹)" type="number"
                value={form.amount}
                onChange={(e) => { setForm({ ...form, amount: e.target.value }); setFormError(''); }}
                slotProps={{ htmlInput: { min: 1, step: 'any' } }}
                required
              />
              <TextField fullWidth select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>{CATEGORY_EMOJI[cat]} {cat.charAt(0) + cat.slice(1).toLowerCase()}</MenuItem>
                ))}
              </TextField>
              <TextField fullWidth select label="Frequency" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                {FREQUENCIES.map((f) => (
                  <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth label="Start Date" type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  '& input[type="date"]': {
                    colorScheme: isLight ? 'light' : 'dark',
                  },
                }}
              />
              <TextField
                fullWidth label="End Date (optional)" type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Leave blank for indefinite"
                sx={{
                  '& input[type="date"]': {
                    colorScheme: isLight ? 'light' : 'dark',
                  },
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
            <Button onClick={() => { setDialogOpen(false); setFormError(''); }} sx={{ borderRadius: 2.5, textTransform: 'none' }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={submitting || !form.description || !form.amount}
              sx={{
                borderRadius: 2.5, px: 3.5, fontWeight: 700, textTransform: 'none',
                bgcolor: isLight ? '#059669' : '#10B981', color: '#ffffff',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                '&:hover': { bgcolor: isLight ? '#047857' : '#059669' },
              }}
            >
              {submitting ? 'Creating...' : 'Add Rule'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
