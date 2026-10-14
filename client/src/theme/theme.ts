'use client';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// ============================================================================
// FairShare Premium Design System
// ============================================================================

const baseTheme = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, letterSpacing: '0.01em' },
    subtitle2: { fontWeight: 500, letterSpacing: '0.01em' },
    button: { fontWeight: 600, textTransform: 'none' as const, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: 'none',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5558e6 0%, #7c4deb 100%)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '2px 8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateX(4px)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.8125rem',
        },
      },
    },
  },
};

// ============================================================================
// LIGHT THEME
// ============================================================================
export const lightTheme = responsiveFontSizes(
  createTheme({
    ...baseTheme,
    palette: {
      mode: 'light',
      primary: {
        main: '#6366f1',
        light: '#818cf8',
        dark: '#4f46e5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#ec4899',
        light: '#f472b6',
        dark: '#db2777',
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
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
      },
      background: {
        default: '#f8fafc',
        paper: '#ffffff',
      },
      text: {
        primary: '#1e293b',
        secondary: '#64748b',
      },
      divider: 'rgba(0, 0, 0, 0.06)',
    },
    components: {
      ...baseTheme.components,
      MuiCard: {
        styleOverrides: {
          root: {
            ...baseTheme.components?.MuiCard?.styleOverrides?.root,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.04)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            ...baseTheme.components?.MuiDrawer?.styleOverrides?.paper,
            backgroundColor: '#ffffff',
            borderRight: '1px solid rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
  } as any)
);

// ============================================================================
// DARK THEME
// ============================================================================
export const darkTheme = responsiveFontSizes(
  createTheme({
    ...baseTheme,
    palette: {
      mode: 'dark',
      primary: {
        main: '#818cf8',
        light: '#a5b4fc',
        dark: '#6366f1',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#f472b6',
        light: '#f9a8d4',
        dark: '#ec4899',
        contrastText: '#ffffff',
      },
      success: {
        main: '#34d399',
        light: '#6ee7b7',
        dark: '#10b981',
      },
      warning: {
        main: '#fbbf24',
        light: '#fde68a',
        dark: '#f59e0b',
      },
      error: {
        main: '#f87171',
        light: '#fca5a5',
        dark: '#ef4444',
      },
      info: {
        main: '#60a5fa',
        light: '#93c5fd',
        dark: '#3b82f6',
      },
      background: {
        default: '#0f172a',
        paper: '#1e293b',
      },
      text: {
        primary: '#f1f5f9',
        secondary: '#94a3b8',
      },
      divider: 'rgba(255, 255, 255, 0.08)',
    },
    components: {
      ...baseTheme.components,
      MuiCard: {
        styleOverrides: {
          root: {
            ...baseTheme.components?.MuiCard?.styleOverrides?.root,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)',
              transform: 'translateY(-2px)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            ...baseTheme.components?.MuiPaper?.styleOverrides?.root,
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            ...baseTheme.components?.MuiDrawer?.styleOverrides?.paper,
            backgroundColor: '#1e293b',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          ...baseTheme.components?.MuiButton?.styleOverrides,
          containedPrimary: {
            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            },
          },
        },
      },
    },
  } as any)
);
