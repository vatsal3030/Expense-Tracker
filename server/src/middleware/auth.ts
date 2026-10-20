import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../lib/supabase';
import prisma from '../lib/prisma';
import appCache from '../lib/cache';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    supabaseId: string;
  };
}

/**
 * High-Speed Authentication Middleware
 * 1. Checks in-memory L1 token cache (0.00ms)
 * 2. Uses in-flight deduplication to prevent 5-7 parallel requests from repeating verification
 * 3. Tries fast local JWT verification (0.05ms) before falling back to remote Supabase calls
 * 4. Caches dbUser in Redis & L1 cache to avoid repeated DB round-trips to Sydney
 */
interface CachedUserSession {
  user: {
    id: string;
    email: string;
    supabaseId: string;
  };
  expiresAt: number;
}

const TOKEN_CACHE_MAX = 5000;
const tokenCache = new Map<string, CachedUserSession>();
const inFlightAuth = new Map<string, Promise<{ id: string; email: string; supabaseId: string } | null>>();

// Periodic cleanup: evict expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenCache) {
    if (value.expiresAt <= now) tokenCache.delete(key);
  }
}, 5 * 60 * 1000).unref();

/**
 * Core verification worker with deduplication and caching
 */
async function verifyAndResolveUser(token: string): Promise<{ id: string; email: string; supabaseId: string } | null> {
  // 1. Check in-memory token cache
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  // 2. Fast decode token payload
  let supabaseId: string | null = null;
  let email: string | null = null;
  let tokenExpMs = Date.now() + 10 * 60 * 1000; // default 10 min window

  const decoded = jwt.decode(token) as any;
  if (decoded) {
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null; // Token already expired
    }
    if (decoded.exp) {
      tokenExpMs = decoded.exp * 1000;
    }
    supabaseId = decoded.sub || null;
    email = decoded.email || null;
  }

  // 3. Try local signature verification if secret is present
  let isSignatureVerified = false;
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && decoded) {
    try {
      jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      isSignatureVerified = true;
    } catch {
      // Signature mismatch with local secret — will verify via Supabase client below
    }
  }

  // 4. If not locally verified, verify with Supabase
  if (!isSignatureVerified) {
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !supabaseUser) {
      tokenCache.delete(token);
      return null;
    }
    supabaseId = supabaseUser.id;
    email = supabaseUser.email || email;
  }

  if (!supabaseId) {
    return null;
  }

  // 5. Retrieve or create user in our database with Redis/L1 cache
  const userCacheKey = `user:sub:${supabaseId}`;
  let dbUser = await appCache.get<{ id: string; email: string; supabaseId: string }>(userCacheKey);

  if (!dbUser) {
    let found = await prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true, email: true, supabaseId: true, lastLoginAt: true, username: true, name: true },
    });

    if (!found) {
      const base = (email ? email.split('@')[0] : 'user').toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
      const genUsername = `${base}_${Math.floor(100 + Math.random() * 900)}`;
      // Auto-create user on first authenticated request
      found = await prisma.user.create({
        data: {
          supabaseId,
          email: email || `${supabaseId}@fairshare.local`,
          name: email ? email.split('@')[0] : 'User',
          username: genUsername,
          lastLoginAt: new Date(),
        },
        select: { id: true, email: true, supabaseId: true, lastLoginAt: true, username: true, name: true },
      });
    } else {
      // Auto-backfill username if missing
      if (!found.username) {
        const base = (found.name || found.email || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
        const genUsername = `${base.slice(0, 15)}_${Math.floor(100 + Math.random() * 900)}`;
        prisma.user.update({
          where: { id: found.id },
          data: { username: genUsername },
        }).catch(() => {});
      }

      // Non-blocking update of last login timestamp
      const lastLogin = found.lastLoginAt ? new Date(found.lastLoginAt).getTime() : 0;
      if (Date.now() - lastLogin > 1000 * 60 * 30) {
        prisma.user.update({
          where: { id: found.id },
          data: { lastLoginAt: new Date() },
        }).catch(() => {});
      }
    }

    dbUser = {
      id: found.id,
      email: found.email,
      supabaseId,
    };

    // Cache user lookup for 15 minutes across L1 & Redis
    appCache.set(userCacheKey, dbUser, 15 * 60 * 1000);
  }

  const userPayload = {
    id: dbUser.id,
    email: dbUser.email,
    supabaseId,
  };

  // Cache token session in-memory for up to 10 minutes (bounded by token expiration)
  const ttl = Math.max(30 * 1000, Math.min(10 * 60 * 1000, tokenExpMs - Date.now()));
  if (tokenCache.size >= TOKEN_CACHE_MAX) {
    const entries = [...tokenCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    for (let i = 0; i < Math.floor(entries.length / 2); i++) tokenCache.delete(entries[i][0]);
  }
  tokenCache.set(token, {
    user: userPayload,
    expiresAt: Date.now() + ttl,
  });

  return userPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Check high-speed in-memory cache first (0.00ms)
    const cached = tokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.user;
      next();
      return;
    }

    // Deduplicate concurrent requests with the same token
    let authPromise = inFlightAuth.get(token);
    if (!authPromise) {
      authPromise = verifyAndResolveUser(token);
      inFlightAuth.set(token, authPromise);
      authPromise.finally(() => {
        inFlightAuth.delete(token);
      });
    }

    const userPayload = await authPromise;

    if (!userPayload) {
      tokenCache.delete(token);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please sign in again.',
      });
      return;
    }

    req.user = userPayload;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service unavailable.',
    });
  }
};

/**
 * Optional authentication — doesn't fail if no token is provided,
 * but populates req.user if a valid token exists.
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const userPayload = await verifyAndResolveUser(token);
    if (userPayload) {
      req.user = userPayload;
    }
    next();
  } catch {
    next();
  }
};
