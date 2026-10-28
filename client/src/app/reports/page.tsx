'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  MenuItem, useTheme, alpha, Skeleton, Chip, Divider,
  LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Stack,
} from '@mui/material';
import {
  FileDownload, Description, BarChart, CalendarMonth,
  TableChart, Assessment, LocalFireDepartment, TrendingDown,
  Print, ArrowDownward,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { exportApi, groupApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: '🍔', TRANSPORT: '🚗', ENTERTAINMENT: '🎬', SHOPPING: '🛍️',
  UTILITIES: '💡', RENT: '🏠', HEALTH: '💊', EDUCATION: '📚',
  TRAVEL: '✈️', GROCERIES: '🛒', SUBSCRIPTIONS: '📱', GENERAL: '📋',
  INSURANCE: '🛡️', GIFTS: '🎁', DONATIONS: '❤️', INVESTMENTS: '📈',
  SALARY: '💰', FREELANCE: '💻', OTHER: '📦',
};

export default function ReportsPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [groups, setGroups] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState('personal');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    try {
      const savedReport = localStorage.getItem('fairshare_cached_report');
      if (savedReport) {
        const parsed = JSON.parse(savedReport);
        if (parsed) setReport(parsed);
      }
      const savedGroups = localStorage.getItem('fairshare_cached_groups');
      if (savedGroups) {
        const parsedGroups = JSON.parse(savedGroups);
        if (Array.isArray(parsedGroups) && parsedGroups.length > 0) setGroups(parsedGroups);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  // Fetch groups
  useEffect(() => {
    if (user?.id) {
      groupApi.list().then((res) => {
        const data = res.data?.data || [];
        setGroups(data);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('fairshare_cached_groups', JSON.stringify(data));
          } catch {}
        }
      }).catch(() => {});
    }
  }, [user?.id]);

  const isFetchingRef = useRef(false);

  const fetchReport = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!report) setLoading(true);
    try {
      const params: any = { from: dateFrom, to: dateTo };
      if (selectedGroup !== 'personal') params.groupId = selectedGroup;

      const res = await exportApi.report(params);
      const data = res.data.data;
      setReport(data);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('fairshare_cached_report', JSON.stringify(data));
        } catch {}
      }
    } catch (error) {
      console.error('Fetch report error:', error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedGroup]);

  useEffect(() => {
    if (user?.id) fetchReport();
  }, [user?.id, fetchReport]);

  const handleApplyPreset = (preset: 'thisMonth' | 'last30' | 'lastMonth' | 'thisYear') => {
    const now = new Date();
    let from = new Date();
    let to = new Date();

    if (preset === 'thisMonth') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = now;
    } else if (preset === 'last30') {
      from.setDate(now.getDate() - 30);
      to = now;
    } else if (preset === 'lastMonth') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'thisYear') {
      from = new Date(now.getFullYear(), 0, 1);
      to = now;
    }

    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(to.toISOString().slice(0, 10));
  };

  const handleDownloadCsv = async () => {
    setDownloading(true);
    try {
      let response;
      if (selectedGroup !== 'personal') {
        response = await exportApi.groupCsv(selectedGroup);
      } else {
        response = await exportApi.personalCsv({ from: dateFrom, to: dateTo });
      }

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const summary = report?.summary;
  const expensesList: any[] = report?.expenses || [];

  const categoryBreakdown = summary?.categoryBreakdown;
  const categoryEntries = useMemo(() => {
    if (!categoryBreakdown) return [];
    return Object.entries(categoryBreakdown).sort(([, a], [, b]) => (b as number) - (a as number));
  }, [categoryBreakdown]);

  const maxCategoryAmount = categoryEntries.length > 0 ? (categoryEntries[0][1] as number) : 1;

const getCategoryColorScale = (pct: number) => {
  if (pct >= 50) {
    return {
      gradient: 'linear-gradient(90deg, #F97316 0%, #EF4444 100%)',
      color: '#EF4444',
      badgeBg: 'rgba(239, 68, 68, 0.12)',
      badgeBorder: 'rgba(239, 68, 68, 0.25)',
      badgeText: '#F87171',
      status: 'Dominant Outflow',
    };
  }
  if (pct >= 25) {
    return {
      gradient: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)',
      color: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      badgeBorder: 'rgba(245, 158, 11, 0.25)',
      badgeText: '#FBBF24',
      status: 'Moderate Spend',
    };
  }
  if (pct >= 10) {
    return {
      gradient: 'linear-gradient(90deg, #34D399 0%, #10B981 100%)',
      color: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      badgeBorder: 'rgba(16, 185, 129, 0.25)',
      badgeText: '#34D399',
      status: 'Controlled',
    };
  }
  return {
    gradient: 'linear-gradient(90deg, #38BDF8 0%, #0284C7 100%)',
    color: '#0284C7',
    badgeBg: 'rgba(2, 132, 199, 0.12)',
    badgeBorder: 'rgba(2, 132, 199, 0.25)',
    badgeText: '#38BDF8',
    status: 'Minor Share',
  };
};

  // Rich meaningful analytics calculation
  const analytics = useMemo(() => {
    if (!summary) return null;
    const total = Number(summary.totalAmount || 0);

    // Days covered
    const start = new Date(dateFrom).getTime();
    const end = new Date(dateTo).getTime();
    const diffDays = Math.max(1, Math.round(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1);

    const dailyBurnRate = Math.round(total / diffDays);

    // Largest expense - uses user's actual share in personal view
    let largest: any = null;
    expensesList.forEach((e) => {
      const eAmt = Number(selectedGroup === 'personal' && e.userShare !== undefined ? e.userShare : e.amount);
      const largestAmt = largest ? Number(selectedGroup === 'personal' && largest.userShare !== undefined ? largest.userShare : largest.amount) : 0;
      if (!largest || eAmt > largestAmt) {
        largest = { ...e, amount: eAmt };
      }
    });

    const topCategory = categoryEntries.length > 0 ? categoryEntries[0] : null;
    const topCategoryPct = topCategory && total > 0 ? ((topCategory[1] as number) / total) * 100 : 0;

    return {
      diffDays,
      dailyBurnRate,
      largest,
      topCategoryName: topCategory ? topCategory[0] : null,
      topCategoryAmount: topCategory ? (topCategory[1] as number) : 0,
      topCategoryPct,
    };
  }, [summary, dateFrom, dateTo, expensesList, categoryEntries, selectedGroup]);

  return (
    <AppLayout>
      <Box id="print-report-container" sx={{ pb: { xs: 4, sm: 4 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Print-Only Executive Header (Appears only on printed statements / PDFs) */}
        <Box
          className="print-only"
          sx={{
            display: 'none',
            '@media print': {
              display: 'block !important',
              mb: 3,
              pb: 2,
              borderBottom: '2px solid #E2E8F0',
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography sx={{ fontSize: '20pt', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
                Owino <span style={{ color: '#10B981', fontSize: '15pt', fontWeight: 700 }}>FairShare</span>
              </Typography>
              <Typography sx={{ fontSize: '11pt', fontWeight: 600, color: '#475569', mt: 0.5 }}>
                Financial Statement &amp; Outflow Intelligence Report
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '9pt', color: '#64748B' }}>
                <strong>Generated:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
              <Typography sx={{ fontSize: '9pt', color: '#64748B' }}>
                <strong>Scope:</strong> {selectedGroup === 'personal' ? 'Personal Expenses' : (groups.find(g => g.id === selectedGroup)?.name || 'Group Expenses')}
              </Typography>
              <Typography sx={{ fontSize: '9pt', color: '#64748B' }}>
                <strong>Period:</strong> {dateFrom} to {dateTo}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Header - Compact Spacing & Structured Layout (Hidden on Print) */}
        <Box
          className="no-print"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 1.5,
            '@media print': { display: 'none !important' },
          }}
        >
          <Box>
            <Typography fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '1.45rem', md: '1.65rem' }, letterSpacing: '-0.02em', color: 'text.primary' }}>
              Reports &amp; Intelligence
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.78rem', sm: '0.875rem' } }}>
              Comprehensive outflow analytics, category distribution, and financial statements
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Print sx={{ fontSize: 18 }} />}
              onClick={handlePrint}
              sx={{
                flex: { xs: 1, sm: 'initial' },
                borderRadius: 2, px: 2, py: 0.75, fontWeight: 600, textTransform: 'none',
                borderColor: theme.palette.divider,
                color: 'text.primary',
                '&:hover': { bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)' },
              }}
            >
              Print Report
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<FileDownload sx={{ fontSize: 18 }} />}
              onClick={handleDownloadCsv}
              disabled={downloading}
              sx={{
                flex: { xs: 1, sm: 'initial' },
                borderRadius: 2, px: 2.5, py: 0.75, fontWeight: 700,
                bgcolor: isLight ? '#059669' : '#10B981', color: '#ffffff', textTransform: 'none',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                '&:hover': { bgcolor: isLight ? '#047857' : '#059669' },
              }}
            >
              {downloading ? 'Downloading...' : 'Export CSV'}
            </Button>
          </Stack>
        </Box>

        {/* Filters Card - Tight, clean, with instant presets (Hidden on Print) */}
        <Card
          className="glass-secondary no-print"
          sx={{
            borderRadius: 2.75,
            mb: 1.5,
            border: `1px solid ${theme.palette.divider}`,
            '@media print': { display: 'none !important' },
          }}
        >
          <CardContent sx={{ p: { xs: 1.75, sm: 2 }, '&:last-child': { pb: { xs: 1.75, sm: 2 } } }}>
            {/* Quick Range Presets */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'center' } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, mr: 0.5, fontSize: '0.72rem' }}>
                QUICK PERIOD:
              </Typography>
              {[
                { label: 'Last 30 Days', id: 'last30' as const },
                { label: 'This Month', id: 'thisMonth' as const },
                { label: 'Last Month', id: 'lastMonth' as const },
                { label: 'This Year', id: 'thisYear' as const },
              ].map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  size="small"
                  onClick={() => handleApplyPreset(p.id)}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    height: 24,
                    cursor: 'pointer',
                    bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      bgcolor: isLight ? 'rgba(5, 150, 105, 0.1)' : 'rgba(16, 185, 129, 0.14)',
                      borderColor: isLight ? '#059669' : '#10B981',
                    },
                  }}
                />
              ))}
            </Box>

            <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth select label="Scope / Account" value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  size="small"
                >
                  <MenuItem value="personal">Personal Expenses</MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>👥 {g.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth label="From Date" type="date" size="small"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true, sx: { color: isLight ? undefined : '#94A3B8' } },
                    htmlInput: {
                      sx: {
                        color: isLight ? '#0F172A' : '#F8FAFC !important',
                        colorScheme: isLight ? 'light' : 'dark',
                      },
                    },
                  }}
                  sx={{
                    colorScheme: isLight ? 'light' : 'dark',
                    '& .MuiInputBase-input': {
                      color: isLight ? '#0F172A' : '#F8FAFC !important',
                    },
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      filter: isLight ? 'none' : 'invert(1) brightness(2) !important',
                      cursor: 'pointer',
                      opacity: 1,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth label="To Date" type="date" size="small"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true, sx: { color: isLight ? undefined : '#94A3B8' } },
                    htmlInput: {
                      sx: {
                        color: isLight ? '#0F172A' : '#F8FAFC !important',
                        colorScheme: isLight ? 'light' : 'dark',
                      },
                    },
                  }}
                  sx={{
                    colorScheme: isLight ? 'light' : 'dark',
                    '& .MuiInputBase-input': {
                      color: isLight ? '#0F172A' : '#F8FAFC !important',
                    },
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      filter: isLight ? 'none' : 'invert(1) brightness(2) !important',
                      cursor: 'pointer',
                      opacity: 1,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Button
                  fullWidth variant="outlined" onClick={fetchReport}
                  startIcon={<Assessment />}
                  sx={{
                    height: 40,
                    borderRadius: 2, textTransform: 'none', fontWeight: 700,
                    borderColor: isLight ? '#059669' : '#10B981',
                    color: isLight ? '#059669' : '#34D399',
                    '&:hover': {
                      borderColor: isLight ? '#047857' : '#34D399',
                      bgcolor: alpha(isLight ? '#059669' : '#10B981', 0.1),
                    },
                  }}
                >
                  Generate
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <Grid container spacing={1.5}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <Card
                  className="glass-secondary"
                  sx={{
                    borderRadius: 2.75,
                    p: 2,
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Skeleton variant="rounded" width={38} height={38} sx={{ borderRadius: 2 }} animation="wave" />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="65%" height={16} animation="wave" />
                      <Skeleton width="85%" height={26} sx={{ mt: 0.5 }} animation="wave" />
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : report && analytics ? (
          <>
            {/* Meaningful Intelligence Stat Cards: Red for Outflow, Amber for Burn, etc. */}
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              {/* Stat 1: Total Outflow (RED / ROSE because money is going out!) */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  className="glass-secondary"
                  sx={{
                    borderRadius: 2.75, border: `1px solid ${theme.palette.divider}`,
                    boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box sx={{
                        width: 38, height: 38, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha('#EF4444', 0.12), color: '#EF4444',
                      }}>
                        <ArrowDownward sx={{ fontSize: 20 }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650, fontSize: '0.68rem', letterSpacing: '0.02em', display: 'block' }}>
                          TOTAL OUTFLOW ({summary.totalExpenses} {summary.totalExpenses === 1 ? 'BILL' : 'BILLS'})
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: '1.18rem', color: isLight ? '#DC2626' : '#F87171' }}>
                          -{formatCurrency(summary.totalAmount)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Stat 2: Daily Burn Rate */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  className="glass-secondary"
                  sx={{
                    borderRadius: 2.75, border: `1px solid ${theme.palette.divider}`,
                    boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box sx={{
                        width: 38, height: 38, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha('#F59E0B', 0.12), color: '#F59E0B',
                      }}>
                        <LocalFireDepartment sx={{ fontSize: 20 }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650, fontSize: '0.68rem', letterSpacing: '0.02em', display: 'block' }}>
                          DAILY BURN RATE ({analytics.diffDays}D)
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: '1.18rem' }}>
                          {formatCurrency(analytics.dailyBurnRate)}/day
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Stat 3: Average Per Transaction */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  className="glass-secondary"
                  sx={{
                    borderRadius: 2.75, border: `1px solid ${theme.palette.divider}`,
                    boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box sx={{
                        width: 38, height: 38, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha('#3B82F6', 0.12), color: '#3B82F6',
                      }}>
                        <BarChart sx={{ fontSize: 20 }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650, fontSize: '0.68rem', letterSpacing: '0.02em', display: 'block' }}>
                          AVG PER EXPENSE
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: '1.18rem' }}>
                          {formatCurrency(summary.averagePerExpense)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Stat 4: Largest Single Expense */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  className="glass-secondary"
                  sx={{
                    borderRadius: 2.75, border: `1px solid ${theme.palette.divider}`,
                    boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box sx={{
                        width: 38, height: 38, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha('#8B5CF6', 0.12), color: '#8B5CF6',
                      }}>
                        <TrendingDown sx={{ fontSize: 20 }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650, fontSize: '0.68rem', letterSpacing: '0.02em', display: 'block' }}>
                          LARGEST SINGLE BILL
                        </Typography>
                        <Typography noWrap variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: '1.18rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {analytics.largest ? formatCurrency(Number(analytics.largest.amount)) : 'None'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Category Distribution Breakdown */}
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 2.75,
                mb: 1.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.25 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>Category Distribution</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ranked breakdown of spend across {categoryEntries.length} active {categoryEntries.length === 1 ? 'category' : 'categories'}
                    </Typography>
                  </Box>
                  {analytics.topCategoryName && (
                    <Chip
                      size="small"
                      label={`Top: ${analytics.topCategoryName.toLowerCase()} (${analytics.topCategoryPct.toFixed(1)}%)`}
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 650,
                        textTransform: 'capitalize',
                        bgcolor: isLight ? 'rgba(5, 150, 105, 0.1)' : 'rgba(52, 211, 153, 0.12)',
                        color: isLight ? '#059669' : '#34D399',
                        border: `1px solid ${isLight ? 'rgba(5, 150, 105, 0.25)' : 'rgba(52, 211, 153, 0.25)'}`,
                      }}
                    />
                  )}
                </Box>

                <Grid container spacing={1.5}>
                  {categoryEntries.map(([cat, amt]) => {
                    const amount = amt as number;
                    const pct = summary.totalAmount > 0 ? (amount / summary.totalAmount) * 100 : 0;
                    const scale = getCategoryColorScale(pct);

                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2.25,
                            bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: scale.color,
                              bgcolor: isLight ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.05)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography fontSize="1.05rem">{CATEGORY_EMOJI[cat] || '📋'}</Typography>
                              <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                                {cat.toLowerCase()}
                              </Typography>
                            </Box>
                            {/* Category outflow amount */}
                            <Typography variant="body2" fontWeight={750} sx={{ color: isLight ? '#DC2626' : '#F87171' }}>
                              -{formatCurrency(amount)}
                            </Typography>
                          </Box>

                          {/* Dynamic Color / Gradient Progress Bar */}
                          <LinearProgress
                            variant="determinate"
                            value={maxCategoryAmount > 0 ? (amount / maxCategoryAmount) * 100 : 0}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: scale.gradient,
                                boxShadow: `0 0 8px ${alpha(scale.color, 0.35)}`,
                              },
                            }}
                          />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.6 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.66rem', color: scale.badgeText, fontWeight: 700 }}>
                              {scale.status}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                              {pct.toFixed(1)}% of total outflow
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>

            {/* Expense Details Ledger - Red Outflow Amounts & Split Details */}
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 2.75,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: { xs: 1.75, sm: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>Expense Outflow Ledger</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Granular transaction ledger itemizing money spent across selected period
                    </Typography>
                  </Box>
                  <Chip
                    label={`${expensesList.length} total entries`}
                    size="small"
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', width: '100%' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }}>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.76rem', py: 1 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.76rem', py: 1 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.76rem', py: 1 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.76rem', py: 1, display: { xs: 'none', md: 'table-cell' } }}>Scope / Group</TableCell>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.76rem', py: 1, display: { xs: 'none', sm: 'table-cell' } }}>Paid By</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 750, fontSize: '0.76rem', py: 1 }}>Outflow Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expensesList.map((exp: any, idx: number) => {
                        const userShare = Number(exp.userShare ?? exp.amount);
                        const totalBill = Number(exp.totalBill ?? exp.amount);
                        const isSplitExpense = (exp.isSplit || (exp.shares && exp.shares.length > 1) || (exp.group && exp.group !== 'Personal')) && totalBill > userShare;
                        const displayAmount = (selectedGroup === 'personal' && exp.userShare !== undefined) ? userShare : Number(exp.amount);

                        return (
                          <TableRow key={exp.id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontSize: '0.82rem', fontWeight: 550, color: 'text.secondary', py: 1 }}>
                              {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.84rem', fontWeight: 650, color: 'text.primary', py: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                <span>{exp.description}</span>
                                {isSplitExpense && (
                                  <Chip
                                    label="Split"
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.62rem',
                                      fontWeight: 700,
                                      bgcolor: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.15)',
                                      color: isLight ? '#1D4ED8' : '#93C5FD',
                                      border: `1px solid ${isLight ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.3)'}`,
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.82rem', py: 1 }}>
                              <Chip
                                size="small"
                                label={`${CATEGORY_EMOJI[exp.category] || '📋'} ${exp.category?.toLowerCase()}`}
                                sx={{
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  height: 22,
                                  textTransform: 'capitalize',
                                  bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary', display: { xs: 'none', md: 'table-cell' }, py: 1 }}>
                              {exp.group || 'Personal'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.82rem', fontWeight: 550, display: { xs: 'none', sm: 'table-cell' }, py: 1 }}>
                              {exp.paidBy}
                            </TableCell>
                            {/* OUTFLOW AMOUNT IN RED/CRIMSON - reflects user's actual share */}
                            <TableCell
                              align="right"
                              sx={{
                                py: 1,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '0.88rem',
                                  fontWeight: 750,
                                  color: isLight ? '#DC2626' : '#F87171',
                                  lineHeight: 1.2,
                                }}
                              >
                                -{formatCurrency(displayAmount)}
                              </Typography>
                              {isSplitExpense && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    fontSize: '0.66rem',
                                    color: 'text.secondary',
                                    mt: 0.25,
                                  }}
                                >
                                  Your share · Total {formatCurrency(totalBill)}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="glass-secondary" sx={{ borderRadius: 2.75 }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <TableChart sx={{ fontSize: 52, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} color="text.secondary">No report data generated</Typography>
              <Typography variant="body2" color="text.secondary">Select an account scope and date range to view complete outflow analytics</Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </AppLayout>
  );
}
