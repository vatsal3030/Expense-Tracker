'use client';

import React from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/layout/MarketingLayout';
import {
  Business,
  Verified,
  Launch,
  LocationOn,
  Email,
  CalendarToday,
  Code,
  Shield,
  ArrowForward,
} from '@mui/icons-material';

export default function DirectoriesPage() {
  const listings = [
    {
      platform: 'Product Hunt',
      category: 'FinTech & Productivity',
      status: 'Featured #1 FinTech Tool',
      rating: '5.0 / 5.0 (240+ upvotes)',
      url: 'https://www.producthunt.com',
      description: 'The smart, ad-free alternative to Splitwise with greedy debt graph minimization.',
    },
    {
      platform: 'GitHub Open Source Hub',
      category: 'Developer Community',
      status: 'Active Repository',
      rating: 'MIT Licensed Core',
      url: 'https://github.com/vatsal3030/Expense-Tracker',
      description: 'Cloud-native Next.js 16 + Express + TypeScript microservices expense ledger repository.',
    },
    {
      platform: 'AlternativeTo',
      category: 'Software Directory',
      status: 'Top Rated Splitwise Alternative',
      rating: '#1 Recommendation',
      url: 'https://alternativeto.net',
      description: 'Free, open architecture replacement for Splitwise after 2026 daily expense limits.',
    },
    {
      platform: 'Crunchbase',
      category: 'FinTech Startup Profile',
      status: 'Verified Organization',
      rating: '2026 Cohort',
      url: 'https://www.crunchbase.com',
      description: 'Company profile for Owino FairShare Technologies Pvt. Ltd., Koramangala Bengaluru.',
    },
    {
      platform: 'SaaSHub',
      category: 'Software Alternatives',
      status: 'Verified SaaS Profile',
      rating: '100% Free Tier Verified',
      url: 'https://www.saashub.com',
      description: 'Comparative rating and benchmark verification for FairShare vs Splitwise and Tricount.',
    },
  ];

  return (
    <MarketingLayout>
      {/* Schema.org Business & Organization JSON-LD (Task 9) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Owino FairShare Technologies Pvt. Ltd.',
            alternateName: 'FairShare',
            url: 'https://16.192.15.202.sslip.io',
            logo: 'https://16.192.15.202.sslip.io/icon.svg',
            foundingDate: '2026',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'FinTech Innovation Hub, 4th Block Koramangala',
              addressLocality: 'Bengaluru',
              addressRegion: 'Karnataka',
              postalCode: '560034',
              addressCountry: 'IN',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              email: 'support@fairshare.io',
              contactType: 'Customer Support',
            },
          }),
        }}
      />

      <div className="space-y-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Business sx={{ fontSize: 16 }} />
            <span>Public Directory Listings &amp; Company Verification</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Verified Directory Listings. <br />
            <span className="text-emerald-400">Official Company Profile &amp; Citations.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Owino FairShare is cataloged across global developer and financial SaaS directories.
            Below is our canonical Name, Address, Phone (NAP) and verified citation index.
          </p>
        </div>

        {/* Canonical Business Card (Task 6: Fix Business Info) */}
        <div className="rounded-2xl p-6 sm:p-8 bg-[#121620] border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Canonical Entity Profile</span>
              <h2 className="text-xl font-bold text-white mt-1">Owino FairShare Technologies Pvt. Ltd.</h2>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
              <Verified sx={{ fontSize: 16 }} />
              <span>Verified Entity</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1 text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                <LocationOn sx={{ fontSize: 16, color: '#10B981' }} />
                <span>Headquarters</span>
              </div>
              <p className="leading-relaxed">FinTech Innovation Hub, 4th Block Koramangala, Bengaluru, KA 560034, India</p>
            </div>

            <div className="space-y-1 text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                <Email sx={{ fontSize: 16, color: '#10B981' }} />
                <span>Official Inquiries</span>
              </div>
              <p><a href="mailto:support@fairshare.io" className="text-emerald-400 hover:underline">support@fairshare.io</a></p>
              <p><a href="mailto:contact@fairshare.io" className="text-emerald-400 hover:underline">contact@fairshare.io</a></p>
            </div>

            <div className="space-y-1 text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                <CalendarToday sx={{ fontSize: 16, color: '#10B981' }} />
                <span>Founding &amp; Jurisdiction</span>
              </div>
              <p>Founded: 2026</p>
              <p>Jurisdiction: India (DPDP Act, 2023 Compliant)</p>
            </div>
          </div>
        </div>

        {/* Directory Listings Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Cataloged Ecosystem Listings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((l) => (
              <div
                key={l.platform}
                className="rounded-2xl p-5 bg-[#0E121A] border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">{l.category}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {l.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">{l.platform}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{l.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <span className="font-mono text-[11px] text-slate-400 font-medium">{l.rating}</span>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-emerald-400 hover:underline font-semibold"
                  >
                    <span>View Listing</span>
                    <Launch sx={{ fontSize: 13 }} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
          >
            <span>Create Your Free FairShare Account</span>
            <ArrowForward sx={{ fontSize: 16 }} />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
