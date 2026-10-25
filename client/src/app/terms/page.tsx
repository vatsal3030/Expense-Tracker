'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
  Chip,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Gavel,
  Shield,
  ArrowBack,
  Security,
  AccountBalance,
  AssignmentTurnedIn,
  ErrorOutlined,
} from '@mui/icons-material';
import Link from 'next/link';

export default function TermsOfServicePage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        py: { xs: 4, sm: 6 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="md">
        {/* Navigation Bar */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Button
            component={Link}
            href="/dashboard"
            startIcon={<ArrowBack />}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 650,
              fontSize: '0.85rem',
              '&:hover': { color: 'text.primary' },
            }}
          >
            Back to Dashboard
          </Button>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Chip
              label="Legal Agreement"
              size="small"
              sx={{
                bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(52, 211, 153, 0.12)',
                color: isLight ? '#0E6245' : '#34D399',
                border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(52, 211, 153, 0.25)'}`,
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            />
            <Chip
              label="DPDP & IT Act Compliant"
              size="small"
              icon={<Shield sx={{ fontSize: '14px !important', color: 'inherit !important' }} />}
              sx={{
                bgcolor: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(96, 165, 250, 0.12)',
                color: isLight ? '#1D4ED8' : '#93C5FD',
                border: `1px solid ${isLight ? 'rgba(59, 130, 246, 0.2)' : 'rgba(96, 165, 250, 0.25)'}`,
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            />
          </Stack>
        </Box>

        {/* Hero Card */}
        <Card
          className="glass-secondary glass-specular-top"
          sx={{
            mb: 3,
            borderRadius: 3,
            p: { xs: 2.5, sm: 3.5 },
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                bgcolor: alpha('#10B981', 0.15),
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Gavel sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', fontSize: { xs: '1.45rem', sm: '1.85rem' } }}>
                Terms of Service
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                Effective Date: October 25, 2026 · Governing Law: Republic of India
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
            Welcome to FairShare (&ldquo;Owino&rdquo;). By creating an account or accessing our platform, you enter into a legally binding contract under the Indian Contract Act, 1872, the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023. Please review these terms carefully.
          </Typography>
        </Card>

        {/* Content Body */}
        <Stack spacing={2.5}>
          {/* Section 1 */}
          <Card className="glass-secondary" sx={{ borderRadius: 2.5, p: { xs: 2.25, sm: 2.75 }, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={750} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AssignmentTurnedIn sx={{ fontSize: 20, color: '#10B981' }} />
              1. Platform Nature & Peer-to-Peer Ledger
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
              FairShare is a non-banking social ledger tool designed solely for tracking shared expenses, calculating mathematical debt simplifications, and providing UPI deep-link routing.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              FairShare does not hold user deposits, does not act as an escrow agent, does not process UPI funds directly through a proprietary wallet, and is not a financial intermediary under the Reserve Bank of India (RBI) Payment and Settlement Systems Act, 2007. All fiat transfers occur directly peer-to-peer between user accounts via authorized NPCI/UPI handles.
            </Typography>
          </Card>

          {/* Section 2 */}
          <Card className="glass-secondary" sx={{ borderRadius: 2.5, p: { xs: 2.25, sm: 2.75 }, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={750} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Security sx={{ fontSize: 20, color: '#3B82F6' }} />
              2. User Eligibility & Account Security
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
              You must be at least 18 years old to create an account. In accordance with Section 9 of the Digital Personal Data Protection Act, 2023, personal data of individuals under 18 years of age requires verifiable parental or lawful guardian consent.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              You are responsible for maintaining the confidentiality of your session credentials, JWT tokens, and OTP codes. You agree to notify FairShare immediately of any unauthorized access to your account.
            </Typography>
          </Card>

          {/* Section 3 */}
          <Card className="glass-secondary" sx={{ borderRadius: 2.5, p: { xs: 2.25, sm: 2.75 }, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={750} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccountBalance sx={{ fontSize: 20, color: '#F59E0B' }} />
              3. Accuracy of Expense Entries & UPI Payments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
              Users are solely responsible for verifying the accuracy of expense descriptions, split ratios, amounts, and UPI Virtual Payment Addresses (VPAs).
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              FairShare provides debt simplification algorithms (min-cash-flow routing) to reduce bilateral transfers. While our algorithms are mathematically rigorous, FairShare disclaims liability for incorrect split allocations created by group administrators or erroneous UPI transfers initiated to incorrect phone numbers or VPAs.
            </Typography>
          </Card>

          {/* Section 4 */}
          <Card className="glass-secondary" sx={{ borderRadius: 2.5, p: { xs: 2.25, sm: 2.75 }, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={750} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Shield sx={{ fontSize: 20, color: '#8B5CF6' }} />
              4. Digital Personal Data Protection (DPDP Act, 2023)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
              FairShare operates as a Data Fiduciary under the Digital Personal Data Protection Act, 2023. We process your personal data (name, email, UPI VPA, expense shares) solely for lawful, specified purposes with your explicit consent.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              You retain full statutory rights to access your data, request correction of inaccurate records, withdraw consent, request erasure upon settlement of debts, and file grievances with our designated Grievance Officer. For complete details, consult our <Link href="/privacy" style={{ color: '#10B981', fontWeight: 600 }}>Privacy Policy</Link>.
            </Typography>
          </Card>

          {/* Section 5 */}
          <Card className="glass-secondary" sx={{ borderRadius: 2.5, p: { xs: 2.25, sm: 2.75 }, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={750} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ErrorOutlined sx={{ fontSize: 20, color: '#EF4444' }} />
              5. Limitation of Liability & Dispute Resolution
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
              To the maximum extent permitted under applicable Indian laws, FairShare, its developers, and affiliates shall not be liable for any indirect, incidental, or consequential damages resulting from peer-to-peer default between group members, banking gateway downtimes, or telecommunications failures.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              These Terms are governed by the laws of India. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
            </Typography>
          </Card>

          {/* Section 6 */}
          <Card className="glass-secondary" sx={{ borderRadius: 2.5, p: { xs: 2.25, sm: 2.75 }, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={750} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Security sx={{ fontSize: 20, color: '#10B981' }} />
              6. Developer & Contact Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1 }}>
              FairShare is a personal web utility created and maintained by <strong>Vatsal Vadgama</strong> for public utility and social expense management.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              For queries, technical support, or notifications, please contact: <a href="mailto:vatsalvadgama04@gmail.com" style={{ color: '#10B981', fontWeight: 600 }}>vatsalvadgama04@gmail.com</a>.
            </Typography>
          </Card>
        </Stack>

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            FairShare · Owino Smart Expense Splitting · Compliant with DPDP Act 2023 & IT Act 2000 (India)
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Link href="/privacy" style={{ fontSize: '0.8rem', color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>
              Privacy & DPDP Policy
            </Link>
            <span style={{ color: 'gray' }}>·</span>
            <Link href="/dashboard" style={{ fontSize: '0.8rem', color: 'inherit', textDecoration: 'none' }}>
              Dashboard
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
