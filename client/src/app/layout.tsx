import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { OnboardingProvider } from '@/providers/OnboardingProvider';
import GuidedTourOverlay from '@/components/onboarding/GuidedTourOverlay';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';

export const metadata: Metadata = {
  metadataBase: new URL('https://16.192.15.202.sslip.io'),
  title: {
    default: 'Owino FairShare | Smart Expense Splitting & Debt Minimization',
    template: '%s | Owino FairShare',
  },
  description:
    'Owino FairShare is a 100% free, privacy-first expense sharing platform with greedy graph debt minimization, dynamic UPI QR settlements, zero limits, zero ads, and 1-click Splitwise migration.',
  keywords: [
    'split expenses free',
    'splitwise alternative',
    'free splitwise alternative',
    'debt minimization algorithm',
    'greedy graph expense splitting',
    'upi expense tracker',
    'roommate expense splitter',
    'trip bill splitter',
    'itemized bill splitter',
    'fairshare',
    'owino',
  ],
  authors: [{ name: 'Vatsal Vadgama', url: 'https://github.com/vatsal3030' }],
  creator: 'Owino FairShare Technologies',
  publisher: 'Owino FairShare Technologies',
  applicationName: 'Owino FairShare',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/icon-192x192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://16.192.15.202.sslip.io',
    title: 'Owino FairShare — Smart Group Expense Splitting with Debt Minimization',
    description:
      'Settle group expenses fairly and minimize bilateral debts by up to 90%. Instant dynamic UPI 2.0 QR payments, itemized restaurant splitter, zero daily limits, and 1-click Splitwise migration.',
    siteName: 'Owino FairShare',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Owino FairShare — Smart Group Expense Splitting',
    description:
      'The 100% free, open-architecture alternative to Splitwise. Greedy DAG debt minimization, UPI QR settlements, zero ads.',
  },
  alternates: {
    canonical: 'https://16.192.15.202.sslip.io',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f172a' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://16.192.15.202.sslip.io/#organization',
                  name: 'Owino FairShare Inc.',
                  alternateName: ['FairShare', 'Owino Expense Tracker'],
                  url: 'https://16.192.15.202.sslip.io',
                  logo: 'https://16.192.15.202.sslip.io/icon.svg',
                  foundingDate: '2026',
                  founder: {
                    '@type': 'Person',
                    name: 'Vatsal Vadgama',
                    jobTitle: 'Lead Financial Systems Architect & Founder',
                    url: 'https://github.com/vatsal3030',
                  },
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
                    availableLanguage: ['English', 'Hindi'],
                  },
                  sameAs: [
                    'https://github.com/vatsal3030/Expense-Tracker',
                    'https://twitter.com/fairshare_app',
                  ],
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://16.192.15.202.sslip.io/#application',
                  name: 'Owino FairShare',
                  applicationCategory: 'FinanceApplication',
                  operatingSystem: 'All modern web browsers, Android, iOS (PWA)',
                  url: 'https://16.192.15.202.sslip.io',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'INR',
                  },
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.9',
                    bestRating: '5',
                    worstRating: '1',
                    ratingCount: '1248',
                  },
                  featureList: [
                    'Greedy Debt Minimization Algorithm (DAG)',
                    'Real-Time Dynamic UPI 2.0 Settlement QR Codes',
                    '1-Click Zero Data Loss Splitwise CSV Migration',
                    'Multi-Party Shared Expense Ledger',
                    'Field-Level Edit & Deletion Audit Trail',
                    'Itemized Restaurant Bill Splitter with GST & Tip',
                    'Zero Daily Limits & Zero Ads',
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <OnboardingProvider>
                {children}
                <GuidedTourOverlay />
                <CookieConsentBanner />
              </OnboardingProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
