'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Typography,
  Stack,
  Tooltip,
  useTheme,
  alpha,
  CircularProgress,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  FlashOn,
  Mic,
  MicOff,
  Send,
  Edit,
  Category as CategoryIcon,
  Group as GroupIcon,
  AttachMoney,
  Check,
  Close,
  History,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { groupApi, friendApi, expenseApi } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { triggerDataRefresh } from '@/lib/events';

export const CATEGORY_LEXICON: Record<string, string> = {
  // Food & Dining
  food: 'FOOD', dinner: 'FOOD', lunch: 'FOOD', breakfast: 'FOOD', snack: 'FOOD', snacks: 'FOOD',
  pizza: 'FOOD', burger: 'FOOD', cafe: 'FOOD', coffee: 'FOOD', tea: 'FOOD', chai: 'FOOD',
  restaurant: 'FOOD', biryani: 'FOOD', swiggy: 'FOOD', zomato: 'FOOD', drinks: 'FOOD', beer: 'FOOD',
  // Transport & Travel
  uber: 'TRANSPORT', ola: 'TRANSPORT', cab: 'TRANSPORT', auto: 'TRANSPORT', taxi: 'TRANSPORT',
  petrol: 'TRANSPORT', fuel: 'TRANSPORT', metro: 'TRANSPORT', train: 'TRANSPORT', bus: 'TRANSPORT',
  toll: 'TRANSPORT', parking: 'TRANSPORT', flight: 'TRAVEL', hotel: 'TRAVEL', airbnb: 'TRAVEL',
  trip: 'TRAVEL', tour: 'TRAVEL', resort: 'TRAVEL',
  // Groceries & Home
  groceries: 'GROCERIES', grocery: 'GROCERIES', milk: 'GROCERIES', veggies: 'GROCERIES',
  vegetables: 'GROCERIES', fruits: 'GROCERIES', supermarket: 'GROCERIES', zepto: 'GROCERIES',
  blinkit: 'GROCERIES', instamart: 'GROCERIES',
  // Utilities & Bills
  wifi: 'UTILITIES', internet: 'UTILITIES', electricity: 'UTILITIES', power: 'UTILITIES',
  water: 'UTILITIES', gas: 'UTILITIES', cylinder: 'UTILITIES', bill: 'UTILITIES', recharge: 'UTILITIES',
  // Rent & Living
  rent: 'RENT', maintenance: 'RENT', maid: 'RENT', cook: 'RENT', flat: 'RENT',
  // Entertainment & Subscriptions
  movie: 'ENTERTAINMENT', cinema: 'ENTERTAINMENT', tickets: 'ENTERTAINMENT', show: 'ENTERTAINMENT',
  netflix: 'SUBSCRIPTIONS', spotify: 'SUBSCRIPTIONS', prime: 'SUBSCRIPTIONS', hotstar: 'SUBSCRIPTIONS',
  youtube: 'SUBSCRIPTIONS', game: 'ENTERTAINMENT', party: 'ENTERTAINMENT', club: 'ENTERTAINMENT',
  // Shopping & Health
  shopping: 'SHOPPING', amazon: 'SHOPPING', flipkart: 'SHOPPING', clothes: 'SHOPPING',
  doctor: 'HEALTH', medicine: 'HEALTH', pharmacy: 'HEALTH', hospital: 'HEALTH',
};

export const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: '🍔', TRANSPORT: '🚗', GROCERIES: '🛒', UTILITIES: '💡',
  RENT: '🏠', ENTERTAINMENT: '🎬', SUBSCRIPTIONS: '📱', SHOPPING: '🛍️',
  HEALTH: '💊', TRAVEL: '✈️', GENERAL: '📋', OTHER: '📌',
};

const FREQUENT_TEMPLATES = [
  { label: '☕ Chai / Coffee ₹120', text: 'Chai 120' },
  { label: '🚕 Cab / Auto ₹250', text: 'Cab 250' },
  { label: '🍕 Dinner / Food ₹650', text: 'Dinner 650' },
  { label: '🛒 Groceries ₹850', text: 'Groceries 850' },
];

interface SmartQuickAddBarProps {
  initialGroupId?: string;
  onExpenseCreated?: () => void;
  placeholder?: string;
}

export default function SmartQuickAddBar({
  initialGroupId,
  onExpenseCreated,
  placeholder = '⚡ Syntax: item amount [group] (e.g. "Pizza 1200 Goa Trip" or "Chai 40" for personal)',
}: SmartQuickAddBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const { user, profile } = useAuth();
  const isLight = theme.palette.mode === 'light';

  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Groups and Friends cache for entity matching
  const [groups, setGroups] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Category override menu
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [manualCategory, setManualCategory] = useState<string | null>(null);

  // Group override menu
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(null);
  const [manualGroup, setManualGroup] = useState<any | null>(null);

  // Fetch groups and friends once for instant matching
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      groupApi.list().catch(() => ({ data: { data: [] } })),
      friendApi.list().catch(() => ({ data: { data: [] } })),
    ]).then(([groupsRes, friendsRes]) => {
      if (!isMounted) return;
      const gList = groupsRes.data?.data || [];
      const fList = friendsRes.data?.data || [];
      setGroups(gList);
      setFriends(fList);

      if (initialGroupId) {
        const found = gList.find((g: any) => g.id === initialGroupId);
        if (found) setManualGroup(found);
      }
    });
    return () => { isMounted = false; };
  }, [initialGroupId]);

  // Speech Recognition setup (Web Speech API) with robust fallback & live interim feedback
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setToastSeverity('error');
      setToastMessage('Voice dictation is not supported by your current browser. Try Chrome, Edge, or Safari.');
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    try {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = navigator.language || 'en-IN';

      recog.onstart = () => {
        setIsListening(true);
        setToastSeverity('info');
        setToastMessage('🎙️ Listening... Speak naturally (e.g. "Pizza 1200 Goa Trip" or "Chai 40")');
      };

      recog.onresult = (e: any) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        const text = (final || interim).trim();
        if (text) setInput(text);
      };

      recog.onerror = (e: any) => {
        setIsListening(false);
        console.warn('Speech recognition event error:', e.error);
        if (e.error === 'not-allowed') {
          setToastSeverity('error');
          setToastMessage('Microphone permission blocked. Please allow microphone access in your browser address bar.');
        } else if (e.error === 'no-speech') {
          setToastSeverity('warning');
          setToastMessage('No speech was detected. Please speak closer to your microphone.');
        } else if (e.error === 'network') {
          setToastSeverity('error');
          setToastMessage('Voice dictation network error. Please check your internet connection.');
        }
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
      recog.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setToastSeverity('error');
      setToastMessage('Could not activate microphone: ' + (err.message || 'unknown error'));
    }
  };

  // Levenshtein distance for fuzzy group/friend name matching
  const getEditDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Natural Language Parser with extensive edge-case handling
  const parsed = useMemo(() => {
    // Normalize and collapse extra spaces
    const raw = input.replace(/\s+/g, ' ').trim();
    if (!raw) {
      return {
        amount: 0,
        category: manualCategory || 'GENERAL',
        description: '',
        targetGroup: manualGroup || null,
        targetFriend: null as any | null,
        unmatchedGroupCandidate: null as string | null,
        isValid: false,
        validationError: null as string | null,
      };
    }

    // 1. EXTRACT AMOUNT ROBUSTLY
    // Handles: "1200", "₹1200", "₹ 1200", "1,200", "15,000.50", "450 rs", "450rs", "$50", "1.5k", "2k", "1200/-"
    // Also protects addresses/numbers like "Flat 402", "Room 12", "Table 4" from hijacking the bill amount!
    let detectedAmount = 0;
    let matchedAmountSubstring = '';

    // Check for "k" notation multiplier: "1.5k" -> 1500, "2k" -> 2000
    const kMultiplierRegex = /\b(\d+(?:\.\d+)?)\s*(?:k|kilo)\b/i;
    const kMatch = raw.match(kMultiplierRegex);

    if (kMatch) {
      detectedAmount = Math.round(parseFloat(kMatch[1]) * 1000);
      matchedAmountSubstring = kMatch[0];
    } else {
      // Clean commas inside numbers: "1,200" -> "1200", "15,000" -> "15000"
      const normalizedWithCleanNumbers = raw.replace(/(\d+),(\d+)/g, '$1$2');

      // Check explicit currency indicators: ₹500, rs 500, 500rs, 500/-, $50
      const explicitCurrencyRegex = /(?:₹|\$|rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)|\b(\d+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|\/-)/i;
      const explicitMatch = normalizedWithCleanNumbers.match(explicitCurrencyRegex);

      if (explicitMatch) {
        const numStr = explicitMatch[1] || explicitMatch[2];
        detectedAmount = parseFloat(numStr);
        matchedAmountSubstring = explicitMatch[0];
      } else {
        // Disambiguate standalone numbers, ignoring items like "flat 402", "room 12", "table 3"
        const tokens = normalizedWithCleanNumbers.split(' ');
        let candidateNumber = 0;
        let candidateToken = '';

        for (let i = 0; i < tokens.length; i++) {
          const t = tokens[i].replace(/[₹$,/-]/g, '');
          const prev = i > 0 ? tokens[i - 1].toLowerCase() : '';
          const isPrefixWord = /^(flat|room|table|apt|apartment|sector|gate|no|item|phase|block)$/i.test(prev);

          if (!isPrefixWord && /^\d+(?:\.\d{1,2})?$/.test(t)) {
            const val = parseFloat(t);
            if (val > 0) {
              candidateNumber = val;
              candidateToken = tokens[i];
            }
          }
        }

        if (candidateNumber > 0) {
          detectedAmount = candidateNumber;
          matchedAmountSubstring = candidateToken;
        }
      }
    }

    // 2. EXTRACT CATEGORY
    let detectedCategory = manualCategory || 'GENERAL';
    if (!manualCategory) {
      const words = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
      for (const w of words) {
        if (CATEGORY_LEXICON[w]) {
          detectedCategory = CATEGORY_LEXICON[w];
          break;
        }
      }
    }

    // 3. EXTRACT TARGET GROUP OR FRIEND & HANDLE UNMATCHED GROUP EDGES
    let targetGroup = manualGroup || null;
    let targetFriend: any = null;
    let unmatchedGroupCandidate: string | null = null;

    if (!targetGroup) {
      const lowerRaw = raw.toLowerCase();

      // Check for explicit group markers: "@Goa", "in Goa Trip", "group: Goa Trip", "to Goa"
      const explicitGroupMarkerRegex = /(?:@|in\s+group\s+|group\s*:\s*|in\s+|to\s+|for\s+group\s+)([a-z0-9\s-_]+)$/i;
      const markerMatch = raw.match(explicitGroupMarkerRegex);
      const explicitGroupName = markerMatch ? markerMatch[1].trim() : null;

      // Search all user groups
      // A) Exact match
      let matchedGroup = groups.find((g: any) => {
        const gName = (g.name || '').toLowerCase().trim();
        return gName.length > 1 && (lowerRaw === gName || lowerRaw.includes(gName));
      });

      // B) Word token match
      if (!matchedGroup) {
        matchedGroup = groups.find((g: any) => {
          const gName = (g.name || '').toLowerCase().trim();
          if (gName.length < 3) return false;
          const gWords = gName.split(/\s+/);
          return gWords.some((gw: string) => gw.length >= 3 && lowerRaw.includes(gw));
        });
      }

      // C) Typo tolerance / fuzzy distance
      if (!matchedGroup && groups.length > 0) {
        const candidateToTest = explicitGroupName || (raw.split(/\s+/).slice(-2).join(' '));
        if (candidateToTest && candidateToTest.length >= 4) {
          matchedGroup = groups.find((g: any) => {
            const gName = (g.name || '').toLowerCase().trim();
            return getEditDistance(candidateToTest.toLowerCase(), gName) <= 2;
          });
        }
      }

      if (matchedGroup) {
        targetGroup = matchedGroup;
      } else if (explicitGroupName && explicitGroupName.length > 1) {
        // Explicit group declared by user does not exist
        unmatchedGroupCandidate = explicitGroupName;
      } else {
        // Friend match
        const matchedFriend = friends.find((f: any) => {
          const fName = (f.name || '').toLowerCase().trim();
          return fName.length > 2 && lowerRaw.includes(fName);
        });
        if (matchedFriend) {
          targetFriend = matchedFriend;
        } else if (matchedAmountSubstring) {
          // Detect trailing text after amount that isn't a category
          const amountIdx = raw.indexOf(matchedAmountSubstring);
          const afterAmount = raw.slice(amountIdx + matchedAmountSubstring.length).trim();
          const cleanAfter = afterAmount.replace(/\b(rs|inr|with|and|paid|by)\b/gi, '').trim();
          if (cleanAfter.length >= 3 && !CATEGORY_LEXICON[cleanAfter.toLowerCase()]) {
            unmatchedGroupCandidate = cleanAfter;
          }
        }
      }
    }

    // 4. CLEAN DESCRIPTION
    let cleanDesc = raw;
    if (matchedAmountSubstring) {
      cleanDesc = cleanDesc.replace(matchedAmountSubstring, '');
    }
    if (targetGroup?.name) {
      const gRegex = new RegExp(`\\b${targetGroup.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      cleanDesc = cleanDesc.replace(gRegex, '');
    }
    cleanDesc = cleanDesc
      .replace(/[@#]([a-z0-9_-]+)/gi, '')
      .replace(/\b(with|for|at|in|paid|by|to|and|rs|inr|group)\b/gi, ' ')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanDesc) {
      cleanDesc = detectedCategory === 'FOOD' ? 'Food / Dining' :
        detectedCategory === 'TRANSPORT' ? 'Cab / Ride' :
        detectedCategory === 'GROCERIES' ? 'Groceries' : 'Shared Expense';
    } else {
      cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
    }

    let validationError = null;
    if (detectedAmount <= 0) {
      validationError = 'Please specify an amount (e.g. 1200 or ₹500)';
    } else if (cleanDesc.length === 0) {
      validationError = 'Please enter an expense name';
    }

    return {
      amount: detectedAmount,
      category: detectedCategory,
      description: cleanDesc,
      targetGroup,
      targetFriend,
      unmatchedGroupCandidate,
      isValid: detectedAmount > 0 && cleanDesc.length > 0,
      validationError,
    };
  }, [input, manualCategory, manualGroup, groups, friends]);

  // One-Tap Instant Log with Optimistic UI & Zero Lag
  const handleInstantSubmit = async (overrideGroup?: any) => {
    if (!parsed.isValid || submitting || !user?.id) {
      if (parsed.validationError) {
        setToastSeverity('warning');
        setToastMessage(parsed.validationError);
      }
      return;
    }

    const finalGroup = overrideGroup || parsed.targetGroup;

    // Edge case: User typed a group that doesn't exist and hasn't explicitly selected one
    if (!finalGroup && parsed.unmatchedGroupCandidate && !overrideGroup) {
      setToastSeverity('warning');
      setToastMessage(`⚠️ Group "${parsed.unmatchedGroupCandidate}" not found. Tap the Group chip below to choose a group, or tap Quick Log again to log as Personal.`);
      return;
    }

    setSubmitting(true);
    const savedInput = input;

    // 1. Determine members instantly from cached group data (NO extra network round-trip!)
    let splitsPayload: any[] = [];
    if (finalGroup?.id) {
      const cachedGrp = groups.find((g: any) => g.id === finalGroup.id);
      const members = cachedGrp?.members || [];
      if (members.length > 0) {
        splitsPayload = members.map((m: any) => ({
          userId: m.userId || m.user?.id || m.id,
        }));
      } else {
        splitsPayload = [{ userId: user.id }];
      }
    } else if (parsed.targetFriend?.id) {
      splitsPayload = [
        { userId: user.id },
        { userId: parsed.targetFriend.id },
      ];
    } else {
      splitsPayload = [{ userId: user.id }];
    }

    const expensePayload = {
      description: parsed.description,
      amount: parsed.amount,
      currency: finalGroup?.currency || 'INR',
      category: parsed.category,
      splitType: 'EQUAL' as const,
      groupId: finalGroup?.id || null,
      paidById: user.id,
      splits: splitsPayload,
      date: new Date().toISOString(),
    };

    // 2. OPTIMISTIC FEEDBACK: Clear input & notify UI instantly!
    setInput('');
    setToastSeverity('success');
    setToastMessage(`⚡ Logged "${parsed.description}" (₹${parsed.amount.toLocaleString()})!`);

    const optimisticExpense = {
      ...expensePayload,
      id: `temp_${Date.now()}`,
      paidBy: { id: user.id, name: profile?.name || (user as any).user_metadata?.name || 'You', avatarUrl: profile?.avatarUrl || null },
      shares: splitsPayload.map((s) => ({
        userId: s.userId,
        amount: Math.round((parsed.amount / splitsPayload.length) * 100) / 100,
      })),
      createdAt: new Date().toISOString(),
    };

    if (onExpenseCreated) {
      onExpenseCreated();
    }
    triggerDataRefresh({ type: 'expense', data: optimisticExpense });

    try {
      await expenseApi.create(expensePayload, {
        headers: { 'idempotency-key': `quick_${user.id}_${Date.now()}` },
      });

      setManualCategory(null);
      if (!initialGroupId) setManualGroup(null);
    } catch (err: any) {
      console.error('Instant quick add error:', err);
      // Rollback on failure
      setInput(savedInput);
      setToastSeverity('error');
      setToastMessage(err.response?.data?.error || 'Failed to quickly log expense. Restored input.');
      triggerDataRefresh({ type: 'expense' });
    } finally {
      setSubmitting(false);
    }
  };

  // Open full detailed editor pre-filled
  const handleOpenDetailed = () => {
    const params = new URLSearchParams();
    if (parsed.description) params.set('description', parsed.description);
    if (parsed.amount) params.set('amount', String(parsed.amount));
    if (parsed.category) params.set('category', parsed.category);
    if (parsed.targetGroup?.id) params.set('groupId', parsed.targetGroup.id);
    if (parsed.targetFriend?.id) params.set('friendId', parsed.targetFriend.id);
    router.push(`/expenses/new?${params.toString()}`);
  };

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Box
        className="glass-secondary glass-specular-top"
        sx={{
          p: { xs: 1.75, sm: 2.25 },
          borderRadius: 3.5,
          border: isListening ? '1.5px solid #10B981 !important' : `1px solid ${theme.palette.divider}`,
          boxShadow: isListening
            ? '0 0 25px rgba(16, 185, 129, 0.25)'
            : isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Main Input Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && parsed.isValid) {
                handleInstantSubmit();
              }
            }}
            placeholder={placeholder}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FlashOn sx={{ color: '#10B981', fontSize: 22 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {input ? (
                      <IconButton size="small" onClick={() => setInput('')} sx={{ color: 'text.secondary' }}>
                        <Close fontSize="small" />
                      </IconButton>
                    ) : null}
                    <Tooltip title={isListening ? 'Listening... click to stop' : 'Voice Dictate Expense'}>
                      <IconButton
                        size="small"
                        onClick={toggleListening}
                        sx={{
                          color: isListening ? '#EF4444' : 'text.secondary',
                          bgcolor: isListening ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                          animation: isListening ? 'pulse 1.2s infinite' : 'none',
                          ml: 0.5,
                          '&:hover': { color: '#10B981' },
                        }}
                      >
                        {isListening ? <MicOff fontSize="small" /> : <Mic fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2.5,
                  bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                  fontSize: { xs: '0.875rem', sm: '0.95rem' },
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: alpha(theme.palette.text.primary, 0.15) },
                  '&.Mui-focused fieldset': { borderColor: '#10B981' },
                },
              },
            }}
          />

          <Button
            variant="contained"
            disabled={!parsed.isValid || submitting}
            onClick={handleInstantSubmit}
            className="glass-emerald-active"
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: 'none',
              px: { xs: 2, sm: 2.75 },
              py: 0.95,
              bgcolor: '#0E6245',
              color: '#ffffff',
              flexShrink: 0,
              minWidth: { xs: 'auto', sm: 110 },
              '&:hover': { bgcolor: '#094A34' },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Send sx={{ fontSize: 17 }} />
                <Typography variant="body2" fontWeight={700} sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Quick Log
                </Typography>
              </Stack>
            )}
          </Button>
        </Box>

        {/* Live Parsed Preview & Fast Actions */}
        {input.trim().length > 0 && (
          <Box
            className="animate-fade-in"
            sx={{
              mt: 1.5,
              pt: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.25,
            }}
          >
            {/* Parsed Badges */}
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                Detected:
              </Typography>

              {/* Amount badge */}
              <Chip
                label={parsed.amount > 0 ? `₹${parsed.amount.toFixed(0)}` : 'Enter amount'}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  bgcolor: parsed.amount > 0 ? alpha('#10B981', 0.15) : alpha(theme.palette.error.main, 0.12),
                  color: parsed.amount > 0 ? '#10B981' : theme.palette.error.main,
                  border: `1px solid ${parsed.amount > 0 ? 'rgba(16, 185, 129, 0.3)' : 'transparent'}`,
                }}
              />

              {/* Category selector badge */}
              <Chip
                icon={<CategoryIcon sx={{ fontSize: '14px !important' }} />}
                label={`${CATEGORY_EMOJI[parsed.category] || '📋'} ${parsed.category}`}
                size="small"
                onClick={(e) => setCategoryMenuAnchor(e.currentTarget)}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.725rem',
                  cursor: 'pointer',
                  bgcolor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                  '&:hover': { bgcolor: alpha('#10B981', 0.1) },
                }}
              />

              {/* Group / Friend badge */}
              <Chip
                icon={<GroupIcon sx={{ fontSize: '14px !important' }} />}
                label={
                  parsed.targetGroup ? `Group: ${parsed.targetGroup.name}` :
                  parsed.targetFriend ? `Friend: ${parsed.targetFriend.name}` :
                  parsed.unmatchedGroupCandidate ? `⚠️ Group "${parsed.unmatchedGroupCandidate}" Not Found (Tap to Pick)` :
                  'Personal Expense'
                }
                size="small"
                onClick={(e) => setGroupMenuAnchor(e.currentTarget)}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.725rem',
                  cursor: 'pointer',
                  bgcolor: parsed.unmatchedGroupCandidate && !parsed.targetGroup
                    ? alpha(theme.palette.warning.main, 0.15)
                    : parsed.targetGroup || parsed.targetFriend
                    ? alpha('#3B82F6', 0.12)
                    : isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                  color: parsed.unmatchedGroupCandidate && !parsed.targetGroup
                    ? theme.palette.warning.main
                    : parsed.targetGroup || parsed.targetFriend ? '#3B82F6' : 'text.secondary',
                  border: parsed.unmatchedGroupCandidate && !parsed.targetGroup
                    ? `1px solid ${alpha(theme.palette.warning.main, 0.4)}`
                    : 'none',
                }}
              />
            </Stack>

            {/* Customize Link */}
            <Button
              size="small"
              variant="text"
              startIcon={<Edit sx={{ fontSize: 15 }} />}
              onClick={handleOpenDetailed}
              sx={{
                p: 0,
                color: 'text.secondary',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { color: '#10B981', bgcolor: 'transparent' },
              }}
            >
              Add more details →
            </Button>
          </Box>
        )}

        {/* Quick Re-log Frequency Chips & Syntax Guide (When input is empty) */}
        {!input && (
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="💡 Syntax: item amount [group]"
              size="small"
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: alpha('#10B981', 0.1),
                color: '#10B981',
                border: '1px dashed rgba(16, 185, 129, 0.35)',
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.725rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <History sx={{ fontSize: 14 }} /> Fast Presets:
            </Typography>
            {FREQUENT_TEMPLATES.map((tpl) => (
              <Chip
                key={tpl.label}
                label={tpl.label}
                size="small"
                onClick={() => setInput(tpl.text)}
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: 2,
                  bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    bgcolor: alpha('#10B981', 0.1),
                    borderColor: '#10B981',
                    color: '#10B981',
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Category Selection Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={() => setCategoryMenuAnchor(null)}
        slotProps={{
          paper: {
            className: 'glass-deep',
            sx: { maxHeight: 300, minWidth: 170, borderRadius: 2.5 },
          },
        }}
      >
        {Object.entries(CATEGORY_EMOJI).map(([cat, emoji]) => (
          <MenuItem
            key={cat}
            selected={parsed.category === cat}
            onClick={() => {
              setManualCategory(cat);
              setCategoryMenuAnchor(null);
            }}
            sx={{ fontSize: '0.825rem', fontWeight: 600 }}
          >
            {emoji} {cat}
          </MenuItem>
        ))}
      </Menu>

      {/* Group / Target Selection Menu */}
      <Menu
        anchorEl={groupMenuAnchor}
        open={Boolean(groupMenuAnchor)}
        onClose={() => setGroupMenuAnchor(null)}
        slotProps={{
          paper: {
            className: 'glass-deep',
            sx: { maxHeight: 300, minWidth: 200, borderRadius: 2.5 },
          },
        }}
      >
        <MenuItem
          selected={!manualGroup}
          onClick={() => {
            setManualGroup(null);
            setGroupMenuAnchor(null);
          }}
          sx={{ fontSize: '0.825rem', fontWeight: 600 }}
        >
          👤 Personal Expense (No Group)
        </MenuItem>
        {groups.map((g: any) => (
          <MenuItem
            key={g.id}
            selected={manualGroup?.id === g.id}
            onClick={() => {
              setManualGroup(g);
              setGroupMenuAnchor(null);
            }}
            sx={{ fontSize: '0.825rem', fontWeight: 600 }}
          >
            👥 {g.name}
          </MenuItem>
        ))}
      </Menu>

      {/* Feedback Toast */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={2500}
        onClose={() => setToastMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toastSeverity} sx={{ borderRadius: 3, fontWeight: 600 }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
