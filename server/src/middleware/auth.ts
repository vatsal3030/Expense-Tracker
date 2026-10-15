import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import prisma from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    supabaseId: string;
  };
}

/**
 * Authentication middleware that validates Supabase JWT tokens
 * and attaches the user to the request object.
 */
// Fast in-memory token cache (3 minute TTL) to eliminate redundant network roundtrips to Supabase
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

// Periodic cleanup: evict expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenCache) {
    if (value.expiresAt <= now) tokenCache.delete(key);
  }
}, 5 * 60 * 1000).unref(); // .unref() so this timer doesn't prevent graceful shutdown

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

    // Check high-speed in-memory cache first
    const cached = tokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.user;
      next();
      return;
    }

    // Verify token with Supabase
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      tokenCache.delete(token);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please sign in again.',
      });
      return;
    }

    // Find or create user in our database
    let dbUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!dbUser) {
      // Auto-create user on first authenticated request
      dbUser = await prisma.user.create({
        data: {
          supabaseId: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.full_name || 
                supabaseUser.user_metadata?.name || 
                supabaseUser.email!.split('@')[0],
          avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Update last login timestamp asynchronously without blocking the request
      const lastLogin = dbUser.lastLoginAt ? new Date(dbUser.lastLoginAt).getTime() : 0;
      if (Date.now() - lastLogin > 1000 * 60 * 30) {
        prisma.user.update({
          where: { id: dbUser.id },
          data: { lastLoginAt: new Date() },
        }).catch((err) => console.error('Background lastLogin update error:', err));
      }
    }

    const userPayload = {
      id: dbUser.id,
      email: dbUser.email,
      supabaseId: supabaseUser.id,
    };

    req.user = userPayload;

    // Cache valid session for 3 minutes (with size cap to prevent memory leaks)
    if (tokenCache.size >= TOKEN_CACHE_MAX) {
      const entries = [...tokenCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      for (let i = 0; i < Math.floor(entries.length / 2); i++) tokenCache.delete(entries[i][0]);
    }
    tokenCache.set(token, {
      user: userPayload,
      expiresAt: Date.now() + 1000 * 60 * 3,
    });

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
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && supabaseUser) {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: supabaseUser.id },
      });

      if (dbUser) {
        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          supabaseId: supabaseUser.id,
        };
      }
    }

    next();
  } catch {
    next();
  }
};
