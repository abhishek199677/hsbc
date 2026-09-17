'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { tokens as stitchTokens } from './tokens';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  toggleTheme: () => void;
  tokens: typeof stitchTokens;
}

export function useTheme(): ThemeContextType {
  const [isDark, setIsDark] = useState(true); // Default to dark mode for Stitch aesthetic

  useEffect(() => {
    // Check for saved preference or system preference
    const saved = localStorage.getItem('stitch-theme');
    if (saved) {
      setIsDark(saved === 'dark');
    } else {
      // Default to dark for Stitch brutalist aesthetic
      setIsDark(true);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  useEffect(() => {
    localStorage.setItem('stitch-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const value = useMemo(() => ({
    theme: (isDark ? 'dark' : 'light') as Theme,
    isDark,
    setIsDark,
    toggleTheme,
    tokens: stitchTokens,
  }), [isDark, setIsDark, toggleTheme]);

  return value;
}

export default useTheme;
