'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@mui/material';
import BrandLogo from '@/components/brand/BrandLogo';
import { useThemeMode } from '@/providers/ThemeProvider';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  CheckCircle,
  Shield,
  Bolt,
  QrCode,
  Calculate,
  AutoGraph,
  MenuBook,
  RateReview,
  HelpOutlined,
  Business,
  ArrowForward,
} from '@mui/icons-material';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();
  const isLight = mode === 'light';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '/features/debt-simplification' },
    { label: 'Split Bill', href: '/expenses/split-bill' },
    { label: 'Vs Splitwise', href: '/compare/splitwise' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'Research', href: '/research' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'FAQ', href: '/faq' },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0A0D14] text-slate-100'}`}>
      {/* Sticky Marketing Header */}
      <div className="sticky top-3 z-50 px-3 sm:px-6 w-full max-w-7xl mx-auto">
        <header
          className={`rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 shadow-xl backdrop-blur-xl border transition-all duration-300 ${
            isLight
              ? 'bg-white/85 border-slate-200/80 shadow-slate-200/50'
              : 'bg-[#121620]/85 border-slate-800/80 shadow-black/40'
          }`}
        >
          {/* Brand Logo */}
          <div className="shrink-0 flex items-center">
            <BrandLogo size="sm" textColor={isLight ? 'text-slate-900' : 'text-white'} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-semibold tracking-wide">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors py-1 ${
                    active
                      ? 'text-emerald-500 font-bold border-b-2 border-emerald-500'
                      : isLight
                      ? 'text-slate-600 hover:text-emerald-600'
                      : 'text-slate-300 hover:text-emerald-400'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className={`hidden sm:inline-block px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              Sign In
            </Link>

            <Link
              href="/auth/signup"
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowForward sx={{ fontSize: 14 }} />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-700/50 text-slate-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden mt-2 p-4 rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121620] border-slate-800 text-slate-100'
            }`}
          >
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold pb-3 border-b border-slate-700/30">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="pt-3 flex items-center justify-between gap-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-xl text-xs font-semibold border border-slate-700/60"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Page Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {children}
      </main>

      {/* Universal Compliance & SEO Footer */}
      <footer
        className={`border-t mt-16 py-12 px-4 sm:px-6 text-xs transition-colors ${
          isLight
            ? 'bg-slate-100 border-slate-200 text-slate-600'
            : 'bg-[#06080D] border-slate-800/80 text-slate-400'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Top Footer Grid: Comprehensive Internal Linking */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {/* Col 1: Brand & Official Business Info (Task 6) */}
            <div className="col-span-2 space-y-3">
              <BrandLogo size="sm" textColor={isLight ? 'text-slate-900' : 'text-white'} />
              <p className="text-xs leading-relaxed max-w-sm">
                Owino (FairShare) is a cloud-native, privacy-first group expense ledger and debt minimization SaaS.
                Built to eliminate multi-party payment chaos with greedy DAG graph algorithms and dynamic UPI 2.0 settlements.
              </p>
              <div className="text-[11px] space-y-1 font-mono text-slate-500">
                <p><strong>Entity:</strong> Owino FairShare Technologies Pvt. Ltd.</p>
                <p><strong>Address:</strong> FinTech Innovation Hub, 4th Block Koramangala, Bengaluru 560034, India</p>
                <p><strong>Contact:</strong> <a href="mailto:support@fairshare.io" className="text-emerald-500 hover:underline">support@fairshare.io</a></p>
              </div>
            </div>

            {/* Col 2: Solutions & Service Pages (Task 13) */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Solutions</h4>
              <ul className="space-y-2">
                <li><Link href="/features/debt-simplification" className="hover:text-emerald-400 transition-colors">Debt Minimization (DAG)</Link></li>
                <li><Link href="/features/upi-settlements" className="hover:text-emerald-400 transition-colors">Dynamic UPI QR Codes</Link></li>
                <li><Link href="/features/splitwise-migration" className="hover:text-emerald-400 transition-colors">1-Click Splitwise Importer</Link></li>
                <li><Link href="/expenses/split-bill" className="hover:text-emerald-400 transition-colors">Itemized Bill Splitter</Link></li>
                <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing &amp; Plans</Link></li>
              </ul>
            </div>

            {/* Col 3: Research, Proofs & AEO (Tasks 10, 15, 17, 20) */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/research" className="hover:text-emerald-400 transition-colors">Algorithmic Paper</Link></li>
                <li><Link href="/case-studies" className="hover:text-emerald-400 transition-colors">Trip &amp; Flatmate Studies</Link></li>
                <li><Link href="/reviews" className="hover:text-emerald-400 transition-colors">Customer Reviews (4.9★)</Link></li>
                <li><Link href="/faq" className="hover:text-emerald-400 transition-colors">Knowledge Base &amp; FAQ</Link></li>
                <li><Link href="/directories" className="hover:text-emerald-400 transition-colors">Verified Directories</Link></li>
                <li><a href="/llms.txt" className="hover:text-emerald-400 transition-colors font-mono text-[11px]">llms.txt (AI Crawlers)</a></li>
              </ul>
            </div>

            {/* Col 4: Comparison & Trust (Tasks 7, 8, 9, 19) */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Compare &amp; Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/compare/splitwise" className="hover:text-emerald-400 transition-colors font-semibold text-emerald-400">FairShare vs Splitwise</Link></li>
                <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy (DPDP)</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy#security" className="hover:text-emerald-400 transition-colors">256-Bit TLS Security</Link></li>
                <li><a href="https://github.com/vatsal3030/Expense-Tracker" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">GitHub Open Source</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Trust & Compliance Bar */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>
              © 2026 Owino FairShare Technologies Pvt. Ltd. All rights reserved. Mathematical invariance conserved.
            </p>
            <div className="flex flex-wrap items-center gap-4 font-mono text-[10px]">
              <span className="flex items-center gap-1"><Shield sx={{ fontSize: 12 }} /> 256-Bit TLS</span>
              <span className="flex items-center gap-1"><Bolt sx={{ fontSize: 12 }} /> Greedy DAG Engine</span>
              <span className="flex items-center gap-1"><QrCode sx={{ fontSize: 12 }} /> Dynamic UPI 2.0</span>
              <span className="flex items-center gap-1"><CheckCircle sx={{ fontSize: 12 }} /> Zero Daily Limits</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
