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

    // Verify token with Supabase
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
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
      // Update last login
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() },
      });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      supabaseId: supabaseUser.id,
    };

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
