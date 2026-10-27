'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  username?: string | null;
  avatarUrl: string | null;
  phone: string | null;
  defaultCurrency: string;
  timezone: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, meta?: { agreedToTerms?: boolean }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithGithub: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const userRef = useRef<User | null>(null);
  const sessionRef = useRef<Session | null>(null);

  const fetchProfile = useCallback(async (accessToken: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          try {
            localStorage.setItem('fairshare_user_profile', JSON.stringify(data.data));
          } catch {}
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, []);

  useEffect(() => {
    // Restore cached profile immediately on client mount
    try {
      const saved = localStorage.getItem('fairshare_user_profile');
      if (saved) setProfile(JSON.parse(saved));
    } catch {}

    // Get initial session quickly from local storage
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        sessionRef.current = currentSession;
        setSession(currentSession);
        userRef.current = currentSession?.user ?? null;
        setUser(currentSession?.user ?? null);

        // Fetch fresh profile in the background without blocking UI initialization
        if (currentSession?.access_token) {
          fetchProfile(currentSession.access_token);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        const prevUserId = userRef.current?.id;
        const nextUserId = newSession?.user?.id;

        // User signed out
        if (event === 'SIGNED_OUT' || !nextUserId) {
          userRef.current = null;
          sessionRef.current = null;
          setUser(null);
          setProfile(null);
          setSession(null);
          try {
            localStorage.removeItem('fairshare_user_profile');
          } catch {}
          return;
        }

        // Keep current session token fresh in state & ref
        sessionRef.current = newSession;
        setSession(newSession);

        // If the user identity is the same (e.g. tab switch, window focus, periodic token refresh)
        if (prevUserId === nextUserId) {
          // DO NOT call setUser(...) with a new object instance or re-fetch profile!
          // This keeps the user & profile references completely stable across tab switches,
          // preventing all pages from re-rendering and re-fetching.
          return;
        }

        // Only when the user actually changed (e.g. newly signed in user)
        userRef.current = newSession.user;
        setUser(newSession.user);

        if (newSession.access_token) {
          await fetchProfile(newSession.access_token);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    meta?: { agreedToTerms?: boolean }
  ) => {
    if (!isSupabaseConfigured()) {
      return {
        error:
          'Supabase API key is missing. Please copy your anon public key from Supabase Dashboard (Project Settings > API) and paste it into client/.env.local.',
      };
    }
    try {
      const emailRedirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            agreed_to_terms: meta?.agreedToTerms ?? true,
            terms_accepted_at: new Date().toISOString(),
            terms_version: '2026.1',
          },
          emailRedirectTo,
        },
      });

      if (error) {
        if (error.message.includes('API key') || error.message.includes('401')) {
          return {
            error:
              'Invalid Supabase API key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY in client/.env.local (from Supabase Dashboard > Settings > API).',
          };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred during signup.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error:
          'Supabase API key is missing. Please copy your anon public key from Supabase Dashboard (Project Settings > API) and paste it into client/.env.local.',
      };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('API key') || error.message.includes('401')) {
          return {
            error:
              'Invalid Supabase API key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY in client/.env.local.',
          };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred during sign in.' };
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      return {
        error:
          'Supabase API key is missing. Please copy your anon public key from Supabase Dashboard (Project Settings > API) and paste it into client/.env.local.',
      };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        if (error.message.includes('not enabled') || error.message.includes('validation_failed')) {
          return {
            error:
              'Google Sign-in is not enabled in your Supabase project. In Supabase Dashboard, go to Authentication > Sign In / Providers > Google, enable it, or use Email & Password instead.',
          };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch {
      return { error: 'Google sign-in failed. Please use Email & Password.' };
    }
  };

  const signInWithGithub = async () => {
    if (!isSupabaseConfigured()) {
      return {
        error:
          'Supabase API key is missing. Please copy your anon public key from Supabase Dashboard (Project Settings > API) and paste it into client/.env.local.',
      };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        if (error.message.includes('not enabled') || error.message.includes('validation_failed')) {
          return {
            error:
              'GitHub Sign-in is not enabled in your Supabase project. In Supabase Dashboard, go to Authentication > Sign In / Providers > GitHub, enable it, or use Email & Password instead.',
          };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch {
      return { error: 'GitHub sign-in failed. Please use Email & Password.' };
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error:
          'Supabase API key is missing. Please configure client/.env.local.',
      };
    }
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?type=recovery`
        : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to send password reset email.' };
    }
  };

  const updatePassword = async (password: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error:
          'Supabase API key is missing. Please configure client/.env.local.',
      };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to update password.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.access_token) {
      await fetchProfile(session.access_token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithGithub,
        signOut,
        refreshProfile,
        resetPasswordForEmail,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
