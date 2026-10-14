'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, List, ListItem, ListItemAvatar,
  ListItemText, Avatar, Chip, Skeleton, useTheme, alpha, IconButton, Divider,
  Tabs, Tab, Pagination,
} from '@mui/material';
import { Check, Close, ArrowForward, Handshake } from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { settlementApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SettlementsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  const statusFilter = ['', 'PENDING', 'CONFIRMED'][tab];

  const fetchSettlements = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await settlementApi.list(params);
      setSettlements(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error('Fetch settlements error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (user) fetchSettlements();
  }, [user, fetchSettlements]);

  const handleConfirm = async (id: string) => {
    try {
      await settlementApi.confirm(id);
      fetchSettlements();
    } catch (error) {
      console.error('Confirm error:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await settlementApi.reject(id);
      fetchSettlements();
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const statusConfig: Record<string, { color: 'warning' | 'success' | 'error'; label: string }> = {
    PENDING: { color: 'warning', label: 'Pending' },
    CONFIRMED: { color: 'success', label: 'Confirmed' },
    REJECTED: { color: 'error', label: 'Rejected' },
  };

  if (authLoading) return null;

  return (
    <AppLayout>
      <Box className="animate-fade-in">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800}>Settlements</Typography>
          <Typography variant="body1" color="text.secondary">Track and confirm payments</Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setPage(1); }}
            sx={{ px: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Tab label="All" />
            <Tab label="Pending" />
            <Tab label="Confirmed" />
          </Tabs>
        </Card>

        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[1, 2, 3].map(i => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, py: 2 }}>
                    <Skeleton variant="circular" width={44} height={44} />
                    <Box sx={{ flex: 1 }}><Skeleton width="50%" /><Skeleton width="30%" /></Box>
                  </Box>
                ))}
              </Box>
            ) : settlements.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Handshake sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No settlements yet</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {settlements.map((s, i) => {
                  const isPayee = s.payeeId === profile?.id;
                  const canConfirm = isPayee && s.status === 'PENDING';
                  const cfg = statusConfig[s.status] || statusConfig.PENDING;

                  return (
                    <React.Fragment key={s.id}>
                      <ListItem sx={{ px: 3, py: 2 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
                            <Handshake />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight={600}>{s.payer?.name}</Typography>
                              <ArrowForward sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body1" fontWeight={600}>{s.payee?.name}</Typography>
                              <Chip label={cfg.label} size="small" color={cfg.color} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {s.group?.name ? `${s.group.name} • ` : ''}
                              {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {s.notes ? ` • ${s.notes}` : ''}
                            </Typography>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="h6" fontWeight={700}>{formatCurrency(Number(s.amount))}</Typography>
                          {canConfirm && (
                            <>
                              <IconButton size="small" onClick={() => handleConfirm(s.id)} sx={{ color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                                <Check fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleReject(s.id)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                                <Close fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </ListItem>
                      {i < settlements.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
