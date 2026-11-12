'use client';

import React from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/layout/MarketingLayout';
import {
  AutoGraph,
  Bolt,
  CheckCircle,
  AccountTree,
  ArrowForward,
  Functions,
  Savings,
} from '@mui/icons-material';

export default function DebtSimplificationFeaturePage() {
  return (
    <MarketingLayout>
      {/* Schema.org TechArticle JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: 'Greedy Directed Acyclic Graph (DAG) Debt Minimization Algorithm',
            description: 'How Owino FairShare mathematically slashes group payment transfers by up to 90% using greedy net balance matching.',
            author: {
              '@type': 'Person',
              name: 'Vatsal Vadgama',
              jobTitle: 'Lead Financial Systems Architect',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Owino FairShare Inc.',
            },
          }),
        }}
      />

      <div className="space-y-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <AccountTree sx={{ fontSize: 16 }} />
            <span>Algorithmic Core Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Greedy Debt Minimization. <br />
            <span className="text-emerald-400">Turn 20 Payments Into Just 3.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            When roommates or travel groups spend together, bilateral debts multiply into a chaotic web.
            Owino FairShare uses greedy graph optimization to reduce transactions by up to 90% while guaranteeing exact zero net balances.
          </p>
        </div>

        {/* Visual Graph Before & After */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6 bg-[#0E121A] border border-rose-500/20 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Without Minimization (Chaos)</span>
            <div className="p-4 rounded-xl bg-black/40 font-mono text-xs space-y-2 text-slate-300">
              <p className="text-rose-400">❌ Alex pays Bob ₹500</p>
              <p className="text-rose-400">❌ Bob pays Charlie ₹500</p>
              <p className="text-rose-400">❌ Charlie pays Dave ₹500</p>
              <p className="text-rose-400">❌ Dave pays Alex ₹200</p>
              <p className="text-slate-500 border-t border-slate-800 pt-2 font-bold">Total: 4 Bilateral Transactions</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Everyone is transferring money to everyone else. Bank apps get flooded, UPI daily limits get exhausted, and mental fatigue spikes.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-[#121620] border border-emerald-500/30 space-y-4 shadow-xl shadow-emerald-500/5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">With FairShare Greedy DAG</span>
            <div className="p-4 rounded-xl bg-black/40 font-mono text-xs space-y-2 text-slate-300">
              <p className="text-emerald-400 font-bold">✓ Alex pays Charlie ₹300</p>
              <p className="text-emerald-400 font-bold">✓ Bob is completely settled (₹0)</p>
              <p className="text-emerald-400 font-bold">✓ Dave is completely settled (₹0)</p>
              <p className="text-emerald-400 font-bold">✓ Net balance mathematically conserved</p>
              <p className="text-emerald-400 border-t border-slate-800 pt-2 font-bold">Total: 1 Direct Payment (75% Reduction!)</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              FairShare computes each member's net stance (Credits - Debits) and pairs the largest debtor with the largest creditor in O(V log V) time.
            </p>
          </div>
        </div>

        {/* How It Works Step-by-Step */}
        <div className="rounded-2xl p-6 sm:p-8 bg-[#121620] border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Functions sx={{ color: '#10B981' }} />
            <span>The Mathematical Invariant</span>
          </h2>
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>
              Across any closed group of $N$ participants, the sum of all net balances must strictly equal zero:
            </p>
            <div className="p-4 rounded-xl bg-black/50 font-mono text-center text-sm text-emerald-400 border border-slate-800">
              ∑ (Paid_i - Share_i) = 0
            </div>
            <p>
              Rather than resolving each bill as an isolated debt edge, FairShare aggregates all debts into a single directed acyclic graph.
              At any point in time, clicking <strong>"Simplify Debts"</strong> condenses the graph into the minimum possible number of transfers.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
          >
            <span>Try Debt Simplification Free</span>
            <ArrowForward sx={{ fontSize: 16 }} />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}

