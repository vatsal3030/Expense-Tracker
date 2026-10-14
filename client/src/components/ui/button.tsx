'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      default:
        'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-950/50 active:scale-[0.98]',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98]',
      outline:
        'border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white',
      secondary:
        'bg-slate-800 text-slate-100 hover:bg-slate-700 active:scale-[0.98]',
      ghost:
        'hover:bg-slate-800/70 text-slate-300 hover:text-white',
      link:
        'text-emerald-400 underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-11 rounded-lg px-6 text-base font-semibold',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
