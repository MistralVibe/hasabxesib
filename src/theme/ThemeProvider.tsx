import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme, ResolvedScheme, ThemeMode, ThemeTokens } from './tokens';

interface ThemeContextValue {
  theme: ThemeTokens;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? 'light';
  const [mode, setMode] = useState<ThemeMode>('system');

  const value = useMemo<ThemeContextValue>(() => {
    const scheme: ResolvedScheme = mode === 'system' ? systemScheme : mode;
    return { theme: buildTheme(scheme), mode, setMode };
  }, [mode, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
