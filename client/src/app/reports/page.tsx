'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  MenuItem, useTheme, alpha, Skeleton, Chip, Stack, Divider,
  LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper,
} from '@mui/material';
import {
  FileDownload, Description, BarChart, CalendarMonth,
  PictureAsPdf, TableChart, Assessment,
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
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  // Fetch groups
  useEffect(() => {
    if (user?.id) {
      groupApi.list().then((res) => {
        setGroups(res.data?.data || []);
      }).catch(() => {});
    }
  }, [user?.id]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { from: dateFrom, to: dateTo };
      if (selectedGroup !== 'personal') params.groupId = selectedGroup;

      const res = await exportApi.report(params);
      setReport(res.data.data);
    } catch (error) {
      console.error('Fetch report error:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedGroup]);

  useEffect(() => {
    if (user?.id) fetchReport();
  }, [user?.id, fetchReport]);

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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const summary = report?.summary;
  const categoryEntries = summary ? Object.entries(summary.categoryBreakdown).sort(([, a], [, b]) => (b as number) - (a as number)) : [];
  const maxCategoryAmount = categoryEntries.length > 0 ? (categoryEntries[0][1] as number) : 1;

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ pb: { xs: 8, sm: 6 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' } }}>
              Reports & Export
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
              Generate expense reports and download data
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleDownloadCsv}
            disabled={downloading}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2.5, px: 3, fontWeight: 600,
              bgcolor: isLight ? '#0E6245' : '#059669', color: '#ffffff', textTransform: 'none',
              '&:hover': { bgcolor: isLight ? '#0A4B35' : '#047857' },
            }}
          >
            {downloading ? 'Downloading...' : 'Download CSV'}
          </Button>
        </Box>

        {/* Filters */}
        <Card
          className="glass-secondary"
          sx={{ borderRadius: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth select label="Scope" value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  size="small"
                >
                  <MenuItem value="personal">📋 Personal Expenses</MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>👥 {g.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth label="From" type="date" size="small"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{
                    colorScheme: isLight ? 'light' : 'dark',
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      filter: isLight ? 'none' : 'invert(1) brightness(1.2)',
                      cursor: 'pointer',
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth label="To" type="date" size="small"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{
                    colorScheme: isLight ? 'light' : 'dark',
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      filter: isLight ? 'none' : 'invert(1) brightness(1.2)',
                      cursor: 'pointer',
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Button
                  fullWidth variant="outlined" onClick={fetchReport}
                  startIcon={<Assessment />}
                  sx={{
                    borderRadius: 2, textTransform: 'none', fontWeight: 600,
                    borderColor: isLight ? '#0E6245' : '#34D399',
                    color: isLight ? '#0E6245' : '#34D399',
                    '&:hover': { bgcolor: alpha(isLight ? '#0E6245' : '#34D399', 0.08) },
                  }}
                >
                  Generate
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <Grid container spacing={2.5}>
            {[1, 2, 3].map((i) => (
              <Grid size={{ xs: 12, sm: 4 }} key={i}>
                <Card className="glass-secondary"><CardContent><Skeleton height={100} /></CardContent></Card>
              </Grid>
            ))}
          </Grid>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Total Expenses', value: summary.totalExpenses, icon: <Description sx={{ fontSize: 20 }} />, color: '#0E6245' },
                { label: 'Total Spent', value: formatCurrency(summary.totalAmount), icon: <BarChart sx={{ fontSize: 20 }} />, color: '#3B82F6' },
                { label: 'Avg Per Expense', value: formatCurrency(summary.averagePerExpense), icon: <CalendarMonth sx={{ fontSize: 20 }} />, color: '#F59E0B' },
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

            {/* Category Breakdown Card */}
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                mb: 3,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Typography variant="h6" fontWeight={800}>Category Breakdown</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {categoryEntries.length} active {categoryEntries.length === 1 ? 'category' : 'categories'}
                  </Typography>
                </Box>

                <Grid container spacing={2.5}>
                  {categoryEntries.map(([cat, amt]) => {
                    const amount = amt as number;
                    const pct = maxCategoryAmount > 0 ? (amount / summary.totalAmount) * 100 : 0;
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat}>
                        <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', border: `1px solid ${theme.palette.divider}` }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography fontSize="1.1rem">{CATEGORY_EMOJI[cat] || '📋'}</Typography>
                              <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                                {cat.toLowerCase()}
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={800} sx={{ color: isLight ? '#0E6245' : '#34D399' }}>
                              {formatCurrency(amount)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={maxCategoryAmount > 0 ? (amount / maxCategoryAmount) * 100 : 0}
                            sx={{
                              height: 6, borderRadius: 3,
                              bgcolor: alpha(isLight ? '#0E6245' : '#10B981', 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                bgcolor: isLight ? '#0E6245' : '#10B981',
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right', fontSize: '0.7rem' }}>
                            {pct.toFixed(1)}% of total
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>

            {/* Full-Width Spacious Expense Ledger */}
            <Card
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>Expense Details Ledger</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Comprehensive transaction history across selected period
                    </Typography>
                  </Box>
                  <Chip
                    label={`${report.expenses.length} total entries`}
                    size="small"
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(52, 211, 153, 0.12)',
                      color: isLight ? '#0E6245' : '#34D399',
                      border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(52, 211, 153, 0.25)'}`,
                    }}
                  />
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', width: '100%' }}>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }}>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.8rem', py: 1.5 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.8rem', py: 1.5 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.8rem', py: 1.5 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.8rem', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Scope / Group</TableCell>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.8rem', py: 1.5, display: { xs: 'none', sm: 'table-cell' } }}>Paid By</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 750, fontSize: '0.8rem', py: 1.5 }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.expenses.map((exp: any, idx: number) => (
                        <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.secondary' }}>
                            {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.88rem', fontWeight: 650, color: 'text.primary' }}>
                            {exp.description}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.85rem' }}>
                            <Chip
                              size="small"
                              label={`${CATEGORY_EMOJI[exp.category] || '📋'} ${exp.category?.toLowerCase()}`}
                              sx={{
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>
                            {exp.group || 'Personal'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 550, display: { xs: 'none', sm: 'table-cell' } }}>
                            {exp.paidBy}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.92rem', fontWeight: 800, color: isLight ? '#0E6245' : '#34D399' }}>
                            {formatCurrency(exp.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="glass-secondary" sx={{ borderRadius: 3.5 }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <TableChart sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No data to display</Typography>
              <Typography variant="body2" color="text.secondary">Adjust date range or scope and generate a report</Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </AppLayout>
  );
}
