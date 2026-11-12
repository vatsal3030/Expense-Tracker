'use client';

import React from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/layout/MarketingLayout';
import {
  MenuBook,
  FlightTakeoff,
  HomeWork,
  Groups,
  TrendingDown,
  CheckCircle,
  ArrowForward,
} from '@mui/icons-material';

export default function CaseStudiesPage() {
  const studies = [
    {
      title: '12-Person Goa Vacation: Slashed 132 Debts to 7 Direct Payments',
      category: 'Travel & Trips',
      icon: <FlightTakeoff sx={{ fontSize: 24, color: '#10B981' }} />,
      stat: '94.7%',
      statLabel: 'Transaction Reduction',
      overview:
        'A group of 12 college friends traveled to Goa for a 5-day holiday. Over 45 shared bills (villa stay, seafood dinners, scooter rentals, beach shacks) were incurred by different members in different amounts.',
      challenge:
        'Bilateral pairwise settlement would have required 132 separate bank transfers. Several members had exhausted their daily UPI limits, and two people were owed money by 8 different friends.',
      solution:
        'Using Owino FairShare’s Greedy Directed Acyclic Graph (DAG) debt minimization algorithm, the net balances of all 12 members were resolved in a single iteration down to exactly 7 single payments.',
      results: [
        'Total group spending: ₹84,650 across 45 receipts',
        'Transactions slashed from 132 down to 7',
        'Time to full settlement: 4 minutes via Dynamic UPI QR codes',
        'Zero disputes or awkward balance follow-ups',
      ],
    },
    {
      title: 'Bangalore Flatmates: Zero Friction Rent & Grocery Settlement',
      category: 'Roommates & Coliving',
      icon: <HomeWork sx={{ fontSize: 24, color: '#10B981' }} />,
      stat: '100%',
      statLabel: 'On-Time Monthly Settlement',
      overview:
        'Four software engineers sharing a 4BHK apartment in Koramangala, Bangalore, juggle maid wages, grocery deliveries, high-speed WiFi, electricity bills, and weekend cookouts.',
      challenge:
        'Previously using WhatsApp notes and Splitwise (which capped them at 3 expenses a day on the free tier), roommates were delaying settlements by 2–3 weeks every month due to transaction friction.',
      solution:
        'The flatmates migrated 8 months of Splitwise history to Owino FairShare in 1 click. They now log daily Blinkit and Zepto deliveries without limits and settle up on the 1st of every month via pre-filled UPI QR codes.',
      results: [
        'Average monthly group ledger: ₹62,000 across 65 expenses',
        'Zero daily expense limits experienced',
        'Average settlement time dropped from 14 days to 45 seconds',
        'Accountability audit log eliminates "who changed what" debates',
      ],
    },
    {
      title: 'Hackathon Organizing Team: Managing ₹1,40,000 in Event Expenses',
      category: 'Events & Non-Profits',
      icon: <Groups sx={{ fontSize: 24, color: '#10B981' }} />,
      stat: '0',
      statLabel: 'Reconciliation Discrepancies',
      overview:
        'A team of 6 university students organized a 36-hour national hackathon with 300 participants, purchasing swag, food catering, cloud servers, and participant prizes.',
      challenge:
        'Reimbursement receipts were scattered across Google Drives and personal credit cards. Finance faculty demanded a verified audit trail before releasing college grant funds.',
      solution:
        'The team utilized FairShare’s shared group ledger with field-level audit trails and receipt attachments, exporting an executive PDF statement with full transaction breakdowns.',
      results: [
        'Total hackathon spend of ₹1,42,800 across 94 transactions verified',
        'College finance audit cleared on first submission with zero flags',
        'Multi-admin governance prevented accidental bill deletions',
      ],
    },
  ];

  return (
    <MarketingLayout>
      {/* Schema.org Article JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: studies.map((s, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: s.title,
              description: s.overview,
            })),
          }),
        }}
      />

      <div className="space-y-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MenuBook sx={{ fontSize: 16 }} />
            <span>Proven In The Real World</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Case Studies &amp; Success Stories. <br />
            <span className="text-emerald-400">Real Groups. Real Numbers.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Discover how roommates, travel groups, and event organizers eliminate payment disputes and reduce transactions by up to 94% using Owino FairShare.
          </p>
        </div>

        {/* Case Studies List */}
        <div className="space-y-8">
          {studies.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl p-6 sm:p-8 bg-[#121620] border border-slate-800 space-y-6 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    {s.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">{s.category}</span>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{s.title}</h2>
                  </div>
                </div>
                <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 shrink-0">
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono">{s.stat}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{s.statLabel}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-300">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">The Overview</h4>
                    <p className="text-slate-400">{s.overview}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider mb-1">The Friction</h4>
                    <p className="text-slate-400">{s.challenge}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-1">The FairShare Solution</h4>
                    <p className="text-slate-300">{s.solution}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5">Measurable Impact</h4>
                    <ul className="space-y-1.5 text-slate-300 font-medium">
                      {s.results.map((res) => (
                        <li key={res} className="flex items-center gap-2">
                          <CheckCircle sx={{ fontSize: 14, color: '#10B981', shrink: 0 }} />
                          <span>{res}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
          >
            <span>Start Your Own Group Success Story</span>
            <ArrowForward sx={{ fontSize: 16 }} />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}

