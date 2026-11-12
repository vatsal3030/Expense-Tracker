'use client';

import React from 'react';
import clsx from 'clsx';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';

export interface BalanceChipProps {
  amount: number;
  currency?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BalanceChip({
  amount,
  currency = '₹',
  showLabel = true,
  size = 'md',
  className,
}: BalanceChipProps) {
  const isPositive = amount > 0.01;
  const isNegative = amount < -0.01;
  const isSettled = !isPositive && !isNegative;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2',
  };

  const statusClasses = isPositive
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
    : isNegative
    ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60'
    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  const label = isPositive ? 'you are owed' : isNegative ? 'you owe' : 'settled';

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md border font-medium select-none',
        sizeClasses[size],
        statusClasses,
        className
      )}
    >
      {isPositive && <ArrowDownLeft className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
      {isNegative && <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />}
      {isSettled && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />}

      {showLabel && <span className="opacity-80 text-[11px] uppercase tracking-wider font-semibold">{label}</span>}

      <span className="font-mono font-bold tracking-tight">
        {currency}
        {Math.abs(amount).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </span>
  );
}
