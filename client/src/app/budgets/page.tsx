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

export default function BudgetsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ category: 'FOOD', amount: '', period: 'MONTHLY', alertAt: 80 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchBudgets();
  }, [user]);

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
    try {
      await budgetApi.create({ ...form, amount: parseFloat(form.amount), alertAt: form.alertAt });
      setDialogOpen(false);
      setForm({ category: 'FOOD', amount: '', period: 'MONTHLY', alertAt: 80 });
      fetchBudgets();
    } catch (error) {
      console.error('Create budget error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await budgetApi.delete(id);
      fetchBudgets();
    } catch (error) {
      console.error('Delete budget error:', error);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return theme.palette.error.main;
    if (percentage >= 80) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Budgets</Typography>
            <Typography variant="body1" color="text.secondary">Set and track spending limits</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
            sx={{
              borderRadius: 3, px: 3, fontWeight: 600,
              bgcolor: '#059669', color: '#ffffff',
              boxShadow: '0 4px 14px rgba(5,150,105,0.25)',
              '&:hover': { bgcolor: '#047857', boxShadow: '0 6px 20px rgba(5,150,105,0.35)' },
            }}>
            Set Budget
          </Button>
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map(i => (<Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}><Card><CardContent><Skeleton height={120} /></CardContent></Card></Grid>))}
          </Grid>
        ) : budgets.length === 0 ? (
          <Card><CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Savings sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No budgets set</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Create budgets to track your spending limits</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Set Budget</Button>
          </CardContent></Card>
        ) : (
          <Grid container spacing={3}>
            {budgets.map((budget) => {
              const progressColor = getProgressColor(budget.percentage);
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={budget.id}>
                  <Card className="animate-slide-in-up" sx={{ position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: progressColor } }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography fontSize="1.5rem">{CATEGORY_EMOJI[budget.category] || '📋'}</Typography>
                          <Box>
                            <Typography variant="body1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                              {budget.category.toLowerCase()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {budget.period.toLowerCase()}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small" onClick={() => handleDelete(budget.id)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">Spent</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(budget.spent)} / {formatCurrency(Number(budget.amount))}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(budget.percentage, 100)}
                          sx={{
                            height: 10, borderRadius: 5,
                            bgcolor: alpha(progressColor, 0.15),
                            '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: progressColor },
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(budget.remaining)} remaining
                        </Typography>
                        {budget.isOverBudget ? (
                          <Chip label="Over budget!" size="small" color="error" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />
                        ) : budget.isAlerted ? (
                          <Chip label={`${budget.percentage}% used`} size="small" color="warning" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />
                        ) : (
                          <Chip label={`${budget.percentage}%`} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: alpha(progressColor, 0.1), color: progressColor }} />
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
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', pb: 1 }}>
            <Typography variant="h6" fontWeight={700}>Set Budget</Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
          </DialogTitle>
          <DialogContent>
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
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 3 }}>Cancel</Button>
            <Button variant="contained" onClick={handleCreate} disabled={submitting || !form.amount} sx={{ borderRadius: 3, px: 4, fontWeight: 600, bgcolor: '#059669', color: '#ffffff', '&:hover': { bgcolor: '#047857' } }}>
              {submitting ? 'Creating...' : 'Set Budget'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
