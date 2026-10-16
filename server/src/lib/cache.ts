/**
 * Enterprise-Grade Multi-Tier Hybrid Cache Engine
 * Tier 1 (L1): In-Memory LRU Map (0ms latency, bounded memory, instantaneous)
 * Tier 2 (L2): Distributed Redis / Upstash (shared state, persistence across restarts)
 *
 * Automatic fallback: If Redis is unavailable or unconfigured, L1 in-memory seamlessly handles all traffic without errors.
 */

import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
}

class MultiTierCache {
  // L1: Fast In-Memory Store
  private memoryStore = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL_MS = 30 * 1000; // 30 seconds default
  private readonly MAX_MEMORY_KEYS = 3000;

  // L2: Redis / Upstash Client
  private upstashClient: UpstashRedis | null = null;
  private ioredisClient: Redis | null = null;
  private isRedisReady = false;
  private providerName = 'In-Memory LRU (L1)';

  constructor() {
    this.initClients();

    // L1 Garbage Collection: clean expired entries every 60 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryStore.entries()) {
        if (entry.expiresAt <= now) {
          this.memoryStore.delete(key);
        }
      }
    }, 60 * 1000).unref();
  }

  private initClients(): void {
    // 1. Prioritize Upstash REST credentials if provided
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
      try {
        this.upstashClient = new UpstashRedis({
          url: upstashUrl,
          token: upstashToken,
        });
        this.isRedisReady = true;
        this.providerName = 'Upstash Serverless Redis (L2)';
        console.log('🚀 [Cache Engine] Connected to Upstash Serverless Redis (L2).');
        return;
      } catch (err: any) {
        console.warn('⚠️ [Cache Engine] Failed to initialize Upstash client:', err.message);
      }
    }

    // 2. Fall back to standard REDIS_URL (Docker Redis, ElastiCache, or Upstash TCP)
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const cleanHost = redisUrl.split('@').pop()?.split('/')[0] || 'redis';
        this.ioredisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
          lazyConnect: true,
          enableOfflineQueue: false,
          retryStrategy: (times) => {
            if (times > 3) return null; // stop retry if server is offline
            return Math.min(times * 200, 1000);
          },
        });

        this.ioredisClient.on('connect', () => {
          this.isRedisReady = true;
          this.providerName = `Redis [${cleanHost}] (L2)`;
          console.log(`🚀 [Cache Engine] Connected to Redis (L2) at ${cleanHost}`);
        });

        this.ioredisClient.on('error', (_err) => {
          this.isRedisReady = false;
        });

        // Non-blocking connection attempt
        this.ioredisClient.connect().catch(() => {
          this.isRedisReady = false;
        });
      } catch (err: any) {
        console.warn('⚠️ [Cache Engine] Failed to initialize ioredis client:', err.message);
      }
    }
  }

  /**
   * Fast synchronous read from L1 Memory
   */
  getSync<T = any>(key: string): T | null {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Multi-tier async read:
   * 1. Check L1 Memory (0ms) -> if hit, return immediately
   * 2. Check L2 Redis/Upstash (if enabled) -> if hit, backfill L1 and return
   * 3. Return null on miss
   */
  async get<T = any>(key: string): Promise<T | null> {
    // 1. Check L1
    const localHit = this.getSync<T>(key);
    if (localHit !== null) return localHit;

    // 2. Check L2 (Upstash REST)
    if (this.upstashClient && this.isRedisReady) {
      try {
        const val = await this.upstashClient.get<T>(key);
        if (val !== null && val !== undefined) {
          // Back-populate L1 for 15s to minimize repeated network calls
          this.setMemory(key, val, 15000);
          return val;
        }
      } catch (_err) {
        // Silently fallback on Upstash error
      }
    }

    // 3. Check L2 (ioredis)
    if (this.ioredisClient && this.isRedisReady) {
      try {
        const raw = await this.ioredisClient.get(key);
        if (raw) {
          const parsed = JSON.parse(raw) as T;
          this.setMemory(key, parsed, 15000);
          return parsed;
        }
      } catch (_err) {
        // Silently fallback on ioredis error
      }
    }

    return null;
  }

  private setMemory<T = any>(key: string, data: T, ttlMs: number): void {
    if (this.memoryStore.size >= this.MAX_MEMORY_KEYS) {
      const oldestKey = this.memoryStore.keys().next().value;
      if (oldestKey) this.memoryStore.delete(oldestKey);
    }
    this.memoryStore.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Set cache entry across L1 (sync) and L2 (async in background)
   */
  set<T = any>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL_MS): void {
    // 1. Set L1 Memory immediately
    this.setMemory(key, data, ttlMs);

    const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));

    // 2. Set L2 Upstash asynchronously
    if (this.upstashClient && this.isRedisReady) {
      this.upstashClient.set(key, data, { ex: ttlSeconds }).catch(() => {});
    }

    // 3. Set L2 ioredis asynchronously
    if (this.ioredisClient && this.isRedisReady) {
      this.ioredisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds).catch(() => {});
    }
  }

  /**
   * Invalidate specific key
   */
  delete(key: string): void {
    this.memoryStore.delete(key);

    if (this.upstashClient && this.isRedisReady) {
      this.upstashClient.del(key).catch(() => {});
    }

    if (this.ioredisClient && this.isRedisReady) {
      this.ioredisClient.del(key).catch(() => {});
    }
  }

  /**
   * Invalidate all keys matching a prefix across L1 and L2
   */
  invalidatePrefix(prefix: string): void {
    // 1. Invalidate L1 memory
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryStore.delete(key);
      }
    }

    // 2. Invalidate Upstash
    if (this.upstashClient && this.isRedisReady) {
      this.upstashClient.keys(`${prefix}*`).then((keys) => {
        if (keys && keys.length > 0) {
          this.upstashClient!.del(...keys).catch(() => {});
        }
      }).catch(() => {});
    }

    // 3. Invalidate ioredis using SCAN stream
    if (this.ioredisClient && this.isRedisReady) {
      const stream = this.ioredisClient.scanStream({
        match: `${prefix}*`,
        count: 100,
      });
      stream.on('data', (keys: string[]) => {
        if (keys.length && this.ioredisClient) {
          this.ioredisClient.del(...keys).catch(() => {});
        }
      });
      stream.on('error', () => {});
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryStore.clear();
    if (this.ioredisClient && this.isRedisReady) {
      this.ioredisClient.flushdb().catch(() => {});
    }
  }

  getProviderInfo(): { provider: string; isRedisReady: boolean; memoryEntries: number } {
    return {
      provider: this.isRedisReady ? this.providerName : 'In-Memory LRU (Fallback active)',
      isRedisReady: this.isRedisReady,
      memoryEntries: this.memoryStore.size,
    };
  }
}

export const appCache = new MultiTierCache();
export default appCache;
