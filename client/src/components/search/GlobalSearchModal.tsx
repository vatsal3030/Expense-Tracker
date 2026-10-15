'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  InputBase,
  Chip,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Receipt as ExpenseIcon,
  Group as GroupIcon,
  People as FriendsIcon,
  Savings as BudgetIcon,
  AccountBalanceWallet as SettlementIcon,
  Dashboard as DashboardIcon,
  Insights as AnalyticsIcon,
  EmojiEvents as FairScoreIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  NorthWest as EnterIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { expenseApi, groupApi, friendApi } from '@/lib/api';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'expenses' | 'groups' | 'friends' | 'navigation' | 'actions';
  icon: React.ReactElement;
  href: string;
  badge?: string;
  amount?: string;
}

const STATIC_ACTIONS: SearchResultItem[] = [
  {
    id: 'act-new-expense',
    title: 'Add New Expense',
    subtitle: 'Create a split expense or record a receipt',
    category: 'actions',
    icon: <AddIcon sx={{ color: '#10B981' }} />,
    href: '/expenses?new=true',
    badge: 'Action',
  },
  {
    id: 'nav-dashboard',
    title: 'Dashboard Overview',
    subtitle: 'Track your balance, monthly spend, and settlements',
    category: 'navigation',
    icon: <DashboardIcon sx={{ color: '#0EA5E9' }} />,
    href: '/dashboard',
    badge: 'Page',
  },
  {
    id: 'nav-expenses',
    title: 'All Expenses',
    subtitle: 'Filter, sort, and manage transactions',
    category: 'navigation',
    icon: <ExpenseIcon sx={{ color: '#10B981' }} />,
    href: '/expenses',
    badge: 'Page',
  },
  {
    id: 'nav-groups',
    title: 'Shared Groups',
    subtitle: 'Trip, roommate, and project ledgers',
    category: 'navigation',
    icon: <GroupIcon sx={{ color: '#8B5CF6' }} />,
    href: '/groups',
    badge: 'Page',
  },
  {
    id: 'nav-budgets',
    title: 'Monthly Budgets',
    subtitle: 'Category limits and threshold alert trackers',
    category: 'navigation',
    icon: <BudgetIcon sx={{ color: '#F59E0B' }} />,
    href: '/budgets',
    badge: 'Page',
  },
  {
    id: 'nav-settlements',
    title: 'UPI Settlements',
    subtitle: 'Simplified debt transactions and QR codes',
    category: 'navigation',
    icon: <SettlementIcon sx={{ color: '#06B6D4' }} />,
    href: '/settlements',
    badge: 'Page',
  },
  {
    id: 'nav-analytics',
    title: 'Financial Analytics',
    subtitle: 'Breakdown reports and spending patterns',
    category: 'navigation',
    icon: <AnalyticsIcon sx={{ color: '#EC4899' }} />,
    href: '/analytics',
    badge: 'Page',
  },
  {
    id: 'nav-fairscore',
    title: 'FairScore Reputation',
    subtitle: 'Reliability tier and timely settlement score',
    category: 'navigation',
    icon: <FairScoreIcon sx={{ color: '#EAB308' }} />,
    href: '/fairscore',
    badge: 'PRO',
  },
  {
    id: 'nav-friends',
    title: 'Friends & Payees',
    subtitle: 'Direct balances and UPI settlement targets',
    category: 'navigation',
    icon: <FriendsIcon sx={{ color: '#6366F1' }} />,
    href: '/friends',
    badge: 'Page',
  },
  {
    id: 'nav-settings',
    title: 'Account Settings',
    subtitle: 'Profile, default currency, and appearance',
    category: 'navigation',
    icon: <SettingsIcon sx={{ color: '#94A3B8' }} />,
    href: '/settings',
    badge: 'Page',
  },
];

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const isLight = theme.palette.mode === 'light';

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'expenses' | 'groups' | 'friends' | 'actions'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search effect with debouncing
  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setResults(STATIC_ACTIONS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const matchingActions = STATIC_ACTIONS.filter(
          (a) => a.title.toLowerCase().includes(trimmed) || a.subtitle.toLowerCase().includes(trimmed)
        );

        // Fetch dynamic matches in parallel with error fallbacks
        const [expensesRes, groupsRes, friendsRes] = await Promise.allSettled([
          expenseApi.list({ search: trimmed, limit: 6 }),
          groupApi.list(),
          friendApi.list(),
        ]);

        const items: SearchResultItem[] = [...matchingActions];

        // Process expenses
        if (expensesRes.status === 'fulfilled' && expensesRes.value?.data?.data) {
          const expenseList = Array.isArray(expensesRes.value.data.data) ? expensesRes.value.data.data : [];
          expenseList.forEach((exp: any) => {
            items.push({
              id: `exp-${exp.id}`,
              title: exp.description || 'Expense',
              subtitle: `${exp.group ? `${exp.group.name} • ` : ''}${new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
              category: 'expenses',
              icon: <ExpenseIcon sx={{ color: '#10B981' }} />,
              href: `/expenses?id=${exp.id}`,
              amount: `₹${Number(exp.amount).toLocaleString('en-IN')}`,
              badge: exp.category || 'EXPENSE',
            });
          });
        }

        // Process groups
        if (groupsRes.status === 'fulfilled' && groupsRes.value?.data?.data) {
          const groupList = Array.isArray(groupsRes.value.data.data) ? groupsRes.value.data.data : [];
          groupList
            .filter((g: any) => g.name?.toLowerCase().includes(trimmed) || g.description?.toLowerCase().includes(trimmed))
            .slice(0, 5)
            .forEach((g: any) => {
              items.push({
                id: `grp-${g.id}`,
                title: g.name,
                subtitle: `${g.members?.length || 1} members • ${g.category || 'Group'}`,
                category: 'groups',
                icon: <GroupIcon sx={{ color: '#8B5CF6' }} />,
                href: `/groups/${g.id}`,
                badge: 'Group',
              });
            });
        }

        // Process friends
        if (friendsRes.status === 'fulfilled' && friendsRes.value?.data?.data) {
          const friendList = Array.isArray(friendsRes.value.data.data) ? friendsRes.value.data.data : [];
          friendList
            .filter((f: any) => {
              const name = f.friend?.name || f.name || '';
              const email = f.friend?.email || f.email || '';
              return name.toLowerCase().includes(trimmed) || email.toLowerCase().includes(trimmed);
            })
            .slice(0, 5)
            .forEach((f: any) => {
              const name = f.friend?.name || f.name || 'Friend';
              const email = f.friend?.email || f.email || '';
              items.push({
                id: `frnd-${f.id}`,
                title: name,
                subtitle: email || 'Friend connection',
                category: 'friends',
                icon: <FriendsIcon sx={{ color: '#6366F1' }} />,
                href: `/friends`,
                badge: 'Friend',
              });
            });
        }

        setResults(items);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Filtered by tab
  const filteredResults = results.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'expenses') return item.category === 'expenses';
    if (activeTab === 'groups') return item.category === 'groups';
    if (activeTab === 'friends') return item.category === 'friends';
    if (activeTab === 'actions') return item.category === 'actions' || item.category === 'navigation';
    return true;
  });

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px)',
          },
        },
        paper: {
          className: 'glass-modal glass-specular-top',
          sx: {
            borderRadius: { xs: 3, sm: 4 },
            bgcolor: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(16, 22, 34, 0.90)',
            backdropFilter: 'blur(30px) saturate(190%)',
            border: `1px solid ${isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.14)'}`,
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.55)',
            overflow: 'hidden',
            m: { xs: 1.5, sm: 3 },
            width: { xs: 'calc(100% - 24px)', sm: '100%' },
            maxWidth: { xs: 'calc(100% - 24px)', sm: '600px' },
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Search Header Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: { xs: 1.5, sm: 2.5 },
            py: { xs: 1.25, sm: 1.75 },
            borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
            gap: 1.5,
          }}
        >
          <SearchIcon sx={{ color: isLight ? '#0E6245' : '#10B981', fontSize: { xs: 22, sm: 24 } }} />
          <InputBase
            inputRef={inputRef}
            fullWidth
            placeholder="Search expenses, groups, friends..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 500,
              color: 'text.primary',
            }}
          />
          {loading ? (
            <CircularProgress size={20} sx={{ color: 'primary.main' }} />
          ) : query ? (
            <IconButton size="small" onClick={() => setQuery('')}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          ) : (
            <Chip
              label="ESC"
              size="small"
              onClick={onClose}
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                color: 'text.secondary',
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'}`,
                cursor: 'pointer',
              }}
            />
          )}
        </Box>

        {/* Filter Category Tabs */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: { xs: 1.5, sm: 2.5 },
            py: 1.25,
            bgcolor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
            borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)'}`,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {[
            { id: 'all', label: 'All Results' },
            { id: 'expenses', label: 'Expenses' },
            { id: 'groups', label: 'Groups' },
            { id: 'friends', label: 'Friends' },
            { id: 'actions', label: 'Navigation & Actions' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Chip
                key={tab.id}
                label={tab.label}
                size="small"
                clickable
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedIndex(0);
                }}
                sx={{
                  flexShrink: 0,
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.75rem',
                  bgcolor: active
                    ? isLight
                      ? 'rgba(14, 98, 69, 0.12)'
                      : 'rgba(16, 185, 129, 0.18)'
                    : 'transparent',
                  color: active ? (isLight ? '#0E6245' : '#10B981') : 'text.secondary',
                  border: `1px solid ${
                    active
                      ? isLight
                        ? 'rgba(14, 98, 69, 0.25)'
                        : 'rgba(16, 185, 129, 0.35)'
                      : isLight
                      ? 'rgba(0, 0, 0, 0.06)'
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                }}
              />
            );
          })}
        </Box>

        {/* Search Results List */}
        <List sx={{ maxHeight: 360, overflowY: 'auto', py: 1, px: 1 }}>
          {filteredResults.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
              <SearchIcon sx={{ fontSize: 40, opacity: 0.35, mb: 1 }} />
              <Typography variant="body2" fontWeight={600}>
                No results found for &ldquo;{query}&rdquo;
              </Typography>
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.7 }}>
                Try searching for an expense name, group title, payee, or command
              </Typography>
            </Box>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <ListItemButton
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  selected={isSelected}
                  sx={{
                    borderRadius: 2.5,
                    my: 0.5,
                    px: 1.75,
                    py: 1,
                    transition: 'all 0.12s ease',
                    bgcolor: isSelected
                      ? isLight
                        ? 'rgba(14, 98, 69, 0.08)'
                        : 'rgba(16, 185, 129, 0.12)'
                      : 'transparent',
                    border: `1px solid ${
                      isSelected
                        ? isLight
                          ? 'rgba(14, 98, 69, 0.20)'
                          : 'rgba(16, 185, 129, 0.25)'
                        : 'transparent'
                    }`,
                    '&:hover': {
                      bgcolor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    disableTypography
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                          {item.title}
                        </Typography>
                        {item.amount && (
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ color: isLight ? '#0E6245' : '#10B981', ml: 1 }}
                          >
                            {item.amount}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                        {item.badge && (
                          <Chip
                            label={item.badge}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              bgcolor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                              color: 'text.secondary',
                            }}
                          />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.subtitle}
                        </Typography>
                      </Box>
                    }
                  />
                  {isSelected && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                      <EnterIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    </Box>
                  )}
                </ListItemButton>
              );
            })
          )}
        </List>

        {/* Footer shortcuts hint */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 1.5, sm: 2.5 },
            py: 1.25,
            bgcolor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
            borderTop: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)'}`,
          }}
        >
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              <strong style={{ color: 'inherit' }}>↑↓</strong> to navigate
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              <strong style={{ color: 'inherit' }}>ENTER</strong> to select
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              <strong style={{ color: 'inherit' }}>ESC</strong> to close
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              display: { xs: 'block', sm: 'none' },
              color: 'text.secondary',
              fontSize: '0.72rem',
            }}
          >
            Tap result to open
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isLight ? '#0E6245' : '#10B981',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.04em',
            }}
          >
            Owino Elastic Search
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
