'use client';

import { useEffect } from 'react';

export const DATA_REFRESH_EVENT = 'fairshare:data-refresh';

export interface DataRefreshDetail {
  type?: 'expense' | 'settlement' | 'group' | 'notification' | 'all';
  data?: any;
}

/**
 * Triggers an instant data refresh across all active components/pages in the application.
 */
export function triggerDataRefresh(detail?: DataRefreshDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_REFRESH_EVENT, { detail }));
  }
}

/**
 * React hook to listen for instant data refresh events (from local actions or Socket.io events).
 */
export function useDataRefresh(onRefresh: (detail?: DataRefreshDetail) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<DataRefreshDetail>;
      onRefresh(customEvent.detail);
    };

    window.addEventListener(DATA_REFRESH_EVENT, handler);
    return () => {
      window.removeEventListener(DATA_REFRESH_EVENT, handler);
    };
  }, [onRefresh]);
}
