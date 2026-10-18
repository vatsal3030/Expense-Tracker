'use client';

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ChevronRight,
  Edit,
  Delete,
} from '@mui/icons-material';

export const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: '🍔',
  TRANSPORT: '🚗',
  ENTERTAINMENT: '🎬',
  SHOPPING: '🛍️',
  UTILITIES: '💡',
  RENT: '🏠',
  HEALTH: '💊',
  EDUCATION: '📚',
  TRAVEL: '✈️',
  GROCERIES: '🛒',
  SUBSCRIPTIONS: '📱',
  INSURANCE: '🛡️',
  GIFTS: '🎁',
  GENERAL: '📋',
  OTHER: '📌',
  DONATIONS: '❤️',
  INVESTMENTS: '📈',
  SALARY: '💰',
  FREELANCE: '💻',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  FOOD: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.25)' },
  TRANSPORT: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.25)' },
  ENTERTAINMENT: { bg: 'rgba(236, 72, 153, 0.12)', text: '#EC4899', border: 'rgba(236, 72, 153, 0.25)' },
  SHOPPING: { bg: 'rgba(168, 85, 247, 0.12)', text: '#A855F7', border: 'rgba(168, 85, 247, 0.25)' },
  UTILITIES: { bg: 'rgba(234, 179, 8, 0.12)', text: '#EAB308', border: 'rgba(234, 179, 8, 0.25)' },
  RENT: { bg: 'rgba(14, 165, 233, 0.12)', text: '#0EA5E9', border: 'rgba(14, 165, 233, 0.25)' },
  HEALTH: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.25)' },
  GROCERIES: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22C55E', border: 'rgba(34, 197, 94, 0.25)' },
  TRAVEL: { bg: 'rgba(14, 98, 69, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
};

interface SplitwiseExpenseItemProps {
  expense: any;
  currentUserId?: string;
  currency?: string;
  showGroupTag?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SplitwiseExpenseItem({
  expense,
  currentUserId,
  currency = 'INR',
  showGroupTag = true,
  canEdit = false,
  canDelete = false,
  onClick,
  onEdit,
  onDelete,
}: SplitwiseExpenseItemProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Date parsing
  const dateObj = expense.date ? new Date(expense.date) : new Date();
  const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = dateObj.getDate();

  // Splitwise Stance Calculation
  const totalAmount = Number(expense.amount || 0);
  const isPayer =
    Boolean(currentUserId) &&
    (expense.paidById === currentUserId ||
      expense.paidBy?.id === currentUserId ||
      expense.paidBy?.supabase_id === currentUserId);

  const myShare = expense.shares?.find(
    (s: any) =>
      s.userId === currentUserId ||
      s.user?.id === currentUserId ||
      s.user?.supabase_id === currentUserId
  );
  const myShareAmount = myShare ? Number(myShare.amount || 0) : 0;

  let stance: 'lent' | 'borrowed' | 'paid' | 'not_involved' = 'not_involved';
  let stanceLabel = 'not involved';
  let stanceColor = theme.palette.text.secondary;
  let stanceDisplayAmount = '';

  if (isPayer) {
    const othersOwed = Math.max(0, totalAmount - myShareAmount);
    if (othersOwed > 0.01) {
      stance = 'lent';
      stanceLabel = 'you lent';
      stanceColor = isDark ? '#34D399' : '#059669';
      stanceDisplayAmount = `+${formatAmount(othersOwed)}`;
    } else {
      stance = 'paid';
      stanceLabel = 'you paid';
      stanceColor = isDark ? '#34D399' : '#0E6245';
      stanceDisplayAmount = formatAmount(totalAmount);
    }
  } else if (myShareAmount > 0.01) {
    stance = 'borrowed';
    stanceLabel = 'you borrowed';
    stanceColor = '#EF4444';
    stanceDisplayAmount = `-${formatAmount(myShareAmount)}`;
  } else {
    stance = 'not_involved';
    stanceLabel = 'not involved';
    stanceColor = theme.palette.text.secondary;
    stanceDisplayAmount = '';
  }

  // Payer display string
  const payerName = isPayer
    ? 'You'
    : expense.paidBy?.name || 'Someone';
  const payerSubtitle = `${payerName} paid ${formatAmount(totalAmount)}`;

  const catTheme = CATEGORY_COLORS[expense.category] || {
    bg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    text: theme.palette.text.primary,
    border: theme.palette.divider,
  };

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        gap: { xs: 1.5, sm: 2 },
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s ease-in-out',
        position: 'relative',
        '&:hover': {
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.02)',
          '& .splitwise-actions': {
            opacity: 1,
            pointerEvents: 'auto',
          },
          '& .splitwise-chevron': {
            transform: 'translateX(3px)',
            color: '#10B981',
          },
        },
      }}
    >
      {/* Left Group: Date Block + Category Icon + Title/Subtitle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, minWidth: 0, flex: 1 }}>
        {/* Date Block (Stacked Month + Day, Splitwise style) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 36, sm: 42 },
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: '0.625rem', sm: '0.68rem' },
              fontWeight: 700,
              letterSpacing: '0.04em',
              lineHeight: 1,
              color: 'text.secondary',
              textTransform: 'uppercase',
            }}
          >
            {monthShort}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.05rem', sm: '1.2rem' },
              fontWeight: 800,
              lineHeight: 1.15,
              mt: 0.3,
              color: 'text.primary',
            }}
          >
            {dayNum}
          </Typography>
        </Box>

        {/* Category Icon Container */}
        <Box
          sx={{
            width: { xs: 40, sm: 44 },
            height: { xs: 40, sm: 44 },
            borderRadius: { xs: 2.25, sm: 2.5 },
            bgcolor: catTheme.bg,
            border: `1px solid ${catTheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: { xs: '1.25rem', sm: '1.35rem' },
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {CATEGORY_EMOJI[expense.category] || '📋'}
        </Box>

        {/* Title, Payer & Meta Info */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.925rem', sm: '1rem' },
                color: 'text.primary',
                letterSpacing: '-0.01em',
              }}
            >
              {expense.description}
            </Typography>

            {/* Desktop Tags (Group & Split method) */}
            {showGroupTag && expense.group?.name && (
              <Chip
                label={expense.group.name}
                size="small"
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  height: 20,
                  fontSize: '0.675rem',
                  fontWeight: 600,
                  bgcolor: alpha('#0E6245', 0.1),
                  color: isDark ? '#34D399' : '#0E6245',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3, flexWrap: 'wrap' }}>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                fontWeight: 500,
              }}
            >
              {payerSubtitle}
            </Typography>
            {expense.shares?.length > 1 && (
              <Typography
                variant="caption"
                sx={{
                  display: { xs: 'none', sm: 'inline' },
                  color: 'text.disabled',
                  fontSize: '0.75rem',
                }}
              >
                • {expense.shares.length} shares
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Right Group: Stance Block + Actions + Chevron */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexShrink: 0 }}>
        {/* Desktop Quick Actions (Edit / Delete) */}
        {(canEdit || canDelete) && (
          <Box
            className="splitwise-actions"
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity 0.15s ease',
            }}
          >
            {canEdit && onEdit && (
              <Tooltip title="Edit Expense">
                <IconButton
                  size="small"
                  onClick={onEdit}
                  sx={{
                    color: 'text.secondary',
                    p: 0.75,
                    '&:hover': { color: '#10B981', bgcolor: alpha('#10B981', 0.1) },
                  }}
                >
                  <Edit sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && onDelete && (
              <Tooltip title="Delete Expense">
                <IconButton
                  size="small"
                  onClick={onDelete}
                  sx={{
                    color: 'text.secondary',
                    p: 0.75,
                    '&:hover': { color: '#EF4444', bgcolor: alpha('#EF4444', 0.1) },
                  }}
                >
                  <Delete sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {/* Stance Block (Splitwise style: you lent / you borrowed) */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 85, sm: 100 } }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: stanceColor,
              fontWeight: 700,
              fontSize: { xs: '0.675rem', sm: '0.725rem' },
              lineHeight: 1.1,
              letterSpacing: '0.01em',
              textTransform: 'lowercase',
            }}
          >
            {stanceLabel}
          </Typography>

          {stanceDisplayAmount ? (
            <Typography
              variant="body2"
              sx={{
                color: stanceColor,
                fontWeight: 800,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.25,
                mt: 0.2,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {stanceDisplayAmount}
            </Typography>
          ) : (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
              }}
            >
              —
            </Typography>
          )}
        </Box>

        {/* Right Arrow Chevron (Indicating click/tap opens details) */}
        <ChevronRight
          className="splitwise-chevron"
          sx={{
            fontSize: { xs: 20, sm: 22 },
            color: 'text.disabled',
            transition: 'all 0.18s ease',
            flexShrink: 0,
          }}
        />
      </Box>
    </Box>
  );
}
