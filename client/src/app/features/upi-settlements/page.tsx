'use client';

import React from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/layout/MarketingLayout';
import {
  QrCode,
  Smartphone,
  CheckCircle,
  Bolt,
  Shield,
  ArrowForward,
} from '@mui/icons-material';

export default function UpiSettlementsFeaturePage() {
  return (
    <MarketingLayout>
      <div className="space-y-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <QrCode sx={{ fontSize: 16 }} />
            <span>Instant Mobile Payments</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Dynamic UPI 2.0 Settlement. <br />
            <span className="text-emerald-400">Scan. Tap. Debt Settled.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Say goodbye to copy-pasting phone numbers, asking for UPI IDs, or typing wrong amounts.
            Owino FairShare generates real-time dynamic UPI payment QR codes with exact minimized figures.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl p-6 bg-[#0E121A] border border-slate-800 space-y-3">
            <Smartphone sx={{ fontSize: 32, color: '#10B981' }} />
            <h3 className="text-base font-bold text-white">All Indian UPI Apps</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Works natively with Google Pay (GPay), PhonePe, Paytm, BHIM, CRED, Amazon Pay, and all Indian banking UPI applications.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-[#0E121A] border border-slate-800 space-y-3">
            <Bolt sx={{ fontSize: 32, color: '#10B981' }} />
            <h3 className="text-base font-bold text-white">Exact Amount Pre-Filled</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The QR code embeds the payee's VPA, transaction reference, and the exact minimized debt amount to the last rupee.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-[#0E121A] border border-slate-800 space-y-3">
            <Shield sx={{ fontSize: 32, color: '#10B981' }} />
            <h3 className="text-base font-bold text-white">Instant Confirmation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Once paid, one click notifies the creditor and marks the settlement as confirmed, updating group balances in real-time.
            </p>
          </div>
        </div>

        {/* Interactive Demo Callout */}
        <div className="rounded-2xl p-6 sm:p-8 bg-[#121620] border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white">Experience Dynamic UPI QR Settlements</h3>
            <p className="text-xs text-slate-400">
              Create a free group or try the simulator on the homepage to see the dynamic QR modal in action.
            </p>
          </div>
          <Link
            href="/auth/signup"
            className="px-6 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shrink-0"
          >
            Start Splitting with UPI
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
