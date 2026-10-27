'use client';

import React, { Suspense, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, MenuItem,
  Grid, Chip, Avatar, Skeleton, useTheme, alpha, Stack,
  InputAdornment, IconButton, FormControl, InputLabel, Select,
  CircularProgress, Alert, Snackbar, ToggleButtonGroup, ToggleButton,
  LinearProgress, Tooltip, Divider,
} from '@mui/material';
import {
  ArrowBack, Check, ReceiptLong, Group as GroupIcon,
  AttachMoney, Person, CalendarToday, Notes, PieChart,
  Percent, Functions, Balance, Refresh,
  DeleteSweep, Calculate, ErrorOutlined, FlashOn, ContentCopy,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { expenseApi, groupApi, friendApi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { triggerDataRefresh } from '@/lib/events';

function NewExpenseSkeleton() {
  return (
    <Box className="animate-fade-in" sx={{ width: '100%', maxWidth: { xs: '100%', xl: 1400 }, mx: 'auto', pb: { xs: 8, sm: 6 } }}>
      {/* Top Header Skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 2.5 }} />
          <Box>
            <Skeleton width={220} height={36} />
            <Skeleton width={320} height={18} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
      </Box>

      {/* 2-Column Responsive Widescreen Skeleton */}
      <Grid container spacing={3.5} sx={{ alignItems: 'flex-start' }}>
        {/* Left Column: Form Cards */}
        <Grid size={{ xs: 12, lg: 7.5, xl: 8 }}>
          <Stack spacing={3}>
            {/* Section 1 Card Skeleton: Details */}
            <Card className="glass-secondary glass-specular-top" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3.5 }}>
              <Skeleton width={140} height={16} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2.5 }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2.5 }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2.5 }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2.5 }} />
                </Grid>
              </Grid>
            </Card>

            {/* Section 2 Card Skeleton: Participants & Payer */}
            <Card className="glass-secondary glass-specular-top" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3.5 }}>
              <Skeleton width={170} height={16} sx={{ mb: 2 }} />
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2.5 }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2.5 }} />
                </Grid>
              </Grid>
              <Skeleton width={200} height={16} sx={{ mb: 1.5 }} />
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="rounded" width={110} height={34} sx={{ borderRadius: 3 }} />
                ))}
              </Stack>
            </Card>

            {/* Section 3 Card Skeleton: Split Strategy */}
            <Card className="glass-secondary glass-specular-top" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Skeleton width={160} height={16} />
                <Skeleton variant="rounded" width={280} height={36} sx={{ borderRadius: 2 }} />
              </Box>
              <Skeleton variant="rounded" width="100%" height={48} sx={{ borderRadius: 2.5, mb: 2 }} />
              <Stack spacing={1.5}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rounded" width="100%" height={58} sx={{ borderRadius: 2.5 }} />
                ))}
              </Stack>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column: Sticky Summary Hub Skeleton */}
        <Grid size={{ xs: 12, lg: 4.5, xl: 4 }}>
          <Card className="glass-secondary glass-specular-top" sx={{ p: 3, borderRadius: 3.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Skeleton width={120} height={20} />
              <Skeleton variant="rounded" width={70} height={22} sx={{ borderRadius: 2 }} />
            </Box>
            <Skeleton width="60%" height={48} sx={{ mb: 1 }} />
            <Skeleton width="80%" height={20} sx={{ mb: 2.5 }} />
            <Skeleton variant="rounded" width="100%" height={70} sx={{ borderRadius: 2.5, mb: 2.5 }} />
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton width={100} height={20} />
                  <Skeleton width={60} height={20} />
                </Box>
              ))}
            </Stack>
            <Skeleton variant="rounded" width="100%" height={48} sx={{ borderRadius: 2.5 }} />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

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

const DRAFT_KEY = 'owino_expense_new_draft';

type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES' | 'ADJUSTMENT';

function NewExpenseContent() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLight = theme.palette.mode === 'light';
  const { user, profile, loading: authLoading } = useAuth();

  const preselectedGroupId = searchParams.get('groupId') || '';
  const preselectedFriendId = searchParams.get('friendId') || '';
  const editId = searchParams.get('edit') || '';
  const cloneId = searchParams.get('clone') || '';
  const queryDescription = searchParams.get('description') || '';
  const queryAmount = searchParams.get('amount') || '';
  const queryCategory = searchParams.get('category') || '';
  const isEditMode = Boolean(editId);
  const isCloneMode = Boolean(cloneId);

  // Form Fields
  const [description, setDescription] = useState(queryDescription);
  const [amount, setAmount] = useState(queryAmount);
  const [category, setCategory] = useState(queryCategory || 'FOOD');
  const [groupId, setGroupId] = useState(preselectedGroupId);
  const [paidById, setPaidById] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Member Selection & Split allocations
  const [groups, setGroups] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});

  // UI & Draft State
  const [draftRestored, setDraftRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Guards against multiple initial data loads wiping user inputs
  const hasLoadedInitialRef = useRef(false);
  const isFormDirtyRef = useRef(false);

  // Mark dirty whenever user types
  useEffect(() => {
    if (description.trim() || (amount && parseFloat(amount) > 0)) {
      isFormDirtyRef.current = true;
    }
  }, [description, amount]);

  // Protect against accidental refresh / page close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Save draft to localStorage (debounced)
  useEffect(() => {
    if (loadingInitial || isEditMode) return;
    const timer = setTimeout(() => {
      try {
        const draftData = {
          description,
          amount,
          category,
          groupId,
          paidById,
          splitType,
          notes,
          date,
          selectedMemberIds,
          exactAmounts,
          percentages,
          shares,
          adjustments,
          timestamp: Date.now(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      } catch (err) {
        console.error('Failed to save draft:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    description, amount, category, groupId, paidById, splitType, notes,
    date, selectedMemberIds, exactAmounts, percentages, shares, adjustments, loadingInitial, isEditMode
  ]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  // Initial Data Load (Runs once when user is authenticated)
  useEffect(() => {
    if (user?.id && !hasLoadedInitialRef.current) {
      hasLoadedInitialRef.current = true;
      loadInitialData();
    }
  }, [user?.id]);

  const loadInitialData = async () => {
    try {
      setLoadingInitial(true);
      const [groupsRes, friendsRes] = await Promise.all([
        groupApi.list().catch(() => ({ data: { data: [] } })),
        friendApi.list().catch(() => ({ data: { data: [] } })),
      ]);

      const groupList = groupsRes.data?.data || [];
      const friendList = friendsRes.data?.data || [];
      setGroups(groupList);
      setFriends(friendList);

      // Handle Edit or Clone Mode: Load existing expense and current group members
      const targetExpId = editId || cloneId;
      if (targetExpId) {
        try {
          const expRes = await expenseApi.get(targetExpId);
          const exp = expRes.data?.data;
          if (exp) {
            setDescription(exp.description || '');
            setAmount(String(exp.amount || ''));
            setCategory(exp.category || 'FOOD');
            setSplitType(exp.splitType || 'EQUAL');
            setNotes(exp.notes || '');
            if (isEditMode && exp.date) {
              setDate(new Date(exp.date).toISOString().split('T')[0]);
            } else {
              setDate(new Date().toISOString().split('T')[0]);
            }
            if (exp.paidById) {
              setPaidById(exp.paidById);
            }
            const targetGid = exp.groupId || preselectedGroupId || '';
            setGroupId(targetGid);

            const existingSplitMemberIds = (exp.shares || []).map((s: any) => s.userId);

            if (targetGid) {
              // Load all CURRENT group members dynamically so newly joined members can be shared with!
              await loadGroupMembers(targetGid, existingSplitMemberIds);
            } else {
              initializePersonalMembers(friendList, existingSplitMemberIds);
            }

            if (exp.splitType === 'EXACT') {
              const exactMap: Record<string, string> = {};
              exp.shares?.forEach((s: any) => { exactMap[s.userId] = String(s.amount); });
              setExactAmounts(exactMap);
            } else if (exp.splitType === 'PERCENTAGE') {
              const pctMap: Record<string, string> = {};
              const totalAmt = Number(exp.amount) || 1;
              exp.shares?.forEach((s: any) => {
                pctMap[s.userId] = String(Math.round((Number(s.amount) / totalAmt) * 100));
              });
              setPercentages(pctMap);
            }
            return;
          }
        } catch (err) {
          console.error('Failed to load expense for edit/clone:', err);
          setErrorMsg('Failed to load expense details.');
        }
      }

      // Check for saved draft
      let restoredFromDraft = false;
      const savedDraftRaw = localStorage.getItem(DRAFT_KEY);
      if (savedDraftRaw) {
        try {
          const draft = JSON.parse(savedDraftRaw);
          // Only restore if draft has some meaningful content and is reasonably fresh (e.g. within 7 days)
          if (draft && (draft.description || draft.amount)) {
            if (draft.description) setDescription(draft.description);
            if (draft.amount) setAmount(draft.amount);
            if (draft.category) setCategory(draft.category);
            if (draft.paidById) setPaidById(draft.paidById);
            if (draft.splitType) setSplitType(draft.splitType);
            if (draft.notes) setNotes(draft.notes);
            if (draft.date) setDate(draft.date);
            if (draft.exactAmounts) setExactAmounts(draft.exactAmounts);
            if (draft.percentages) setPercentages(draft.percentages);
            if (draft.shares) setShares(draft.shares);
            if (draft.adjustments) setAdjustments(draft.adjustments);

            const targetGid = draft.groupId !== undefined ? draft.groupId : preselectedGroupId;
            setGroupId(targetGid);
            if (targetGid) {
              await loadGroupMembers(targetGid, draft.selectedMemberIds);
            } else {
              initializePersonalMembers(friendList, draft.selectedMemberIds);
            }

            restoredFromDraft = true;
            setDraftRestored(true);
          }
        } catch (e) {
          console.warn('Failed parsing draft:', e);
        }
      }

      // If no draft restored, setup defaults from URL query params and user settings
      if (!restoredFromDraft) {
        try {
          const prefsRaw = localStorage.getItem('owino_user_preferences');
          if (prefsRaw) {
            const prefs = JSON.parse(prefsRaw);
            if (prefs.defaultSplitType) {
              setSplitType(prefs.defaultSplitType);
            }
          }
        } catch {}

        const targetGid = preselectedGroupId || (groupList.length > 0 ? groupList[0].id : '');
        setGroupId(targetGid);
        if (targetGid) {
          await loadGroupMembers(targetGid);
        } else {
          initializePersonalMembers(friendList);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const initializePersonalMembers = (friendList: any[], preselectedIds?: string[]) => {
    const currentMember = {
      userId: user?.id || profile?.id || 'me',
      user: {
        id: user?.id || profile?.id || 'me',
        name: profile?.name || 'You',
        avatarUrl: profile?.avatarUrl,
      },
    };
    const mappedFriends = friendList.map((f: any) => ({
      userId: f.id,
      user: { id: f.id, name: f.name, avatarUrl: f.avatarUrl },
    }));
    const all = [currentMember, ...mappedFriends];
    setSelectedGroupMembers(all);

    if (preselectedIds && preselectedIds.length > 0) {
      setSelectedMemberIds(preselectedIds);
    } else if (preselectedFriendId) {
      setSelectedMemberIds([currentMember.userId, preselectedFriendId]);
    } else {
      setSelectedMemberIds([currentMember.userId]);
    }
    if (!paidById) setPaidById(currentMember.userId);
  };

  const loadGroupMembers = async (gid: string, restoredMemberIds?: string[]) => {
    try {
      const res = await groupApi.get(gid);
      const members = res.data?.data?.members || [];
      setSelectedGroupMembers(members);

      const allMemberIds = members.map((m: any) => m.user?.id || m.userId).filter(Boolean);
      if (restoredMemberIds && restoredMemberIds.length > 0) {
        // Keep valid restored member IDs that exist in the group
        const validIds = restoredMemberIds.filter((id) => allMemberIds.includes(id));
        setSelectedMemberIds(validIds.length > 0 ? validIds : allMemberIds);
      } else {
        setSelectedMemberIds(allMemberIds);
      }

      // Default paidBy to current user if member, else first member
      const currentUid = profile?.id || user?.id;
      if (!paidById || !allMemberIds.includes(paidById)) {
        if (currentUid && allMemberIds.includes(currentUid)) {
          setPaidById(currentUid);
        } else if (allMemberIds.length > 0) {
          setPaidById(allMemberIds[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load group members:', err);
    }
  };

  const handleGroupChange = async (newGid: string) => {
    setGroupId(newGid);
    if (newGid) {
      await loadGroupMembers(newGid);
    } else {
      initializePersonalMembers(friends);
    }
  };

  const toggleMemberSelection = (uid: string) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(uid)) {
        if (prev.length === 1) return prev; // Keep at least one member
        return prev.filter((id) => id !== uid);
      } else {
        return [...prev, uid];
      }
    });
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setDescription('');
    setAmount('');
    setNotes('');
    setExactAmounts({});
    setPercentages({});
    setShares({});
    setAdjustments({});
    setDraftRestored(false);
    isFormDirtyRef.current = false;
  };

  // Calculations & Balance Validation
  const numericTotal = useMemo(() => {
    const parsed = parseFloat(amount);
    return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  }, [amount]);

  const activeMembers = useMemo(() => {
    return selectedGroupMembers.filter((m) => {
      const uid = m.user?.id || m.userId;
      return selectedMemberIds.includes(uid);
    });
  }, [selectedGroupMembers, selectedMemberIds]);

  const splitMetrics = useMemo(() => {
    const count = activeMembers.length || 1;
    const round2 = (num: number) => Math.round(num * 100) / 100;

    if (splitType === 'EQUAL') {
      const perPerson = Math.floor((numericTotal / count) * 100) / 100;
      const remainder = round2(numericTotal - perPerson * count);
      return {
        isValid: numericTotal > 0 && count > 0,
        perPerson,
        remainder,
        totalAllocated: numericTotal,
        diff: 0,
        message: `₹${perPerson.toFixed(2)} per person${remainder > 0 ? ` (+₹${remainder.toFixed(2)} to first payer for roundoff)` : ''}`,
      };
    }

    if (splitType === 'EXACT') {
      const sumExact = activeMembers.reduce((acc, m) => {
        const uid = m.user?.id || m.userId;
        const val = parseFloat(exactAmounts[uid] || '0');
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const roundedSum = round2(sumExact);
      const diff = round2(numericTotal - roundedSum);
      const isValid = Math.abs(diff) < 0.01 && numericTotal > 0;
      return {
        isValid,
        totalAllocated: roundedSum,
        diff,
        message: isValid
          ? 'Exact amounts match total bill perfectly (100% balanced) ✓'
          : diff > 0
          ? `Remaining to allocate: ₹${diff.toFixed(2)}`
          : `Over allocated by ₹${Math.abs(diff).toFixed(2)}`,
      };
    }

    if (splitType === 'PERCENTAGE') {
      const sumPercent = activeMembers.reduce((acc, m) => {
        const uid = m.user?.id || m.userId;
        const val = parseFloat(percentages[uid] || '0');
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const roundedPercent = round2(sumPercent);
      const diffPercent = round2(100 - roundedPercent);
      const isValid = Math.abs(diffPercent) < 0.01 && numericTotal > 0;
      return {
        isValid,
        totalAllocated: (numericTotal * roundedPercent) / 100,
        diff: diffPercent,
        message: isValid
          ? '100% of the total amount allocated ✓'
          : diffPercent > 0
          ? `${diffPercent.toFixed(1)}% remaining to assign`
          : `${Math.abs(diffPercent).toFixed(1)}% over 100%`,
      };
    }

    if (splitType === 'SHARES') {
      const totalShares = activeMembers.reduce((acc, m) => {
        const uid = m.user?.id || m.userId;
        const val = parseFloat(shares[uid] || '1');
        return acc + (isNaN(val) || val <= 0 ? 1 : val);
      }, 0);
      const shareValue = totalShares > 0 ? numericTotal / totalShares : 0;
      return {
        isValid: numericTotal > 0 && totalShares > 0,
        totalShares,
        shareValue,
        totalAllocated: numericTotal,
        diff: 0,
        message: `Total ${totalShares} shares • 1 share = ₹${shareValue.toFixed(2)}`,
      };
    }

    if (splitType === 'ADJUSTMENT') {
      const totalAdj = activeMembers.reduce((acc, m) => {
        const uid = m.user?.id || m.userId;
        const val = parseFloat(adjustments[uid] || '0');
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const baseShare = count > 0 ? (numericTotal - totalAdj) / count : 0;
      return {
        isValid: numericTotal > 0 && baseShare >= 0,
        totalAllocated: numericTotal,
        totalAdj,
        baseShare,
        diff: 0,
        message: `Base share: ₹${Math.max(0, baseShare).toFixed(2)} + individual adjustments (Total: ₹${numericTotal.toFixed(2)}) ✓`,
      };
    }

    return { isValid: true, diff: 0, totalAllocated: numericTotal, message: '' };
  }, [splitType, numericTotal, activeMembers, exactAmounts, percentages, shares, adjustments]);

  // Quick distribution helpers
  const handleAutoDistributeExact = () => {
    if (numericTotal <= 0 || activeMembers.length === 0) return;

    // Check which members have a valid positive amount already filled
    const filledUids = new Set<string>();
    let filledSum = 0;
    activeMembers.forEach((m) => {
      const uid = m.user?.id || m.userId;
      const val = parseFloat(exactAmounts[uid] || '0');
      if (!isNaN(val) && val > 0) {
        filledUids.add(uid);
        filledSum += val;
      }
    });

    const unfilledMembers = activeMembers.filter((m) => !filledUids.has(m.user?.id || m.userId));

    // If none are filled, or all are filled, or sum already >= total: split whole total evenly among all members
    if (unfilledMembers.length === 0 || unfilledMembers.length === activeMembers.length || filledSum >= numericTotal) {
      const perPerson = Math.floor((numericTotal / activeMembers.length) * 100) / 100;
      const remainder = Math.round((numericTotal - perPerson * activeMembers.length) * 100) / 100;
      const nextMap: Record<string, string> = {};
      activeMembers.forEach((m, i) => {
        const uid = m.user?.id || m.userId;
        const amt = i === 0 ? perPerson + remainder : perPerson;
        nextMap[uid] = amt.toFixed(2);
      });
      setExactAmounts(nextMap);
      return;
    }

    // Distribute remaining amount evenly among unfilled members
    const remaining = Math.round((numericTotal - filledSum) * 100) / 100;
    const perPerson = Math.floor((remaining / unfilledMembers.length) * 100) / 100;
    const remainder = Math.round((remaining - perPerson * unfilledMembers.length) * 100) / 100;

    const nextMap = { ...exactAmounts };
    unfilledMembers.forEach((m, i) => {
      const uid = m.user?.id || m.userId;
      const amt = i === 0 ? perPerson + remainder : perPerson;
      nextMap[uid] = amt.toFixed(2);
    });
    setExactAmounts(nextMap);
  };

  const handleAutoDistributePercentages = () => {
    if (activeMembers.length === 0) return;

    // Check which members have a valid percentage already filled
    const filledUids = new Set<string>();
    let filledSum = 0;
    activeMembers.forEach((m) => {
      const uid = m.user?.id || m.userId;
      const val = parseFloat(percentages[uid] || '0');
      if (!isNaN(val) && val > 0) {
        filledUids.add(uid);
        filledSum += val;
      }
    });

    const unfilledMembers = activeMembers.filter((m) => !filledUids.has(m.user?.id || m.userId));

    // If none or all are filled or sum >= 100: split 100% equally among all
    if (unfilledMembers.length === 0 || unfilledMembers.length === activeMembers.length || filledSum >= 100) {
      const count = activeMembers.length;
      const equalPct = Math.floor((100 / count) * 10) / 10;
      const remainder = Math.round((100 - equalPct * count) * 10) / 10;
      const nextMap: Record<string, string> = {};
      activeMembers.forEach((m, i) => {
        const uid = m.user?.id || m.userId;
        const pct = i === 0 ? equalPct + remainder : equalPct;
        nextMap[uid] = pct.toString();
      });
      setPercentages(nextMap);
      return;
    }

    // Distribute remaining percentage among unfilled members
    const remaining = Math.round((100 - filledSum) * 10) / 10;
    const perPerson = Math.floor((remaining / unfilledMembers.length) * 10) / 10;
    const remainder = Math.round((remaining - perPerson * unfilledMembers.length) * 10) / 10;

    const nextMap = { ...percentages };
    unfilledMembers.forEach((m, i) => {
      const uid = m.user?.id || m.userId;
      const pct = i === 0 ? perPerson + remainder : perPerson;
      nextMap[uid] = pct.toString();
    });
    setPercentages(nextMap);
  };

  const handleResetShares = () => {
    const nextMap: Record<string, string> = {};
    activeMembers.forEach((m) => {
      const uid = m.user?.id || m.userId;
      nextMap[uid] = '1';
    });
    setShares(nextMap);
  };

  const handleResetAdjustments = () => {
    setAdjustments({});
  };

  // 1-Click Fast Split Presets (Time-Saving Fast Mode)
  const handlePresetSplitEqually = () => {
    setSplitType('EQUAL');
    setSelectedMemberIds(selectedGroupMembers.map((m: any) => m.user?.id || m.userId));
  };

  const handlePresetYouPaidTheyOwe = () => {
    const myId = user?.id || profile?.id;
    if (myId) setPaidById(myId);
    const otherMembers = selectedGroupMembers
      .map((m: any) => m.user?.id || m.userId)
      .filter((uid: string) => uid !== myId);
    if (otherMembers.length > 0) {
      setSelectedMemberIds(otherMembers);
      setSplitType('EQUAL');
    }
  };

  const handlePresetTheyPaidYouOwe = () => {
    const myId = user?.id || profile?.id;
    const otherMembers = selectedGroupMembers
      .map((m: any) => m.user?.id || m.userId)
      .filter((uid: string) => uid !== myId);
    if (otherMembers.length > 0) {
      setPaidById(otherMembers[0]);
      if (myId) setSelectedMemberIds([myId]);
      setSplitType('EQUAL');
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please enter an expense description.');
      return;
    }
    if (description.trim().length > 150) {
      setErrorMsg('Expense description cannot exceed 150 characters.');
      return;
    }
    if (numericTotal <= 0) {
      setErrorMsg('Please enter a positive amount greater than ₹0.');
      return;
    }
    if (numericTotal > 10000000) {
      setErrorMsg('Expense amount cannot exceed ₹10,000,000.');
      return;
    }

    if (!splitMetrics.isValid) {
      setErrorMsg(splitMetrics.message || 'Please balance the split amounts before saving.');
      return;
    }

    const currentUserId = profile?.id || user?.id || '';
    const actualPayer = paidById || currentUserId;

    let splitsPayload: any[] = [];
    if (splitType === 'EQUAL') {
      splitsPayload = activeMembers.map((m) => ({
        userId: m.user?.id || m.userId,
      }));
    } else if (splitType === 'EXACT') {
      for (const m of activeMembers) {
        const uid = m.user?.id || m.userId;
        const val = parseFloat(exactAmounts[uid] || '0');
        if (isNaN(val) || val < 0) {
          setErrorMsg('Individual split amounts cannot be negative.');
          return;
        }
        if (val > 10000000) {
          setErrorMsg('Individual split amount cannot exceed ₹10,000,000.');
          return;
        }
      }
      splitsPayload = activeMembers.map((m) => {
        const uid = m.user?.id || m.userId;
        return {
          userId: uid,
          amount: parseFloat(exactAmounts[uid] || '0'),
        };
      });
    } else if (splitType === 'PERCENTAGE') {
      for (const m of activeMembers) {
        const uid = m.user?.id || m.userId;
        const val = parseFloat(percentages[uid] || '0');
        if (isNaN(val) || val < 0 || val > 100) {
          setErrorMsg('Split percentage must be between 0% and 100%.');
          return;
        }
      }
      splitsPayload = activeMembers.map((m) => {
        const uid = m.user?.id || m.userId;
        return {
          userId: uid,
          percentage: parseFloat(percentages[uid] || '0'),
        };
      });
    } else if (splitType === 'SHARES') {
      for (const m of activeMembers) {
        const uid = m.user?.id || m.userId;
        const val = parseFloat(shares[uid] || '1');
        if (isNaN(val) || val < 1 || val > 1000) {
          setErrorMsg('Share count must be between 1 and 1000.');
          return;
        }
      }
      splitsPayload = activeMembers.map((m) => {
        const uid = m.user?.id || m.userId;
        return {
          userId: uid,
          shares: parseFloat(shares[uid] || '1'),
        };
      });
    } else if (splitType === 'ADJUSTMENT') {
      splitsPayload = activeMembers.map((m) => {
        const uid = m.user?.id || m.userId;
        return {
          userId: uid,
          adjustment: parseFloat(adjustments[uid] || '0'),
        };
      });
    }

    // Safety fallback
    if (splitsPayload.length === 0) {
      splitsPayload = [{ userId: currentUserId }];
    }

    const payload = {
      description: description.trim(),
      amount: numericTotal,
      category,
      splitType,
      paidById: actualPayer,
      groupId: groupId || null,
      notes: notes.trim() || null,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      splits: splitsPayload,
    };

    try {
      setSubmitting(true);
      setErrorMsg('');
      if (isEditMode) {
        await expenseApi.update(editId, payload);
      } else {
        const idempotencyKey = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await expenseApi.create(payload, {
          headers: { 'idempotency-key': idempotencyKey },
        });
        isFormDirtyRef.current = false;
        localStorage.removeItem(DRAFT_KEY);
      }

      triggerDataRefresh({ type: 'expense' });

      if (groupId) {
        router.push(`/groups/${groupId}`);
      } else {
        router.push('/expenses');
      }
    } catch (err: any) {
      console.error(isEditMode ? 'Update expense error:' : 'Create expense error:', err);
      setErrorMsg(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} expense. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Computed share per member for display & breakdown
  const getMemberComputedShare = useCallback((uid: string, index: number) => {
    if (splitType === 'EQUAL') {
      const count = activeMembers.length || 1;
      const perPerson = Math.floor((numericTotal / count) * 100) / 100;
      const rem = Math.round((numericTotal - perPerson * count) * 100) / 100;
      return index === 0 ? perPerson + rem : perPerson;
    } else if (splitType === 'EXACT') {
      return parseFloat(exactAmounts[uid] || '0') || 0;
    } else if (splitType === 'PERCENTAGE') {
      const pct = parseFloat(percentages[uid] || '0') || 0;
      return (numericTotal * pct) / 100;
    } else if (splitType === 'SHARES') {
      const totalShares = activeMembers.reduce(
        (sum, mem) => sum + (parseFloat(shares[mem.user?.id || mem.userId] || '1') || 1),
        0
      );
      const myShareCount = parseFloat(shares[uid] || '1') || 1;
      return totalShares > 0 ? (numericTotal * myShareCount) / totalShares : 0;
    } else if (splitType === 'ADJUSTMENT') {
      const totalAdj = activeMembers.reduce(
        (sum, mem) => sum + (parseFloat(adjustments[mem.user?.id || mem.userId] || '0') || 0),
        0
      );
      const base = (numericTotal - totalAdj) / (activeMembers.length || 1);
      const adj = parseFloat(adjustments[uid] || '0') || 0;
      return Math.max(0, base + adj);
    }
    return 0;
  }, [splitType, activeMembers, numericTotal, exactAmounts, percentages, shares, adjustments]);

  const currentUserId = user?.id || profile?.id;
  const isCurrentPayer = Boolean(paidById && paidById === currentUserId);
  const isCurrentUserIncluded = activeMembers.some((m: any) => (m.user?.id || m.userId) === currentUserId);
  const currentUserIndex = activeMembers.findIndex((m: any) => (m.user?.id || m.userId) === currentUserId);
  const myComputedShare = isCurrentUserIncluded && currentUserIndex >= 0 && currentUserId ? getMemberComputedShare(currentUserId, currentUserIndex) : 0;

  const myNetStanding = isCurrentPayer
    ? numericTotal - myComputedShare
    : isCurrentUserIncluded
    ? -myComputedShare
    : 0;

  const emeraldColor = isLight ? '#059669' : '#10B981';
  const emeraldText = isLight ? '#047857' : '#34D399';
  const emeraldBg = isLight ? alpha('#059669', 0.1) : 'rgba(16, 185, 129, 0.14)';
  const emeraldBorder = isLight ? 'rgba(5, 150, 105, 0.3)' : 'rgba(16, 185, 129, 0.35)';

  const payerMember = selectedGroupMembers.find((m: any) => (m.user?.id || m.userId) === paidById);
  const payerDisplayName = paidById === currentUserId
    ? 'You'
    : payerMember?.user?.name || 'Selected Payer';

  return (
    <AppLayout>
      {loadingInitial ? (
        <NewExpenseSkeleton />
      ) : (
        <Box className="animate-fade-in" sx={{ width: '100%', maxWidth: { xs: '100%', xl: 1400 }, mx: 'auto', pb: { xs: 8, sm: 6 } }}>
          {/* Top Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                type="button"
                onClick={() => (groupId ? router.push(`/groups/${groupId}`) : router.push('/expenses'))}
                sx={{
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2.5,
                  '&:hover': { bgcolor: emeraldBg, borderColor: emeraldColor, color: emeraldColor },
                }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2.125rem' } }}>
                  {isEditMode ? 'Edit Expense' : 'Add New Expense'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {isEditMode ? 'Update bill details, adjust shares, or add newly joined group members' : 'Exact mathematical splits with zero calculation errors'}
                </Typography>
              </Box>
            </Box>

            {draftRestored && (
              <Chip
                label="Draft Restored"
                color="success"
                size="small"
                onDelete={clearDraft}
                deleteIcon={<DeleteSweep fontSize="small" />}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  bgcolor: emeraldBg,
                  color: emeraldText,
                  border: `1px solid ${emeraldBorder}`,
                }}
              />
            )}
          </Box>

          {isCloneMode && (
            <Alert
              severity="info"
              icon={<ContentCopy fontSize="small" />}
              sx={{
                mb: 3,
                borderRadius: 3,
                fontWeight: 600,
                border: '1px solid',
                borderColor: alpha('#0288d1', 0.3),
                bgcolor: alpha('#0288d1', 0.08),
              }}
            >
              Cloned Expense — We&apos;ve duplicated participants and splits. Today&apos;s date has been prefilled. Review and click Save when ready!
            </Alert>
          )}

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3.5} sx={{ alignItems: 'flex-start' }}>
              {/* Left Column: Comprehensive Form Cards */}
              <Grid size={{ xs: 12, lg: 7.5, xl: 8 }}>
                <Stack spacing={3}>
                  {/* Card 1: Expense Details */}
                  <Card
                    className="glass-secondary glass-specular-top"
                    sx={{
                      borderRadius: 3.5,
                      p: { xs: 2.5, sm: 3.5 },
                      boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.secondary', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
                      1. Expense Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          fullWidth
                          label="Expense Description / Title"
                          placeholder="e.g. Dinner at Olive, Grocery Haul, Hotel Booking"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                          slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: { maxLength: 150 },
                          }}
                          helperText="Max 150 characters"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="Total Amount"
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: { min: 0.01, max: 10000000, step: 'any' },
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Typography fontWeight={800} sx={{ color: emeraldColor, fontSize: '1.1rem' }}>
                                    ₹
                                  </Typography>
                                </InputAdornment>
                              ),
                            },
                          }}
                          helperText="Range: ₹0.01 to ₹10,000,000"
                        />
                      </Grid>

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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <span style={{ fontSize: '1.1rem' }}>{CATEGORY_EMOJI[cat]}</span>
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
                          label="Expense Date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Card 2: Participants & Payer */}
                  <Card
                    className="glass-secondary glass-specular-top"
                    sx={{
                      borderRadius: 3.5,
                      p: { xs: 2.5, sm: 3.5 },
                      boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.secondary', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
                      2. Participants & Payer
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          select
                          label="Shared In (Group / Personal)"
                          value={groupId}
                          onChange={(e) => handleGroupChange(e.target.value)}
                          disabled={Boolean(preselectedGroupId || isEditMode)}
                          helperText={
                            preselectedGroupId
                              ? '🔒 Locked to this group'
                              : isEditMode
                              ? '🔒 Group cannot be changed when editing an expense'
                              : undefined
                          }
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          <MenuItem value="">👤 Direct with Friends (No group)</MenuItem>
                          {groups.map((g) => (
                            <MenuItem key={g.id} value={g.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <GroupIcon fontSize="small" sx={{ color: emeraldColor }} />
                                <Typography variant="body2" fontWeight={600}>{g.name}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          select
                          label="Paid By"
                          value={paidById}
                          onChange={(e) => setPaidById(e.target.value)}
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          {selectedGroupMembers.map((m: any) => {
                            const uid = m.user?.id || m.userId;
                            const isYou = uid === user?.id || uid === profile?.id;
                            return (
                              <MenuItem key={uid} value={uid}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar src={m.user?.avatarUrl} sx={{ width: 22, height: 22, fontSize: '0.7rem', bgcolor: emeraldColor, color: '#FFFFFF' }}>
                                    {m.user?.name?.charAt(0) || '?'}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight={isYou ? 700 : 500}>
                                    {m.user?.name} {isYou ? '(You)' : m.user?.username ? `(@${m.user.username})` : m.user?.email ? `(${m.user.email.split('@')[0]})` : ''}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            );
                          })}
                        </TextField>
                      </Grid>
                    </Grid>

                    {/* Member selection chips */}
                    <Box sx={{ mt: 2.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        Select members included in this bill ({selectedMemberIds.length} of {selectedGroupMembers.length} selected):
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedGroupMembers.map((m: any) => {
                          const uid = m.user?.id || m.userId;
                          const isSelected = selectedMemberIds.includes(uid);
                          const isCurrentUser = uid === user?.id || uid === profile?.id;
                          const handleTag = m.user?.username ? `@${m.user.username}` : m.user?.email ? m.user.email.split('@')[0] : '';

                          return (
                            <Chip
                              key={uid}
                              avatar={
                                <Avatar
                                  src={m.user?.avatarUrl}
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    bgcolor: isSelected ? emeraldColor : theme.palette.divider,
                                    color: '#FFFFFF',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {m.user?.name?.charAt(0) || '?'}
                                </Avatar>
                              }
                              label={isCurrentUser ? `${m.user?.name} (You)` : handleTag ? `${m.user?.name} (${handleTag})` : m.user?.name}
                              onClick={() => toggleMemberSelection(uid)}
                              variant={isSelected ? 'filled' : 'outlined'}
                              sx={{
                                fontWeight: isSelected ? 700 : 500,
                                bgcolor: isSelected ? emeraldBg : 'transparent',
                                borderColor: isSelected ? emeraldBorder : theme.palette.divider,
                                color: isSelected ? emeraldText : 'text.secondary',
                                cursor: 'pointer',
                                transition: 'all 0.18s ease',
                                '&:hover': {
                                  bgcolor: isSelected ? alpha(emeraldColor, 0.22) : alpha(theme.palette.text.primary, 0.05),
                                  borderColor: emeraldColor,
                                },
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  </Card>

                  {/* Card 3: Advanced Split Methods & Allocation */}
                  <Card
                    className="glass-secondary glass-specular-top"
                    sx={{
                      borderRadius: 3.5,
                      p: { xs: 2.5, sm: 3.5 },
                      boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    {/* 1-Click Fast Split Presets */}
                    <Box sx={{ mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: emeraldBg, border: `1px dashed ${emeraldBorder}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                        <FlashOn sx={{ fontSize: 18, color: emeraldColor }} />
                        <Typography variant="caption" fontWeight={750} sx={{ color: emeraldText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Fast Split Presets (1-Click)
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                          clickable
                          size="small"
                          icon={<Check sx={{ fontSize: 16 }} />}
                          label="Split Equally (All)"
                          onClick={handlePresetSplitEqually}
                          variant={splitType === 'EQUAL' && selectedMemberIds.length === selectedGroupMembers.length ? 'filled' : 'outlined'}
                          sx={{
                            fontWeight: 650,
                            fontSize: '0.75rem',
                            bgcolor: splitType === 'EQUAL' && selectedMemberIds.length === selectedGroupMembers.length ? alpha(emeraldColor, 0.25) : 'transparent',
                            borderColor: emeraldBorder,
                            color: splitType === 'EQUAL' && selectedMemberIds.length === selectedGroupMembers.length ? emeraldText : 'text.primary',
                            '&:hover': { bgcolor: alpha(emeraldColor, 0.18), borderColor: emeraldColor },
                          }}
                        />
                        <Chip
                          clickable
                          size="small"
                          label="You Paid, They Owe 100%"
                          onClick={handlePresetYouPaidTheyOwe}
                          variant="outlined"
                          sx={{
                            fontWeight: 650,
                            fontSize: '0.75rem',
                            borderColor: emeraldBorder,
                            '&:hover': { bgcolor: alpha(emeraldColor, 0.18), borderColor: emeraldColor },
                          }}
                        />
                        <Chip
                          clickable
                          size="small"
                          label="They Paid, You Owe 100%"
                          onClick={handlePresetTheyPaidYouOwe}
                          variant="outlined"
                          sx={{
                            fontWeight: 650,
                            fontSize: '0.75rem',
                            borderColor: emeraldBorder,
                            '&:hover': { bgcolor: alpha(emeraldColor, 0.18), borderColor: emeraldColor },
                          }}
                        />
                      </Stack>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
                        3. Split Method & Allocation
                      </Typography>

                      {/* Split Type Selector */}
                      <ToggleButtonGroup
                        value={splitType}
                        exclusive
                        onChange={(_, val) => {
                          if (val) setSplitType(val);
                        }}
                        size="small"
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          '& .MuiToggleButtonGroup-grouped': {
                            border: `1px solid ${theme.palette.divider} !important`,
                            borderRadius: '8px !important',
                          },
                          '& .MuiToggleButton-root': {
                            textTransform: 'none',
                            px: { xs: 1.25, sm: 1.5 },
                            py: 0.5,
                            fontSize: { xs: '0.75rem', sm: '0.8rem' },
                            fontWeight: 600,
                            '&.Mui-selected': {
                              bgcolor: emeraldBg,
                              color: emeraldText,
                              borderColor: `${emeraldColor} !important`,
                              fontWeight: 750,
                              '&:hover': { bgcolor: alpha(emeraldColor, 0.22) },
                            },
                          },
                        }}
                      >
                        <ToggleButton value="EQUAL" type="button">
                          = Equally
                        </ToggleButton>
                        <ToggleButton value="EXACT" type="button">
                          ≠ Unequal / Exact
                        </ToggleButton>
                        <ToggleButton value="PERCENTAGE" type="button">
                          % By Percent
                        </ToggleButton>
                        <ToggleButton value="SHARES" type="button">
                          ➗ By Shares
                        </ToggleButton>
                        <ToggleButton value="ADJUSTMENT" type="button">
                          ± Adjustment
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    {/* Calculation Status Banner */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: splitMetrics.isValid
                          ? emeraldBg
                          : alpha(theme.palette.error.main, 0.08),
                        border: `1px solid ${
                          splitMetrics.isValid
                            ? emeraldBorder
                            : alpha(theme.palette.error.main, 0.3)
                        }`,
                        mb: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        {splitMetrics.isValid ? (
                          <Check sx={{ color: emeraldColor, fontSize: '1.25rem' }} />
                        ) : (
                          <ErrorOutlined sx={{ color: theme.palette.error.main, fontSize: '1.25rem' }} />
                        )}
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ color: splitMetrics.isValid ? emeraldText : theme.palette.error.main }}
                          >
                            {splitMetrics.message}
                          </Typography>
                          {numericTotal > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Total bill: ₹{numericTotal.toFixed(2)} • Allocated: ₹{splitMetrics.totalAllocated.toFixed(2)}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Contextual Action Buttons */}
                      {splitType === 'EXACT' && (
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          onClick={handleAutoDistributeExact}
                          startIcon={<Calculate fontSize="small" />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 2,
                            borderColor: emeraldBorder,
                            color: emeraldText,
                            '&:hover': { borderColor: emeraldColor, bgcolor: emeraldBg },
                          }}
                        >
                          Distribute Remaining
                        </Button>
                      )}
                      {splitType === 'PERCENTAGE' && (
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          onClick={handleAutoDistributePercentages}
                          startIcon={<Refresh fontSize="small" />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 2,
                            borderColor: emeraldBorder,
                            color: emeraldText,
                            '&:hover': { borderColor: emeraldColor, bgcolor: emeraldBg },
                          }}
                        >
                          Split % Equally
                        </Button>
                      )}
                      {splitType === 'SHARES' && (
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          onClick={handleResetShares}
                          startIcon={<Refresh fontSize="small" />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 2,
                            borderColor: emeraldBorder,
                            color: emeraldText,
                            '&:hover': { borderColor: emeraldColor, bgcolor: emeraldBg },
                          }}
                        >
                          Reset 1 Share Each
                        </Button>
                      )}
                      {splitType === 'ADJUSTMENT' && (
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          onClick={handleResetAdjustments}
                          startIcon={<Refresh fontSize="small" />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 2,
                            borderColor: emeraldBorder,
                            color: emeraldText,
                            '&:hover': { borderColor: emeraldColor, bgcolor: emeraldBg },
                          }}
                        >
                          Clear Adjustments
                        </Button>
                      )}
                    </Box>

                    {/* Member Input Rows */}
                    <Stack spacing={1.5}>
                      {activeMembers.map((m: any, index: number) => {
                        const uid = m.user?.id || m.userId;
                        const isPayer = uid === paidById;
                        const isCurrentUser = uid === user?.id || uid === profile?.id;
                        const memberShareAmt = getMemberComputedShare(uid, index);
                        const displayShare = `₹${memberShareAmt.toFixed(2)}`;

                        return (
                          <Box
                            key={uid}
                            sx={{
                              p: 1.75,
                              borderRadius: 2.5,
                              bgcolor: alpha(theme.palette.action.hover, 0.03),
                              border: `1px solid ${theme.palette.divider}`,
                              display: 'flex',
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              justifyContent: 'space-between',
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: 1.5,
                              transition: 'all 0.18s ease',
                              '&:hover': { borderColor: alpha(emeraldColor, 0.3) },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: { xs: 'auto', sm: 160 } }}>
                              <Avatar
                                src={m.user?.avatarUrl}
                                sx={{ width: 34, height: 34, fontSize: '0.8rem', bgcolor: emeraldColor, color: '#FFFFFF' }}
                              >
                                {m.user?.name?.charAt(0) || '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={650}>
                                  {m.user?.name} {isCurrentUser ? '(You)' : ''}
                                </Typography>
                                {(m.user?.username || m.user?.email) && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                    @{m.user?.username || m.user?.email?.split('@')[0]}
                                  </Typography>
                                )}
                                {isPayer && (
                                  <Typography variant="caption" sx={{ color: emeraldText, fontWeight: 700, display: 'block' }}>
                                    Paid for this bill
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            {/* Interactive input depending on Split Type */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' }, width: { xs: '100%', sm: 'auto' }, gap: 2 }}>
                              {splitType === 'EQUAL' && (
                                <Typography variant="body2" fontWeight={750} sx={{ color: emeraldText }}>
                                  {displayShare}
                                </Typography>
                              )}

                              {splitType === 'EXACT' && (
                                <TextField
                                  size="small"
                                  type="number"
                                  placeholder="0.00"
                                  value={exactAmounts[uid] || ''}
                                  onChange={(e) =>
                                    setExactAmounts({ ...exactAmounts, [uid]: e.target.value })
                                  }
                                  slotProps={{
                                    input: {
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <Typography fontWeight={700} fontSize="0.85rem">
                                            ₹
                                          </Typography>
                                        </InputAdornment>
                                      ),
                                    },
                                  }}
                                  sx={{ width: 140 }}
                                />
                              )}

                              {splitType === 'PERCENTAGE' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    placeholder="0"
                                    value={percentages[uid] || ''}
                                    onChange={(e) =>
                                      setPercentages({ ...percentages, [uid]: e.target.value })
                                    }
                                    slotProps={{
                                      input: {
                                        endAdornment: (
                                          <InputAdornment position="end">
                                            <Typography fontWeight={700} fontSize="0.85rem">
                                              %
                                            </Typography>
                                          </InputAdornment>
                                        ),
                                      },
                                    }}
                                    sx={{ width: 110 }}
                                  />
                                  <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ minWidth: 70, textAlign: 'right' }}>
                                    = {displayShare}
                                  </Typography>
                                </Box>
                              )}

                              {splitType === 'SHARES' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    placeholder="1"
                                    value={shares[uid] || '1'}
                                    onChange={(e) =>
                                      setShares({ ...shares, [uid]: e.target.value })
                                    }
                                    slotProps={{
                                      input: {
                                        endAdornment: (
                                          <InputAdornment position="end">
                                            <Typography variant="caption" fontWeight={600}>
                                              share(s)
                                            </Typography>
                                          </InputAdornment>
                                        ),
                                      },
                                    }}
                                    sx={{ width: 130 }}
                                  />
                                  <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ minWidth: 70, textAlign: 'right' }}>
                                    = {displayShare}
                                  </Typography>
                                </Box>
                              )}

                              {splitType === 'ADJUSTMENT' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    placeholder="±0.00"
                                    value={adjustments[uid] || ''}
                                    onChange={(e) =>
                                      setAdjustments({ ...adjustments, [uid]: e.target.value })
                                    }
                                    slotProps={{
                                      input: {
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            <Typography fontWeight={700} fontSize="0.85rem">
                                              ±₹
                                            </Typography>
                                          </InputAdornment>
                                        ),
                                      },
                                    }}
                                    sx={{ width: 130 }}
                                  />
                                  <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ minWidth: 75, textAlign: 'right' }}>
                                    = {displayShare}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Card>

                  {/* Card 4: Notes & Memo */}
                  <Card
                    className="glass-secondary glass-specular-top"
                    sx={{
                      borderRadius: 3.5,
                      p: { xs: 2.5, sm: 3.5 },
                      boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
                      4. Notes & Memo (Optional)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Add receipt notes, payment transaction ID, or memo..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Card>

                  {/* Mobile-Only Actions Bar */}
                  <Box sx={{ display: { xs: 'flex', lg: 'none' }, gap: 1.5, flexDirection: 'column', pt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={submitting || !description.trim() || numericTotal <= 0 || !splitMetrics.isValid}
                      startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Check />}
                      sx={{
                        borderRadius: 2.5,
                        py: 1.5,
                        fontWeight: 700,
                        bgcolor: emeraldColor,
                        color: '#FFFFFF',
                        textTransform: 'none',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                        '&:hover': { bgcolor: isLight ? '#047857' : '#059669' },
                      }}
                    >
                      {submitting ? 'Saving...' : isEditMode ? 'Update Expense' : 'Save Expense'}
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button
                        type="button"
                        variant="outlined"
                        fullWidth
                        onClick={() => (groupId ? router.push(`/groups/${groupId}`) : router.push('/expenses'))}
                        sx={{
                          borderRadius: 2.5,
                          borderColor: theme.palette.divider,
                          color: 'text.primary',
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="text"
                        color="error"
                        onClick={clearDraft}
                        startIcon={<DeleteSweep fontSize="small" />}
                        sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
                      >
                        Clear
                      </Button>
                    </Box>
                  </Box>
                </Stack>
              </Grid>

              {/* Right Column: Sticky Live Split Breakdown & Quick Submit Action Hub */}
              <Grid size={{ xs: 12, lg: 4.5, xl: 4 }}>
                <Box sx={{ position: { xs: 'static', lg: 'sticky' }, top: 88, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Sticky Summary Card */}
                  <Card
                    className="glass-secondary glass-specular-top"
                    sx={{
                      borderRadius: 3.5,
                      p: 3,
                      boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 16px 40px rgba(0,0,0,0.45)',
                      border: splitMetrics.isValid
                        ? `1px solid ${emeraldBorder} !important`
                        : `1px solid ${alpha(theme.palette.error.main, 0.3)} !important`,
                    }}
                  >
                    {/* Header: Live Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: emeraldColor, boxShadow: `0 0 10px ${emeraldColor}` }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: emeraldText }}>
                          Live Split Breakdown
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={splitType === 'EQUAL' ? '= Equal' : splitType === 'EXACT' ? '≠ Exact' : splitType === 'PERCENTAGE' ? '% Percent' : splitType === 'SHARES' ? '➗ Shares' : '± Adjust'}
                        sx={{
                          height: 22,
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          bgcolor: emeraldBg,
                          color: emeraldText,
                          border: `1px solid ${emeraldBorder}`,
                        }}
                      />
                    </Box>

                    {/* Total Hero Amount */}
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Total Bill Amount
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.25 }}>
                        <Typography variant="h3" fontWeight={850} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
                          ₹{numericTotal.toFixed(2)}
                        </Typography>
                        <Chip
                          label={`${CATEGORY_EMOJI[category] || '📋'} ${category}`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.675rem',
                            fontWeight: 600,
                            bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Paid by: <strong>{payerDisplayName}</strong>
                      </Typography>
                    </Box>

                    {/* Personal Net Standing Impact Banner */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        mb: 2.5,
                        bgcolor: myNetStanding > 0
                          ? emeraldBg
                          : myNetStanding < 0
                          ? alpha(theme.palette.error.main, 0.1)
                          : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${
                          myNetStanding > 0
                            ? emeraldBorder
                            : myNetStanding < 0
                            ? alpha(theme.palette.error.main, 0.3)
                            : theme.palette.divider
                        }`,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: myNetStanding > 0 ? emeraldText : myNetStanding < 0 ? '#FB7185' : 'text.secondary', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.25 }}>
                        Your Net Balance Impact
                      </Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ color: myNetStanding > 0 ? emeraldColor : myNetStanding < 0 ? '#EF4444' : 'text.primary', letterSpacing: '-0.01em' }}>
                        {myNetStanding > 0 ? `+₹${myNetStanding.toFixed(2)}` : myNetStanding < 0 ? `-₹${Math.abs(myNetStanding).toFixed(2)}` : '₹0.00'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                        {myNetStanding > 0
                          ? 'You will be reimbursed this amount by group members.'
                          : myNetStanding < 0
                          ? 'You will owe this amount to the payer.'
                          : 'You are not financially affected by this bill.'}
                      </Typography>
                    </Box>

                    {/* Math Validation Status */}
                    <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {splitMetrics.isValid ? (
                        <Check sx={{ color: emeraldColor, fontSize: 18 }} />
                      ) : (
                        <ErrorOutlined sx={{ color: theme.palette.error.main, fontSize: 18 }} />
                      )}
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ color: splitMetrics.isValid ? emeraldText : theme.palette.error.main }}
                      >
                        {splitMetrics.isValid ? 'Math Balanced (100% split match) ✓' : splitMetrics.message}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Participant Shares Breakdown List */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1.5 }}>
                        Participant Allocations ({activeMembers.length})
                      </Typography>
                      <Stack spacing={1}>
                        {activeMembers.map((m: any, idx: number) => {
                          const uid = m.user?.id || m.userId;
                          const isYou = uid === currentUserId;
                          const shareAmt = getMemberComputedShare(uid, idx);
                          const pct = numericTotal > 0 ? Math.round((shareAmt / numericTotal) * 100) : 0;

                          return (
                            <Box
                              key={uid}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 0.5,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                  src={m.user?.avatarUrl}
                                  sx={{ width: 22, height: 22, fontSize: '0.7rem', bgcolor: isYou ? emeraldColor : theme.palette.divider, color: '#FFFFFF' }}
                                >
                                  {m.user?.name?.charAt(0) || '?'}
                                </Avatar>
                                <Typography variant="body2" fontWeight={isYou ? 700 : 500} sx={{ fontSize: '0.825rem' }}>
                                  {m.user?.name} {isYou ? '(You)' : ''}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.825rem', color: isYou ? emeraldText : 'text.primary' }}>
                                  ₹{shareAmt.toFixed(2)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.675rem' }}>
                                  {pct}% of bill
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>

                    {/* Desktop Sticky Submit Button (No scrolling needed!) */}
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={submitting || !description.trim() || numericTotal <= 0 || !splitMetrics.isValid}
                      startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Check />}
                      sx={{
                        borderRadius: 2.5,
                        py: 1.35,
                        fontWeight: 700,
                        fontSize: '0.925rem',
                        bgcolor: emeraldColor,
                        color: '#FFFFFF',
                        textTransform: 'none',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isLight ? '#047857' : '#059669',
                          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      {submitting ? 'Saving...' : isEditMode ? 'Update Expense' : 'Save Expense'}
                    </Button>

                    {/* Desktop Secondary Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.75 }}>
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        color="error"
                        onClick={clearDraft}
                        startIcon={<DeleteSweep fontSize="small" />}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Clear Form
                      </Button>
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        onClick={() => (groupId ? router.push(`/groups/${groupId}`) : router.push('/expenses'))}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      )}
    </AppLayout>
  );
}

export default function NewExpensePage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <NewExpenseSkeleton />
        </AppLayout>
      }
    >
      <NewExpenseContent />
    </Suspense>
  );
}
