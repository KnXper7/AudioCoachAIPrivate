// ThemeContext.js — exposes theme + tweak controls (dark mode, accent, scoreMode)
import React, { createContext, useContext, useMemo, useState } from 'react';
import { makeTheme, ACCENTS } from './theme';

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);
  const [accent, setAccent] = useState(ACCENTS[0]);
  // scoreMode: 'bar' | 'ring' | 'number' | 'tier'  (matches design Tweaks panel)
  const [scoreMode, setScoreMode] = useState('bar');

  const theme = useMemo(() => makeTheme({ dark, accent }), [dark, accent]);

  const value = useMemo(
    () => ({ theme, scoreMode, setScoreMode, dark, setDark, accent, setAccent }),
    [theme, scoreMode, dark, accent]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx).theme;
export const useTweaks = () => useContext(ThemeCtx);
