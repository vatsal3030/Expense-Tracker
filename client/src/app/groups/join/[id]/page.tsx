'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Avatar,
  AvatarGroup,
  Alert,
  Chip,
  Stack,
  useTheme,
  alpha,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Lock as LockIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  ExpandMore as ExpandMoreIcon,
  InfoOutlined as InfoOutlinedIcon,
  VerifiedUser as VerifiedUserIcon,
  AccountBalanceWallet as WalletIcon,
  ReceiptLong as ReceiptIcon,
  Group as GroupIcon,
  FlightTakeoff,
  Home,
  Favorite,
  Business,
  People,
  FamilyRestroom,
  Work,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { groupApi } from '@/lib/api';
import BrandLogo from '@/components/brand/BrandLogo';

const TYPE_ICONS: Record<string, React.ReactElement> = {
  TRIP: <FlightTakeoff sx={{ fontSize: 16 }} />,
  HOME: <Home sx={{ fontSize: 16 }} />,
  COUPLE: <Favorite sx={{ fontSize: 16 }} />,
  OFFICE: <Business sx={{ fontSize: 16 }} />,
  FRIENDS: <People sx={{ fontSize: 16 }} />,
  FAMILY: <FamilyRestroom sx={{ fontSize: 16 }} />,
  PROJECT: <Work sx={{ fontSize: 16 }} />,
  OTHER: <GroupIcon sx={{ fontSize: 16 }} />,
};

function JoinGroupSkeleton() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="rounded" width={140} height={36} sx={{ borderRadius: 2 }} />
      </Box>
      <Container maxWidth="sm" disableGutters sx={{ maxWidth: 460 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            textAlign: 'center',
          }}
        >
          <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
            <Skeleton variant="circular" width={76} height={76} />
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Skeleton width="40%" height={16} />
              <Skeleton width="70%" height={32} />
              <Skeleton width="50%" height={18} />
            </Box>
            <Stack direction="row" spacing={1}>
              <Skeleton width={80} height={28} sx={{ borderRadius: 4 }} />
              <Skeleton width={110} height={28} sx={{ borderRadius: 4 }} />
            </Stack>
            <Skeleton variant="rounded" width="100%" height={60} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" width="100%" height={80} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" width="100%" height={46} sx={{ borderRadius: 2.5 }} />
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default function JoinGroupPage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user, loading: authLoading } = useAuth();

  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (id) {
      groupApi.getPublicInfo(id)
        .then((res) => {
          setGroupInfo(res.data?.data);
          if (res.data?.data?.isMember) {
            setStatusMessage({
              type: 'info',
              text: 'You are already an active member of this group!',
            });
          }
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'Failed to load group invite link.');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleJoin = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/groups/join/${id}`);
      return;
    }

    setError('');
    setJoining(true);

    try {
      const res = await groupApi.join(id, { passcode: passcode.trim() || undefined });
      const status = res.data?.data?.status;

      if (status === 'PENDING_APPROVAL') {
        setStatusMessage({
          type: 'info',
          text: res.data?.data?.message || 'Join request submitted! The group admin has been notified for approval.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Welcome! You have successfully joined the group ledger.',
        });
        setTimeout(() => {
          router.push(`/groups/${id}`);
        }, 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join group. Please check your passcode.');
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return <JoinGroupSkeleton />;
  }

  const isLight = theme.palette.mode === 'light';
  const groupType = groupInfo?.type || 'OTHER';
  const typeIcon = TYPE_ICONS[groupType] || <GroupIcon sx={{ fontSize: 16 }} />;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Background Glow Vignette */}
      <Box
        sx={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: isLight
            ? 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          top: '15%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Brand Header */}
      <Box sx={{ mb: 3, position: 'relative', zIndex: 1 }}>
        <BrandLogo size="md" />
      </Box>

      <Container maxWidth="sm" disableGutters sx={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            textAlign: 'center',
            boxShadow: isLight
              ? '0 12px 40px rgba(0,0,0,0.06)'
              : '0 16px 48px rgba(0,0,0,0.45)',
          }}
        >
          {error && !groupInfo ? (
            <Box>
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5, textAlign: 'left' }}>
                {error}
              </Alert>
              <Button
                variant="outlined"
                onClick={() => router.push('/dashboard')}
                sx={{ borderRadius: 2.5, px: 3, py: 1 }}
              >
                Back to Dashboard
              </Button>
            </Box>
          ) : (
            <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
              {/* Group Avatar Hero */}
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{
                    width: 76,
                    height: 76,
                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                    color: 'primary.main',
                    fontSize: '2rem',
                    fontWeight: 800,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  {groupInfo?.name?.charAt(0)?.toUpperCase() || 'G'}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    bgcolor: 'primary.main',
                    color: '#ffffff',
                    borderRadius: '50%',
                    p: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${theme.palette.background.paper}`,
                  }}
                >
                  <WalletIcon sx={{ fontSize: 14 }} />
                </Box>
              </Box>

              {/* Title & Metadata */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem' }}
                >
                  FairShare Group Invite
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  {groupInfo?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Created by <strong>{groupInfo?.admin?.name || groupInfo?.adminName || 'Admin'}</strong>
                </Typography>
              </Box>

              {/* Badges Bar */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip
                  icon={typeIcon}
                  label={groupType}
                  size="small"
                  sx={{ fontWeight: 700, textTransform: 'capitalize', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                />
                <Chip
                  label={groupInfo?.currency || 'INR'}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                {groupInfo?.isPasswordProtected && (
                  <Chip
                    icon={<LockIcon sx={{ fontSize: '13px !important' }} />}
                    label="Passcode Protected"
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                {groupInfo?.requireAdminApproval && (
                  <Chip
                    icon={<SecurityIcon sx={{ fontSize: '13px !important' }} />}
                    label="Admin Approval Required"
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>

              {/* Instagram-style Mutual Friends or Member Stack */}
              {groupInfo?.mutualFriends && groupInfo.mutualFriends.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    width: '100%',
                  }}
                >
                  <AvatarGroup
                    max={3}
                    sx={{
                      '& .MuiAvatar-root': {
                        width: 34,
                        height: 34,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: `2px solid ${theme.palette.background.paper}`,
                      },
                    }}
                  >
                    {groupInfo.mutualFriends.map((f: any) => (
                      <Avatar key={f.id} src={f.avatarUrl || undefined} alt={f.name}>
                        {f.name.charAt(0)}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  <Box sx={{ textAlign: 'left', flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', color: 'text.primary', lineHeight: 1.3 }}>
                      {groupInfo.mutualFriends.length === 1
                        ? `${groupInfo.mutualFriends[0].name} is in this group`
                        : groupInfo.mutualFriends.length === 2
                        ? `${groupInfo.mutualFriends[0].name} and ${groupInfo.mutualFriends[1].name} are in this group`
                        : `${groupInfo.mutualFriends[0].name} and ${groupInfo.mutualFriends.length - 1} other mutual friends are in this group`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                      Mutual friends from your contact network
                    </Typography>
                  </Box>
                </Box>
              ) : groupInfo?.members && groupInfo.members.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.25,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                    width: '100%',
                  }}
                >
                  <AvatarGroup
                    max={4}
                    sx={{
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem',
                        border: `2px solid ${theme.palette.background.paper}`,
                      },
                    }}
                  >
                    {groupInfo.members.map((m: any) => (
                      <Avatar key={m.id} src={m.avatarUrl || undefined} alt={m.name}>
                        {m.name.charAt(0)}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  <Box sx={{ textAlign: 'left', flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 650, fontSize: '0.82rem', color: 'text.primary' }}>
                      {groupInfo.memberCount} member{groupInfo.memberCount === 1 ? '' : 's'} sharing expenses
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                      Active FairShare ledger
                    </Typography>
                  </Box>
                </Box>
              ) : null}

              {/* Group Snapshot Metrics */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1.2,
                  width: '100%',
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.2,
                    borderRadius: 2.5,
                    bgcolor: alpha(theme.palette.text.primary, 0.03),
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                    MEMBERS
                  </Typography>
                  <Typography variant="body1" fontWeight={800} sx={{ mt: 0.2 }}>
                    {groupInfo?.memberCount || 1}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.2,
                    borderRadius: 2.5,
                    bgcolor: alpha(theme.palette.text.primary, 0.03),
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                    EXPENSES
                  </Typography>
                  <Typography variant="body1" fontWeight={800} sx={{ mt: 0.2 }}>
                    {groupInfo?.expenseCount || 0}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.2,
                    borderRadius: 2.5,
                    bgcolor: alpha(theme.palette.text.primary, 0.03),
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                    CURRENCY
                  </Typography>
                  <Typography variant="body1" fontWeight={800} sx={{ mt: 0.2 }}>
                    {groupInfo?.currency || 'INR'}
                  </Typography>
                </Paper>
              </Box>

              {/* Expandable Group Guidelines, Description & Policy */}
              <Accordion
                elevation={0}
                disableGutters
                sx={{
                  width: '100%',
                  bgcolor: 'transparent',
                  '&:before': { display: 'none' },
                  border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                  borderRadius: '14px !important',
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                  sx={{ px: 2, minHeight: 42, '& .MuiAccordionSummary-content': { my: 0.5 } }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <InfoOutlinedIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight={700} fontSize="0.84rem">
                      Group Rules & Details
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pt: 0, pb: 2, textAlign: 'left' }}>
                  {groupInfo?.description && (
                    <Box sx={{ mb: 1.5, p: 1.25, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25, color: 'text.primary', fontSize: '0.84rem', lineHeight: 1.5 }}>
                        {groupInfo.description}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Ledger Guidelines
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 0.75 }}>
                    {groupInfo?.rules && groupInfo.rules.length > 0 ? (
                      groupInfo.rules.map((rule: string, idx: number) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <VerifiedUserIcon sx={{ fontSize: 15, color: 'primary.main', mt: 0.2, flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem', lineHeight: 1.45 }}>
                            {rule}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon sx={{ fontSize: 15, color: 'primary.main' }} />
                        <Typography variant="caption" color="text.secondary">
                          Transparent ledger with instant mathematical balance tracking.
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {error && (
                <Alert severity="error" sx={{ width: '100%', borderRadius: 2.5, textAlign: 'left', fontSize: '0.825rem' }}>
                  {error}
                </Alert>
              )}

              {statusMessage && (
                <Alert
                  severity={statusMessage.type}
                  icon={statusMessage.type === 'success' ? <CheckCircleIcon fontSize="inherit" /> : undefined}
                  sx={{ width: '100%', borderRadius: 2.5, textAlign: 'left', fontSize: '0.84rem' }}
                >
                  {statusMessage.text}
                </Alert>
              )}

              {/* Passcode input if protected */}
              {groupInfo?.isPasswordProtected && !groupInfo?.isMember && (
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Enter Group Passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Required secret passcode"
                  slotProps={{
                    input: {
                      startAdornment: <LockIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />,
                    },
                  }}
                  autoFocus
                />
              )}

              {groupInfo?.isMember ? (
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push(`/groups/${id}`)}
                  sx={{
                    py: 1.25,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    bgcolor: '#059669',
                    color: '#ffffff',
                    '&:hover': { bgcolor: '#047857' },
                  }}
                >
                  Open Group Ledger
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  disabled={joining || (groupInfo?.isPasswordProtected && !passcode.trim())}
                  onClick={handleJoin}
                  sx={{
                    py: 1.25,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    fontSize: '0.925rem',
                    bgcolor: '#059669',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(5,150,105,0.25)',
                    '&:hover': {
                      bgcolor: '#047857',
                      boxShadow: '0 6px 20px rgba(5,150,105,0.35)',
                    },
                  }}
                >
                  {joining ? (
                    'Joining...'
                  ) : !user ? (
                    'Sign In to Join Group'
                  ) : (
                    `Join ${groupInfo?.name || 'Group'}`
                  )}
                </Button>
              )}

              <Divider sx={{ width: '100%', my: 0.5 }} />

              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VerifiedUserIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                FairShare Cryptographic Ledger • Balances visible to group members only
              </Typography>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
