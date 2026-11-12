'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/layout/MarketingLayout';
import {
  HelpOutlined,
  ExpandMore,
  CheckCircle,
  Bolt,
  QrCode,
  Security,
  ArrowForward,
} from '@mui/icons-material';

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

export default function FaqPage() {
  const faqs: FaqItem[] = [
    {
      q: 'Is Owino FairShare really 100% free with no hidden charges?',
      a: 'Yes, completely. All core functionality — creating unlimited groups, adding unlimited expenses with zero daily caps, running greedy debt minimization, generating dynamic UPI QR codes, receipt OCR scanning, and 1-click Splitwise CSV importing — is 100% free with zero advertisements.',
      category: 'Pricing & Limits',
    },
    {
      q: 'How does Greedy Debt Simplification work?',
      a: 'FairShare models all multi-party debts as a Directed Acyclic Graph (DAG). It calculates each participant’s net financial position (Credits - Debits). The algorithm iteratively matches the largest debtor with the largest creditor until all balances reach zero. This slashes the total number of required payments by up to 90% while guaranteeing exact financial conservation.',
      category: 'Algorithm & Math',
    },
    {
      q: 'How does Owino FairShare compare to Splitwise in 2026?',
      a: 'Splitwise now restricts free users to 3 expenses per day, introduces 10-second wait countdowns, shows full-screen ads, and paywalls debt simplification behind Splitwise Pro ($4.99/mo). Owino FairShare provides unlimited daily expenses, instant debt simplification, dynamic UPI QR settlements, zero ads, and zero countdown timers completely free.',
      category: 'Comparison',
    },
    {
      q: 'How do I migrate my existing groups and history from Splitwise?',
      a: 'Simply export your group as a CSV file from Splitwise, open FairShare, and click "Import Splitwise". Our bulk importer processes over 2,200+ historical expenses in seconds, auto-maps members, and preserves your past transaction ledger with zero data loss.',
      category: 'Migration',
    },
    {
      q: 'How do Dynamic UPI 2.0 Settlement QR codes work?',
      a: 'When you are ready to settle a debt with a friend, FairShare automatically generates a standardized Bharat UPI 2.0 QR code embedding the payee’s Virtual Payment Address (VPA) and the exact minimized debt figure. Scanning it with Google Pay, PhonePe, Paytm, or BHIM automatically fills the recipient and amount, preventing human error.',
      category: 'Payments & UPI',
    },
    {
      q: 'Can members edit or delete expenses without others knowing?',
      a: 'No. FairShare includes an accountability audit trail. Whenever any participant edits an amount, changes a category, or deletes an expense, FairShare records the exact field diff (from vs to) and the author’s name in the group activity stream, preventing disputes.',
      category: 'Security & Trust',
    },
    {
      q: 'Is FairShare compliant with privacy laws?',
      a: 'Yes. FairShare is built in compliance with India’s Digital Personal Data Protection (DPDP) Act, 2023 and GDPR standards. All data is encrypted in transit via 256-bit TLS v1.3 and at rest, and we never sell user financial data to third-party ad networks.',
      category: 'Security & Trust',
    },
    {
      q: 'Does FairShare work on mobile devices?',
      a: 'Yes. FairShare is fully responsive and installable as a Progressive Web App (PWA) on iOS and Android. It features touch-friendly 44px+ targets, quick bottom navigation, and full offline caching.',
      category: 'Mobile & Access',
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [filterCat, setFilterCat] = useState<string>('ALL');

  const categories = ['ALL', 'Pricing & Limits', 'Algorithm & Math', 'Comparison', 'Migration', 'Payments & UPI', 'Security & Trust'];

  const filteredFaqs = filterCat === 'ALL' ? faqs : faqs.filter((f) => f.category === filterCat);

  return (
    <MarketingLayout>
      {/* Schema.org FAQPage JSON-LD (Task 7 & 15) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: f.a,
              },
            })),
          }),
        }}
      />

      <div className="space-y-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HelpOutlined sx={{ fontSize: 16 }} />
            <span>Knowledge Base &amp; AEO Answers</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Frequently Asked Questions. <br />
            <span className="text-emerald-400">Everything You Need to Know.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Got questions about debt simplification, UPI payments, Splitwise migration, or security? We have direct answers.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3.5 py-1.5 rounded-full border transition-all ${
                filterCat === cat
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-[#121620] border-emerald-500/40 shadow-xl shadow-emerald-500/5'
                    : 'bg-[#0E121A] border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ExpandMore
                    sx={{
                      fontSize: 22,
                      color: isOpen ? '#10B981' : '#94A3B8',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      shrink: 0,
                    }}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
                    <p>{faq.a}</p>
                    <div className="mt-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-6 sm:p-8 bg-[#121620] border border-slate-800 text-center space-y-3">
          <h3 className="text-lg font-bold text-white">Still have questions?</h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Our engineering and support team is ready to help you migrate your groups or set up custom ledgers.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="mailto:support@fairshare.io"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700"
            >
              Email support@fairshare.io
            </a>
            <Link
              href="/auth/signup"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
