'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, MenuItem,
  Grid, Chip, Avatar, Skeleton, useTheme, alpha, Stack,
  InputAdornment, IconButton, FormControl, InputLabel, Select,
  CircularProgress, Alert, Snackbar,
} from '@mui/material';
import {
  ArrowBack, Check, ReceiptLong, Group as GroupIcon,
  AttachMoney, Person, CalendarToday, Notes,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { expenseApi, groupApi, friendApi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

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
};

function NewExpenseContent() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLight = theme.palette.mode === 'light';
  const { user, profile, loading: authLoading } = useAuth();

  const preselectedGroupId = searchParams.get('groupId') || '';
  const preselectedFriendId = searchParams.get('friendId') || '';

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [groupId, setGroupId] = useState(preselectedGroupId);
  const [splitType, setSplitType] = useState('EQUAL');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user, preselectedGroupId]);

  const loadInitialData = async () => {
    try {
      setLoadingInitial(true);
      const res = await groupApi.list();
      const list = res.data?.data || [];
      setGroups(list);

      const targetGroupId = preselectedGroupId || (list.length > 0 ? list[0].id : '');
      if (targetGroupId) {
        setGroupId(targetGroupId);
        await loadGroupMembers(targetGroupId);
      }
    } catch (err) {
      console.error('Failed to load initial groups:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const loadGroupMembers = async (gid: string) => {
    try {
      const res = await groupApi.get(gid);
      const members = res.data?.data?.members || [];
      setSelectedGroupMembers(members);
      // Default to selecting all members for equal split
      const memberIds = members.map((m: any) => m.user?.id || m.userId).filter(Boolean);
      setSelectedMemberIds(memberIds);
    } catch (err) {
      console.error('Failed to load group members:', err);
    }
  };

  const handleGroupChange = async (newGid: string) => {
    setGroupId(newGid);
    if (newGid) {
      await loadGroupMembers(newGid);
    } else {
      setSelectedGroupMembers([]);
      setSelectedMemberIds(user?.id ? [user.id] : []);
    }
  };

  const toggleMemberSelection = (uid: string) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(uid)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== uid);
      } else {
        return [...prev, uid];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      setErrorMsg('Please enter a valid description and amount.');
      return;
    }

    const currentUserId = profile?.id || user?.id || '';
    const numericAmount = parseFloat(amount);

    let splits: any[] = [];
    if (splitType === 'EQUAL') {
      const activeIds = selectedMemberIds.length > 0 ? selectedMemberIds : [currentUserId];
      splits = activeIds.map((uid) => ({ userId: uid }));
    } else if (splitType === 'EXACT') {
      splits = selectedMemberIds.map((uid) => ({
        userId: uid,
        amount: parseFloat(exactAmounts[uid] || '0'),
      }));
    }

    // Always include current user if equal split
    if (splitType === 'EQUAL' && !splits.find((s) => s.userId === currentUserId)) {
      splits.unshift({ userId: currentUserId });
    }

    const payload = {
      description: description.trim(),
      amount: numericAmount,
      category,
      splitType,
      groupId: groupId || null,
      notes: notes.trim() || null,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      splits,
    };

    try {
      setSubmitting(true);
      setErrorMsg('');
      await expenseApi.create(payload);

      // Navigate back to the originating group or expenses overview
      if (groupId) {
        router.push(`/groups/${groupId}`);
      } else {
        router.push('/expenses');
      }
    } catch (err: any) {
      console.error('Create expense error:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to create expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingInitial) {
    return (
      <AppLayout>
        <Box sx={{ maxWidth: 640, mx: 'auto', p: 3 }}>
          <Skeleton width={180} height={40} />
          <Skeleton width="100%" height={200} sx={{ mt: 2, borderRadius: 3 }} />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box className="animate-fade-in" sx={{ maxWidth: 720, mx: 'auto', pb: 8 }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton
            onClick={() => (groupId ? router.push(`/groups/${groupId}`) : router.push('/expenses'))}
            sx={{
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2.5,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
              Add New Expense
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Record a personal or shared group bill with instant splits
            </Typography>
          </Box>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }}>
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card
            sx={{
              borderRadius: 3.5,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
              p: { xs: 2.5, sm: 3.5 },
            }}
          >
            <Stack spacing={3}>
              {/* Description & Amount */}
              <TextField
                fullWidth
                label="Expense Title / Description"
                placeholder="e.g. Dinner at Olive, Groceries, Flight Tickets"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                fullWidth
                label="Amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography fontWeight={700} color="#0E6245">
                          ₹
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Category & Date Grid */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  >
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{CATEGORY_EMOJI[cat]}</span>
                          <Typography variant="body2" fontWeight={500}>
                            {cat.charAt(0) + cat.slice(1).toLowerCase()}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
              </Grid>

              {/* Group Selector */}
              <TextField
                fullWidth
                select
                label="Split In Group (optional)"
                value={groupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="">Personal Expense (No group)</MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon fontSize="small" sx={{ color: '#0E6245' }} />
                      <Typography variant="body2" fontWeight={600}>{g.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              {/* Split Members Selection (When group is chosen) */}
              {groupId && selectedGroupMembers.length > 0 && (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.action.hover, 0.04),
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.primary' }}>
                      Split Between ({selectedMemberIds.length} of {selectedGroupMembers.length} selected)
                    </Typography>
                    <Chip
                      label={splitType}
                      size="small"
                      sx={{
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        bgcolor: alpha('#0E6245', 0.1),
                        color: '#0E6245',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedGroupMembers.map((m: any) => {
                      const uid = m.user?.id || m.userId;
                      const isSelected = selectedMemberIds.includes(uid);
                      const isCurrentUser = uid === user?.id || uid === profile?.id;

                      return (
                        <Chip
                          key={uid}
                          avatar={
                            <Avatar
                              src={m.user?.avatarUrl}
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: isSelected ? '#0E6245' : theme.palette.divider,
                                color: '#FFFFFF',
                                fontSize: '0.75rem',
                              }}
                            >
                              {m.user?.name?.charAt(0) || '?'}
                            </Avatar>
                          }
                          label={isCurrentUser ? `${m.user?.name} (You)` : m.user?.name}
                          onClick={() => toggleMemberSelection(uid)}
                          variant={isSelected ? 'filled' : 'outlined'}
                          sx={{
                            fontWeight: isSelected ? 700 : 500,
                            bgcolor: isSelected ? alpha('#0E6245', 0.12) : 'transparent',
                            borderColor: isSelected ? '#0E6245' : theme.palette.divider,
                            color: isSelected ? '#0E6245' : 'text.secondary',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: alpha('#0E6245', 0.18),
                            },
                          }}
                        />
                      );
                    })}
                  </Box>

                  {amount && parseFloat(amount) > 0 && selectedMemberIds.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                      Each person pays ~ ₹{(parseFloat(amount) / selectedMemberIds.length).toFixed(2)}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes (optional)"
                placeholder="Add receipt notes, payment details, or memo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              {/* Submit CTA */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => (groupId ? router.push(`/groups/${groupId}`) : router.push('/expenses'))}
                  sx={{
                    borderRadius: 2.5,
                    px: 3,
                    borderColor: theme.palette.divider,
                    color: 'text.primary',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || !description.trim() || !amount}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Check />}
                  sx={{
                    borderRadius: 2.5,
                    px: 4,
                    py: 1,
                    fontWeight: 700,
                    bgcolor: '#0E6245',
                    color: '#FFFFFF',
                    textTransform: 'none',
                    boxShadow: '0 2px 8px rgba(14, 98, 69, 0.25)',
                    '&:hover': { bgcolor: '#094A34' },
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Expense'}
                </Button>
              </Box>
            </Stack>
          </Card>
        </form>
      </Box>
    </AppLayout>
  );
}

export default function NewExpensePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }
    >
      <NewExpenseContent />
    </Suspense>
  );
}
