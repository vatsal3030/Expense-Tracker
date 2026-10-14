'use client';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// ============================================================================
// FairShare Production Design System — Emerald & Slate FinTech
// ============================================================================

const headingFontFamily = '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const bodyFontFamily = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const baseTheme = {
  typography: {
    fontFamily: bodyFontFamily,
    h1: { fontFamily: headingFontFamily, fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontFamily: headingFontFamily, fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontFamily: headingFontFamily, fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontFamily: headingFontFamily, fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontFamily: headingFontFamily, fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontFamily: headingFontFamily, fontWeight: 600, letterSpacing: '-0.005em' },
    subtitle1: { fontWeight: 500, letterSpacing: '0.005em' },
    subtitle2: { fontWeight: 500, letterSpacing: '0.005em' },
    button: { fontFamily: headingFontFamily, fontWeight: 600, textTransform: 'none' as const, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          fontSize: '0.875rem',
          boxShadow: 'none',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#059669',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#047857',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
          },
        },
        containedSecondary: {
          backgroundColor: '#334155',
          color: '#f8fafc',
          '&:hover': {
            backgroundColor: '#475569',
          },
        },
        outlined: {
          borderColor: '#1e293b',
          '&:hover': {
            borderColor: '#334155',
            backgroundColor: 'rgba(51, 65, 85, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'border-color 0.15s ease',
            '&:hover fieldset': {
              borderColor: '#334155',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#10b981',
              borderWidth: '1.5px',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
};

// ============================================================================
// DARK THEME (Default) — Emerald & Slate FinTech
// ============================================================================
export const darkTheme = responsiveFontSizes(
  createTheme({
    ...baseTheme,
    palette: {
      mode: 'dark',
      primary: {
        main: '#10b981', // Emerald 500
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#64748b', // Slate 500
        light: '#94a3b8',
        dark: '#334155',
        contrastText: '#f8fafc',
      },
      success: {
        main: '#10b981', // Emerald
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#f59e0b', // Amber
        light: '#fbbf24',
        dark: '#d97706',
        contrastText: '#ffffff',
      },
      error: {
        main: '#ef4444', // Crimson Red
        light: '#f87171',
        dark: '#dc2626',
        contrastText: '#ffffff',
      },
      background: {
        default: '#090d16', // Deep FinTech background
        paper: '#0f172a',   // Slate card surface
      },
      text: {
        primary: '#f8fafc',
        secondary: '#94a3b8',
      },
      divider: '#1e293b',
    },
    components: {
      ...baseTheme.components,
      MuiCard: {
        styleOverrides: {
          root: {
            ...baseTheme.components?.MuiCard?.styleOverrides?.root,
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
            '&:hover': {
              borderColor: '#334155',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: '#0f172a',
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#090d16',
            borderRight: '1px solid #1e293b',
          },
        },
      },
    },
  } as any)
);

// ============================================================================
// LIGHT THEME — Emerald & Clean Slate
// ============================================================================
export const lightTheme = responsiveFontSizes(
  createTheme({
    ...baseTheme,
    palette: {
      mode: 'light',
      primary: {
        main: '#059669', // Emerald 600
        light: '#10b981',
        dark: '#047857',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#475569', // Slate 600
        light: '#64748b',
        dark: '#1e293b',
        contrastText: '#ffffff',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      background: {
        default: '#f8fafc',
        paper: '#ffffff',
      },
      text: {
        primary: '#0f172a',
        secondary: '#64748b',
      },
      divider: '#e2e8f0',
    },
    components: {
      ...baseTheme.components,
      MuiCard: {
        styleOverrides: {
          root: {
            ...baseTheme.components?.MuiCard?.styleOverrides?.root,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            '&:hover': {
              borderColor: '#cbd5e1',
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
          },
        },
      },
    },
  } as any)
);
