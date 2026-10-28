'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { useDataRefresh } from '@/lib/events';

export interface GamificationData {
  fairScore: number;
  streakDays: number;
  tier: string;
  tierColor: string;
  scoreBreakdown?: {
    settlementDiscipline: number;
    transparency: number;
    collaboration: number;
    consistency: number;
  };
  badges?: any[];
  leaderboard?: any[];
}

let cachedGamification: GamificationData | null = null;
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('fairshare_gamification_cache');
    if (stored) {
      cachedGamification = JSON.parse(stored);
    }
  } catch {}
}

const listeners = new Set<(data: GamificationData) => void>();
let inFlightGamificationPromise: Promise<void> | null = null;
let lastGamificationFetch = 0;
const THROTTLE_INTERVAL_MS = 60 * 1000; // 60s throttle for background revalidations

function notifyListeners(data: GamificationData) {
  cachedGamification = data;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('fairshare_gamification_cache', JSON.stringify(data));
    } catch {}
  }
  listeners.forEach((listener) => listener(data));
}

export function useGamification() {
  const { session } = useAuth();
  const [data, setData] = useState<GamificationData | null>(cachedGamification);
  const [loading, setLoading] = useState(!cachedGamification);

  const fetchGamification = useCallback(async (force = false) => {
    if (!session?.access_token) return;
    const now = Date.now();
    if (!force && now - lastGamificationFetch < THROTTLE_INTERVAL_MS && cachedGamification) {
      return;
    }
    if (inFlightGamificationPromise) {
      return inFlightGamificationPromise;
    }

    inFlightGamificationPromise = (async () => {
      try {
        const res = await api.get('/dashboard/gamification');
        if (res.data?.success && res.data?.data) {
          lastGamificationFetch = Date.now();
          notifyListeners(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to fetch gamification data:', err);
      } finally {
        inFlightGamificationPromise = null;
        setLoading(false);
      }
    })();

    return inFlightGamificationPromise;
  }, [session?.access_token]);

  useEffect(() => {
    const handleUpdate = (updated: GamificationData) => {
      setData(updated);
      setLoading(false);
    };

    listeners.add(handleUpdate);
    if (!cachedGamification && session?.access_token) {
      fetchGamification(true);
    } else if (session?.access_token) {
      // Revalidate in background (throttled)
      fetchGamification(false);
    }

    return () => {
      listeners.delete(handleUpdate);
    };
  }, [session?.access_token, fetchGamification]);

  useDataRefresh(
    useCallback(
      (detail?: any) => {
        if (detail?.type === 'expense' || detail?.type === 'settlement' || detail?.type === 'all') {
          fetchGamification(true);
        }
      },
      [fetchGamification]
    )
  );

  return {
    data,
    fairScore: data?.fairScore ?? (cachedGamification?.fairScore ?? 500),
    streakDays: data?.streakDays ?? (cachedGamification?.streakDays ?? 1),
    tier: data?.tier ?? (cachedGamification?.tier ?? 'Silver'),
    tierColor: data?.tierColor ?? (cachedGamification?.tierColor ?? '#60a5fa'),
    loading,
    refresh: fetchGamification,
  };
}
