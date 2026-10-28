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
    fontSize: 14,
    h1: { fontFamily: headingFontFamily, fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.028em', lineHeight: 1.2 },
    h2: { fontFamily: headingFontFamily, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.022em', lineHeight: 1.25 },
    h3: { fontFamily: headingFontFamily, fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.018em', lineHeight: 1.3 },
    h4: { fontFamily: headingFontFamily, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.35 },
    h5: { fontFamily: headingFontFamily, fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4 },
    h6: { fontFamily: headingFontFamily, fontSize: '0.875rem', fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.4 },
    body1: { fontSize: '0.875rem', lineHeight: 1.5, letterSpacing: '-0.01em' },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5, letterSpacing: '-0.005em' },
    subtitle1: { fontSize: '0.875rem', fontWeight: 500, letterSpacing: '-0.005em' },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '-0.005em' },
    caption: { fontSize: '0.75rem', lineHeight: 1.4, letterSpacing: '0.02em', fontWeight: 500 },
    button: { fontFamily: headingFontFamily, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none' as const, letterSpacing: '-0.005em' },
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
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#059669',
          color: '#ffffff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.20)',
          '&:hover': {
            backgroundColor: '#047857',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.24)',
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
          borderRadius: 18,
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
          letterSpacing: '0.01em',
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
          borderRadius: 22,
          '@media (max-width: 600px)': {
            margin: '12px !important',
            width: 'calc(100% - 24px) !important',
            maxWidth: 'calc(100% - 24px) !important',
            maxHeight: 'calc(100% - 32px) !important',
            borderRadius: '18px !important',
          },
        },
      },
    },
  },
};

// ============================================================================
// DARK THEME (Default) — Emerald & Slate Liquid Glassmorphism
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
        default: '#080A0D', // Deep optical obsidian spatial canvas
        paper: 'rgba(15, 22, 34, 0.40)', // High-translucency liquid glass base
      },
      text: {
        primary: '#F8FAFC',
        secondary: '#94A3B8',
      },
      divider: 'rgba(255, 255, 255, 0.08)',
    },
    components: {
      ...baseTheme.components,
      MuiInputBase: {
        styleOverrides: {
          root: {
            '& input[type="date"]::-webkit-calendar-picker-indicator, & input[type="datetime-local"]::-webkit-calendar-picker-indicator, & input[type="time"]::-webkit-calendar-picker-indicator': {
              filter: 'invert(1) brightness(1.8) contrast(1.2) !important',
              cursor: 'pointer',
              opacity: 0.95,
            },
          },
          input: {
            '&[type="date"]::-webkit-calendar-picker-indicator, &[type="datetime-local"]::-webkit-calendar-picker-indicator, &[type="time"]::-webkit-calendar-picker-indicator': {
              filter: 'invert(1) brightness(1.8) contrast(1.2) !important',
              cursor: 'pointer',
              opacity: 0.95,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& input[type="date"]::-webkit-calendar-picker-indicator, & input[type="datetime-local"]::-webkit-calendar-picker-indicator, & input[type="time"]::-webkit-calendar-picker-indicator': {
              filter: 'invert(1) brightness(1.8) contrast(1.2) !important',
              cursor: 'pointer',
              opacity: 0.95,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            ...baseTheme.components?.MuiCard?.styleOverrides?.root,
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.015) 22%, rgba(15, 22, 34, 0.40) 55%, rgba(10, 14, 22, 0.50) 100%)',
            backdropFilter: 'blur(20px) saturate(180%) contrast(102%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%) contrast(102%)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderTopColor: 'rgba(255, 255, 255, 0.24)',
            borderLeftColor: 'rgba(255, 255, 255, 0.14)',
            borderRightColor: 'rgba(255, 255, 255, 0.06)',
            borderBottomColor: 'rgba(255, 255, 255, 0.03)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.24), inset 1px 0 0 0 rgba(255, 255, 255, 0.07), inset 0 -1px 0 0 rgba(0, 0, 0, 0.45), 0 16px 38px -8px rgba(0, 0, 0, 0.52), 0 2px 8px -1px rgba(0, 0, 0, 0.35)',
            transition: 'border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.18)',
              borderTopColor: 'rgba(255, 255, 255, 0.38)',
              borderLeftColor: 'rgba(255, 255, 255, 0.22)',
              boxShadow: 'inset 0 1.5px 0 0 rgba(255, 255, 255, 0.32), inset 1px 0 0 0 rgba(255, 255, 255, 0.10), inset 0 -1px 0 0 rgba(0, 0, 0, 0.50), 0 22px 50px -10px rgba(0, 0, 0, 0.65), 0 4px 14px -2px rgba(0, 0, 0, 0.40)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.018) 22%, rgba(15, 22, 34, 0.38) 55%, rgba(10, 14, 22, 0.48) 100%)',
            backdropFilter: 'blur(20px) saturate(190%) contrast(106%)',
            WebkitBackdropFilter: 'blur(20px) saturate(190%) contrast(106%)',
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: 'linear-gradient(180deg, rgba(14, 20, 30, 0.75) 0%, rgba(9, 13, 20, 0.68) 100%)',
            backdropFilter: 'blur(28px) saturate(200%) contrast(106%)',
            WebkitBackdropFilter: 'blur(28px) saturate(200%) contrast(106%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '10px 0 40px -8px rgba(0, 0, 0, 0.65), 2px 0 12px -2px rgba(0, 0, 0, 0.45)',
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(4, 6, 12, 0.72)',
            backdropFilter: 'none !important',
            WebkitBackdropFilter: 'none !important',
          },
        },
      },
      MuiModal: {
        styleOverrides: {
          backdrop: {
            backdropFilter: 'none !important',
            WebkitBackdropFilter: 'none !important',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 22,
            background: 'linear-gradient(160deg, rgba(16, 22, 34, 0.88) 0%, rgba(10, 14, 22, 0.84) 100%)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTopColor: 'rgba(255, 255, 255, 0.32)',
            borderLeftColor: 'rgba(255, 255, 255, 0.20)',
            boxShadow: 'inset 0 1.5px 0 0 rgba(255, 255, 255, 0.30), inset 0 -1px 0 0 rgba(0, 0, 0, 0.50), 0 32px 80px -16px rgba(0, 0, 0, 0.85), 0 10px 28px -4px rgba(0, 0, 0, 0.50)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            background: 'linear-gradient(160deg, rgba(16, 22, 32, 0.92) 0%, rgba(10, 14, 20, 0.88) 100%)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTopColor: 'rgba(255, 255, 255, 0.28)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 0 rgba(0, 0, 0, 0.40), 0 20px 48px -8px rgba(0, 0, 0, 0.70), 0 4px 14px -2px rgba(0, 0, 0, 0.40)',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.10)' },
            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.20)' },
            '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: '1.5px' },
          },
        },
      },
    },
  } as any)
);

// ============================================================================
// LIGHT THEME (Default) — Warm Translucent Ivory Canvas, Apple Liquid Glass
// ============================================================================
export const lightTheme = responsiveFontSizes(
  createTheme({
    ...baseTheme,
    palette: {
      mode: 'light',
      primary: {
        main: '#059669', // Vibrant Emerald 600
        light: '#10b981',
        dark: '#047857',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#1F2937', // Deep Charcoal Slate
        light: '#4B5563',
        dark: '#111827',
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
        default: '#F8FAFC', // Crisp porcelain / slate canvas
        paper: 'rgba(255, 255, 255, 0.72)', // High-translucency glass surface
      },
      text: {
        primary: '#0F172A',
        secondary: '#475569',
      },
      divider: 'rgba(0, 0, 0, 0.06)',
    },
    components: {
      ...baseTheme.components,
      MuiInputBase: {
        styleOverrides: {
          root: {
            '& input[type="date"]::-webkit-calendar-picker-indicator, & input[type="datetime-local"]::-webkit-calendar-picker-indicator, & input[type="time"]::-webkit-calendar-picker-indicator': {
              filter: 'invert(1) brightness(1.8) contrast(1.2) !important',
              cursor: 'pointer',
              opacity: 0.95,
            },
          },
          input: {
            '&[type="date"]::-webkit-calendar-picker-indicator, &[type="datetime-local"]::-webkit-calendar-picker-indicator, &[type="time"]::-webkit-calendar-picker-indicator': {
              filter: 'invert(1) brightness(1.8) contrast(1.2) !important',
              cursor: 'pointer',
              opacity: 0.95,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& input[type="date"]::-webkit-calendar-picker-indicator, & input[type="datetime-local"]::-webkit-calendar-picker-indicator, & input[type="time"]::-webkit-calendar-picker-indicator': {
              filter: 'invert(1) brightness(1.8) contrast(1.2) !important',
              cursor: 'pointer',
              opacity: 0.95,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            ...baseTheme.components?.MuiCard?.styleOverrides?.root,
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.46) 35%, rgba(244, 247, 252, 0.38) 100%)',
            backdropFilter: 'blur(20px) saturate(180%) contrast(102%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%) contrast(102%)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            borderTopColor: 'rgba(255, 255, 255, 0.98)',
            borderLeftColor: 'rgba(255, 255, 255, 0.90)',
            borderRightColor: 'rgba(255, 255, 255, 0.70)',
            borderBottomColor: 'rgba(226, 232, 240, 0.55)',
            borderRadius: 18,
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.98), inset 1px 0 0 0 rgba(255, 255, 255, 0.65), inset 0 -1px 0 0 rgba(0, 0, 0, 0.03), 0 12px 32px -8px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
            transition: 'border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.14)',
              borderTopColor: 'rgba(0, 0, 0, 0.20)',
              boxShadow: 'inset 0 1.5px 0 0 rgba(255, 255, 255, 1), 0 18px 42px -8px rgba(15, 23, 42, 0.09), 0 2px 8px -1px rgba(15, 23, 42, 0.04)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.46) 35%, rgba(244, 247, 252, 0.38) 100%)',
            backdropFilter: 'blur(20px) saturate(180%) contrast(102%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%) contrast(102%)',
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.86) 0%, rgba(248, 250, 254, 0.78) 100%)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            borderRight: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '6px 0 28px -6px rgba(15, 23, 42, 0.07)',
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'none !important',
            WebkitBackdropFilter: 'none !important',
          },
        },
      },
      MuiModal: {
        styleOverrides: {
          backdrop: {
            backdropFilter: 'none !important',
            WebkitBackdropFilter: 'none !important',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 22,
            background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 252, 0.90) 100%)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.98)',
            borderTopColor: '#ffffff',
            boxShadow: 'inset 0 1.5px 0 0 rgba(255, 255, 255, 1), 0 32px 75px -12px rgba(15, 23, 42, 0.18), 0 8px 24px -2px rgba(15, 23, 42, 0.08)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 252, 0.90) 100%)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.90)',
            borderTopColor: '#ffffff',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 1), 0 18px 45px -8px rgba(15, 23, 42, 0.12), 0 4px 12px -1px rgba(15, 23, 42, 0.06)',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& fieldset': { borderColor: '#E5E7EB' },
            '&:hover fieldset': { borderColor: '#9CA3AF' },
            '&.Mui-focused fieldset': { borderColor: '#059669', borderWidth: '1.5px' },
          },
        },
      },
    },
  } as any)
);
