'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Container, Paper, Typography, Button, TextField,
  Avatar, CircularProgress, Alert, Chip, Stack, useTheme, alpha,
} from '@mui/material';
import {
  Group as GroupIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { groupApi } from '@/lib/api';
import BrandLogo from '@/components/brand/BrandLogo';

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
              text: 'You are already a member of this group!',
            });
          }
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'Failed to load group invite.');
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
          text: res.data?.data?.message || 'Join request sent! An admin will review it shortly.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Welcome! You have successfully joined the group.',
        });
        setTimeout(() => {
          router.push(`/groups/${id}`);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join group. Please check your passcode.');
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

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
        <BrandLogo size="md" />
      </Box>

      <Container maxWidth="xs" disableGutters>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
          }}
        >
          {error && !groupInfo ? (
            <Box>
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
                {error}
              </Alert>
              <Button variant="outlined" onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </Box>
          ) : (
            <Stack spacing={2.5} alignItems="center">
              {/* Group Avatar */}
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: 'primary.main',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                {groupInfo?.name?.charAt(0) || <GroupIcon />}
              </Avatar>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Group Invitation
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                  {groupInfo?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Created by {groupInfo?.adminName} • {groupInfo?.memberCount || 1} members
                </Typography>
              </Box>

              {/* Badges */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip
                  label={groupInfo?.type || 'Group'}
                  size="small"
                  sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                />
                {groupInfo?.isPasswordProtected && (
                  <Chip
                    icon={<LockIcon sx={{ fontSize: '14px !important' }} />}
                    label="Passcode Protected"
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                {groupInfo?.requireAdminApproval && (
                  <Chip
                    icon={<SecurityIcon sx={{ fontSize: '14px !important' }} />}
                    label="Approval Required"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>

              {error && (
                <Alert severity="error" sx={{ width: '100%', borderRadius: 2.5, textAlign: 'left', fontSize: '0.825rem' }}>
                  {error}
                </Alert>
              )}

              {statusMessage && (
                <Alert
                  severity={statusMessage.type}
                  icon={statusMessage.type === 'success' ? <CheckCircleIcon fontSize="inherit" /> : undefined}
                  sx={{ width: '100%', borderRadius: 2.5, textAlign: 'left', fontSize: '0.85rem' }}
                >
                  {statusMessage.text}
                </Alert>
              )}

              {/* Passcode input if protected */}
              {groupInfo?.isPasswordProtected && !statusMessage && (
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Enter Group Passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Secret passcode required"
                  autoFocus
                />
              )}

              {groupInfo?.isMember ? (
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push(`/groups/${id}`)}
                  sx={{ py: 1.2, borderRadius: 2.5, fontWeight: 700 }}
                >
                  Open Group
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  disabled={joining || (groupInfo?.isPasswordProtected && !passcode.trim())}
                  onClick={handleJoin}
                  sx={{
                    py: 1.2,
                    borderRadius: 2.5,
                    fontWeight: 650,
                    fontSize: '0.925rem',
                  }}
                >
                  {joining ? (
                    <CircularProgress size={24} sx={{ color: '#fff' }} />
                  ) : !user ? (
                    'Sign In to Join'
                  ) : (
                    `Join ${groupInfo?.name || 'Group'}`
                  )}
                </Button>
              )}
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
