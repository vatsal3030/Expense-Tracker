'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  Button, TextField, IconButton, Stack, Chip, Avatar, Tooltip,
  InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Alert, Divider, useTheme,
} from '@mui/material';
import {
  Plus, Trash2, Utensils, Receipt, Copy,
  Share2, ArrowRight, Calculator, CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface BillMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface BillLineItem {
  id: string;
  name: string;
  amount: string;
  assignedMemberIds: string[];
}

interface ItemizedBillSplitModalProps {
  open: boolean;
  onClose: () => void;
  members: BillMember[];
  groupId?: string;
  currentUserId?: string;
  onApplySplit?: (data: {
    description: string;
    totalAmount: number;
    shares: Record<string, number>;
  }) => void;
  onExpenseCreated?: () => void;
}

export default function ItemizedBillSplitModal({
  open,
  onClose,
  members,
  groupId,
  currentUserId,
  onApplySplit,
}: ItemizedBillSplitModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';

  // Fallback members if none passed
  const activeMembers: BillMember[] = useMemo(() => {
    if (members && members.length > 0) return members;
    return [
      { id: 'you', name: 'You' },
      { id: 'friend1', name: 'Friend 1' },
      { id: 'friend2', name: 'Friend 2' },
    ];
  }, [members]);

  const allMemberIds = useMemo(() => activeMembers.map((m) => m.id), [activeMembers]);

  const [billTitle, setBillTitle] = useState('Dinner Bill');
  const [items, setItems] = useState<BillLineItem[]>([
    { id: '1', name: 'Starters & Appetizers', amount: '350', assignedMemberIds: allMemberIds },
    { id: '2', name: 'Main Course', amount: '680', assignedMemberIds: allMemberIds },
    { id: '3', name: 'Drinks & Beverages', amount: '270', assignedMemberIds: [allMemberIds[0] || 'you'] },
  ]);

  const [taxPercent, setTaxPercent] = useState('5');
  const [tipPercent, setTipPercent] = useState('10');
  const [copySuccess, setCopySuccess] = useState(false);

  // Add Item
  const handleAddItem = (presetName = '', presetAmount = '') => {
    const newItem: BillLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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

  // Toggle member on an item
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

  // Select all members for an item
  const handleSelectAllFor = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, assignedMemberIds: [...allMemberIds] } : it))
    );
  };

  // Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    const memberSubtotals: Record<string, number> = {};
    activeMembers.forEach((m) => {
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

    activeMembers.forEach((m, idx) => {
      const mSub = memberSubtotals[m.id] || 0;
      const ratio = subtotal > 0 ? mSub / subtotal : 1 / activeMembers.length;
      const mTax = taxAmount * ratio;
      const mTip = tipAmount * ratio;
      const mTotal = Math.round((mSub + mTax + mTip) * 100) / 100;
      memberFinalTotals[m.id] = mTotal;
      runningSum += mTotal;
    });

    // Fix rounding penny discrepancy on first member
    const diff = Math.round((grandTotal - runningSum) * 100) / 100;
    if (diff !== 0 && activeMembers.length > 0) {
      memberFinalTotals[activeMembers[0].id] =
        Math.round((memberFinalTotals[activeMembers[0].id] + diff) * 100) / 100;
    }

    return {
      subtotal,
      taxAmount,
      tipAmount,
      grandTotal,
      memberSubtotals,
      memberFinalTotals,
    };
  }, [items, activeMembers, taxPercent, tipPercent]);

  // Copy text summary to clipboard
  const handleCopySummary = () => {
    let text = `🧾 *Itemized Bill Split: ${billTitle}*\n`;
    text += `Total: ₹${calculations.grandTotal.toFixed(2)} (Subtotal: ₹${calculations.subtotal.toFixed(2)}, Tax: ₹${calculations.taxAmount.toFixed(2)}, Tip: ₹${calculations.tipAmount.toFixed(2)})\n\n`;
    text += `*Who Pays What:*\n`;
    activeMembers.forEach((m) => {
      const share = calculations.memberFinalTotals[m.id] || 0;
      text += `• ${m.name}: ₹${share.toFixed(2)}\n`;
    });
    text += `\nSplit calculated on FairShare (100% free, zero limits).`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    let text = `🧾 *Itemized Bill: ${billTitle}*\nTotal: ₹${calculations.grandTotal.toFixed(2)}\n\n`;
    activeMembers.forEach((m) => {
      const share = calculations.memberFinalTotals[m.id] || 0;
      text += `• ${m.name}: ₹${share.toFixed(2)}\n`;
    });
    text += `\nTracked via FairShare`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Apply to New Expense
  const handleApply = () => {
    if (onApplySplit) {
      onApplySplit({
        description: billTitle,
        totalAmount: calculations.grandTotal,
        shares: calculations.memberFinalTotals,
      });
      onClose();
    } else {
      const params = new URLSearchParams();
      params.set('description', billTitle);
      params.set('amount', String(calculations.grandTotal));
      params.set('category', 'FOOD');
      if (groupId) params.set('groupId', groupId);
      router.push(`/expenses/new?${params.toString()}`);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'none !important',
            WebkitBackdropFilter: 'none !important',
          },
        },
        paper: {
          sx: {
            borderRadius: { xs: 2.5, sm: 3.5 },
            bgcolor: isLight ? '#ffffff' : '#0E131F',
            border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'}`,
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          bgcolor: isLight ? '#F8FAFC' : 'rgba(16, 185, 129, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
            }}
          >
            <Utensils size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={750} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
              Itemized Bill & Restaurant Splitter
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Split individual dishes, drinks, tax, and tip with zero calculation errors
            </Typography>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Stack spacing={2.5}>
          {/* Bill Title & Quick Preset Pills */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <TextField
              size="small"
              label="Bill / Place Name"
              value={billTitle}
              onChange={(e) => setBillTitle(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                + Add Preset:
              </Typography>
              <Chip size="small" label="🍕 Pizza ₹450" onClick={() => handleAddItem('Pizza', '450')} clickable />
              <Chip size="small" label="🍹 Drinks ₹320" onClick={() => handleAddItem('Cocktails / Drinks', '320')} clickable />
              <Chip size="small" label="🍰 Dessert ₹200" onClick={() => handleAddItem('Dessert', '200')} clickable />
            </Box>
          </Box>

          {/* Line Items Table */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
              bgcolor: 'transparent',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: isLight ? '#F1F5F9' : 'rgba(255,255,255,0.03)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: '35%' }}>Item Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: '22%' }}>Price (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Who Shared It</TableCell>
                  <TableCell align="right" sx={{ width: 44 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((it, idx) => (
                  <TableRow key={it.id} hover>
                    <TableCell sx={{ py: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={it.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems((prev) => prev.map((item) => (item.id === it.id ? { ...item, name: val } : item)));
                        }}
                        placeholder={`Item ${idx + 1}`}
                        sx={{ '& .MuiInputBase-input': { fontSize: '0.825rem', py: 0.6 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
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
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          },
                        }}
                        sx={{ '& .MuiInputBase-input': { fontSize: '0.825rem', py: 0.6 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {activeMembers.map((m) => {
                          const isAssigned = it.assignedMemberIds.includes(m.id);
                          return (
                            <Chip
                              key={m.id}
                              size="small"
                              label={m.name}
                              onClick={() => handleToggleMember(it.id, m.id)}
                              sx={{
                                height: 24,
                                fontSize: '0.72rem',
                                fontWeight: isAssigned ? 700 : 500,
                                bgcolor: isAssigned ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                                color: isAssigned ? '#10B981' : 'text.secondary',
                                border: `1px solid ${isAssigned ? 'rgba(16, 185, 129, 0.4)' : isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                                cursor: 'pointer',
                              }}
                            />
                          );
                        })}
                        <Tooltip title="Select Everyone">
                          <Chip
                            size="small"
                            label="All"
                            onClick={() => handleSelectAllFor(it.id)}
                            sx={{ height: 24, fontSize: '0.68rem', cursor: 'pointer' }}
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1, px: 0.5 }}>
                      <IconButton size="small" onClick={() => handleRemoveItem(it.id)} disabled={items.length <= 1}>
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            startIcon={<Plus size={16} />}
            variant="outlined"
            size="small"
            onClick={() => handleAddItem()}
            sx={{
              textTransform: 'none',
              alignSelf: 'flex-start',
              borderRadius: 2,
              borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)',
            }}
          >
            Add Line Item
          </Button>

          {/* Tax & Tip Controls */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="GST / Tax (%)"
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                sx={{ width: 120 }}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                }}
              />
              <TextField
                size="small"
                label="Tip / Service (%)"
                type="number"
                value={tipPercent}
                onChange={(e) => setTipPercent(e.target.value)}
                sx={{ width: 130 }}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                }}
              />
              <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  Subtotal: ₹{calculations.subtotal.toFixed(2)} + Tax (₹{calculations.taxAmount.toFixed(2)}) + Tip (₹{calculations.tipAmount.toFixed(2)})
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#10B981', fontSize: '1.2rem' }}>
                  Total: ₹{calculations.grandTotal.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Participant Allocations Breakdown */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: isLight ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={750} sx={{ fontSize: '0.85rem' }}>
                Individual Net Breakdown (Includes proportional Tax & Tip)
              </Typography>
              <Chip
                icon={<CheckCircle2 size={13} color="#10B981" />}
                label="Exact Match 100%"
                size="small"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
              {activeMembers.map((m) => {
                const total = calculations.memberFinalTotals[m.id] || 0;
                const sub = calculations.memberSubtotals[m.id] || 0;
                return (
                  <Box
                    key={m.id}
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: '#10B981' }}>
                        {m.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.825rem' }}>
                          {m.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Food: ₹{sub.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#10B981', fontSize: '0.95rem' }}>
                      ₹{total.toFixed(2)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: { xs: 1.5, sm: 2.5 }, borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }}>
        <Button
          size="small"
          startIcon={<Copy size={15} />}
          onClick={handleCopySummary}
          sx={{ textTransform: 'none', fontSize: '0.8rem', color: copySuccess ? '#10B981' : 'text.secondary' }}
        >
          {copySuccess ? 'Copied Breakdown! ✓' : 'Copy Breakdown'}
        </Button>
        <Button
          size="small"
          startIcon={<Share2 size={15} />}
          onClick={handleWhatsAppShare}
          sx={{ textTransform: 'none', fontSize: '0.8rem', color: '#25D366' }}
        >
          WhatsApp
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.825rem' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          endIcon={<ArrowRight size={16} />}
          onClick={handleApply}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            px: 2.5,
            bgcolor: '#10B981',
            color: '#ffffff',
            '&:hover': { bgcolor: '#059669' },
          }}
        >
          Create Expense (₹{calculations.grandTotal.toFixed(2)})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
