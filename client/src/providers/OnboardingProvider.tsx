'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';

export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  subtitle: string;
  description: string;
  gameTip: string;
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
  badge: string;
  iconType: 'quickadd' | 'radar' | 'settle' | 'workspaces' | 'fairscore';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'quick-add',
    targetSelector: '[data-tour="quick-add-bar"]',
    title: 'Natural Language Quick-Add',
    subtitle: 'Lightning-Fast Expense Logging',
    description: 'Log shared and personal expenses in seconds without filling out manual forms. Type naturally: "Pizza 1200 Goa Trip" or tap the microphone for instant speech recognition.',
    gameTip: 'Our regex parser auto-extracts the amount, category, and matching group on the fly.',
    preferredPlacement: 'bottom',
    badge: 'Quest 1 of 5',
    iconType: 'quickadd',
  },
  {
    id: 'financial-overview',
    targetSelector: '[data-tour="financial-overview"]',
    title: 'Real-Time Financial Radar',
    subtitle: 'Instant Net Equity & Cash Flow',
    description: 'Your net financial standing aggregated across all groups and friends. Real-time balance calculations guarantee zero penny-rounding discrepancies.',
    gameTip: 'Green indicates money owed to you; Red indicates your pending settlements.',
    preferredPlacement: 'bottom',
    badge: 'Quest 2 of 5',
    iconType: 'radar',
  },
  {
    id: 'settle-up',
    targetSelector: '[data-tour="settle-up-btn"]',
    title: 'Greedy Graph Debt Minimization',
    subtitle: 'Reduce Multi-Party Payments by 70%',
    description: 'Our mathematical graph solver eliminates circular debts between members. Tap Settle Up to generate instant peer UPI QR codes and deep links for zero-fee bank-to-bank settlement.',
    gameTip: 'No platform fees or wallet lock-in. Direct bank settlements in one tap.',
    preferredPlacement: 'bottom',
    badge: 'Quest 3 of 5',
    iconType: 'settle',
  },
  {
    id: 'sidebar-nav',
    targetSelector: '[data-tour="sidebar-nav"]',
    title: 'Workspaces & Financial Rail',
    subtitle: 'Unified Navigation Architecture',
    description: 'Easily navigate through shared Groups, individual Friends, Category Budgets, Recurring Subscriptions, and Audit Reports from this sleek sidebar.',
    gameTip: 'Tip: Press ⌘K or Ctrl+K anywhere to launch the Elastic Search palette.',
    preferredPlacement: 'right',
    badge: 'Quest 4 of 5',
    iconType: 'workspaces',
  },
  {
    id: 'fairscore-badge',
    targetSelector: '[data-tour="fairscore-badge"]',
    title: 'FairScore Reputation Engine',
    subtitle: 'Financial Karma & Payment Streaks',
    description: 'Building an on-time settlement streak boosts your reputation score, advancing your profile from Bronze to Diamond Tier.',
    gameTip: 'Timely settlements enhance your peer credit standing across all your circles.',
    preferredPlacement: 'bottom',
    badge: 'Quest 5 of 5',
    iconType: 'fairscore',
  },
];

interface OnboardingContextType {
  isTourActive: boolean;
  tourStepIndex: number;
  currentTourStep: TourStep | null;
  totalTourSteps: number;
  isAutoPlay: boolean;
  autoPlayProgress: number; // 0 to 100
  showWelcomePill: boolean;
  startTour: (startIndex?: number, autoPlay?: boolean) => void;
  pauseTour: () => void;
  resumeTour: () => void;
  toggleAutoPlay: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  jumpToStep: (stepIndex: number) => void;
  endTour: () => void;
  dismissWelcomePill: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STEP_DURATION_MS = 6000; // 6 seconds per step in auto-play mode

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);
  const [showWelcomePill, setShowWelcomePill] = useState(false);

  const storageKey = useMemo(() => {
    return user?.id ? `fairshare_tour_seen_${user.id}` : 'fairshare_tour_seen_guest';
  }, [user?.id]);

  // Check if user has already seen or dismissed the tour
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const seen = localStorage.getItem(storageKey);
      if (!seen && !authLoading && user) {
        // Show gentle, non-intrusive invite pill after 1 second on dashboard
        const timer = setTimeout(() => {
          setShowWelcomePill(true);
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        setShowWelcomePill(false);
      }
    } catch {
      setShowWelcomePill(false);
    }
  }, [storageKey, authLoading, user]);

  const dismissWelcomePill = useCallback(() => {
    setShowWelcomePill(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, 'dismissed');
      } catch {}
    }
  }, [storageKey]);

  const markTourSeen = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, 'completed');
      } catch {}
    }
  }, [storageKey]);

  const startTour = useCallback((startIndex = 0, autoPlay = true) => {
    setTourStepIndex(startIndex);
    setIsAutoPlay(autoPlay);
    setAutoPlayProgress(0);
    setIsTourActive(true);
    setShowWelcomePill(false);
  }, []);

  const endTour = useCallback(() => {
    setIsTourActive(false);
    setIsAutoPlay(false);
    setAutoPlayProgress(0);
    markTourSeen();
  }, [markTourSeen]);

  const nextTourStep = useCallback(() => {
    setAutoPlayProgress(0);
    setTourStepIndex((prev) => {
      if (prev + 1 < TOUR_STEPS.length) {
        return prev + 1;
      } else {
        // Tour completed
        endTour();
        return prev;
      }
    });
  }, [endTour]);

  const prevTourStep = useCallback(() => {
    setAutoPlayProgress(0);
    setTourStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const jumpToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
      setAutoPlayProgress(0);
      setTourStepIndex(stepIndex);
    }
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlay((prev) => !prev);
  }, []);

  const pauseTour = useCallback(() => {
    setIsAutoPlay(false);
  }, []);

  const resumeTour = useCallback(() => {
    setIsAutoPlay(true);
  }, []);

  // Auto-play progress countdown loop
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isTourActive || !isAutoPlay) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    const intervalTime = 50; // update progress every 50ms
    const stepIncrement = (intervalTime / STEP_DURATION_MS) * 100;

    autoPlayTimerRef.current = setInterval(() => {
      setAutoPlayProgress((prev) => {
        if (prev + stepIncrement >= 100) {
          // Advance to next step
          nextTourStep();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalTime);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isTourActive, isAutoPlay, nextTourStep]);

  const currentTourStep = isTourActive && TOUR_STEPS[tourStepIndex] ? TOUR_STEPS[tourStepIndex] : null;

  const value = useMemo(
    () => ({
      isTourActive,
      tourStepIndex,
      currentTourStep,
      totalTourSteps: TOUR_STEPS.length,
      isAutoPlay,
      autoPlayProgress,
      showWelcomePill,
      startTour,
      pauseTour,
      resumeTour,
      toggleAutoPlay,
      nextTourStep,
      prevTourStep,
      jumpToStep,
      endTour,
      dismissWelcomePill,
    }),
    [
      isTourActive,
      tourStepIndex,
      currentTourStep,
      isAutoPlay,
      autoPlayProgress,
      showWelcomePill,
      startTour,
      pauseTour,
      resumeTour,
      toggleAutoPlay,
      nextTourStep,
      prevTourStep,
      jumpToStep,
      endTour,
      dismissWelcomePill,
    ]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
