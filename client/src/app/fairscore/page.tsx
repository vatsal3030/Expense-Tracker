'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Skeleton,
  Stack,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  EmojiEvents,
  LocalFireDepartment,
  Bolt,
  Shield,
  Flight,
  Star,
  MilitaryTech,
  Celebration,
  CheckCircle,
  Lock,
  Share,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';

const BADGE_ICONS: Record<string, React.ReactNode> = {
  Zap: <Bolt />,
  Plane: <Flight />,
  Shield: <Shield />,
  Crown: <MilitaryTech />,
  Scale: <EmojiEvents />,
  Target: <Star />,
};

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Diamond: { bg: 'rgba(52,211,153,0.12)', text: '#34d399', border: '#10b981' },
  Platinum: { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: '#059669' },
  Gold: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: '#d97706' },
  Silver: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa', border: '#3b82f6' },
  Bronze: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: '#64748b' },
};

export default function FairScorePage() {
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cheered, setCheered] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchGamification = async () => {
      if (!session?.access_token) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/dashboard/gamification`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load gamification data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGamification();
  }, [session]);

  const handleCheer = (name: string) => {
    setCheered((prev) => ({ ...prev, [name]: true }));
    setTimeout(() => {
      setCheered((prev) => ({ ...prev, [name]: false }));
    }, 2500);
  };

  const score = data?.fairScore || 750;
  const tier = data?.tier || 'Platinum';
  const tierStyle = TIER_COLORS[tier] || TIER_COLORS.Gold;
  const strokeDashoffset = 440 - (440 * score) / 1000;

  return (
    <AppLayout>
      <Box sx={{ pb: 6 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2.5,
                bgcolor: 'rgba(16,185,129,0.12)',
                color: '#10b981',
                display: 'flex',
              }}
            >
              <EmojiEvents />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#f8fafc', letterSpacing: '-0.02em' }}>
              FairScore & Financial Karma
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, ml: 5.5 }}>
            Earn reliability reputation, build streak momentum, and unlock FinTech achievements with your group
          </Typography>
        </Box>

        {/* Hero Score Gauge & Streak Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Main FairScore Gauge */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              sx={{
                bgcolor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 4,
                p: 4,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle background glow */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 5 }} sx={{ textAlign: 'center' }}>
                  {/* Circular SVG Gauge */}
                  <Box sx={{ position: 'relative', width: 170, height: 170, mx: 'auto' }}>
                    <svg width="170" height="170" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#1e293b"
                        strokeWidth="12"
                        fill="transparent"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={440}
                        strokeDashoffset={loading ? 440 : strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{ transition: 'stroke-dashoffset 1.2s ease-in-out' }}
                      />
                    </svg>

                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h3" fontWeight={800} sx={{ color: '#f8fafc', lineHeight: 1 }}>
                        {loading ? <Skeleton width={60} /> : score}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mt: 0.5 }}>
                        out of 1000
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 7 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={`${tier} Tier`}
                      size="small"
                      sx={{
                        bgcolor: tierStyle.bg,
                        color: tierStyle.text,
                        border: `1px solid ${tierStyle.border}`,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                      Top 8% in Peer Network
                    </Typography>
                  </Box>

                  <Typography variant="h6" fontWeight={700} sx={{ color: '#f8fafc', mb: 1 }}>
                    Ultra-Reliable Splitter
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6, mb: 2 }}>
                    Your high score means friends trust you to front bills and settle balances fast. Settle all pending debts to unlock Diamond status!
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Share fontSize="small" />}
                      onClick={() => navigator.clipboard.writeText(`My FairScore on FairShare is ${score} (${tier} Tier)!`)}
                      sx={{
                        borderColor: '#334155',
                        color: '#f8fafc',
                        borderRadius: 2.5,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        '&:hover': { borderColor: '#10b981' },
                      }}
                    >
                      Share Score
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Active Streak Card */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                bgcolor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 4,
                p: 3.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalFireDepartment sx={{ color: '#f59e0b', fontSize: 28 }} />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#f8fafc' }}>
                      Clarity Streak
                    </Typography>
                  </Box>
                  <Chip
                    label="Active"
                    size="small"
                    sx={{ bgcolor: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 700 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                  <Typography variant="h2" fontWeight={800} sx={{ color: '#f59e0b', lineHeight: 1 }}>
                    14
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#94a3b8' }}>
                    consecutive days
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.5, mb: 3 }}>
                  You have logged or verified every group expense for two straight weeks without delay.
                </Typography>
              </Box>

              {/* 7-Day Dot Progress */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 1 }}>
                  THIS WEEK&apos;S STREAK LOG
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        flex: 1,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: idx < 6 ? '#059669' : '#1e293b',
                        color: idx < 6 ? '#ffffff' : '#64748b',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {day}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* 4 Score Pillars */}
        <Typography variant="h6" fontWeight={800} sx={{ color: '#f8fafc', mb: 2 }}>
          FairScore Factors Breakdown
        </Typography>

        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {[
            {
              title: 'Settlement Speed',
              score: data?.scoreBreakdown?.settlementDiscipline || 260,
              max: 300,
              desc: 'How quickly you confirm payments when requested',
              color: '#10b981',
            },
            {
              title: 'Expense Transparency',
              score: data?.scoreBreakdown?.transparency || 270,
              max: 300,
              desc: 'Receipt attachments, itemized split accuracy',
              color: '#0ea5e9',
            },
            {
              title: 'Group Collaboration',
              score: data?.scoreBreakdown?.collaboration || 170,
              max: 200,
              desc: 'Active shared ledgers and balanced contributions',
              color: '#f59e0b',
            },
            {
              title: 'Zero Overdue Balance',
              score: data?.scoreBreakdown?.consistency || 180,
              max: 200,
              desc: 'No unsettled balance older than 7 days',
              color: '#34d399',
            },
          ].map((pillar, idx) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={idx}>
              <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 3.5, p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f8fafc' }}>
                    {pillar.title}
                  </Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: pillar.color }}>
                    {pillar.score}/{pillar.max}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(pillar.score / pillar.max) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#1e293b',
                    my: 1.5,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: pillar.color,
                      borderRadius: 3,
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1.4 }}>
                  {pillar.desc}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Achievement Badges Showcase */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#f8fafc' }}>
              Financial Badges & Achievements
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Milestones unlocked through healthy shared expense habits
            </Typography>
          </Box>
          <Chip
            label={`${(data?.badges || []).filter((b: any) => b.unlocked).length}/6 Unlocked`}
            size="small"
            sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#34d399', fontWeight: 700 }}
          />
        </Box>

        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {(data?.badges || []).map((badge: any) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={badge.id}>
              <Card
                sx={{
                  bgcolor: '#0f172a',
                  border: badge.unlocked ? '1px solid #334155' : '1px solid #1e293b',
                  borderRadius: 3.5,
                  p: 3,
                  position: 'relative',
                  opacity: badge.unlocked ? 1 : 0.65,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: badge.unlocked ? '#10b981' : '#1e293b' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      w: 44,
                      h: 44,
                      p: 1.25,
                      borderRadius: 2.5,
                      bgcolor: badge.unlocked ? 'rgba(16,185,129,0.12)' : '#1e293b',
                      color: badge.unlocked ? '#10b981' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {BADGE_ICONS[badge.icon] || <Star />}
                  </Box>

                  <Chip
                    label={badge.unlocked ? `${badge.points} PTS` : 'LOCKED'}
                    size="small"
                    icon={badge.unlocked ? <CheckCircle sx={{ '&&': { fontSize: 13, color: '#34d399' } }} /> : <Lock sx={{ '&&': { fontSize: 13, color: '#64748b' } }} />}
                    sx={{
                      bgcolor: badge.unlocked ? 'rgba(16,185,129,0.1)' : '#1e293b',
                      color: badge.unlocked ? '#34d399' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                    }}
                  />
                </Box>

                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f8fafc', mb: 0.5 }}>
                  {badge.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2, minHeight: 32 }}>
                  {badge.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Progress
                  </Typography>
                  <Typography variant="caption" fontWeight={600} sx={{ color: badge.unlocked ? '#10b981' : '#94a3b8' }}>
                    {badge.current}/{badge.max}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={badge.progress}
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    bgcolor: '#1e293b',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: badge.unlocked ? '#10b981' : '#475569',
                      borderRadius: 3,
                    },
                  }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Friend Reliability Leaderboard */}
        <Typography variant="h6" fontWeight={800} sx={{ color: '#f8fafc', mb: 2 }}>
          Friend Group Leaderboard
        </Typography>

        <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 4, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#090d16' }}>
                <TableRow>
                  <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>RANK</TableCell>
                  <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>MEMBER</TableCell>
                  <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>FAIRSCORE</TableCell>
                  <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>TIER</TableCell>
                  <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>STREAK</TableCell>
                  <TableCell align="right" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.leaderboard || []).map((row: any) => (
                  <TableRow
                    key={row.rank}
                    sx={{
                      bgcolor: row.isCurrentUser ? 'rgba(16,185,129,0.04)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                    }}
                  >
                    <TableCell sx={{ color: row.rank === 1 ? '#f59e0b' : '#94a3b8', fontWeight: 700 }}>
                      {row.rank === 1 ? '🥇 #1' : row.rank === 2 ? '🥈 #2' : row.rank === 3 ? '🥉 #3' : `#${row.rank}`}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={row.avatarUrl || undefined}
                          sx={{ width: 32, height: 32, bgcolor: '#1e293b', fontSize: '0.85rem' }}
                        >
                          {row.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} sx={{ color: row.isCurrentUser ? '#34d399' : '#f8fafc' }}>
                          {row.name} {row.isCurrentUser && '(You)'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#f8fafc', fontWeight: 700 }}>
                      {row.score}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.tier}
                        size="small"
                        sx={{
                          bgcolor: (TIER_COLORS[row.tier] || TIER_COLORS.Gold).bg,
                          color: (TIER_COLORS[row.tier] || TIER_COLORS.Gold).text,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#f59e0b', fontWeight: 700 }}>
                      🔥 {row.streak}d
                    </TableCell>
                    <TableCell align="right">
                      {!row.isCurrentUser && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCheer(row.name)}
                          sx={{
                            borderRadius: 2,
                            borderColor: '#334155',
                            color: cheered[row.name] ? '#34d399' : '#f8fafc',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            py: 0.5,
                            px: 1.5,
                            '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16,185,129,0.06)' },
                          }}
                        >
                          {cheered[row.name] ? 'Cheered! 🎉' : 'Cheer 👏'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </AppLayout>
  );
}
