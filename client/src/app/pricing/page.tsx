'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/layout/MarketingLayout';
import {
  CheckCircle,
  Close,
  Bolt,
  Shield,
  QrCode,
  Group,
  ReceiptLong,
  CloudSync,
  HelpOutlined,
  ArrowForward,
} from '@mui/icons-material';

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: 'Community Free',
      badge: 'Popular for Friends & Trips',
      price: '₹0',
      period: 'forever free',
      description: 'Everything you need to split expenses, eliminate multi-party debt, and pay with UPI.',
      cta: 'Get Started Free',
      ctaHref: '/auth/signup',
      highlighted: true,
      features: [
        'Unlimited groups & members',
        'Unlimited expense creation (zero daily limits)',
        'Greedy DAG Debt Minimization Algorithm (Included Free)',
        'Real-time Dynamic UPI 2.0 Settlement QR Codes',
        '1-Click Splitwise CSV Importer (2,500+ bills)',
        'Itemized Restaurant Bill Splitter with GST & Tip',
        'Zero advertisements & zero wait countdowns',
        'Mobile PWA & responsive layout',
      ],
      notIncluded: [
        'Automated multi-currency FX arbitrage alerts',
        'Custom corporate ERP CSV integration',
      ],
    },
    {
      name: 'Pro Supporter',
      badge: 'For Global Travelers',
      price: annual ? '₹79' : '₹99',
      period: annual ? '/month (billed ₹948/yr)' : '/month',
      description: 'Support open-source development and unlock advanced multi-currency financial tools.',
      cta: 'Upgrade to Pro',
      ctaHref: '/auth/signup?plan=pro',
      highlighted: false,
      features: [
        'Everything in Community Free',
        'Real-time foreign exchange (FX) rates for 160+ currencies',
        'Export detailed PDF monthly financial statements',
        'Category budget threshold SMS & WhatsApp alerts',
        'Early access to new algorithmic optimization engines',
        'Verified Pro Supporter profile badge',
      ],
      notIncluded: [
        'Custom corporate ERP CSV integration',
      ],
    },
    {
      name: 'Team / Events',
      badge: 'Offsites & Organizations',
      price: annual ? '₹399' : '₹499',
      period: annual ? '/month (billed ₹4,788/yr)' : '/month',
      description: 'Dedicated financial ledger governance for startups, hackathons, and corporate teams.',
      cta: 'Contact Sales',
      ctaHref: '/auth/signup?plan=team',
      highlighted: false,
      features: [
        'Everything in Pro Supporter',
        'Multi-admin governance & approval workflows',
        'Shared organizational audit trails & activity exports',
        'Custom reimbursement export presets (Tally, QuickBooks)',
        'Dedicated 99.9% uptime SLA and 1-on-1 migration assistance',
      ],
      notIncluded: [],
    },
  ];

  return (
    <MarketingLayout>
      {/* Schema.org Price & Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Owino FairShare Expense Splitter',
            description: '100% Free group expense splitting and debt minimization SaaS with dynamic UPI QR settlements.',
            brand: {
              '@type': 'Brand',
              name: 'Owino FairShare',
            },
            offers: [
              {
                '@type': 'Offer',
                name: 'Community Free',
                price: '0',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
              },
              {
                '@type': 'Offer',
                name: 'Pro Supporter',
                price: '99',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
              },
            ],
          }),
        }}
      />

      <div className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Bolt sx={{ fontSize: 14 }} />
            <span>100% Free Core Architecture • Zero Artificial Limits</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Simple, Transparent Pricing. <br className="hidden sm:inline" />
            <span className="text-emerald-400">Zero Paywalls on Fairness.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Splitwise started charging for core debt simplification and capping daily entries.
            Owino FairShare keeps all debt minimization and bill splitting 100% free forever.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 pt-3">
            <span className={`text-xs font-semibold ${!annual ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="w-12 h-6 rounded-full bg-slate-800 border border-slate-700 relative transition-colors p-0.5"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-5 h-5 rounded-full bg-emerald-400 transition-transform ${
                  annual ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${annual ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
              Annual
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between border transition-all duration-300 ${
                p.highlighted
                  ? 'bg-[#121620] border-emerald-500/50 shadow-2xl shadow-emerald-500/10 relative'
                  : 'bg-[#0E121A] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <span className="text-xs font-semibold text-emerald-400">{p.badge}</span>
                  <h3 className="text-2xl font-bold text-white mt-1">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{p.description}</p>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono">{p.price}</span>
                  <span className="text-xs text-slate-400">{p.period}</span>
                </div>

                <Link
                  href={p.ctaHref}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold text-center block transition-all ${
                    p.highlighted
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {p.cta}
                </Link>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Included Features:</p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <CheckCircle sx={{ fontSize: 16, color: '#10B981', shrink: 0, mt: 0.2 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {p.notIncluded.length > 0 && (
                    <ul className="space-y-2 text-xs text-slate-500 pt-2">
                      {p.notIncluded.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 line-through">
                          <Close sx={{ fontSize: 16, color: '#64748B', shrink: 0, mt: 0.2 }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Teaser */}
        <div className="max-w-3xl mx-auto rounded-2xl p-6 sm:p-8 bg-[#121620] border border-slate-800 text-center space-y-3">
          <HelpOutlined sx={{ fontSize: 32, color: '#10B981' }} />
          <h3 className="text-lg font-bold text-white">Have questions about our pricing or migration?</h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Check out our comprehensive FAQ or test the 1-click Splitwise CSV migration tool right now.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/faq" className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700">
              Read FAQs
            </Link>
            <Link href="/compare/splitwise" className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:underline">
              Compare with Splitwise →
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
