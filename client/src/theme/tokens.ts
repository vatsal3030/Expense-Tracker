/**
 * Owino Design System (ODS) — Centralized Design Tokens
 * Focus: High Performance, Clean Minimalist FinTech, High Contrast, Zero GPU Lag
 */

export const tokens = {
  colors: {
    // Canvas & Surfaces (Light)
    light: {
      canvas: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceSubtle: '#F1F5F9',
      border: '#E2E8F0',
      borderHover: '#CBD5E1',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
    },
    // Canvas & Surfaces (Dark)
    dark: {
      canvas: '#0A0E17',
      surface: '#121824',
      surfaceSubtle: '#1A2234',
      border: '#1E293B',
      borderHover: '#334155',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
    },
    // Financial Status (Universal & High Contrast)
    financial: {
      positive: '#059669', // You are owed (+)
      positiveBg: '#ECFDF5',
      positiveDark: '#10B981',
      positiveDarkBg: '#064E3B33',

      negative: '#DC2626', // You owe (-)
      negativeBg: '#FEF2F2',
      negativeDark: '#F43F5E',
      negativeDarkBg: '#88133733',

      neutral: '#475569', // Settled / ₹0
      neutralBg: '#F1F5F9',
      neutralDark: '#94A3B8',
      neutralDarkBg: '#1E293B',
    },
    // Brand
    brand: {
      primary: '#0D9488', // Teal 600
      primaryHover: '#0F766E', // Teal 700
      accent: '#14B8A6', // Teal 500
      lightBg: '#F0FDFA',
    },
  },
  typography: {
    fontSans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontHeading: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  radii: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
    cardHover: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    fast: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
    normal: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type ThemeTokens = typeof tokens;
