'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import clsx from 'clsx';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'subtle' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  const baseClasses =
    'rounded-xl border transition-colors bg-white dark:bg-[#121824] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xs';

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  };

  const variantClasses = {
    default: '',
    subtle: 'bg-slate-50 dark:bg-[#0E1420] border-slate-200 dark:border-slate-800/80',
    interactive:
      'hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer hover:shadow-sm',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={clsx(baseClasses, paddingClasses[padding], variantClasses[variant], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
