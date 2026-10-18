import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../lib/prisma';
import supabaseAdmin from '../lib/supabase';
import appCache from '../lib/cache';

export const authRouter = Router();

// POST /api/auth/signup — Register a new user
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

authRouter.post(
  '/signup',
  validate({ body: signupSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(409).json({ success: false, error: 'An account with this email already exists.' });
        return;
      }

      // Create user in Supabase
      const { data: supabaseData, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      });

      if (supabaseError) {
        res.status(400).json({ success: false, error: supabaseError.message });
        return;
      }

      // Create user in our database
      const user = await prisma.user.create({
        data: {
          email,
          name,
          supabaseId: supabaseData.user.id,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: 'Account created successfully!',
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ success: false, error: 'Failed to create account. Please try again.' });
    }
  }
);

// POST /api/auth/login — Sign in with email/password
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

authRouter.post(
  '/login',
  validate({ body: loginSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        res.status(401).json({ success: false, error: 'Invalid email or password.' });
        return;
      }

      // Update last login
      await prisma.user.updateMany({
        where: { supabaseId: data.user.id },
        data: { lastLoginAt: new Date() },
      });

      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
      });

      res.json({
        success: true,
        data: {
          user: {
            id: dbUser?.id,
            email: dbUser?.email,
            name: dbUser?.name,
            avatarUrl: dbUser?.avatarUrl,
          },
          session: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at,
          },
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
    }
  }
);

// POST /api/auth/refresh — Refresh access token
authRouter.post('/refresh', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token is required.' });
      return;
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      res.status(401).json({ success: false, error: 'Invalid refresh token.' });
      return;
    }

    res.json({
      success: true,
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    });
  } catch (error: any) {
    console.error('Refresh error:', error);
    res.status(500).json({ success: false, error: 'Token refresh failed.' });
  }
});

// GET /api/auth/me — Get current user info (cached for 10 minutes)
authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = `user:profile:${req.user!.id}`;
    const cached = await appCache.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        defaultCurrency: true,
        timezone: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    appCache.set(cacheKey, user, 10 * 60 * 1000);
    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user info.' });
  }
});

// POST /api/auth/logout — Sign out
authRouter.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      await supabaseAdmin.auth.admin.signOut(token);
    }

    if (req.user?.id) {
      appCache.delete(`user:profile:${req.user.id}`);
      appCache.delete(`user:sub:${req.user.supabaseId}`);
    }

    res.json({ success: true, message: 'Signed out successfully.' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.json({ success: true, message: 'Signed out.' });
  }
});
