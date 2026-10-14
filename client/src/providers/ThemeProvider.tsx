'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material';
import { lightTheme, darkTheme } from '@/theme/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const saved = localStorage.getItem('fairshare-theme') as ThemeMode;
    if (saved && (saved === 'light' || saved === 'dark')) {
      setMode(saved);
    } else {
      setMode('light');
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
  }, [mode]);

  const toggleTheme = () => {
    const applyToggle = () => {
      setMode((prev) => {
        const next = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('fairshare-theme', next);
        return next;
      });
    };

    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.document?.startViewTransition) {
        win.document.startViewTransition(applyToggle);
      } else {
        const wave = win.document?.createElement('div');
        if (wave && win.document?.body) {
          wave.className = 'ocean-wave-active';
          win.document.body.appendChild(wave);
          setTimeout(() => wave.remove(), 750);
        }
        applyToggle();
      }
    } else {
      applyToggle();
    }
  };

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('fairshare-theme', newMode);
  };

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode: handleSetMode }}>
      <MUIThemeProvider theme={theme}>
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
}
