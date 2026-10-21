import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import appCache from '../lib/cache';
import axios from 'axios';

export const fxRouter = Router();
fxRouter.use(authenticate);

// =============================================================================
// Supported currencies
// =============================================================================
const SUPPORTED_CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'AED', 'THB', 'JPY', 'SGD', 'AUD', 'CAD',
  'CHF', 'CNY', 'HKD', 'KRW', 'MYR', 'NZD', 'PHP', 'SEK', 'TWD', 'ZAR',
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', THB: '฿',
  JPY: '¥', SGD: 'S$', AUD: 'A$', CAD: 'C$', CHF: 'CHF', CNY: '¥',
  HKD: 'HK$', KRW: '₩', MYR: 'RM', NZD: 'NZ$', PHP: '₱', SEK: 'kr',
  TWD: 'NT$', ZAR: 'R',
};

// =============================================================================
// GET /api/fx/rates — Get latest exchange rates (cached hourly)
// =============================================================================
fxRouter.get('/rates', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const base = ((req.query.base as string) || 'USD').toUpperCase();

    // Check in-memory cache first (1 hour TTL)
    const cacheKey = `fx:rates:${base}`;
    const cached = appCache.getSync(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached, cached: true });
      return;
    }

    // Fetch from frankfurter.app (100% free, no API key)
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${base}`, {
      timeout: 8000,
    });

    const rates = response.data.rates;
    rates[base] = 1; // Add self-reference

    const result = {
      base,
      date: response.data.date,
      rates,
      currencies: SUPPORTED_CURRENCIES,
      symbols: CURRENCY_SYMBOLS,
    };

    // Cache for 1 hour
    appCache.set(cacheKey, result, 3600 * 1000);

    // Persist to database for offline access
    const upsertPromises = Object.entries(rates).map(([currency, rate]) =>
      prisma.exchangeRate.upsert({
        where: {
          baseCurrency_targetCurrency: {
            baseCurrency: base,
            targetCurrency: currency,
          },
        },
        update: {
          rate: new Decimal(rate as number),
          fetchedAt: new Date(),
        },
        create: {
          baseCurrency: base,
          targetCurrency: currency,
          rate: new Decimal(rate as number),
        },
      })
    );

    // Fire and forget DB persistence
    Promise.all(upsertPromises).catch((err) =>
      console.error('FX rate persist error:', err)
    );

    res.json({ success: true, data: result, cached: false });
  } catch (error: any) {
    console.error('Fetch FX rates error:', error?.message);

    // Fallback: Try database cached rates
    try {
      const base = ((req.query.base as string) || 'USD').toUpperCase();
      const dbRates = await prisma.exchangeRate.findMany({
        where: { baseCurrency: base },
      });

      if (dbRates.length > 0) {
        const rates: Record<string, number> = {};
        dbRates.forEach((r) => {
          rates[r.targetCurrency] = Number(r.rate);
        });

        res.json({
          success: true,
          data: {
            base,
            date: dbRates[0].fetchedAt.toISOString().slice(0, 10),
            rates,
            currencies: SUPPORTED_CURRENCIES,
            symbols: CURRENCY_SYMBOLS,
            stale: true,
          },
          cached: true,
        });
        return;
      }
    } catch {}

    res.status(503).json({
      success: false,
      error: 'Exchange rate service temporarily unavailable.',
    });
  }
});

// =============================================================================
// GET /api/fx/convert — Convert amount between currencies
// =============================================================================
fxRouter.get('/convert', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const from = ((req.query.from as string) || 'USD').toUpperCase();
    const to = ((req.query.to as string) || 'INR').toUpperCase();
    const amount = parseFloat(req.query.amount as string);

    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid amount.' });
      return;
    }

    if (from === to) {
      res.json({
        success: true,
        data: {
          from, to, amount,
          converted: amount,
          rate: 1,
          symbol: CURRENCY_SYMBOLS[to] || to,
        },
      });
      return;
    }

    // Try cache first
    const cacheKey = `fx:rates:${from}`;
    let rates: Record<string, number> | null = null;
    const cached = appCache.getSync(cacheKey);

    if (cached && (cached as any).rates) {
      rates = (cached as any).rates;
    } else {
      // Fetch live
      const response = await axios.get(
        `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
        { timeout: 8000 }
      );
      rates = response.data.rates;
    }

    const rate = rates?.[to];
    if (!rate) {
      res.status(400).json({ success: false, error: `Cannot convert ${from} to ${to}.` });
      return;
    }

    const converted = Math.round(amount * rate * 100) / 100;

    res.json({
      success: true,
      data: {
        from, to, amount,
        converted,
        rate,
        fromSymbol: CURRENCY_SYMBOLS[from] || from,
        toSymbol: CURRENCY_SYMBOLS[to] || to,
        display: `${CURRENCY_SYMBOLS[from] || ''}${amount.toLocaleString()} ${from} → ${CURRENCY_SYMBOLS[to] || ''}${converted.toLocaleString()} ${to}`,
      },
    });
  } catch (error: any) {
    console.error('FX convert error:', error?.message);
    res.status(503).json({ success: false, error: 'Conversion service temporarily unavailable.' });
  }
});

// =============================================================================
// GET /api/fx/currencies — List supported currencies
// =============================================================================
fxRouter.get('/currencies', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      currencies: SUPPORTED_CURRENCIES,
      symbols: CURRENCY_SYMBOLS,
    },
  });
});
