// ThemeContext.js — theme preference (system | light | dark), persisted.
// Defaults to 'system' so the app matches the device on first launch.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeTheme } from './theme';

const ThemeCtx = createContext(null);
const KEY = 'audiocoach_theme_pref_v1';

export function ThemeProvider({ children }) {
  const system = useColorScheme(); // 'light' | 'dark' | null, updates live
  const [pref, setPref] = useState('system'); // 'system' | 'light' | 'dark'
  const [scoreMode, setScoreMode] = useState('bar');

  // load saved preference once
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(KEY);
        if (v) setPref(v);
      } catch (e) {}
    })();
  }, []);

  const setThemePref = (p) => {
    setPref(p);
    AsyncStorage.setItem(KEY, p).catch(() => {});
  };

  const sys = system || Appearance.getColorScheme() || 'dark';
  const dark = pref === 'system' ? sys === 'dark' : pref === 'dark';
  const theme = useMemo(() => makeTheme({ dark }), [dark]);

  const value = useMemo(
    () => ({ theme, dark, pref, setThemePref, scoreMode, setScoreMode }),
    [theme, dark, pref, scoreMode]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx).theme;
export const useTweaks = () => useContext(ThemeCtx);
