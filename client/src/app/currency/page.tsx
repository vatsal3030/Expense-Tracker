'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, MenuItem,
  useTheme, alpha, Skeleton, Chip, IconButton, Tooltip, Button,
} from '@mui/material';
import {
  CurrencyExchange, SwapHoriz, TrendingUp, Public, Refresh,
} from '@mui/icons-material';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { fxApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const POPULAR_PAIRS = [
  { from: 'USD', to: 'INR' },
  { from: 'EUR', to: 'INR' },
  { from: 'GBP', to: 'INR' },
  { from: 'AED', to: 'INR' },
  { from: 'THB', to: 'INR' },
  { from: 'JPY', to: 'INR' },
  { from: 'SGD', to: 'INR' },
  { from: 'USD', to: 'EUR' },
];

const FLAG_EMOJI: Record<string, string> = {
  INR: '🇮🇳', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', AED: '🇦🇪', THB: '🇹🇭',
  JPY: '🇯🇵', SGD: '🇸🇬', AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', CNY: '🇨🇳',
  HKD: '🇭🇰', KRW: '🇰🇷', MYR: '🇲🇾', NZD: '🇳🇿', PHP: '🇵🇭', SEK: '🇸🇪',
  TWD: '🇹🇼', ZAR: '🇿🇦',
};

export default function CurrencyPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  // Converter state
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [amount, setAmount] = useState('100');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user?.id, authLoading, router]);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fxApi.getRates('USD');
      setRates(res.data.data);
    } catch (error) {
      console.error('Fetch rates error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) fetchRates();
  }, [user?.id, fetchRates]);

  const handleConvert = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    setConverting(true);
    try {
      const res = await fxApi.convert(fromCurrency, toCurrency, amt);
      setResult(res.data.data);
    } catch (error) {
      console.error('Convert error:', error);
    } finally {
      setConverting(false);
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  // Auto-convert on change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount && parseFloat(amount) > 0) handleConvert();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCurrency, toCurrency, amount]);

  const currencies: string[] = rates?.currencies?.length
    ? rates.currencies
    : Object.keys(FLAG_EMOJI);
  const symbols: Record<string, string> = rates?.symbols || {
    USD: '$', INR: '₹', EUR: '€', GBP: '£', AED: 'د.إ', CAD: 'C$', JPY: '¥', AUD: 'A$', SGD: 'S$'
  };

  const formatRate = (rate: number) => {
    if (rate >= 100) return rate.toFixed(2);
    if (rate >= 1) return rate.toFixed(4);
    return rate.toFixed(6);
  };

  return (
    <AppLayout>
      <Box sx={{ pb: { xs: 4, sm: 4 }, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.35rem', sm: '1.65rem', md: '1.85rem' } }}>
              Currency Exchange
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
              Real-time FX rates — powered by ECB
            </Typography>
          </Box>
          <Tooltip title="Refresh Rates">
            <IconButton onClick={fetchRates} sx={{ bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', border: `1px solid ${theme.palette.divider}` }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Converter Card */}
        <Card
          className="glass-secondary glass-specular-top"
          sx={{
            borderRadius: 3, mb: 2,
            boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.04)' : '0 12px 30px rgba(0,0,0,0.35)',
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <CurrencyExchange sx={{ color: isLight ? '#0E6245' : '#34D399', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={800}>Convert Currency</Typography>
            </Box>

            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth label="Amount" type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                />
              </Grid>
              <Grid size={{ xs: 5, sm: 3 }}>
                <TextField
                  fullWidth select label="From"
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                >
                  {currencies.map((c: string) => (
                    <MenuItem key={c} value={c}>{FLAG_EMOJI[c] || '🌐'} {c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 2, sm: 1 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                <IconButton
                  onClick={handleSwap}
                  sx={{
                    bgcolor: isLight ? 'rgba(14, 98, 69, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                    border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.2)' : 'rgba(16, 185, 129, 0.3)'}`,
                    '&:hover': { bgcolor: isLight ? 'rgba(14, 98, 69, 0.15)' : 'rgba(16, 185, 129, 0.2)' },
                  }}
                >
                  <SwapHoriz sx={{ color: isLight ? '#0E6245' : '#34D399' }} />
                </IconButton>
              </Grid>
              <Grid size={{ xs: 5, sm: 3 }}>
                <TextField
                  fullWidth select label="To"
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                >
                  {currencies.map((c: string) => (
                    <MenuItem key={c} value={c}>{FLAG_EMOJI[c] || '🌐'} {c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {/* Result */}
            {result && (
              <Box sx={{
                mt: 3, p: 2.5, borderRadius: 3,
                bgcolor: isLight ? 'rgba(14, 98, 69, 0.04)' : 'rgba(16, 185, 129, 0.06)',
                border: `1px solid ${isLight ? 'rgba(14, 98, 69, 0.12)' : 'rgba(16, 185, 129, 0.15)'}`,
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                  {FLAG_EMOJI[result.from]} {result.fromSymbol}{Number(result.amount).toLocaleString('en-IN')} {result.from}
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: isLight ? '#0E6245' : '#34D399', lineHeight: 1.2 }}>
                  {FLAG_EMOJI[result.to]} {result.toSymbol}{Number(result.converted).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  <Typography component="span" variant="body1" fontWeight={600} sx={{ ml: 1, color: 'text.secondary' }}>
                    {result.to}
                  </Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Rate: 1 {result.from} = {formatRate(result.rate)} {result.to}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Popular Rates Grid */}
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Popular Rates</Typography>
        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 6, sm: 3 }} key={i}>
                <Card className="glass-secondary"><CardContent><Skeleton height={60} /></CardContent></Card>
              </Grid>
            ))}
          </Grid>
        ) : rates ? (
          <Grid container spacing={2}>
            {POPULAR_PAIRS.map((pair) => {
              const ratesMap = rates.rates || {};
              // Calculate cross rate via USD base
              const fromRate = pair.from === 'USD' ? 1 : ratesMap[pair.from];
              const toRate = pair.to === 'USD' ? 1 : ratesMap[pair.to];
              const crossRate = fromRate && toRate ? toRate / fromRate : null;

              return (
                <Grid size={{ xs: 6, sm: 3 }} key={`${pair.from}-${pair.to}`}>
                  <Card
                    className="glass-secondary"
                    sx={{
                      borderRadius: 3, cursor: 'pointer',
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: isLight ? '#0E6245' : '#34D399' },
                    }}
                    onClick={() => {
                      setFromCurrency(pair.from);
                      setToCurrency(pair.to);
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                        <Typography fontSize="1.1rem">{FLAG_EMOJI[pair.from]}</Typography>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">→</Typography>
                        <Typography fontSize="1.1rem">{FLAG_EMOJI[pair.to]}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        {pair.from}/{pair.to}
                      </Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: isLight ? '#0E6245' : '#34D399' }}>
                        {crossRate ? formatRate(crossRate) : '—'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Typography color="text.secondary">Unable to load rates. Please try again.</Typography>
        )}

        {/* Rate table info */}
        {rates && (
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<Public sx={{ fontSize: 14 }} />}
              label={`Last updated: ${rates.date}`}
              size="small"
              sx={{ fontSize: '0.7rem', bgcolor: alpha(theme.palette.text.secondary, 0.08) }}
            />
            {rates.stale && (
              <Chip label="Cached rates (offline)" size="small" color="warning" sx={{ fontSize: '0.7rem' }} />
            )}
          </Box>
        )}
      </Box>
    </AppLayout>
  );
}
