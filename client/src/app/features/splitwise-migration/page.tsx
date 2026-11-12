'use client';

import React from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/layout/MarketingLayout';
import {
  CloudUpload,
  CheckCircle,
  Bolt,
  Security,
  History,
  ArrowForward,
} from '@mui/icons-material';

export default function SplitwiseMigrationFeaturePage() {
  return (
    <MarketingLayout>
      <div className="space-y-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CloudUpload sx={{ fontSize: 16 }} />
            <span>1-Click Zero Data Loss Migration</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Migrate from Splitwise in 10 Seconds. <br />
            <span className="text-emerald-400">Bring All Your Bills &amp; Balances.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Tired of Splitwise's 3-expense daily cap, ads, and forced paid plans?
            Export your group CSV from Splitwise, upload it to Owino FairShare, and your entire multi-year history is migrated instantly.
          </p>
        </div>

        {/* 3 Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl p-6 bg-[#0E121A] border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-sm">1</div>
            <h3 className="text-base font-bold text-white">Export from Splitwise</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open your Splitwise group settings and click &quot;Export as CSV&quot;. It downloads a complete spreadsheet of all expenses.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-[#0E121A] border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-sm">2</div>
            <h3 className="text-base font-bold text-white">Upload to FairShare</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In FairShare, click &quot;Import Splitwise&quot;. Drop the CSV file. Our high-performance parser reads 2,500+ rows in milliseconds.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-[#0E121A] border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-sm">3</div>
            <h3 className="text-base font-bold text-white">Match &amp; Done</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select which member is you. FairShare auto-creates guest profiles for everyone else and links all debt simplification flows.
            </p>
          </div>
        </div>

        {/* Technical Capabilities */}
        <div className="rounded-2xl p-6 sm:p-8 bg-[#121620] border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white">Enterprise-Grade Import Reliability</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
              <span>Tested with 2,229+ transaction datasets</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
              <span>Chunked batch inserts prevent timeouts</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
              <span>Idempotent deduplication prevents duplicates</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
              <span>Multi-year dates (2024–2026) conserved</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
          >
            <span>Start Free Import Now</span>
            <ArrowForward sx={{ fontSize: 16 }} />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}

