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
  Alert,
} from '@mui/material';
import {
  Shield,
  ArrowBack,
  Lock,
  ContactMail,
  Storage,
  PersonSearch,
  DeleteForever,
  VerifiedUser,
  Gavel,
} from '@mui/icons-material';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
              label="DPDP Act, 2023 Compliant"
              size="small"
              icon={<Shield sx={{ fontSize: '14px !important', color: 'inherit !important' }} />}
              sx={{
                bgcolor: isLight ? 'rgba(5, 150, 105, 0.08)' : 'rgba(52, 211, 153, 0.12)',
                color: isLight ? '#059669' : '#34D399',
                border: `1px solid ${isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(52, 211, 153, 0.25)'}`,
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            />
            <Chip
              label="Govt. of India Gazette"
              size="small"
              sx={{
                bgcolor: isLight ? 'rgba(245, 158, 11, 0.08)' : 'rgba(251, 191, 36, 0.12)',
                color: isLight ? '#B45309' : '#FBBF24',
                border: `1px solid ${isLight ? 'rgba(245, 158, 11, 0.2)' : 'rgba(251, 191, 36, 0.25)'}`,
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
              <Shield sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', fontSize: { xs: '1.45rem', sm: '1.85rem' } }}>
                Privacy & Data Protection Policy
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                Statutory Notice Under Section 5 of the Digital Personal Data Protection Act, 2023 (DPDP Act, India)
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
            FairShare (&ldquo;Owino&rdquo;) is committed to the protection of your digital personal data. This Privacy Policy details our practices as a <strong>Data Fiduciary</strong> in processing personal data of users in India, your statutory rights as a <strong>Data Principal</strong>, and the grievance redressal mechanisms available to you.
          </Typography>
        </Card>

        {/* Indian DPDP Act Highlights Alert */}
        <Alert
          severity="info"
          icon={<VerifiedUser sx={{ color: '#10B981' }} />}
          sx={{
            mb: 3,
            borderRadius: 2.5,
            bgcolor: isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: 'text.primary',
            '& .MuiAlert-message': { fontSize: '0.85rem', lineHeight: 1.6 },
          }}
        >
          <strong>Your Rights under India&apos;s DPDP Act, 2023:</strong> You have the absolute right to access a summary of your personal data processed by FairShare, the right to correct inaccurate or outdated information, the right to withdraw consent and have your personal data erased, and the right to nominate an individual in the event of death or incapacity.
        </Alert>

        {/* Policy Sections */}
        <Stack spacing={2.5}>
          {/* Section 1 */}
          <Card className="glass-secondary" sx={{ borderRadius: 2.5, p: { xs: 2.25, sm: 2.75 }, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={750} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Storage sx={{ fontSize: 20, color: '#10B981' }} />
              1. Personal Data We Collect & Process (Section 5 Notice)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
              FairShare processes only the minimum necessary personal data required to deliver expense tracking and debt settlement calculation services:
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, mb: 0, '& li': { mb: 0.75, fontSize: '0.84rem', color: 'text.secondary', lineHeight: 1.6 } }}>
              <li><strong>Identity & Profile Data:</strong> Full name, verified email address, phone number (if provided for group invites), profile photo URL.</li>
              <li><strong>Financial Identifier Data:</strong> UPI Virtual Payment Address (e.g., username@upi) solely to facilitate peer-to-peer settlement deep-linking. We <em>never</em> collect, access, or store banking passwords, UPI PINs, CVVs, or debit/credit card numbers.</li>
              <li><strong>Transaction & Ledger Data:</strong> Expense amounts, split distributions, category tags, timestamps, receipts/attachments, and settlement confirmations recorded within your mutual groups.</li>
              <li><strong>Technical Telemetry:</strong> Log files, IP address, device metadata, and browser headers collected strictly for security audits, rate-limiting, and fraud prevention.</li>
            </Box>
          </Card>

          {/* Section 2 */}
          <Card className="glass-secondary" sx={{ borderRadius: 2.5, p: { xs: 2.25, sm: 2.75 }, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={750} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Gavel sx={{ fontSize: 20, color: '#3B82F6' }} />
              2. Lawful Grounds for Processing & Consent (Section 6)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
              We process personal data based on your explicit, informed, and unconditional consent obtained upon registration, and for legitimate contractual purposes to calculate group balances and debt graph simplifications.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              In accordance with Section 6(4) of the DPDP Act, 2023, you have the right to withdraw your consent at any time through Account Settings or by submitting a written request to our Grievance Officer. Upon consent withdrawal, your personal data will be purged within statutory timelines, subject to resolution of outstanding group settlements.
            </Typography>
          </Card>

          {/* Section 3 */}
          <Card className="glass-secondary" sx={{ borderRadius: 2.5, p: { xs: 2.25, sm: 2.75 }, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={750} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonSearch sx={{ fontSize: 20, color: '#F59E0B' }} />
              3. Data Principal Statutory Rights (Sections 11–14)
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, mb: 0, '& li': { mb: 1, fontSize: '0.84rem', color: 'text.secondary', lineHeight: 1.6 } }}>
              <li><strong>Right to Access Information (Section 11):</strong> Request a structured report of all personal data held, processing activities, and identities of group members with whom expense shares were shared.</li>
              <li><strong>Right to Correction & Erasure (Section 12):</strong> Rectify inaccurate personal data, complete incomplete profiles, and request erasure of personal data that is no longer necessary for the specified purpose.</li>
              <li><strong>Right of Grievance Redressal (Section 13):</strong> Access an accessible, prompt grievance redressal channel before escalating complaints to the Data Protection Board of India.</li>
              <li><strong>Right to Nominate (Section 14):</strong> Designate any natural person who shall, in the event of your death or incapacity, exercise your Data Principal rights.</li>
            </Box>
          </Card>

          {/* Section 4 */}
          <Card className="glass-secondary" sx={{ borderRadius: 2.5, p: { xs: 2.25, sm: 2.75 }, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={750} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Lock sx={{ fontSize: 20, color: '#8B5CF6' }} />
              4. Security Safeguards & Non-Sharing Policy (Section 8)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
              FairShare enforces technical and organizational safeguards in compliance with Section 8(5) of the DPDP Act, including AES-256 encryption at rest, TLS 1.3 encryption in transit, strict role-based access control (RBAC), and automated database sanitization.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              <strong>We do not sell, rent, or monetize your personal or financial data</strong> to third-party ad networks, credit bureaus, or marketing aggregators. Data is only accessible to authenticated group co-members as intentionally split by you.
            </Typography>
          </Card>

          {/* Section 5: Grievance Officer Details */}
          <Card
            className="glass-secondary glass-specular-top"
            sx={{
              borderRadius: 2.5,
              p: { xs: 2.25, sm: 2.75 },
              border: `1.5px solid ${isLight ? 'rgba(5, 150, 105, 0.25)' : 'rgba(16, 185, 129, 0.35)'}`,
              bgcolor: isLight ? 'rgba(5, 150, 105, 0.03)' : 'rgba(16, 185, 129, 0.04)',
            }}
          >
            <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: isLight ? '#059669' : '#34D399' }}>
              <ContactMail sx={{ fontSize: 22 }} />
              5. Grievance Redressal Officer & Statutory Contact (Section 13)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
              In accordance with Section 13(2) of the Digital Personal Data Protection Act, 2023, the details of our designated Data Protection & Grievance Officer in India are:
            </Typography>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${theme.palette.divider}`,
                fontSize: '0.84rem',
                lineHeight: 1.7,
              }}
            >
              <Typography variant="body2" fontWeight={750} sx={{ mb: 0.5 }}>
                FairShare Grievance & Data Protection Contact
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Data Protection & Grievance Officer:</strong> Vatsal Vadgama (Personal Project Maintainer)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Email Address:</strong> <a href="mailto:vatsalvadgama04@gmail.com" style={{ color: '#10B981', fontWeight: 600 }}>vatsalvadgama04@gmail.com</a>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Jurisdiction:</strong> Republic of India
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Statutory Resolution Timeline:</strong> Within thirty (30) days from receipt of grievance, as prescribed under DPDP Rules.
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              If you remain dissatisfied with our resolution, you may file a formal complaint before the <strong>Data Protection Board of India (DPBI)</strong> pursuant to Section 27 of the DPDP Act, 2023.
            </Typography>
          </Card>
        </Stack>

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            FairShare · Owino Smart Expense Splitting · Digital Personal Data Protection Act, 2023 Compliant
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Link href="/terms" style={{ fontSize: '0.8rem', color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>
              Terms of Service
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
