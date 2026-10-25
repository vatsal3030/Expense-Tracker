'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Chip,
  Skeleton,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
} from '@mui/material';
import {
  EmojiEvents,
  LocalFireDepartment,
  Bolt,
  Shield,
  Flight,
  Star,
  MilitaryTech,
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
  Diamond: { bg: 'rgba(14, 98, 69, 0.12)', text: '#0E6245', border: '#0E6245' },
  Platinum: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: '#059669' },
  Gold: { bg: 'rgba(245, 158, 11, 0.12)', text: '#D97706', border: '#D97706' },
  Silver: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6', border: '#3B82F6' },
  Bronze: { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748B', border: '#64748B' },
};

export default function FairScorePage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cheered, setCheered] = useState<Record<string, boolean>>({});

  const hasLoadedGamificationRef = React.useRef(false);

  useEffect(() => {
    if (!session?.access_token || hasLoadedGamificationRef.current) return;
    const fetchGamification = async () => {
      try {
        setLoading(true);
        hasLoadedGamificationRef.current = true;
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
  }, [session?.user?.id, session?.access_token]);

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
      <Box sx={{ pb: { xs: 4, sm: 4 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2.5,
                bgcolor: alpha('#0E6245', 0.1),
                color: '#0E6245',
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <EmojiEvents />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', letterSpacing: '-0.02em', fontSize: { xs: '1.25rem', sm: '1.85rem', md: '2.125rem' } }}>
              FairScore & Financial Karma
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: { xs: 0, sm: 5.5 }, fontSize: { xs: '0.78rem', sm: '0.875rem' } }}>
            Earn reliability reputation, build streak momentum, and unlock FinTech achievements with your group
          </Typography>
        </Box>

        {/* Hero Score Gauge & Streak Row */}
        <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }} sx={{ mb: 4 }}>
          {/* Main FairScore Gauge */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              className="glass-secondary glass-specular-top glass-emerald-ambient"
              sx={{
                borderRadius: 3.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                p: { xs: 2.5, sm: 3.5, md: 4 },
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 5 }} sx={{ textAlign: 'center' }}>
                  {/* Circular SVG Gauge with liquid glow */}
                  <Box sx={{ position: 'relative', width: 170, height: 170, mx: 'auto' }}>
                    <svg width="170" height="170" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke={isLight ? '#E9ECEF' : 'rgba(255, 255, 255, 0.08)'}
                        strokeWidth="12"
                        fill="transparent"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#10B981"
                        strokeWidth="12"
                        strokeDasharray={440}
                        strokeDashoffset={loading ? 440 : strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{
                          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))',
                        }}
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
                      <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.mode === 'dark' ? '#10B981' : 'text.primary', lineHeight: 1 }}>
                        {loading ? <Skeleton width={60} /> : score}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
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
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Top 8% in Peer Network
                    </Typography>
                  </Box>

                  <Typography variant="h6" fontWeight={750} sx={{ color: 'text.primary', mb: 1 }}>
                    Ultra-Reliable Splitter
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2, fontSize: '0.825rem' }}>
                    Your high score means friends trust you to front bills and settle balances fast. Settle all pending debts to unlock Diamond status!
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Share fontSize="small" />}
                      onClick={() => navigator.clipboard.writeText(`My FairScore on Owino is ${score} (${tier} Tier)!`)}
                      className="glass-tertiary"
                      sx={{
                        color: 'text.primary',
                        borderRadius: 2.5,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        '&:hover': { borderColor: '#10B981', bgcolor: alpha('#10B981', 0.08) },
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
              className="glass-secondary glass-specular-top"
              sx={{
                borderRadius: 3.5,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
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
                    <LocalFireDepartment sx={{ color: '#F59E0B', fontSize: 28 }} />
                    <Typography variant="subtitle1" fontWeight={750} sx={{ color: 'text.primary' }}>
                      Clarity Streak
                    </Typography>
                  </Box>
                  <Chip
                    label="Active"
                    size="small"
                    sx={{ bgcolor: alpha('#F59E0B', 0.15), color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                  <Typography variant="h2" fontWeight={800} sx={{ color: '#F59E0B', lineHeight: 1 }}>
                    14
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                    consecutive days
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 3, fontSize: '0.825rem' }}>
                  You have logged or verified every group expense for two straight weeks without delay.
                </Typography>
              </Box>

              {/* 7-Day Dot Progress */}
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}>
                  THIS WEEK&apos;S STREAK LOG
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                    <Box
                      key={idx}
                      className={idx < 6 ? "glass-emerald-active" : undefined}
                      sx={{
                        flex: 1,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: idx < 6 ? '#0E6245' : isLight ? '#E9ECEF' : 'rgba(255, 255, 255, 0.08)',
                        color: idx < 6 ? '#FFFFFF' : 'text.secondary',
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
        <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', mb: 2 }}>
          FairScore Factors Breakdown
        </Typography>

        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {[
            {
              title: 'Settlement Speed',
              score: data?.scoreBreakdown?.settlementDiscipline || 260,
              max: 300,
              desc: 'How quickly you confirm payments when requested',
              color: '#0E6245',
            },
            {
              title: 'Expense Transparency',
              score: data?.scoreBreakdown?.transparency || 270,
              max: 300,
              desc: 'Receipt attachments, itemized split accuracy',
              color: '#3B82F6',
            },
            {
              title: 'Group Collaboration',
              score: data?.scoreBreakdown?.collaboration || 170,
              max: 200,
              desc: 'Active shared ledgers and balanced contributions',
              color: '#F59E0B',
            },
            {
              title: 'Zero Overdue Balance',
              score: data?.scoreBreakdown?.consistency || 180,
              max: 200,
              desc: 'No unsettled balance older than 7 days',
              color: '#10B981',
            },
          ].map((pillar, idx) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={idx}>
              <Card
                className="glass-secondary glass-specular-top"
                sx={{
                  borderRadius: 3.5,
                  boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                  p: 2.5,
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    borderColor: 'rgba(16, 185, 129, 0.4) !important',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.primary' }}>
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
                    bgcolor: isLight ? '#E9ECEF' : 'rgba(255, 255, 255, 0.08)',
                    my: 1.5,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: pillar.color,
                      borderRadius: 3,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                  {pillar.desc}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Achievement Badges Showcase */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
              Financial Badges & Achievements
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Milestones unlocked through healthy shared expense habits
            </Typography>
          </Box>
          <Chip
            label={`${(data?.badges || []).filter((b: any) => b.unlocked).length}/6 Unlocked`}
            size="small"
            sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}
          />
        </Box>

        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {(data?.badges || []).map((badge: any) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={badge.id}>
              <Card
                className={badge.unlocked ? "glass-secondary glass-specular-top" : "glass-tertiary"}
                sx={{
                  borderRadius: 3.5,
                  boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
                  p: 3,
                  position: 'relative',
                  opacity: badge.unlocked ? 1 : 0.65,
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  border: badge.unlocked ? undefined : `1px dashed ${theme.palette.divider}`,
                  '&:hover': {
                    borderColor: badge.unlocked ? 'rgba(16, 185, 129, 0.5) !important' : undefined,
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    className="glass-tertiary"
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      bgcolor: badge.unlocked ? 'rgba(16, 185, 129, 0.15)' : alpha(theme.palette.text.secondary, 0.08),
                      border: badge.unlocked ? '1px solid rgba(16, 185, 129, 0.3)' : undefined,
                      color: badge.unlocked ? '#10B981' : 'text.secondary',
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
                    icon={badge.unlocked ? <CheckCircle sx={{ '&&': { fontSize: 13, color: '#34D399' } }} /> : <Lock sx={{ '&&': { fontSize: 13, color: 'text.secondary' } }} />}
                    sx={{
                      bgcolor: badge.unlocked ? 'rgba(16, 185, 129, 0.15)' : alpha(theme.palette.text.secondary, 0.08),
                      color: badge.unlocked ? '#34D399' : 'text.secondary',
                      border: badge.unlocked ? '1px solid rgba(16, 185, 129, 0.3)' : undefined,
                      fontWeight: 700,
                      fontSize: '0.65rem',
                    }}
                  />
                </Box>

                <Typography variant="subtitle2" fontWeight={750} sx={{ color: 'text.primary', mb: 0.5 }}>
                  {badge.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, minHeight: 32 }}>
                  {badge.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="caption" fontWeight={600} sx={{ color: badge.unlocked ? '#10B981' : 'text.secondary' }}>
                    {badge.current}/{badge.max}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={badge.progress}
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    bgcolor: isLight ? '#E9ECEF' : 'rgba(255, 255, 255, 0.08)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: badge.unlocked ? '#10B981' : '#64748B',
                      borderRadius: 3,
                    },
                  }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Friend Reliability Leaderboard */}
        <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', mb: 2 }}>
          Friend Group Leaderboard
        </Typography>

        <Card
          className="glass-secondary glass-specular-top"
          sx={{
            borderRadius: 3.5,
            boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 12px 30px rgba(0,0,0,0.35)',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: isLight ? '#F9FAFB' : 'rgba(255, 255, 255, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>RANK</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>MEMBER</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>FAIRSCORE</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>TIER</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>STREAK</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.leaderboard || []).map((row: any) => (
                  <TableRow
                    key={row.rank}
                    sx={{
                      bgcolor: row.isCurrentUser ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
                    }}
                  >
                    <TableCell sx={{ color: row.rank === 1 ? '#F59E0B' : 'text.secondary', fontWeight: 700 }}>
                      {row.rank === 1 ? '🥇 #1' : row.rank === 2 ? '🥈 #2' : row.rank === 3 ? '🥉 #3' : `#${row.rank}`}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={row.avatarUrl || undefined}
                          className="glass-tertiary"
                          sx={{ width: 32, height: 32, bgcolor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', fontSize: '0.85rem' }}
                        >
                          {row.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} sx={{ color: row.isCurrentUser ? '#10B981' : 'text.primary' }}>
                          {row.name} {row.isCurrentUser && '(You)'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>
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
                    <TableCell sx={{ color: '#F59E0B', fontWeight: 700 }}>
                      🔥 {row.streak}d
                    </TableCell>
                    <TableCell align="right">
                      {!row.isCurrentUser && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCheer(row.name)}
                          className="glass-tertiary"
                          sx={{
                            borderRadius: 2,
                            color: cheered[row.name] ? '#10B981' : 'text.primary',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            py: 0.5,
                            px: 1.5,
                            textTransform: 'none',
                            '&:hover': { borderColor: '#10B981', bgcolor: alpha('#10B981', 0.08) },
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
