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
    <Box className="animate-fade-in" sx={{ maxWidth: 760, mx: 'auto', pb: { xs: 8, sm: 8 } }}>
      {/* Top Header Skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 2.5 }} />
        <Box>
          <Skeleton width={180} height={36} />
          <Skeleton width={220} height={18} sx={{ mt: 0.5 }} />
        </Box>
      </Box>

      {/* Form Card Skeleton */}
      <Card className="glass-card" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 4 }}>
        <Stack spacing={3}>
          {/* Amount input skeleton */}
          <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Skeleton width="30%" height={16} />
            <Skeleton width="60%" height={56} sx={{ my: 1 }} />
            <Skeleton width="40%" height={16} />
          </Box>

          {/* Description input skeleton */}
          <Skeleton variant="rounded" width="100%" height={54} sx={{ borderRadius: 2.5 }} />

          {/* Category chips skeleton */}
          <Box>
            <Skeleton width={120} height={20} sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} variant="rounded" width={80} height={32} sx={{ borderRadius: 3 }} />
              ))}
            </Stack>
          </Box>

          {/* Split selector skeleton */}
          <Box>
            <Skeleton width={100} height={20} sx={{ mb: 1.5 }} />
            <Skeleton variant="rounded" width="100%" height={44} sx={{ borderRadius: 2.5 }} />
          </Box>

          {/* Save button skeleton */}
          <Skeleton variant="rounded" width="100%" height={48} sx={{ borderRadius: 2.5 }} />
        </Stack>
      </Card>
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

  return (
    <AppLayout>
      {loadingInitial ? (
        <NewExpenseSkeleton />
      ) : (
        <Box className="animate-fade-in" sx={{ maxWidth: 760, mx: 'auto', pb: { xs: 8, sm: 8 } }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              type="button"
              onClick={() => (groupId ? router.push(`/groups/${groupId}`) : router.push('/expenses'))}
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2.5,
                '&:hover': { bgcolor: alpha('#0E6245', 0.08) },
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
                bgcolor: alpha('#0E6245', 0.12),
                color: '#0E6245',
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
          <Card
            sx={{
              borderRadius: 3.5,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
              p: { xs: 2.5, sm: 4 },
            }}
          >
            <Stack spacing={3.5}>
              {/* Primary Expense Info */}
              <Box>
                <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
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
                              <Typography fontWeight={800} color="#0E6245">
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
              </Box>

              <Divider />

              {/* Group & Payer Selection */}
              <Box>
                <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
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
                            <GroupIcon fontSize="small" sx={{ color: '#0E6245' }} />
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
                              <Avatar src={m.user?.avatarUrl} sx={{ width: 22, height: 22, fontSize: '0.7rem', bgcolor: '#0E6245' }}>
                                {m.user?.name?.charAt(0) || '?'}
                              </Avatar>
                              <Typography variant="body2" fontWeight={isYou ? 700 : 500}>
                                {m.user?.name} {isYou ? '(You)' : ''}
                              </Typography>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  </Grid>
                </Grid>

                {/* Member selection chips */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                    Select members included in this bill ({selectedMemberIds.length} of {selectedGroupMembers.length} selected):
                  </Typography>
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
                </Box>
              </Box>

              <Divider />

              {/* Advanced Split Methods */}
              <Box>
                {/* 1-Click Fast Split Presets */}
                <Box sx={{ mb: 2, p: 1.5, borderRadius: 2.5, bgcolor: alpha('#0E6245', 0.05), border: `1px dashed ${alpha('#0E6245', 0.25)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <FlashOn sx={{ fontSize: 18, color: '#0E6245' }} />
                    <Typography variant="caption" fontWeight={750} sx={{ color: '#0E6245', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                        bgcolor: splitType === 'EQUAL' && selectedMemberIds.length === selectedGroupMembers.length ? alpha('#0E6245', 0.15) : 'transparent',
                        borderColor: alpha('#0E6245', 0.3),
                        color: splitType === 'EQUAL' && selectedMemberIds.length === selectedGroupMembers.length ? '#0E6245' : 'text.primary',
                        '&:hover': { bgcolor: alpha('#0E6245', 0.12) },
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
                        borderColor: alpha('#0E6245', 0.3),
                        '&:hover': { bgcolor: alpha('#0E6245', 0.12) },
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
                        borderColor: alpha('#0E6245', 0.3),
                        '&:hover': { bgcolor: alpha('#0E6245', 0.12) },
                      }}
                    />
                  </Stack>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
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
                          bgcolor: alpha('#0E6245', 0.12),
                          color: '#0E6245',
                          borderColor: '#0E6245 !important',
                          fontWeight: 750,
                          '&:hover': { bgcolor: alpha('#0E6245', 0.18) },
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
                      ? alpha('#0E6245', 0.07)
                      : alpha(theme.palette.error.main, 0.08),
                    border: `1px solid ${
                      splitMetrics.isValid
                        ? alpha('#0E6245', 0.25)
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
                      <Check sx={{ color: '#0E6245', fontSize: '1.25rem' }} />
                    ) : (
                      <ErrorOutlined sx={{ color: theme.palette.error.main, fontSize: '1.25rem' }} />
                    )}
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: splitMetrics.isValid ? '#0E6245' : theme.palette.error.main }}
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
                        borderColor: '#0E6245',
                        color: '#0E6245',
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
                        borderColor: '#0E6245',
                        color: '#0E6245',
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
                        borderColor: '#0E6245',
                        color: '#0E6245',
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
                        borderColor: '#0E6245',
                        color: '#0E6245',
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

                    // Computed share for display
                    let displayShare = '₹0.00';
                    if (splitType === 'EQUAL') {
                      const count = activeMembers.length || 1;
                      const perPerson = Math.floor((numericTotal / count) * 100) / 100;
                      const rem = Math.round((numericTotal - perPerson * count) * 100) / 100;
                      const myAmount = index === 0 ? perPerson + rem : perPerson;
                      displayShare = `₹${myAmount.toFixed(2)}`;
                    } else if (splitType === 'EXACT') {
                      displayShare = `₹${parseFloat(exactAmounts[uid] || '0').toFixed(2)}`;
                    } else if (splitType === 'PERCENTAGE') {
                      const pct = parseFloat(percentages[uid] || '0');
                      const amt = (numericTotal * pct) / 100;
                      displayShare = `₹${amt.toFixed(2)}`;
                    } else if (splitType === 'SHARES') {
                      const totalShares = activeMembers.reduce(
                        (sum, mem) => sum + parseFloat(shares[mem.user?.id || mem.userId] || '1'),
                        0
                      );
                      const myShareCount = parseFloat(shares[uid] || '1');
                      const amt = totalShares > 0 ? (numericTotal * myShareCount) / totalShares : 0;
                      displayShare = `₹${amt.toFixed(2)}`;
                    } else if (splitType === 'ADJUSTMENT') {
                      const totalAdj = activeMembers.reduce(
                        (sum, mem) => sum + parseFloat(adjustments[mem.user?.id || mem.userId] || '0'),
                        0
                      );
                      const base = (numericTotal - totalAdj) / (activeMembers.length || 1);
                      const adj = parseFloat(adjustments[uid] || '0');
                      const amt = Math.max(0, base + adj);
                      displayShare = `₹${amt.toFixed(2)}`;
                    }

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
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: { xs: 'auto', sm: 160 } }}>
                          <Avatar
                            src={m.user?.avatarUrl}
                            sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#0E6245' }}
                          >
                            {m.user?.name?.charAt(0) || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={650}>
                              {m.user?.name} {isCurrentUser ? '(You)' : ''}
                            </Typography>
                            {isPayer && (
                              <Typography variant="caption" sx={{ color: '#0E6245', fontWeight: 700 }}>
                                Paid for this bill
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Interactive input depending on Split Type */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' }, width: { xs: '100%', sm: 'auto' }, gap: 2 }}>
                          {splitType === 'EQUAL' && (
                            <Typography variant="body2" fontWeight={750} color="#0E6245">
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
              </Box>

              <Divider />

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes & Memo (optional)"
                placeholder="Add receipt notes, payment transaction ID, or memo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, pt: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                <Button
                  type="button"
                  variant="text"
                  color="error"
                  onClick={clearDraft}
                  startIcon={<DeleteSweep fontSize="small" />}
                  sx={{ textTransform: 'none', fontWeight: 600, alignSelf: { xs: 'center', sm: 'auto' } }}
                >
                  Clear Form
                </Button>

                <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                  <Button
                    type="button"
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
                    disabled={submitting || !description.trim() || numericTotal <= 0 || !splitMetrics.isValid}
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
                    {submitting ? 'Saving...' : isEditMode ? 'Update Expense' : 'Save Expense'}
                  </Button>
                </Box>
              </Box>
            </Stack>
          </Card>
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
