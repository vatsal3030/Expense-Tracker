'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  asLink?: boolean;
  textColor?: string;
}

export default function BrandLogo({
  size = 'md',
  showText = true,
  className,
  asLink = true,
  textColor,
}: BrandLogoProps) {
  const iconDimensions = {
    sm: { width: 28, height: 28, stroke: 2.2 },
    md: { width: 36, height: 36, stroke: 2.5 },
    lg: { width: 44, height: 44, stroke: 2.8 },
    xl: { width: 56, height: 56, stroke: 3 },
  }[size];

  const textStyles = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  const logoMark = (
    <div className="relative flex items-center justify-center shrink-0">
      <svg
        width={iconDimensions.width}
        height={iconDimensions.height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="emeraldArc" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="slateArc" x1="44" y1="4" x2="4" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#94a3b8" />
            <stop offset="1" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="coinFill" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#16181D" />
            <stop offset="1" stopColor="#0B0C0E" />
          </linearGradient>
        </defs>

        {/* Outer Hex/Coin Soft Frame */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          fill="url(#coinFill)"
          stroke="#1D1F24"
          strokeWidth="1.5"
        />

        {/* Intersecting Arc 1: Primary Emerald Division */}
        <path
          d="M14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24"
          stroke="url(#emeraldArc)"
          strokeWidth={iconDimensions.stroke}
          strokeLinecap="round"
        />

        {/* Intersecting Arc 2: Secondary Slate Balance */}
        <path
          d="M34 24C34 29.5228 29.5228 34 24 34C18.4772 34 14 29.5228 14 24"
          stroke="url(#slateArc)"
          strokeWidth={iconDimensions.stroke}
          strokeLinecap="round"
        />

        {/* Center Precision Split Notches (Equal Sharing Division) */}
        <line
          x1="18"
          y1="24"
          x2="30"
          y2="24"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="20" cy="19" r="2" fill="#34d399" />
        <circle cx="28" cy="29" r="2" fill="#94a3b8" />
      </svg>
    </div>
  );

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      {logoMark}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className={cn("font-heading font-extrabold tracking-tight flex items-center gap-1.5", textStyles, textColor || "text-slate-900 dark:text-slate-100")}>
            <span>Owino</span>
            <span className="text-emerald-500 font-semibold text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
              FairShare
            </span>
          </div>
          <span className="hidden sm:block font-heading text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">
            Smart Expense Splitting
          </span>
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link href="/" className="inline-flex items-center no-underline outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
