'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants = {
    default:
      'border-transparent bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
    secondary:
      'border-transparent bg-slate-800 text-slate-300 border border-slate-700',
    success:
      'border-transparent bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning:
      'border-transparent bg-amber-500/15 text-amber-400 border border-amber-500/30',
    destructive:
      'border-transparent bg-red-500/15 text-red-400 border border-red-500/30',
    outline:
      'text-slate-300 border border-slate-700 bg-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
