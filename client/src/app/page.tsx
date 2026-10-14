'use client';

import React from 'react';
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
} from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-emerald-500/25 selection:text-emerald-300">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo size="md" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
              How it Works
            </a>
            <a href="#comparison" className="hover:text-emerald-400 transition-colors">
              FairShare vs Others
            </a>
            <a href="#security" className="hover:text-emerald-400 transition-colors">
              Security
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden bg-grid-pattern">
        {/* Subtle radial emerald vignette (not AI purple!) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-semibold mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Free • No Subscription Paywalls • Open Source
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-100 leading-[1.08] mb-6">
            Split expenses fairly, <br />
            <span className="text-emerald-400">keep friendships intact.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
            The modern, privacy-focused expense ledger. Split shared bills, simplify group debts with mathematical precision, and track category budgets — without ads or premium paywalls.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 shadow-lg shadow-emerald-950/40">
                Start Splitting for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200">
                Live App Preview
              </Button>
            </Link>
          </div>

          {/* FinTech Interactive App Preview Card */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-4 sm:p-6 shadow-2xl text-left max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  🏖️
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm sm:text-base">Goa Weekend Trip</h3>
                  <p className="text-xs text-slate-400">4 Members • Last activity 2 hours ago</p>
                </div>
              </div>
              <Badge variant="success">All Settled</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <span className="text-xs text-slate-400 block font-medium">Total Trip Spend</span>
                <span className="text-xl font-bold text-slate-100 mt-1 block">₹28,299</span>
                <span className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 4 Shared Expenses
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <span className="text-xs text-slate-400 block font-medium">You Are Owed</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">+₹4,200</span>
                <span className="text-[11px] text-slate-400 mt-1 block">From Sam Wilson</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <span className="text-xs text-slate-400 block font-medium">Debt Minimization</span>
                <span className="text-xl font-bold text-slate-100 mt-1 block">2 Transfers</span>
                <span className="text-[11px] text-emerald-400 font-medium mt-1 block">Reduced from 6 transfers</span>
              </div>
            </div>

            {/* Simulated Live Expense Row */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-200">Beach Villa 3 Nights</span>
                <span className="text-slate-400">• Paid by Alex</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-200">₹16,000</span>
                <span className="text-slate-400">₹4,000 / person</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 border-t border-slate-800/80 bg-[#090d16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="default" className="mb-3">
              Core Capabilities
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Built for people who want precision, not paywalls.
            </h2>
            <p className="mt-4 text-slate-400 text-base">
              Everything Splitwise locks behind a monthly subscription fee is completely free and unrestricted in FairShare.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:border-slate-700 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <Scale className="w-5 h-5" />
                </div>
                <CardTitle>Greedy Debt Simplification</CardTitle>
                <CardDescription>
                  Mathematical debt graph optimization that reduces 20 circular IOUs to just 3 clean, direct payments.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:border-slate-700 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <PieChart className="w-5 h-5" />
                </div>
                <CardTitle>Flexible Splitting Modes</CardTitle>
                <CardDescription>
                  Split equally, by exact custom amount, percentage share, or weighted units for complex group scenarios.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:border-slate-700 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <CardTitle>Category Budgets & Alerts</CardTitle>
                <CardDescription>
                  Set spending caps by category (Food, Travel, Utilities) and receive proactive alerts at 80% threshold.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:border-slate-700 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <CardTitle>Unlimited Groups & Friends</CardTitle>
                <CardDescription>
                  Create trips, apartment ledgers, office lunches, and family expenses without artificial limits or friend caps.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:border-slate-700 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <CardTitle>Settlement Audit Trail</CardTitle>
                <CardDescription>
                  Two-party settlement verification ensures transactions are only settled when both the payer and payee confirm.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:border-slate-700 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <Lock className="w-5 h-5" />
                </div>
                <CardTitle>Bank-Grade Security</CardTitle>
                <CardDescription>
                  Row-level security, rate-limiting, encrypted auth sessions, and strict Zod validation protect all transaction data.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-24 border-t border-slate-800/80 bg-[#0f172a]/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              FairShare vs Other Apps
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Why settle for limited free tiers and ad clutter when you can have a pure, high-performance tool?
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/90">
            <div className="grid grid-cols-3 p-4 bg-slate-800/60 font-semibold text-xs uppercase tracking-wider text-slate-300">
              <div>Feature</div>
              <div className="text-center text-emerald-400 font-bold">FairShare</div>
              <div className="text-center text-slate-400">Other Split Apps</div>
            </div>

            <div className="divide-y divide-slate-800/80 text-sm">
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-medium text-slate-200">Daily Expense Limit</span>
                <span className="text-center text-emerald-400 font-semibold">Unlimited</span>
                <span className="text-center text-slate-400">Limited (e.g. 3/day)</span>
              </div>
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-medium text-slate-200">Debt Simplification</span>
                <span className="text-center text-emerald-400 font-semibold">Free & Built-in</span>
                <span className="text-center text-slate-400">Locked behind Pro</span>
              </div>
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-medium text-slate-200">Receipt Attachments</span>
                <span className="text-center text-emerald-400 font-semibold">Free</span>
                <span className="text-center text-slate-400">Paid feature</span>
              </div>
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-medium text-slate-200">Category Budgets</span>
                <span className="text-center text-emerald-400 font-semibold">Included</span>
                <span className="text-center text-slate-400">Not supported</span>
              </div>
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="font-medium text-slate-200">Advertisements</span>
                <span className="text-center text-emerald-400 font-semibold">Zero Ads</span>
                <span className="text-center text-slate-400">Heavy banners</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-slate-800/80 bg-[#090d16] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <BrandLogo size="lg" className="justify-center mb-6" asLink={false} />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight mb-4">
            Start managing shared expenses the right way.
          </h2>
          <p className="text-slate-400 text-base mb-8">
            Join thousands of roommates, travel groups, and couples who keep their expenses clear and stress-free.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 shadow-lg shadow-emerald-950/40">
              Create Your Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-[#090d16] text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="sm" />
          <p>© 2026 FairShare. Built for transparent, stress-free financial sharing.</p>
          <div className="flex gap-4">
            <Link href="/auth/login" className="hover:text-emerald-400 transition-colors">
              Login
            </Link>
            <Link href="/auth/signup" className="hover:text-emerald-400 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
