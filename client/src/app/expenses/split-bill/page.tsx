'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, IconButton,
  Stack, Chip, Avatar, Tooltip, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Divider,
  useTheme, Grid, MenuItem, Popover, Checkbox, FormControlLabel,
  Snackbar, Alert, CircularProgress,
} from '@mui/material';
import {
  Add, Delete, ContentCopy, WhatsApp, ReceiptLong, Check,
  Restaurant, ArrowBack, Group, Person, Refresh, Share,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { groupApi, expenseApi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

export interface BillLineItem {
  id: string;
  name: string;
  amount: string;
  assignedMemberIds: string[];
}

export default function SplitBillPage() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLight = theme.palette.mode === 'light';
  const { user, profile } = useAuth();

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(false);

  const [billTitle, setBillTitle] = useState('Restaurant Bill');
  const [currency, setCurrency] = useState('INR');
  const [taxPercent, setTaxPercent] = useState('5');
  const [tipPercent, setTipPercent] = useState('10');
  const [paidById, setPaidById] = useState<string>('');

  const [items, setItems] = useState<BillLineItem[]>([
    { id: '1', name: 'Starters & Appetizers', amount: '350', assignedMemberIds: [] },
    { id: '2', name: 'Main Course', amount: '720', assignedMemberIds: [] },
    { id: '3', name: 'Drinks & Beverages', amount: '280', assignedMemberIds: [] },
  ]);

  // Popover state for compressed member selector
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Fetch user's active groups
  useEffect(() => {
    groupApi.list().then((res) => {
      const gList = res.data?.data || [];
      setGroups(gList);

      const queryGroupId = searchParams.get('groupId');
      if (queryGroupId && gList.some((g: any) => g.id === queryGroupId)) {
        setSelectedGroupId(queryGroupId);
      } else if (gList.length > 0) {
        setSelectedGroupId(gList[0].id);
      }
    }).catch(console.error);
  }, [searchParams]);

  // 2. Fetch selected group details (members)
  useEffect(() => {
    if (!selectedGroupId) return;
    setLoadingGroup(true);
    groupApi.get(selectedGroupId).then((res) => {
      const g = res.data?.data;
      setSelectedGroup(g);
      if (g?.currency) setCurrency(g.currency);

      const myId = profile?.id || user?.id;
      setPaidById(myId || (g?.members?.[0]?.userId ?? ''));

      // Default line items to all members if newly loaded
      const allIds = (g?.members || []).map((m: any) => m.userId || m.user?.id);
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          assignedMemberIds: it.assignedMemberIds.length === 0 ? allIds : it.assignedMemberIds,
        }))
      );
    }).catch(console.error).finally(() => setLoadingGroup(false));
  }, [selectedGroupId, profile?.id, user?.id]);

  const members = useMemo(() => {
    if (!selectedGroup?.members) return [];
    return selectedGroup.members.map((m: any) => ({
      id: m.userId || m.user?.id,
      name: m.user?.name || m.user?.email?.split('@')[0] || 'Member',
      avatarUrl: m.user?.avatarUrl,
    }));
  }, [selectedGroup]);

  const allMemberIds = useMemo(() => members.map((m: any) => m.id), [members]);

  // Add Item
  const handleAddItem = (presetName = '', presetAmount = '') => {
    const newItem: BillLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: presetName || `Item ${items.length + 1}`,
      amount: presetAmount || '',
      assignedMemberIds: [...allMemberIds],
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Member toggle inside Popover
  const handleToggleMember = (itemId: string, memberId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const exists = it.assignedMemberIds.includes(memberId);
        const nextIds = exists
          ? it.assignedMemberIds.filter((id) => id !== memberId)
          : [...it.assignedMemberIds, memberId];
        return { ...it, assignedMemberIds: nextIds.length > 0 ? nextIds : [memberId] };
      })
    );
  };

  const handleSelectAllFor = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, assignedMemberIds: [...allMemberIds] } : it))
    );
  };

  const handleClearAllFor = (itemId: string) => {
    const firstId = allMemberIds[0] || '';
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, assignedMemberIds: [firstId] } : it))
    );
  };

  // Mathematical Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    const memberSubtotals: Record<string, number> = {};
    members.forEach((m: any) => {
      memberSubtotals[m.id] = 0;
    });

    items.forEach((it) => {
      const amt = parseFloat(it.amount) || 0;
      subtotal += amt;
      const count = it.assignedMemberIds.length || 1;
      const share = amt / count;
      it.assignedMemberIds.forEach((uid) => {
        if (memberSubtotals[uid] !== undefined) {
          memberSubtotals[uid] += share;
        }
      });
    });

    const taxRate = (parseFloat(taxPercent) || 0) / 100;
    const tipRate = (parseFloat(tipPercent) || 0) / 100;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const tipAmount = Math.round(subtotal * tipRate * 100) / 100;
    const grandTotal = Math.round((subtotal + taxAmount + tipAmount) * 100) / 100;

    // Distribute tax and tip proportionally to each member's subtotal share
    const memberFinalTotals: Record<string, number> = {};
    let runningSum = 0;

    members.forEach((m: any, idx: number) => {
      const mSub = memberSubtotals[m.id] || 0;
      const ratio = subtotal > 0 ? mSub / subtotal : 1 / (members.length || 1);
      const mTax = taxAmount * ratio;
      const mTip = tipAmount * ratio;
      let finalAmt = Math.round((mSub + mTax + mTip) * 100) / 100;

      if (idx === members.length - 1) {
        finalAmt = Math.round((grandTotal - runningSum) * 100) / 100;
      } else {
        runningSum += finalAmt;
      }
      memberFinalTotals[m.id] = Math.max(0, finalAmt);
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount,
      tipAmount,
      grandTotal,
      memberSubtotals,
      memberFinalTotals,
    };
  }, [items, members, taxPercent, tipPercent]);

  // Currency symbol
  const currSymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';

  // Copy Summary text
  const handleCopySummary = () => {
    let summary = `🧾 *${billTitle}* (${currSymbol}${calculations.grandTotal})\n`;
    summary += `------------------------\n`;
    items.forEach((it) => {
      const amt = parseFloat(it.amount) || 0;
      summary += `• ${it.name}: ${currSymbol}${amt.toFixed(2)} (${it.assignedMemberIds.length} people)\n`;
    });
    summary += `------------------------\n`;
    summary += `Subtotal: ${currSymbol}${calculations.subtotal.toFixed(2)}\n`;
    if (calculations.taxAmount > 0) summary += `Tax (${taxPercent}%): ${currSymbol}${calculations.taxAmount.toFixed(2)}\n`;
    if (calculations.tipAmount > 0) summary += `Tip (${tipPercent}%): ${currSymbol}${calculations.tipAmount.toFixed(2)}\n`;
    summary += `*Total: ${currSymbol}${calculations.grandTotal.toFixed(2)}*\n\n`;
    summary += `*Individual Shares:*\n`;

    members.forEach((m: any) => {
      const share = calculations.memberFinalTotals[m.id] || 0;
      summary += `👉 ${m.name}: *${currSymbol}${share.toFixed(2)}*\n`;
    });

    summary += `\nSplit calculated via Owino FairShare ⚡`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(summary);
      setToastMessage('Bill breakdown copied to clipboard!');
    }
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    let summary = `🧾 *${billTitle}* (${currSymbol}${calculations.grandTotal})\n\n`;
    members.forEach((m: any) => {
      const share = calculations.memberFinalTotals[m.id] || 0;
      summary += `👉 ${m.name}: *${currSymbol}${share.toFixed(2)}*\n`;
    });
    summary += `\nTotal: ${currSymbol}${calculations.grandTotal.toFixed(2)}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(summary)}`, '_blank');
  };

  // Create Group Expense
  const handleCreateExpense = async () => {
    if (!selectedGroupId || calculations.grandTotal <= 0) return;
    setSubmitting(true);
    try {
      const splitShares = members.map((m: any) => ({
        userId: m.id,
        amount: calculations.memberFinalTotals[m.id] || 0,
      }));

      await expenseApi.create({
        groupId: selectedGroupId,
        description: billTitle || 'Itemized Restaurant Bill',
        amount: calculations.grandTotal,
        currency,
        category: 'FOOD',
        splitType: 'EXACT',
        paidById: paidById || (members[0]?.id ?? user?.id),
        shares: splitShares,
        notes: `Itemized split: ${items.map((it) => `${it.name} (${currSymbol}${it.amount})`).join(', ')}`,
      });

      setToastMessage('Expense created successfully in group!');
      setTimeout(() => {
        router.push(`/groups/${selectedGroupId}`);
      }, 700);
    } catch (err: any) {
      console.error('Create itemized expense error:', err);
      setToastMessage(err?.response?.data?.error || 'Failed to create expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeItem = items.find((it) => it.id === activeItemId);

  return (
    <AppLayout>
      <Box sx={{ pb: 6, width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => router.back()}
              sx={{
                bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Itemized Bill &amp; Restaurant Splitter
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Split complex dishes, tax, and service charges across group members with zero math errors
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopy />}
              onClick={handleCopySummary}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
            >
              Copy Breakdown
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="success"
              startIcon={<WhatsApp />}
              onClick={handleWhatsAppShare}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
            >
              WhatsApp
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          {/* LEFT COLUMN: Bill Config & Line Items */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card className="glass-secondary" sx={{ borderRadius: 3.5, p: { xs: 2, sm: 3 }, mb: 3 }}>
              {/* Group & Scope Selector */}
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Assign to Group"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    size="small"
                    helperText={`${members.length} members loaded`}
                  >
                    {groups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        👥 {g.name} ({g.currency || 'INR'})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Bill / Place Name"
                    value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    size="small"
                    placeholder="e.g. Domino's Pizza, Havmor, Dinner"
                  />
                </Grid>
              </Grid>

              {/* Quick Presets */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  + QUICK DISHES:
                </Typography>
                <Chip size="small" label="🍕 Pizza ₹450" onClick={() => handleAddItem('Pizza', '450')} clickable />
                <Chip size="small" label="🍔 Burgers ₹350" onClick={() => handleAddItem('Burgers & Fries', '350')} clickable />
                <Chip size="small" label="🍹 Drinks ₹280" onClick={() => handleAddItem('Drinks / Shakes', '280')} clickable />
                <Chip size="small" label="🍰 Dessert ₹220" onClick={() => handleAddItem('Dessert', '220')} clickable />
              </Box>

              {/* Line Items Table (Desktop) / Cards (Mobile) */}
              <Box sx={{ mb: 2 }}>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, bgcolor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }}>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.78rem' }}>Item / Dish</TableCell>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.78rem', width: 140 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 750, fontSize: '0.78rem', width: 180 }}>Who Split It?</TableCell>
                        <TableCell align="right" sx={{ width: 50 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((it, idx) => {
                        const count = it.assignedMemberIds.length;
                        const isAll = count === members.length && members.length > 0;
                        const label = isAll ? `All (${count})` : count === 1 ? members.find((m: any) => m.id === it.assignedMemberIds[0])?.name || '1 Person' : `${count} Members`;

                        return (
                          <TableRow key={it.id} hover>
                            <TableCell sx={{ py: 1.2 }}>
                              <TextField
                                size="small"
                                fullWidth
                                value={it.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItems((prev) => prev.map((item) => (item.id === it.id ? { ...item, name: val } : item)));
                                }}
                                placeholder={`Item ${idx + 1}`}
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.7 } }}
                              />
                            </TableCell>

                            <TableCell sx={{ py: 1.2 }}>
                              <TextField
                                size="small"
                                type="number"
                                fullWidth
                                value={it.amount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItems((prev) => prev.map((item) => (item.id === it.id ? { ...item, amount: val } : item)));
                                }}
                                placeholder="0.00"
                                slotProps={{
                                  input: {
                                    startAdornment: <InputAdornment position="start">{currSymbol}</InputAdornment>,
                                  },
                                }}
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.7 } }}
                              />
                            </TableCell>

                            {/* COMPRESSED MEMBER SELECTOR BUTTON */}
                            <TableCell sx={{ py: 1.2 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => {
                                  setPopoverAnchor(e.currentTarget);
                                  setActiveItemId(it.id);
                                }}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                  bgcolor: isAll ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                                  color: isAll ? '#10B981' : '#3B82F6',
                                  borderColor: isAll ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                                  px: 1.25,
                                  py: 0.5,
                                }}
                              >
                                {label} ▾
                              </Button>
                            </TableCell>

                            <TableCell align="right" sx={{ py: 1.2 }}>
                              <IconButton
                                size="small"
                                disabled={items.length <= 1}
                                onClick={() => handleRemoveItem(it.id)}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => handleAddItem()}
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
              >
                Add Another Item
              </Button>
            </Card>

            {/* Taxes, Tips & Who Paid */}
            <Card className="glass-secondary" sx={{ borderRadius: 3.5, p: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle2" fontWeight={750} sx={{ mb: 2 }}>
                Taxes, Tip &amp; Payer
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="GST / Tax (%)"
                    type="number"
                    size="small"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Tip / Service (%)"
                    type="number"
                    size="small"
                    value={tipPercent}
                    onChange={(e) => setTipPercent(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Paid In Full By"
                    size="small"
                    value={paidById}
                    onChange={(e) => setPaidById(e.target.value)}
                  >
                    {members.map((m: any) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* RIGHT COLUMN: Live Participant Breakdown & Action Card */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card
              className="glass-secondary"
              sx={{
                borderRadius: 3.5,
                p: 2.5,
                position: { lg: 'sticky' },
                top: { lg: 96 },
              }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Split Breakdown
              </Typography>

              {/* Subtotal, Tax, Tip totals */}
              <Box sx={{ mb: 2, p: 2, borderRadius: 2.5, bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">Items Subtotal:</Typography>
                  <Typography variant="body2" fontWeight={600}>{currSymbol}{calculations.subtotal.toFixed(2)}</Typography>
                </Box>
                {calculations.taxAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" color="text.secondary">Tax ({taxPercent}%):</Typography>
                    <Typography variant="body2" fontWeight={600}>+{currSymbol}{calculations.taxAmount.toFixed(2)}</Typography>
                  </Box>
                )}
                {calculations.tipAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" color="text.secondary">Tip ({tipPercent}%):</Typography>
                    <Typography variant="body2" fontWeight={600}>+{currSymbol}{calculations.tipAmount.toFixed(2)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={800}>Grand Total:</Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#10B981', fontFamily: 'monospace' }}>
                    {currSymbol}{calculations.grandTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              {/* Individual Member Amounts */}
              <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ mb: 1, display: 'block' }}>
                EACH MEMBER PAYS:
              </Typography>

              <Stack spacing={1} sx={{ mb: 3 }}>
                {members.map((m: any) => {
                  const share = calculations.memberFinalTotals[m.id] || 0;
                  return (
                    <Box
                      key={m.id}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={m.avatarUrl} sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#10B981' }}>
                          {m.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {m.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace', color: share > 0 ? 'text.primary' : 'text.secondary' }}>
                        {currSymbol}{share.toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>

              {/* Primary Action Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting || calculations.grandTotal <= 0}
                onClick={handleCreateExpense}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  fontWeight: 750,
                  bgcolor: isLight ? '#059669' : '#10B981',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  textTransform: 'none',
                  '&:hover': { bgcolor: isLight ? '#047857' : '#059669' },
                }}
              >
                {submitting ? 'Recording Expense...' : `Save as Expense in Group`}
              </Button>
            </Card>
          </Grid>
        </Grid>

        {/* COMPACT POPOVER MEMBER SELECTION MENU */}
        <Popover
          open={Boolean(popoverAnchor)}
          anchorEl={popoverAnchor}
          onClose={() => {
            setPopoverAnchor(null);
            setActiveItemId(null);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                p: 1.5,
                width: 260,
                boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                border: `1px solid ${theme.palette.divider}`,
              },
            },
          }}
        >
          {activeItem && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" fontWeight={750} color="text.secondary">
                  Assign "{activeItem.name}"
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <Button size="small" onClick={() => handleSelectAllFor(activeItem.id)} sx={{ fontSize: '0.68rem', py: 0.2, minWidth: 0 }}>
                    All
                  </Button>
                  <Button size="small" color="inherit" onClick={() => handleClearAllFor(activeItem.id)} sx={{ fontSize: '0.68rem', py: 0.2, minWidth: 0 }}>
                    Clear
                  </Button>
                </Stack>
              </Box>

              <Stack spacing={0.5} sx={{ maxHeight: 240, overflowY: 'auto' }}>
                {members.map((m: any) => {
                  const checked = activeItem.assignedMemberIds.includes(m.id);
                  const shareOfThisItem = checked ? (parseFloat(activeItem.amount) || 0) / (activeItem.assignedMemberIds.length || 1) : 0;

                  return (
                    <Box
                      key={m.id}
                      onClick={() => handleToggleMember(activeItem.id, m.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        bgcolor: checked ? (isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)') : 'transparent',
                        '&:hover': { bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          checked={checked}
                          size="small"
                          sx={{ p: 0, color: checked ? '#10B981' : undefined }}
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: checked ? 700 : 500 }}>
                          {m.name}
                        </Typography>
                      </Box>
                      {checked && (
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
                          {currSymbol}{shareOfThisItem.toFixed(0)}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Popover>

        {/* Global Feedback Toast */}
        <Snackbar
          open={Boolean(toastMessage)}
          autoHideDuration={3000}
          onClose={() => setToastMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ borderRadius: 3, fontWeight: 600 }}>
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
}
