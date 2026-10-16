/**
 * Fast In-Memory TTL Cache Engine for High-Performance Read Endpoints
 * Reduces database load and roundtrip latency down to sub-5ms
 */

interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL_MS = 20 * 1000; // 20 seconds default

  constructor() {
    // Periodic garbage collection every 60 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.expiresAt <= now) {
          this.store.delete(key);
        }
      }
    }, 60 * 1000).unref();
  }

  get<T = any>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T = any>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL_MS): void {
    // Bound memory to max 3000 entries
    if (this.store.size > 3000) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export const appCache = new MemoryCache();
export default appCache;
