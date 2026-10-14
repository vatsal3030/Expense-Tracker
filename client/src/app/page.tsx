'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Users,
  PieChart,
  ShieldCheck,
  Zap,
  TrendingUp,
  Receipt,
  Scale,
  Sparkles,
  Lock,
  QrCode,
  Smartphone,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Shield,
  Coins,
  RefreshCw,
  Share2,
  ArrowRightLeft,
  Gamepad2,
  CreditCard,
  Layers,
  Sparkle,
  Sun,
  Moon,
} from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import QrCodeModal from '@/components/common/QrCodeModal';
import { useThemeMode } from '@/providers/ThemeProvider';

// Cartoon & Gaming Avatar Profiles for Live Interactive Simulation
const SIMULATED_HERO_USERS = [
  {
    id: 'u1',
    name: 'Shadow Ninja',
    tag: '@ninja',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowNinja&backgroundColor=b6e3f4,c0aede,d1d4f9',
    badge: 'Paid Bill',
    upiId: 'shadowninja@okhdfcbank',
  },
  {
    id: 'u2',
    name: 'Pixel Mage',
    tag: '@pixel',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PixelMage&backgroundColor=ffd5dc,ffdfbf',
    badge: 'Member',
    upiId: 'pixelmage@okaxis',
  },
  {
    id: 'u3',
    name: 'Robo Mecha',
    tag: '@mecha',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=RoboMecha&backgroundColor=c0aede,d1d4f9',
    badge: 'Member',
    upiId: 'robomecha@paytm',
  },
  {
    id: 'u4',
    name: 'Astro Pilot',
    tag: '@astro',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AstroPilot&backgroundColor=b6e3f4,ffd5dc',
    badge: 'Member',
    upiId: 'astropilot@ybl',
  },
  {
    id: 'u5',
    name: 'Battle Knight',
    tag: '@knight',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=BattleKnight&backgroundColor=ffdfbf,c0aede',
    badge: 'Member',
    upiId: 'battleknight@okicici',
  },
  {
    id: 'u6',
    name: 'Cyber Fox',
    tag: '@fox',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CyberFox&backgroundColor=d1d4f9,b6e3f4',
    badge: 'Member',
    upiId: 'cyberfox@okhdfcbank',
  },
];

const PRESET_BILLS = [
  { label: 'Dinner & Drinks', amount: 3600, icon: '🍕' },
  { label: 'Weekend Villa Trip', amount: 16800, icon: '🏖️' },
  { label: 'Flat Rent & WiFi', amount: 24000, icon: '🏠' },
  { label: 'Supermarket Groceries', amount: 4800, icon: '🛒' },
];

export default function LandingPage() {
  const { mode, toggleTheme } = useThemeMode();
  const isLight = mode === 'light';

  // --- Live Bill Simulator State ---
  const [billAmount, setBillAmount] = useState<number>(4800);
  const [memberCount, setMemberCount] = useState<number>(4);
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'PERCENTAGE' | 'SHARES' | 'EXACT'>('EQUAL');

  // Custom percentages (default equal for 4 members)
  const [customPercents, setCustomPercents] = useState<number[]>([40, 20, 20, 20, 0, 0]);
  // Custom shares
  const [customShares, setCustomShares] = useState<number[]>([2, 1, 1, 1, 1, 1]);

  // QR Modal Simulation
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    title: string;
    subtitle: string;
    value: string;
    badgeText: string;
  }>({
    open: false,
    title: '',
    subtitle: '',
    value: '',
    badgeText: '',
  });

  // Debt Graph Simplification Visualizer Toggle
  const [simplificationActive, setSimplificationActive] = useState<boolean>(true);

  // QR Ecosystem Tab
  const [qrTab, setQrTab] = useState<'UPI' | 'GROUP' | 'CONNECT'>('UPI');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // --- Dynamic Calculation of Member Shares ---
  const calculatedMembers = useMemo(() => {
    const active = SIMULATED_HERO_USERS.slice(0, memberCount);
    const payer = active[0];

    if (splitMode === 'EQUAL') {
      const baseShare = Math.floor(billAmount / memberCount);
      const remainder = billAmount - baseShare * memberCount;

      return active.map((m, idx) => {
        // Penny balancing: first remainder members pay +1
        const share = baseShare + (idx < remainder ? 1 : 0);
        const isPayer = idx === 0;
        const netOwed = isPayer ? billAmount - share : -share;
        return {
          ...m,
          share,
          netOwed,
          isPayer,
          note: isPayer ? `Paid ₹${billAmount.toLocaleString('en-IN')}` : `Owes ₹${share.toLocaleString('en-IN')}`,
        };
      });
    }

    if (splitMode === 'PERCENTAGE') {
      // Normalize percentages to memberCount
      const relevantPercents = customPercents.slice(0, memberCount);
      const totalPct = relevantPercents.reduce((a, b) => a + b, 0) || 100;

      return active.map((m, idx) => {
        const pct = relevantPercents[idx] || 0;
        const share = Math.round((billAmount * pct) / totalPct);
        const isPayer = idx === 0;
        const netOwed = isPayer ? billAmount - share : -share;
        return {
          ...m,
          share,
          netOwed,
          isPayer,
          note: `${pct}% share (₹${share.toLocaleString('en-IN')})`,
        };
      });
    }

    if (splitMode === 'SHARES') {
      const relevantShares = customShares.slice(0, memberCount);
      const totalShares = relevantShares.reduce((a, b) => a + b, 0) || 1;

      return active.map((m, idx) => {
        const s = relevantShares[idx] || 1;
        const share = Math.round((billAmount * s) / totalShares);
        const isPayer = idx === 0;
        const netOwed = isPayer ? billAmount - share : -share;
        return {
          ...m,
          share,
          netOwed,
          isPayer,
          note: `${s} ${s === 1 ? 'share' : 'shares'} (₹${share.toLocaleString('en-IN')})`,
        };
      });
    }

    // Default Exact
    const equalShare = Math.round(billAmount / memberCount);
    return active.map((m, idx) => ({
      ...m,
      share: equalShare,
      netOwed: idx === 0 ? billAmount - equalShare : -equalShare,
      isPayer: idx === 0,
      note: idx === 0 ? `Paid ₹${billAmount.toLocaleString('en-IN')}` : `Owes ₹${equalShare.toLocaleString('en-IN')}`,
    }));
  }, [billAmount, memberCount, splitMode, customPercents, customShares]);

  const handleOpenSimulatedUpiQr = (user: typeof SIMULATED_HERO_USERS[0], amount: number) => {
    const upiUri = `upi://pay?pa=${encodeURIComponent(user.upiId)}&pn=${encodeURIComponent(
      user.name
    )}&am=${amount}&cu=INR&tn=FairShare%20Bill%20Split`;

    setQrModal({
      open: true,
      title: `Instant UPI Pay: ${user.name}`,
      subtitle: `Scan with Google Pay, PhonePe, Paytm, or any UPI app to settle ₹${amount.toLocaleString('en-IN')} instantly.`,
      value: upiUri,
      badgeText: 'Zero Fee UPI Settlement',
    });
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 relative overflow-x-hidden ${
        isLight
          ? 'bg-[#F6F8F6] text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900'
          : 'bg-[#06080D] text-slate-100 selection:bg-emerald-500/25 selection:text-emerald-300'
      }`}
    >
      {/* Dynamic Ambient Background Glows that shine vividly through liquid glass */}
      <div
        className={`fixed top-[-80px] left-1/4 w-[750px] h-[500px] blur-[130px] pointer-events-none rounded-full transition-all duration-700 ${
          isLight
            ? 'bg-gradient-to-tr from-emerald-400/22 via-teal-300/18 to-transparent opacity-85'
            : 'bg-gradient-to-tr from-emerald-500/20 via-teal-400/14 to-transparent opacity-90'
        }`}
      />
      <div
        className={`fixed top-[150px] right-10 w-[600px] h-[550px] blur-[140px] pointer-events-none rounded-full transition-all duration-700 ${
          isLight
            ? 'bg-gradient-to-bl from-teal-400/18 via-cyan-300/14 to-transparent opacity-85'
            : 'bg-gradient-to-bl from-teal-500/16 via-cyan-500/12 to-transparent opacity-90'
        }`}
      />
      <div
        className={`fixed top-[900px] left-[-80px] w-[650px] h-[650px] blur-[150px] pointer-events-none rounded-full transition-all duration-700 ${
          isLight
            ? 'bg-gradient-to-tr from-emerald-300/16 via-teal-400/14 to-transparent opacity-85'
            : 'bg-gradient-to-tr from-emerald-600/15 via-teal-500/12 to-transparent opacity-90'
        }`}
      />
      <div
        className={`fixed top-[1800px] right-[-100px] w-[700px] h-[700px] blur-[160px] pointer-events-none rounded-full transition-all duration-700 ${
          isLight
            ? 'bg-gradient-to-bl from-cyan-400/16 via-emerald-300/14 to-transparent opacity-85'
            : 'bg-gradient-to-bl from-cyan-500/14 via-emerald-600/12 to-transparent opacity-90'
        }`}
      />
      <div
        className={`fixed bottom-[-100px] left-1/3 w-[800px] h-[600px] blur-[160px] pointer-events-none rounded-full transition-all duration-700 ${
          isLight
            ? 'bg-gradient-to-t from-teal-400/16 via-emerald-300/12 to-transparent opacity-85'
            : 'bg-gradient-to-t from-emerald-500/15 via-teal-600/10 to-transparent opacity-90'
        }`}
      />

      {/* Floating macOS Liquid Glass Header */}
      <div className="sticky top-4 z-50 px-4 max-w-7xl mx-auto">
        <header className="macos-glass rounded-full px-5 py-2.5 flex items-center justify-between shadow-2xl transition-all duration-300">
          <BrandLogo size="md" textColor={isLight ? "text-slate-900" : "text-white"} />

          {/* Nav links */}
          <nav
            className={`hidden lg:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            <a href="#simulator" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Live Simulator
            </a>
            <a href="#debt-minimizer" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Debt Graph
            </a>
            <a href="#qr-ecosystem" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              QR Ecosystem
            </a>
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#comparison" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Vs Splitwise
            </a>
            <a href="#faqs" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action buttons + Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Themed Segmented Switcher for Light & Dark */}
            <div className="macos-liquid-surface flex items-center p-0.5 sm:p-1 rounded-full shadow-inner">
              <button
                onClick={() => {
                  if (mode !== 'light') toggleTheme();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  isLight
                    ? 'bg-white/90 text-emerald-800 shadow-sm border border-white/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Light Theme"
                aria-label="Light Theme"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Light</span>
              </button>
              <button
                onClick={() => {
                  if (mode !== 'dark') toggleTheme();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  !isLight
                    ? 'bg-slate-700/80 text-white shadow-sm border border-white/10'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to Dark Theme"
                aria-label="Dark Theme"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            <Link
              href="/auth/login"
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                isLight
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="text-xs font-bold px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all active:scale-95"
            >
              <span className="hidden sm:inline">Get Started Free</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>
      </div>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* SaaS Trust Pill */}
        <div className="macos-glass-pill inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold mb-6 animate-fade-in shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className={isLight ? 'text-emerald-900 font-bold' : 'text-emerald-300 font-bold'}>
            100% Free • Unlimited Daily Splits • Zero Subscription Paywalls
          </span>
        </div>

        {/* Main Title */}
        <h1
          className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.12] mb-6 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          Split expenses fairly. <br />
          <span
            className={`bg-clip-text text-transparent bg-gradient-to-r ${
              isLight
                ? 'from-emerald-700 via-teal-600 to-emerald-800'
                : 'from-emerald-400 via-teal-300 to-emerald-200'
            }`}
          >
            Settle instantly via UPI.
          </span>
        </h1>

        <p
          className={`max-w-2xl mx-auto text-base sm:text-lg leading-relaxed mb-9 ${
            isLight ? 'text-slate-600' : 'text-slate-300/90'
          }`}
        >
          The modern, privacy-first FinTech expense ledger. Calculate 5 split strategies with penny accuracy, minimize group debts mathematically, and pay direct bank-to-bank via dynamic QR codes.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/30 hover:shadow-emerald-900/50 transition-all active:scale-95"
          >
            Start Splitting for Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#simulator"
            className="macos-glass-card w-full sm:w-auto px-6 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>Try Live Interactive Simulator</span>
          </a>
        </div>

        {/* Live Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-16">
          {[
            { label: 'Platform Fee', val: '₹0 Always' },
            { label: 'Daily Expense Cap', val: 'Unlimited' },
            { label: 'Debt Reductions', val: 'Up to 70%' },
            { label: 'UPI Settlement', val: 'Instant QR' },
          ].map((m, i) => (
            <div
              key={i}
              className="macos-liquid-surface p-3.5 rounded-2xl text-center transition-all hover:scale-[1.02]"
            >
              <span className={`text-[11px] font-medium block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {m.label}
              </span>
              <span
                className={`text-base font-extrabold mt-0.5 block ${
                  isLight ? 'text-emerald-750' : 'text-emerald-400'
                }`}
              >
                {m.val}
              </span>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE BILL SPLIT SIMULATOR (Core Interactive Feature for Visitors) */}
        {/* ========================================================================= */}
        <div id="simulator" className="scroll-mt-28 text-left max-w-5xl mx-auto">
          <div className="macos-glass-card p-6 sm:p-8 relative transition-all shadow-2xl">
            <div
              className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b ${
                isLight ? 'border-slate-300/60' : 'border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    isLight
                      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-800'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg sm:text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Live Interactive Split Simulator
                    </h3>
                    <span className="macos-glass-pill px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      LIVE DEMO
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Adjust bill amount, member count, and split logic to see real-time penny-balanced settlement shares.
                  </p>
                </div>
              </div>

              {/* Split Strategy Pill Switcher */}
              <div className="macos-liquid-surface flex items-center gap-1 p-1 rounded-xl text-xs">
                {(['EQUAL', 'PERCENTAGE', 'SHARES'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSplitMode(mode)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      splitMode === mode
                        ? 'bg-emerald-600 text-white shadow-md'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'EQUAL' ? '= Equal' : mode === 'PERCENTAGE' ? '% Percentage' : '➗ Shares'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Controls Grid */}
            <div className="macos-liquid-surface grid grid-cols-1 md:grid-cols-2 gap-6 my-6 p-4.5 rounded-2xl">
              {/* Left: Amount Input & Presets */}
              <div>
                <label
                  className={`text-xs font-bold uppercase tracking-wider block mb-2 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  Total Bill Amount (₹)
                </label>
                <div className="relative">
                  <span
                    className={`absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-lg ${
                      isLight ? 'text-emerald-750' : 'text-emerald-400'
                    }`}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={(e) => setBillAmount(Math.max(10, Number(e.target.value) || 0))}
                    className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-lg font-bold border transition-colors focus:outline-none focus:border-emerald-500 ${
                      isLight
                        ? 'bg-white/80 border-slate-300/80 text-slate-900 shadow-inner'
                        : 'bg-slate-900/80 border-slate-700 text-white shadow-inner'
                    }`}
                  />
                </div>

                {/* Bill Presets */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {PRESET_BILLS.map((b) => (
                    <button
                      key={b.label}
                      onClick={() => setBillAmount(b.amount)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-all ${
                        billAmount === b.amount
                          ? isLight
                            ? 'border-emerald-600 bg-emerald-500/20 text-emerald-900 font-bold shadow-sm'
                            : 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                          : isLight
                          ? 'border-slate-300/60 bg-white/60 text-slate-700 hover:border-slate-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{b.icon}</span>
                      <span>{b.label}</span>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>
                        ₹{b.amount.toLocaleString('en-IN')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Member Count Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    Number of Friends Splitting
                  </label>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      isLight
                        ? 'bg-emerald-500/20 text-emerald-900 border border-emerald-400/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {memberCount} Friends
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-600 my-3 ${
                    isLight ? 'bg-slate-300/80' : 'bg-slate-800'
                  }`}
                />
                <div className={`flex justify-between text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span>2 Friends</span>
                  <span>4 Roommates</span>
                  <span>6 Travelers</span>
                </div>

                <div className={`mt-3 text-xs flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Gamepad2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interactive avatars feature custom gaming and cartoon characters!</span>
                </div>
              </div>
            </div>

            {/* Simulated Live Member Cards (Gaming/Cartoon Avatars) */}
            <div className="space-y-3">
              <div
                className={`flex items-center justify-between text-xs font-bold uppercase tracking-wider px-2 ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                <span>Participant & Avatar</span>
                <span>Calculated Share</span>
                <span className="text-right">Instant UPI Settlement</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {calculatedMembers.map((m) => (
                  <div
                    key={m.id}
                    className="macos-liquid-surface p-3.5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:scale-[1.008]"
                  >
                    {/* User Profile */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl overflow-hidden border p-0.5 shrink-0 shadow-sm ${
                          isLight
                            ? 'border-emerald-400/40 bg-emerald-50'
                            : 'border-emerald-500/30 bg-slate-800/80'
                        }`}
                      >
                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover rounded-xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {m.name}
                          </span>
                          {m.isPayer && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold border ${
                                isLight
                                  ? 'bg-emerald-500/20 text-emerald-900 border-emerald-400/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              Paid Full
                            </span>
                          )}
                        </div>
                        <span className={`text-xs block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {m.note}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Status */}
                    <div className="text-right">
                      <span className={`text-base font-extrabold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        ₹{m.share.toLocaleString('en-IN')}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          m.isPayer
                            ? isLight
                              ? 'text-emerald-750'
                              : 'text-emerald-400'
                            : isLight
                            ? 'text-amber-700'
                            : 'text-amber-400'
                        }`}
                      >
                        {m.isPayer
                          ? `Gets back ₹${m.netOwed.toLocaleString('en-IN')}`
                          : `Owes ₹${m.share.toLocaleString('en-IN')}`}
                      </span>
                    </div>

                    {/* Action Button: QR Settlement */}
                    <div className="shrink-0">
                      {m.isPayer ? (
                        <span
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 ${
                            isLight
                              ? 'text-emerald-900 bg-emerald-500/15 border-emerald-400/40'
                              : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Received
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenSimulatedUpiQr(m, m.share)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm border ${
                            isLight
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                              : 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/40'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Scan UPI QR
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom summary bar */}
            <div
              className={`mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
                isLight ? 'border-slate-300/60 text-slate-600' : 'border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Penny-Balanced: Total shares sum precisely to{' '}
                  <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                    ₹{billAmount.toLocaleString('en-IN')}
                  </strong>{' '}
                  with zero rounding discrepancies.
                </span>
              </div>
              <Link
                href="/auth/signup"
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
              >
                Split real expenses in your account
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* GREEDY DEBT GRAPH MINIMIZATION SHOWCASE */}
      {/* ========================================================================= */}
      <section
        id="debt-minimizer"
        className={`py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t ${
          isLight ? 'border-slate-300/60' : 'border-slate-800/80'
        }`}
      >
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="macos-glass-pill inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold mb-3">
            <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className={isLight ? 'text-emerald-900' : 'text-emerald-300'}>
              Mathematical Debt Graph Optimization
            </span>
          </div>
          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Cut redundant payments by up to 70%.
          </h2>
          <p className={`mt-4 text-sm sm:text-base ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            In any group trip, circular IOUs create confusion. FairShare runs a greedy minimum-cash-flow graph reduction algorithm so you settle in the fewest possible direct transfers.
          </p>

          {/* Toggle Interactive Controller */}
          <div className="macos-liquid-surface inline-flex p-1 rounded-2xl mt-6 shadow-inner">
            <button
              onClick={() => setSimplificationActive(false)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                !simplificationActive
                  ? isLight
                    ? 'bg-rose-500/20 text-rose-900 border border-rose-400/40 shadow-sm'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unoptimized Debts (5 Transfers)
            </button>
            <button
              onClick={() => setSimplificationActive(true)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                simplificationActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/30'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FairShare Greedy Reduction (2 Transfers)
            </button>
          </div>
        </div>

        {/* Visualizer Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Before Reduction */}
          <div
            className={`macos-glass-card p-6 rounded-3xl relative transition-all ${
              !simplificationActive
                ? 'ring-2 ring-rose-500/40'
                : 'opacity-70'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-4 border-b mb-4 ${
                isLight ? 'border-slate-300/60' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <h4 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Without Simplification
                </h4>
              </div>
              <span className="macos-glass-pill px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                5 Separate Transfers
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { from: 'Shadow Ninja', to: 'Pixel Mage', amt: 600, reason: 'Beach Shack Lunch' },
                { from: 'Pixel Mage', to: 'Robo Mecha', amt: 600, reason: 'Cab Ride' },
                { from: 'Robo Mecha', to: 'Astro Pilot', amt: 400, reason: 'Groceries' },
                { from: 'Astro Pilot', to: 'Shadow Ninja', amt: 200, reason: 'Coffee' },
                { from: 'Pixel Mage', to: 'Astro Pilot', amt: 300, reason: 'Snacks' },
              ].map((t, idx) => (
                <div
                  key={idx}
                  className="macos-liquid-surface p-3 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{t.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{t.to}</span>
                  </div>
                  <span className="font-extrabold text-rose-600 dark:text-rose-300">₹{t.amt}</span>
                </div>
              ))}
            </div>

            <div
              className={`mt-4 pt-3 border-t text-[11px] ${
                isLight ? 'border-slate-300/60 text-slate-600' : 'border-slate-800/80 text-slate-400'
              }`}
            >
              Total Cash Circulated:{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>
                ₹2,100 across 5 banking apps
              </strong>
            </div>
          </div>

          {/* Card 2: After FairShare Greedy Simplification */}
          <div
            className={`macos-glass-card p-6 rounded-3xl relative transition-all ${
              simplificationActive
                ? 'ring-2 ring-emerald-500/40'
                : 'opacity-70'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-4 border-b mb-4 ${
                isLight ? 'border-slate-300/60' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  FairShare Optimized
                </h4>
              </div>
              <span className="macos-glass-pill px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Only 2 Direct Payments (60% Savings)
              </span>
            </div>

            <div className="space-y-3">
              {[
                { from: 'Shadow Ninja', to: 'Robo Mecha', amt: 400, note: 'Direct final settlement' },
                { from: 'Pixel Mage', to: 'Robo Mecha', amt: 500, note: 'Direct final settlement' },
              ].map((t, idx) => (
                <div
                  key={idx}
                  className="macos-liquid-surface p-4 rounded-xl flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.from}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.to}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-extrabold text-base block ${
                        isLight ? 'text-emerald-750' : 'text-emerald-400'
                      }`}
                    >
                      ₹{t.amt}
                    </span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-emerald-300/80'}`}>
                      {t.note}
                    </span>
                  </div>
                </div>
              ))}

              <div className="macos-liquid-surface p-4 rounded-xl text-xs">
                <div
                  className={`flex items-center gap-2 font-bold mb-1 ${
                    isLight ? 'text-emerald-750' : 'text-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mathematically Proven Balanced
                </div>
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  Everyone ends with the exact same net balance (+₹900 received, -₹900 paid), eliminating 3 redundant money transfers and UPI steps entirely.
                </span>
              </div>
            </div>

            <div
              className={`mt-4 pt-3 border-t text-[11px] font-semibold ${
                isLight ? 'border-slate-300/60 text-emerald-800' : 'border-slate-800/80 text-emerald-400'
              }`}
            >
              Included free in all FairShare groups (No premium paywalls).
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* UNIVERSAL QR CODE ECOSYSTEM */}
      {/* ========================================================================= */}
      <section
        id="qr-ecosystem"
        className={`py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t ${
          isLight ? 'border-slate-300/60' : 'border-slate-800/80'
        }`}
      >
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="macos-glass-pill inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold mb-3">
            <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className={isLight ? 'text-emerald-900' : 'text-emerald-300'}>
              Universal QR Code Infrastructure
            </span>
          </div>
          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Point, scan, and settle. Zero typing needed.
          </h2>
          <p className={`mt-4 text-sm sm:text-base ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Every group ledger, user profile, and settlement transaction automatically generates a high-contrast dynamic QR code readable by any smartphone camera or UPI app.
          </p>

          {/* QR Feature Tabs */}
          <div className="macos-liquid-surface inline-flex p-1 rounded-2xl mt-6 shadow-inner">
            {[
              { id: 'UPI', label: '1. Instant UPI QR' },
              { id: 'GROUP', label: '2. Group Join QR' },
              { id: 'CONNECT', label: '3. Personal Connect QR' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setQrTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  qrTab === t.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* QR Showcase Card */}
        <div className="macos-glass-card max-w-4xl mx-auto p-6 sm:p-10 rounded-3xl shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Explanation */}
            <div>
              {qrTab === 'UPI' && (
                <div>
                  <span className="macos-glass-pill px-2.5 py-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    BANK-TO-BANK SETTLEMENT
                  </span>
                  <h3 className={`text-2xl font-bold mt-3 mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Instant UPI Deep-Link QR Codes
                  </h3>
                  <p className={`text-sm leading-relaxed mb-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Eliminate copy-pasting UPI IDs. When settling a shared expense or simplified debt, FairShare encodes the exact rupee amount, payee VPA, and reference note into an interactive QR code.
                  </p>
                  <ul className={`space-y-2 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Compatible with Google Pay, PhonePe, Paytm, and BHIM
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Zero intermediary fees — direct bank transfer
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Two-party verification marks it cleared on both sides
                    </li>
                  </ul>
                </div>
              )}

              {qrTab === 'GROUP' && (
                <div>
                  <span className="macos-glass-pill px-2.5 py-1 text-[10px] font-bold text-teal-800 dark:text-teal-300">
                    FRICTIONLESS ONBOARDING
                  </span>
                  <h3 className={`text-2xl font-bold mt-3 mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Instant Group Join via Camera Scan
                  </h3>
                  <p className={`text-sm leading-relaxed mb-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Sitting together at a restaurant? Open your FairShare group, tap &quot;Group QR&quot;, and have everyone scan the screen with their phone camera. They&apos;re instantly added to the ledger without searching names or sharing invite links.
                  </p>
                  <ul className={`space-y-2 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      No app download required to view shared bills
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Optional passcode protection for private trips
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      One-tap WhatsApp & Telegram sharing options
                    </li>
                  </ul>
                </div>
              )}

              {qrTab === 'CONNECT' && (
                <div>
                  <span className="macos-glass-pill px-2.5 py-1 text-[10px] font-bold text-indigo-800 dark:text-indigo-300">
                    IDENTITY & PEER NETWORKING
                  </span>
                  <h3 className={`text-2xl font-bold mt-3 mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Personal Friend Connect QR Code
                  </h3>
                  <p className={`text-sm leading-relaxed mb-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Connect with friends, roommates, and colleagues in person. Your profile has a unique QR code linked to your account, gaming avatar, and preferred UPI ID.
                  </p>
                  <ul className={`space-y-2 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      1-click friend addition without typing emails
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Shows your equipped cartoon or gaming avatar
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      High resolution PNG & SVG downloadable QR cards
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Right: Live Interactive Rendered QR Card */}
            <div className="macos-liquid-surface flex flex-col items-center justify-center p-6 rounded-2xl">
              <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    qrTab === 'UPI'
                      ? 'upi://pay?pa=fairshare@okhdfcbank&pn=ShadowNinja&am=1200&cu=INR&tn=FairShare%20Dinner'
                      : qrTab === 'GROUP'
                      ? 'https://fairshare.app/groups/join/demo-goa-trip'
                      : 'https://fairshare.app/friends/connect/shadow-ninja'
                  )}&color=0e6245&bgcolor=ffffff&margin=8`}
                  alt="QR Code"
                  className="w-44 h-44 object-contain"
                />
              </div>

              <span className={`text-xs font-bold mt-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {qrTab === 'UPI'
                  ? 'UPI Pay: Shadow Ninja (₹1,200)'
                  : qrTab === 'GROUP'
                  ? 'Join Group: Goa Beach Villa'
                  : 'Connect with: Shadow Ninja'}
              </span>
              <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Scan with your smartphone camera
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURE DEEP-DIVE GRID */}
      {/* ========================================================================= */}
      <section
        id="features"
        className={`py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t ${
          isLight ? 'border-slate-300/60' : 'border-slate-800/80'
        }`}
      >
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="macos-glass-pill text-xs font-bold px-3.5 py-1 text-emerald-800 dark:text-emerald-400">
            ENGINEERED FOR FINTECH EXCELLENCE
          </span>
          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight mt-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Every feature you need. Zero gimmicks.
          </h2>
          <p className={`mt-4 text-base ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Engineered from scratch to replace cluttered, ad-supported apps with high-speed mathematical clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Scale className="w-5 h-5" />,
              title: 'Greedy Graph Simplification',
              desc: 'Solves complex multilateral debts with linear programming reduction so no circular money transfers occur.',
            },
            {
              icon: <PieChart className="w-5 h-5" />,
              title: '5 Precise Splitting Strategies',
              desc: 'Split equally, by exact amount, percentage, weighted shares, or individual adjustment offsets with zero penny loss.',
            },
            {
              icon: <QrCode className="w-5 h-5" />,
              title: 'Universal QR Codes',
              desc: 'Instant QR generation for group invites, UPI settlement payments, and personal friend connections.',
            },
            {
              icon: <Gamepad2 className="w-5 h-5" />,
              title: 'Gaming & Cartoon Avatars',
              desc: 'Choose from 12+ playful avatars (Shadow Ninja, Pixel Mage, Robo Mecha) or upload your own avatar.',
            },
            {
              icon: <TrendingUp className="w-5 h-5" />,
              title: 'Category Budgets & Alerts',
              desc: 'Set monthly budget limits for Food, Travel, and Utilities. Get real-time alerts at 80% and 100% caps.',
            },
            {
              icon: <ShieldCheck className="w-5 h-5" />,
              title: 'Two-Party Verification',
              desc: 'Settlements require mutual confirmation from both the payer and payee to ensure complete accounting trust.',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="macos-glass-card p-6 rounded-3xl transition-all group hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
                  isLight
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-800'
                    : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                }`}
              >
                {f.icon}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{f.title}</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* COMPARISON TABLE: FAIRSHARE VS SPLITWISE */}
      {/* ========================================================================= */}
      <section
        id="comparison"
        className={`py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t ${
          isLight ? 'border-slate-300/60' : 'border-slate-800/80'
        }`}
      >
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="macos-glass-pill text-xs font-bold px-3.5 py-1 text-emerald-800 dark:text-emerald-400">
            TRANSPARENT VALUE
          </span>
          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight mt-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Why people are switching to FairShare.
          </h2>
          <p className={`mt-4 text-sm sm:text-base ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            See how FairShare eliminates artificial limitations imposed by incumbent tools.
          </p>
        </div>

        <div className="macos-glass-card rounded-3xl overflow-hidden shadow-2xl">
          <div
            className={`grid grid-cols-3 p-4 sm:p-5 font-bold text-xs uppercase tracking-wider border-b ${
              isLight
                ? 'bg-white/40 text-slate-800 border-slate-300/60'
                : 'bg-slate-900/60 text-slate-300 border-slate-800'
            }`}
          >
            <div>Feature</div>
            <div className="text-center text-emerald-600 dark:text-emerald-400 font-extrabold">FairShare</div>
            <div className="text-center text-slate-400">Other Split Apps</div>
          </div>

          <div
            className={`divide-y text-xs sm:text-sm ${
              isLight ? 'divide-slate-300/50' : 'divide-slate-800/70'
            }`}
          >
            {[
              { feat: 'Daily Expense Entries', fair: 'Unlimited Always', other: 'Capped at 3/day' },
              { feat: 'Debt Simplification Graph', fair: 'Free & Built-in', other: 'Locked behind Pro tier' },
              { feat: 'Instant UPI Settlement QR', fair: 'Integrated (Zero fees)', other: 'Not available' },
              { feat: 'Ad-Free Clean Experience', fair: '100% Ad-Free', other: 'Intrusive video & banner ads' },
              { feat: 'Penny-Balancing Precision', fair: 'Exact Penny Match', other: 'Rounding discrepancies' },
              { feat: 'Gaming & Cartoon Avatars', fair: 'Included', other: 'Generic initials only' },
              { feat: 'Group Join QR Codes', fair: '1-Second Camera Scan', other: 'Manual email invites' },
              { feat: 'Receipt Attachments', fair: 'Free Storage', other: 'Pro plan only' },
            ].map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 p-4 items-center transition-colors ${
                  isLight ? 'hover:bg-white/40' : 'hover:bg-slate-800/40'
                }`}
              >
                <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{row.feat}</span>
                <span
                  className={`text-center font-bold flex items-center justify-center gap-1.5 ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  {row.fair}
                </span>
                <span className={`text-center ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{row.other}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section
        id="faqs"
        className={`py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t ${
          isLight ? 'border-slate-300/60' : 'border-slate-800/80'
        }`}
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Frequently Asked Questions
          </h2>
          <p className={`mt-3 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Everything you need to know about FairShare, privacy, and settlements.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Is FairShare genuinely 100% free with no hidden charges?',
              a: 'Yes! There are no subscription paywalls, no artificial limits on daily expense logging, and zero platform fees for generating UPI payment QR codes.',
            },
            {
              q: 'How does the greedy debt minimization algorithm work?',
              a: 'Instead of having everyone settle individual IOUs with each other, FairShare calculates each member’s net balance (total paid minus total owed) and matches debtors with creditors to clear all balances in the minimum mathematical number of direct transfers.',
            },
            {
              q: 'Do you charge transaction fees on UPI payments?',
              a: 'No. FairShare generates standardized UPI deep-links and dynamic QR codes that open directly in your banking app (Google Pay, PhonePe, Paytm, BHIM). All funds move bank-to-bank directly with zero deductions.',
            },
            {
              q: 'Can I split bills unequally or by percentage and shares?',
              a: 'Yes. FairShare supports 5 split strategies: Equal, Exact Amounts, Percentages (with 100% validation), Weighted Shares (e.g., 2 shares for couples), and Custom Adjustments.',
            },
            {
              q: 'How do the gaming and cartoon avatars work?',
              a: 'In Account Preferences, you can choose from curated cartoon and gaming characters (Shadow Ninja, Pixel Mage, Robo Mecha, Astro Pilot, and more) or upload your own custom picture.',
            },
          ].map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="macos-glass-card rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className={`w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base transition-colors ${
                    isLight
                      ? 'text-slate-900 hover:text-emerald-700'
                      : 'text-white hover:text-emerald-400'
                  }`}
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div
                    className={`px-5 pb-5 text-xs sm:text-sm leading-relaxed border-t pt-3 ${
                      isLight
                        ? 'border-slate-300/60 text-slate-700'
                        : 'border-slate-800/80 text-slate-300/90'
                    }`}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL HIGH-CONVERTING CTA BANNER */}
      {/* ========================================================================= */}
      <section
        className={`py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t ${
          isLight ? 'border-slate-300/60' : 'border-slate-800/80'
        }`}
      >
        <div className="macos-glass-card p-8 sm:p-14 rounded-3xl relative overflow-hidden shadow-2xl">
          <div
            className={`absolute top-0 right-0 w-64 h-64 blur-[90px] rounded-full pointer-events-none ${
              isLight ? 'bg-emerald-400/25' : 'bg-emerald-500/15'
            }`}
          />

          <BrandLogo size="lg" className="justify-center mb-6" asLink={false} textColor={isLight ? "text-slate-900" : "text-white"} />
          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Start splitting bills stress-free today.
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto mb-8 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Join roommates, travel squads, and couples who keep their expenses clear, transparent, and settled on time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-9 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/30 transition-all active:scale-95"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="macos-liquid-surface w-full sm:w-auto px-7 py-3.5 rounded-2xl font-semibold text-sm transition-all"
            >
              <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>Sign In to Existing Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className={`border-t py-10 px-4 text-xs transition-colors ${
          isLight
            ? 'bg-slate-200/40 border-slate-300/60 text-slate-600'
            : 'bg-[#05070A] border-slate-800/80 text-slate-400'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <BrandLogo size="sm" textColor={isLight ? "text-slate-900" : "text-white"} />
          <p className="text-center sm:text-left">
            © 2026 FairShare. Privacy-first, open architecture expense ledger. Built for modern financial transparency.
          </p>
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/auth/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/signup" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Sign Up
            </Link>
            <a href="#simulator" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Interactive Demo
            </a>
          </div>
        </div>
      </footer>

      {/* Global Interactive QR Modal for Simulation */}
      <QrCodeModal
        open={qrModal.open}
        onClose={() => setQrModal({ ...qrModal, open: false })}
        title={qrModal.title}
        subtitle={qrModal.subtitle}
        value={qrModal.value}
        badgeText={qrModal.badgeText}
        downloadFileName="fairshare-demo-qr"
      />
    </div>
  );
}
