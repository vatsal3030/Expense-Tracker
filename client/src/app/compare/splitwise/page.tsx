'use client';

import React from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/layout/MarketingLayout';
import {
  CheckCircle,
  Close,
  CompareArrows,
  Bolt,
  QrCode,
  Security,
  CloudUpload,
  ArrowForward,
} from '@mui/icons-material';

export default function CompareSplitwisePage() {
  const comparisonItems = [
    {
      feature: 'Price & Subscription',
      fairshare: '100% Free Core ($0)',
      splitwise: '$4.99/mo (Splitwise Pro)',
      tricount: 'Free with In-App Ads',
      settleup: '$2.99/mo Premium',
      winner: 'fairshare',
    },
    {
      feature: 'Daily Expense Limits',
      fairshare: 'Unlimited (Zero Limits)',
      splitwise: 'Capped at 3 expenses/day',
      tricount: 'Unlimited',
      settleup: 'Unlimited',
      winner: 'fairshare',
    },
    {
      feature: 'Greedy Debt Simplification (DAG)',
      fairshare: 'Included Free (Up to 90% fewer transfers)',
      splitwise: 'Requires Paid Pro Subscription',
      tricount: 'Basic (Pairwise only)',
      settleup: 'Paid Feature Only',
      winner: 'fairshare',
    },
    {
      feature: 'Dynamic UPI 2.0 QR Code Payments',
      fairshare: 'Yes (Instant Google Pay, PhonePe, Paytm)',
      splitwise: 'No (Venmo / PayPal US only)',
      tricount: 'No UPI Support',
      settleup: 'No Direct UPI QR',
      winner: 'fairshare',
    },
    {
      feature: 'Ad-Free Clean Interface',
      fairshare: '100% Ad-Free Dark & Light UI',
      splitwise: 'Heavy full-screen ads on free tier',
      tricount: 'Banner and popup ads',
      settleup: 'Ads on free tier',
      winner: 'fairshare',
    },
    {
      feature: '1-Click Splitwise History Migration',
      fairshare: 'Yes (Instant CSV Importer for 2,500+ bills)',
      splitwise: 'N/A (Lock-in)',
      tricount: 'No CSV Import',
      settleup: 'No Direct Splitwise Import',
      winner: 'fairshare',
    },
    {
      feature: 'Itemized Restaurant Bill Splitter (GST & Tip)',
      fairshare: 'Included (Compact multi-person selector)',
      splitwise: 'Basic Split Only',
      tricount: 'Separate App Required',
      settleup: 'Basic Equal Split',
      winner: 'fairshare',
    },
    {
      feature: 'Field-Level Accountability Audit Trail',
      fairshare: 'Yes (Diff tracking of who edited what)',
      splitwise: 'Basic text log without diffs',
      tricount: 'None',
      settleup: 'Basic activity feed',
      winner: 'fairshare',
    },
  ];

  return (
    <MarketingLayout>
      {/* Schema.org FAQ & Comparison JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Is Owino FairShare really a free alternative to Splitwise?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Owino FairShare provides unlimited groups, unlimited expenses, greedy debt simplification, receipt scanning, and dynamic UPI QR settlements completely free with zero ads and zero wait timers.',
                },
              },
              {
                '@type': 'Question',
                name: 'How do I migrate my existing groups and expenses from Splitwise?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Export your group or account history from Splitwise as a CSV file, then open FairShare and upload the CSV. FairShare automatically maps members, imports historical balances, and deduplicates records in seconds.',
                },
              },
            ],
          }),
        }}
      />

      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CompareArrows sx={{ fontSize: 16 }} />
            <span>Honest 2026 Feature &amp; Pricing Breakdown</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Owino FairShare vs. Splitwise. <br />
            <span className="text-emerald-400">Why Modern Groups Are Switching.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Splitwise made debt simplification a paid feature and introduced a 3-expense daily limit with full-page ads.
            Here is how Owino FairShare compares across every metric.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/signup"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>Switch to FairShare Free</span>
              <ArrowForward sx={{ fontSize: 14 }} />
            </Link>
            <Link
              href="/features/splitwise-migration"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-2 border border-slate-700"
            >
              <CloudUpload sx={{ fontSize: 16 }} />
              <span>1-Click CSV Importer</span>
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#121620] shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0E121A] text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4 sm:p-5 w-1/3">Feature</th>
                <th className="p-4 sm:p-5 text-emerald-400 font-extrabold bg-emerald-500/5 border-x border-emerald-500/20 w-1/4">
                  Owino FairShare
                </th>
                <th className="p-4 sm:p-5 w-1/5">Splitwise</th>
                <th className="p-4 sm:p-5 w-1/6 hidden md:table-cell">Tricount</th>
                <th className="p-4 sm:p-5 w-1/6 hidden lg:table-cell">Settle Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {comparisonItems.map((item, idx) => (
                <tr key={item.feature} className={idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/30'}>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {item.feature}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-300 bg-emerald-500/5 border-x border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle sx={{ fontSize: 16, color: '#10B981', shrink: 0 }} />
                    <span>{item.fairshare}</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">
                    {item.splitwise.includes('Requires') || item.splitwise.includes('Capped') ? (
                      <span className="text-rose-400 font-medium flex items-center gap-1">
                        <Close sx={{ fontSize: 14 }} /> {item.splitwise}
                      </span>
                    ) : (
                      item.splitwise
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400 hidden md:table-cell">
                    {item.tricount}
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400 hidden lg:table-cell">
                    {item.settleup}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detailed Narrative Section for SEO & AEO (Tasks 1, 14, 20) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="rounded-2xl p-6 bg-[#0E121A] border border-slate-800 space-y-2.5">
            <Bolt sx={{ fontSize: 28, color: '#10B981' }} />
            <h3 className="text-base font-bold text-white">Zero Daily Expense Caps</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When traveling or dining with roommates, having to wait 24 hours to add a fourth receipt ruins group coordination. FairShare never limits how many expenses you can add in a single day.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-[#0E121A] border border-slate-800 space-y-2.5">
            <QrCode sx={{ fontSize: 28, color: '#10B981' }} />
            <h3 className="text-base font-bold text-white">Instant UPI 2.0 Settlement</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No need to switch between banking apps or copy paste phone numbers. FairShare generates real-time UPI QR codes with exact minimized amounts pre-calculated for Google Pay, PhonePe, and Paytm.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-[#0E121A] border border-slate-800 space-y-2.5">
            <Security sx={{ fontSize: 28, color: '#10B981' }} />
            <h3 className="text-base font-bold text-white">Field-Level Audit Trail</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparency prevents friendship disputes. If someone edits an expense amount from ₹500 to ₹700, FairShare logs the exact diff and author in an immutable group activity ledger.
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

