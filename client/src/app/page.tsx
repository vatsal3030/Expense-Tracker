'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  Zap,
  Receipt,
  QrCode,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRightLeft,
  Moon,
  Sun,
  LayoutDashboard,
  Coins,
  Lock,
  ExternalLink,
} from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import QrCodeModal from '@/components/common/QrCodeModal';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BalanceChip } from '@/components/ui/balance-chip';
import { Badge } from '@/components/ui/badge';

// Simulation participants for interactive hero demo
const DEMO_FRIENDS = [
  { id: '1', name: 'You (Rahul)', paid: true, share: 1200, balance: 2400 },
  { id: '2', name: 'Priya Sharma', paid: false, share: 1200, balance: -1200 },
  { id: '3', name: 'Amit Verma', paid: false, share: 1200, balance: -1200 },
];

export default function LandingPage() {
  const router = useRouter();
  const { mode, toggleTheme } = useThemeMode();
  const { user } = useAuth();

  // Interactive Live Bill Simulator State
  const [totalBill, setTotalBill] = useState(3600);
  const [memberCount, setMemberCount] = useState(3);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showDemoQr, setShowDemoQr] = useState(false);

  // Compute live split
  const perPersonShare = Math.round(totalBill / memberCount);
  const payerOwed = totalBill - perPersonShare;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E17] text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* =========================================================================
          1. NAVIGATION BAR
      ========================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A0E17]/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-xs transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BrandLogo size="md" />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
                Owino <span className="text-teal-600 dark:text-teal-400 font-medium">FairShare</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                Smart Expense Ledger
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              How It Works
            </a>
            <a href="#comparison" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Splitwise vs Owino
            </a>
            <a href="#faq" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Actions & Theme Switch */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme mode"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
            >
              {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/dashboard')}
                rightIcon={<LayoutDashboard className="w-4 h-4" />}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/login')}
                  className="hidden sm:inline-flex"
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/signup')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION — CLEAN, ACCESSIBLE & HUMAN
      ========================================================================== */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            {/* Trust Pill */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 text-teal-800 dark:text-teal-300 text-xs font-semibold mb-6 shadow-2xs select-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>100% Free · Zero Ads · Zero Daily Expense Limits</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-tight md:leading-tight"
            >
              Split group bills with friends. <br className="hidden sm:block" />
              <span className="text-teal-600 dark:text-teal-400">Settle up instantly with UPI.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto"
            >
              No complicated spreadsheets. No paywalls limiting you to 3 expenses a day.
              Keep track of shared costs, automatically simplify debts, and pay back in seconds.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/signup')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto font-semibold shadow-sm"
              >
                Start Splitting Bills — It's Free
              </Button>
              <a href="#demo" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Try Interactive Demo
                </Button>
              </a>
            </motion.div>

            {/* Trust Checklist */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Works with GPay, PhonePe & Paytm
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 1-Click Splitwise CSV Import
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Private & Encrypted
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. INTERACTIVE LIVE BILL SIMULATOR (TRY IT RIGHT HERE)
      ========================================================================== */}
      <section id="demo" className="py-14 sm:py-20 bg-white dark:bg-[#0E1420] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <Badge variant="brand" className="mb-2">Hands-On Demo</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              See How Effortless Splitting Really Is
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Adjust the bill amount or friends count below to see how Owino calculates splits and generates instant payment QR codes.
            </p>
          </div>

          {/* Interactive Calculator Card */}
          <div className="bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Controls Column */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  1. Choose a Bill Amount
                </label>
                <div className="flex items-center gap-2 mb-4">
                  {[1200, 3600, 6000, 9600].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTotalBill(amt)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        totalBill === amt
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <div className="relative mb-6">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={totalBill}
                    onChange={(e) => setTotalBill(Math.max(1, Number(e.target.value) || 0))}
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#0A0E17] border border-slate-300 dark:border-slate-700 rounded-xl text-lg font-bold font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  2. Number of Friends Splitting
                </label>
                <div className="flex items-center gap-2 mb-6">
                  {[2, 3, 4, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setMemberCount(num)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        memberCount === num
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {num} People
                    </button>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 text-xs text-teal-900 dark:text-teal-200">
                  <span className="font-bold">Rahul paid the whole bill.</span> Owino automatically calculates that each friend owes Rahul <strong>₹{perPersonShare.toLocaleString('en-IN')}</strong>.
                </div>
              </div>

              {/* Live Result Ledger Column */}
              <div className="bg-white dark:bg-[#0A0E17] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Split Calculation</span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Total: ₹{totalBill.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Member Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                        R
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Rahul (You)</div>
                        <div className="text-[11px] text-slate-500">Paid ₹{totalBill} · Share: ₹{perPersonShare}</div>
                      </div>
                    </div>
                    <BalanceChip amount={payerOwed} size="sm" />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                        P
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Priya Sharma</div>
                        <div className="text-[11px] text-slate-500">Share: ₹{perPersonShare}</div>
                      </div>
                    </div>
                    <BalanceChip amount={-perPersonShare} size="sm" />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                        A
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Amit Verma</div>
                        <div className="text-[11px] text-slate-500">Share: ₹{perPersonShare}</div>
                      </div>
                    </div>
                    <BalanceChip amount={-perPersonShare} size="sm" />
                  </div>
                </div>

                {/* Settle Up Action */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Priya wants to pay back now:
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowDemoQr(true)}
                    leftIcon={<QrCode className="w-3.5 h-3.5" />}
                  >
                    Simulate UPI QR
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. WHY OWINO VS SPLITWISE (NO ADS, NO LIMITS)
      ========================================================================== */}
      <section id="comparison" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="neutral" className="mb-2">Honest Comparison</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Why Thousands Are Leaving Splitwise for Owino
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            No 10-second paywall countdowns. No 3-expense daily limits. Built purely for simple expense splitting.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0A0E17] border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-4 px-6">Feature</th>
                  <th className="py-4 px-6 text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20">
                    Owino (FairShare)
                  </th>
                  <th className="py-4 px-6 text-slate-600 dark:text-slate-400">
                    Splitwise (Free Tier)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                    Daily Expense Limit
                  </td>
                  <td className="py-3.5 px-6 text-emerald-600 dark:text-emerald-400 font-bold bg-teal-50/30 dark:bg-teal-950/10">
                    ✓ Unlimited Forever (100% Free)
                  </td>
                  <td className="py-3.5 px-6 text-rose-600 dark:text-rose-400">
                    ✕ Capped at 3 expenses / day
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                    Advertisements
                  </td>
                  <td className="py-3.5 px-6 text-emerald-600 dark:text-emerald-400 font-bold bg-teal-50/30 dark:bg-teal-950/10">
                    ✓ Zero Ads, Zero Banners
                  </td>
                  <td className="py-3.5 px-6 text-rose-600 dark:text-rose-400">
                    ✕ Banner ads & 10s wait paywalls
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                    Instant UPI QR Code Settlements
                  </td>
                  <td className="py-3.5 px-6 text-emerald-600 dark:text-emerald-400 font-bold bg-teal-50/30 dark:bg-teal-950/10">
                    ✓ Dynamic UPI 2.0 QR for Any Bank
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    ✕ Manual recording or US-only
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                    Debt Minimization (Greedy DAG)
                  </td>
                  <td className="py-3.5 px-6 text-emerald-600 dark:text-emerald-400 font-bold bg-teal-50/30 dark:bg-teal-950/10">
                    ✓ Cuts total transactions by up to 70%
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    Limited in free tier
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                    1-Click Historical Migration
                  </td>
                  <td className="py-3.5 px-6 text-emerald-600 dark:text-emerald-400 font-bold bg-teal-50/30 dark:bg-teal-950/10">
                    ✓ Import all groups & expenses from CSV
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    N/A
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                    Designed for All Ages
                  </td>
                  <td className="py-3.5 px-6 text-emerald-600 dark:text-emerald-400 font-bold bg-teal-50/30 dark:bg-teal-950/10">
                    ✓ Crisp, high contrast, clean font
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    Cluttered, dense mobile UI
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. HOW IT WORKS (3 SIMPLE STEPS)
      ========================================================================== */}
      <section className="py-14 bg-white dark:bg-[#0E1420] border-t border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="brand" className="mb-2">Zero Learning Curve</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Split Any Expense in 3 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="lg" className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-extrabold flex items-center justify-center text-base mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Create Group or Add Friend
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Add your roommates, travel buddies, or family in 2 clicks. You can even import entire groups from Splitwise with 1 file upload.
              </p>
            </Card>

            <Card padding="lg" className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-extrabold flex items-center justify-center text-base mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Record Expenses As You Go
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Paid for groceries or hotel? Type the amount. Split it equally, by exact figures, shares, or percentages.
              </p>
            </Card>

            <Card padding="lg" className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-extrabold flex items-center justify-center text-base mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Settle Up with UPI in 5 Seconds
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tap Settle Up. Scan the generated QR code with GPay, PhonePe, or Paytm. Debts are cleared across both accounts in real-time.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FREQUENTLY ASKED QUESTIONS
      ========================================================================== */}
      <section id="faq" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge variant="neutral" className="mb-2">Common Questions</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3.5">
          {[
            {
              q: 'Is Owino really 100% free with no limits?',
              a: 'Yes. Unlike Splitwise, which caps free users to 3 expenses per day and forces a 10-second countdown, Owino has zero daily limits, zero subscription paywalls, and zero ads.',
            },
            {
              q: 'How do UPI settlements work?',
              a: 'When you tap "Settle Up", Owino creates a standard UPI 2.0 dynamic payment QR code with the exact payee VPA and amount. Anyone can scan it using Google Pay, PhonePe, Paytm, BHIM, or any banking app.',
            },
            {
              q: 'Can I bring my past data from Splitwise?',
              a: 'Yes! Export your group or personal CSV file from Splitwise, upload it to Owino via our 1-click migration tool, and all historical balances, members, and transactions are restored in seconds.',
            },
            {
              q: 'Is my data private and secure?',
              a: 'Yes. All data is isolated and protected by strict row-level authorization. We do not sell your data, we do not show advertisements, and we employ HTTPS/TLS 1.3 encryption across all communication.',
            },
            {
              q: 'Can I use Owino on my mobile phone?',
              a: 'Yes, Owino is built mobile-first. It runs smoothly on any smartphone browser and can be installed directly to your home screen as a fast Progressive Web App (PWA).',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#121824] overflow-hidden"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full py-4 px-5 text-left flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span>{item.q}</span>
                {activeFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          7. BOTTOM CTA CARD
      ========================================================================== */}
      <section className="py-12 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-teal-600 dark:bg-teal-700 text-white rounded-2xl p-8 sm:p-12 text-center shadow-md">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to split bills without limits?
          </h2>
          <p className="mt-3 text-teal-100 text-sm sm:text-base max-w-xl mx-auto">
            Join thousands of roommates, friends, and families who split expenses with zero fees and instant UPI settlements.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/signup')}
              rightIcon={<ArrowRight className="w-4 h-4 text-slate-900" />}
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold border-none"
            >
              Get Started for Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/login')}
              className="border-white/40 text-white hover:bg-white/10"
            >
              Sign In to Your Account
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. COMPLETE FOOTER (LEGAL, FEATURES, PRIVACY & TERMS)
      ========================================================================== */}
      <footer className="bg-white dark:bg-[#0A0E17] border-t border-slate-200 dark:border-slate-800 py-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <BrandLogo size="sm" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Owino FairShare</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Smart expense splitting and automated debt minimization. Built for modern financial transparency.
              </p>
            </div>

            {/* Col 2: Product */}
            <div>
              <div className="font-semibold text-slate-900 dark:text-white mb-3">Product</div>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="hover:text-teal-600 transition-colors">Dashboard</Link></li>
                <li><Link href="/expenses" className="hover:text-teal-600 transition-colors">Expenses</Link></li>
                <li><Link href="/groups" className="hover:text-teal-600 transition-colors">Expense Groups</Link></li>
                <li><Link href="/settlements" className="hover:text-teal-600 transition-colors">UPI Settlements</Link></li>
                <li><Link href="/split-bill" className="hover:text-teal-600 transition-colors">Split Bill Page</Link></li>
              </ul>
            </div>

            {/* Col 3: Comparison & Migration */}
            <div>
              <div className="font-semibold text-slate-900 dark:text-white mb-3">Resources</div>
              <ul className="space-y-2">
                <li><Link href="/compare/splitwise" className="hover:text-teal-600 transition-colors">Splitwise Alternative</Link></li>
                <li><Link href="/features/splitwise-migration" className="hover:text-teal-600 transition-colors">1-Click CSV Import</Link></li>
                <li><a href="#demo" className="hover:text-teal-600 transition-colors">Interactive Demo</a></li>
                <li><Link href="/reports" className="hover:text-teal-600 transition-colors">Expense Reports</Link></li>
              </ul>
            </div>

            {/* Col 4: Legal & Privacy */}
            <div>
              <div className="font-semibold text-slate-900 dark:text-white mb-3">Legal & Trust</div>
              <ul className="space-y-2">
                <li><Link href="/legal/terms" className="hover:text-teal-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-teal-600 transition-colors">Privacy Policy</Link></li>
                <li><span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Free Forever</span></li>
                <li><span className="text-slate-500">No Ads · No Tracking</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>© {new Date().getFullYear()} Owino FairShare. All rights reserved.</div>
            <div className="flex items-center gap-4 text-xs">
              <Link href="/legal/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</Link>
              <Link href="/legal/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link>
              <a href="https://github.com/vatsal3030/Expense-Tracker" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1">
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo QR Code Modal */}
      {showDemoQr && (
        <QrCodeModal
          open={showDemoQr}
          onClose={() => setShowDemoQr(false)}
          title={`Scan & Pay ₹${perPersonShare.toLocaleString('en-IN')}`}
          subtitle="Instant settlement to Rahul via any UPI app (GPay, PhonePe, Paytm)"
          value={`upi://pay?pa=rahul@okhdfcbank&pn=Rahul&am=${perPersonShare}&cu=INR&tn=Dinner%20Bill`}
          badgeText="Dynamic UPI 2.0"
          downloadFileName="fairshare-settlement-qr.png"
        />
      )}
    </div>
  );
}
