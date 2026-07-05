import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, statusColors, syncColors, type ThemeColors } from './colors';
import type { TaskStatus, SyncStatus } from '../types';

const THEME_KEY = '@fieldtasks/theme';

type ThemeName = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeName;
  colors: ThemeColors;
  statusColor: (status: TaskStatus) => string;
  syncColor: (status: SyncStatus) => string;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeName>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark') setTheme(stored);
      })
      .catch(() => {
        // fall back to the system scheme already set in state
      });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: theme === 'dark' ? darkColors : lightColors,
      statusColor: (status) => statusColors[status][theme],
      syncColor: (status) => syncColors[status][theme],
      toggleTheme,
    }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
