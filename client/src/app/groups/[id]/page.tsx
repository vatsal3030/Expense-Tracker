'use client';

import React, { Suspense, useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Avatar, AvatarGroup, Chip,
  List, ListItem, ListItemAvatar, ListItemText, Divider, Button,
  Skeleton, useTheme, alpha, IconButton, Tooltip, Stack, CircularProgress,
} from '@mui/material';
import { ArrowBack, Add, ArrowForward } from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { groupApi } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: '🍔', TRANSPORT: '🚗', ENTERTAINMENT: '🎬', SHOPPING: '🛍️',
  UTILITIES: '💡', RENT: '🏠', HEALTH: '💊', EDUCATION: '📚',
  TRAVEL: '✈️', GROCERIES: '🛒', SUBSCRIPTIONS: '📱', GENERAL: '📋', OTHER: '📌',
};

function GroupDetailContent() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [balances, setBalances] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) fetchGroup();
  }, [user, params.id]);

  const fetchGroup = async () => {
    try {
      const [groupRes, balancesRes] = await Promise.all([
        groupApi.get(params.id as string),
        groupApi.getBalances(params.id as string),
      ]);
      setGroup(groupRes.data.data);
      setBalances(balancesRes.data.data);
    } catch (error) {
      console.error('Fetch group error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  if (authLoading || loading) return (
    <AppLayout>
      <Box sx={{ p: 3 }}>
        <Skeleton width={200} height={40} />
        <Skeleton width={300} sx={{ mt: 1 }} />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[1, 2, 3].map(i => (
            <Grid size={{ xs: 12, md: 4 }} key={i}><Card><CardContent><Skeleton height={100} /></CardContent></Card></Grid>
          ))}
        </Grid>
      </Box>
    </AppLayout>
  );

  return (
    <AppLayout>
      <Box className="animate-fade-in">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => router.push('/groups')} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.08) }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={800}>{group?.name}</Typography>
            {group?.description && <Typography variant="body2" color="text.secondary">{group.description}</Typography>}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Members */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Members ({group?.members?.length || 0})
                </Typography>
                <List disablePadding>
                  {group?.members?.map((m: any, i: number) => (
                    <React.Fragment key={m.user.id}>
                      <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemAvatar>
                          <Avatar src={m.user.avatarUrl || undefined} sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main, fontSize: '0.85rem' }}>
                            {m.user.name?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{m.user.name}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{m.role === 'ADMIN' ? '👑 Admin' : 'Member'}</Typography>}
                        />
                      </ListItem>
                      {i < group.members.length - 1 && <Divider variant="inset" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Balances */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Balances</Typography>
                {balances?.balances?.map((b: any, i: number) => (
                  <Box key={b.user.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: i < balances.balances.length - 1 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={b.user.avatarUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: theme.palette.primary.main }}>{b.user.name?.charAt(0)}</Avatar>
                      <Typography variant="body2" fontWeight={500}>{b.user.name}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color={b.balance >= 0 ? 'success.main' : 'error.main'}>
                      {b.balance >= 0 ? '+' : ''}{formatCurrency(b.balance)}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Simplified Debts */}
            {balances?.simplifiedDebts?.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Settle Up</Typography>
                  {balances.simplifiedDebts.map((debt: any, i: number) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, borderBottom: i < balances.simplifiedDebts.length - 1 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                      <Typography variant="body2" fontWeight={600} color="error.main">{debt.from.name}</Typography>
                      <ArrowForward sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight={600} color="success.main">{debt.to.name}</Typography>
                      <Box sx={{ flex: 1 }} />
                      <Chip label={formatCurrency(debt.amount)} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Recent Expenses */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Recent Expenses</Typography>
                {group?.expenses?.length > 0 ? (
                  <List disablePadding>
                    {group.expenses.slice(0, 10).map((exp: any, i: number) => (
                      <React.Fragment key={exp.id}>
                        <ListItem disablePadding sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.1), fontSize: '1.1rem' }}>
                              {CATEGORY_EMOJI[exp.category] || '📋'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant="body2" fontWeight={600}>{exp.description}</Typography>}
                            secondary={`${exp.paidBy?.name} • ${new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                          />
                          <Typography variant="body2" fontWeight={700}>
                            {formatCurrency(Number(exp.amount))}
                          </Typography>
                        </ListItem>
                        {i < Math.min(group.expenses.length, 10) - 1 && <Divider variant="inset" />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Typography variant="body2">No expenses yet</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AppLayout>
  );
}

export default function GroupDetailPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }
    >
      <GroupDetailContent />
    </Suspense>
  );
}

