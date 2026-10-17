'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Stack,
  LinearProgress, useTheme, alpha, Skeleton, Chip,
} from '@mui/material';
import { Add, Close, Delete, Savings } from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { budgetApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES', 'RENT',
  'HEALTH', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'SUBSCRIPTIONS', 'GENERAL',
];

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: '🍔', TRANSPORT: '🚗', ENTERTAINMENT: '🎬', SHOPPING: '🛍️',
  UTILITIES: '💡', RENT: '🏠', HEALTH: '💊', EDUCATION: '📚',
  TRAVEL: '✈️', GROCERIES: '🛒', SUBSCRIPTIONS: '📱', GENERAL: '📋',
};

import CategoryCycleLoader from '@/components/common/CategoryCycleLoader';

export default function BudgetsPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ category: 'FOOD', amount: '', period: 'MONTHLY', alertAt: 80 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    if (user?.id) fetchBudgets();
  }, [user?.id]);

  const fetchBudgets = async () => {
    try {
      const res = await budgetApi.list();
      setBudgets(res.data.data);
    } catch (error) {
      console.error('Fetch budgets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.amount) return;
    setSubmitting(true);
    const parsedAmount = parseFloat(form.amount);
    const tempId = `temp-${Date.now()}`;
    const optimisticBudget = {
      id: tempId,
      category: form.category,
      amount: parsedAmount,
      period: form.period,
      alertAt: form.alertAt,
      spent: 0,
      percentage: 0,
    };
    const prevBudgets = [...budgets];
    setBudgets((prev) => [optimisticBudget, ...prev]);
    setDialogOpen(false);
    const currentForm = { ...form };
    setForm({ category: 'FOOD', amount: '', period: 'MONTHLY', alertAt: 80 });

    try {
      const res = await budgetApi.create({ ...currentForm, amount: parsedAmount, alertAt: currentForm.alertAt });
      if (res.data?.data) {
        setBudgets((prev) => prev.map((b) => (b.id === tempId ? res.data.data : b)));
      }
    } catch (error) {
      console.error('Create budget error:', error);
      setBudgets(prevBudgets);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prevBudgets = [...budgets];
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    try {
      await budgetApi.delete(id);
    } catch (error) {
      console.error('Delete budget error:', error);
      setBudgets(prevBudgets);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return theme.palette.error.main;
    if (percentage >= 80) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  if (authLoading) {
    return <CategoryCycleLoader message="Loading budget telemetry..." />;
  }

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' } }}>Budgets</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Set and track spending limits</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2.5,
              px: 3,
              fontWeight: 600,
              bgcolor: isLight ? '#0E6245' : '#059669',
              color: '#ffffff',
              boxShadow: isLight
                ? '0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)'
                : '0 1px 3px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.25)',
              textTransform: 'none',
              '&:hover': {
                bgcolor: isLight ? '#0A4B35' : '#047857',
                boxShadow: '0 2px 8px rgba(0,0,0,0.30)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Set Budget
          </Button>
        </Box>

        {loading ? (
          <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
            {[1, 2, 3].map(i => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Card className="glass-secondary"><CardContent><Skeleton height={120} /></CardContent></Card>
              </Grid>
            ))}
          </Grid>
        ) : budgets.length === 0 ? (
          <Card
            className="glass-secondary glass-specular-top"
            sx={{ borderRadius: 3.5, boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)' }}
          >
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Savings sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No budgets set</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Create budgets to track your spending limits</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setDialogOpen(true)}
                className="glass-emerald-active"
                sx={{ bgcolor: '#0E6245', color: '#ffffff', textTransform: 'none', borderRadius: 2.5, fontWeight: 700 }}
              >
                Set Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
            {budgets.map((budget) => {
              const progressColor = getProgressColor(budget.percentage);
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={budget.id}>
                  <Card
                    className="glass-secondary glass-specular-top"
                    sx={{
                      borderRadius: 3.5,
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        borderColor: 'rgba(16, 185, 129, 0.5) !important',
                        transform: 'translateY(-3px)',
                      },
                      '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: progressColor },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography fontSize="1.5rem">{CATEGORY_EMOJI[budget.category] || '📋'}</Typography>
                          <Box>
                            <Typography variant="body1" fontWeight={750} sx={{ textTransform: 'capitalize', color: 'text.primary' }}>
                              {budget.category.toLowerCase()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {budget.period.toLowerCase()}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small" onClick={() => handleDelete(budget.id)} className="glass-tertiary" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">Spent</Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                            {formatCurrency(budget.spent)} / {formatCurrency(Number(budget.amount))}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(budget.percentage, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(progressColor, 0.15),
                            '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: progressColor },
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(budget.remaining)} remaining
                        </Typography>
                        {budget.isOverBudget ? (
                          <Chip label="Over budget!" size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }} />
                        ) : budget.isAlerted ? (
                          <Chip label={`${budget.percentage}% used`} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)' }} />
                        ) : (
                          <Chip label={`${budget.percentage}%`} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: alpha(progressColor, 0.15), color: progressColor, border: `1px solid ${alpha(progressColor, 0.3)}` }} />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Create Budget Dialog */}
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
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                m: { xs: 1.5, sm: 3 },
                width: { xs: 'calc(100% - 24px)', sm: '100%' },
                maxWidth: { xs: 'calc(100% - 24px)', sm: '500px' },
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
              pb: 1,
              px: { xs: 2, sm: 3 },
              pt: { xs: 2, sm: 2.5 },
            }}
          >
            <Typography variant="h6" component="span" fontWeight={800} sx={{ color: 'text.primary' }}>
              Set Budget
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small" className="glass-tertiary">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField fullWidth select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{CATEGORY_EMOJI[cat]} {cat.charAt(0) + cat.slice(1).toLowerCase()}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Budget Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              <TextField fullWidth select label="Period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                <MenuItem value="YEARLY">Yearly</MenuItem>
              </TextField>
              <TextField fullWidth label="Alert at (%)" type="number" value={form.alertAt} onChange={(e) => setForm({ ...form, alertAt: parseInt(e.target.value) || 80 })} helperText="Get notified when spending reaches this percentage" />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2.5, textTransform: 'none' }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={submitting || !form.amount}
              className="glass-emerald-active"
              sx={{
                borderRadius: 2.5,
                px: 3.5,
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: '#0E6245',
                color: '#ffffff',
                '&:hover': { bgcolor: '#094A34' },
              }}
            >
              {submitting ? 'Creating...' : 'Set Budget'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
