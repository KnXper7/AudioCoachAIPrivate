// Glass.js — "Liquid Glass" wrapper with a real glassy fallback that works TODAY.
//
// THREE-TIER STRATEGY (best available wins, nothing ever crashes):
//   1. iOS 26 + expo-glass-effect installed → real Apple Liquid Glass.
//   2. Otherwise, if expo-blur is available (you have it) → frosted BlurView glass.
//      Works right now on SDK 52, on Android, and on older iOS.
//   3. Last resort → a quiet translucent <View>.
//
// You do NOT need to upgrade Expo to use this. Ship it on SDK 52 today and it
// renders blur-glass; if you later move to SDK 54 + iOS 26 it auto-upgrades to
// true Liquid Glass with no code change.
//
// USAGE
//   import { Glass, GlassGroup } from '../components/Glass';
//   <Glass style={styles.card} radius={20} tint={theme.accent}>...</Glass>
//
// PROPS (Glass)
//   style          any View style (width/height/padding/borderRadius live here)
//   radius         convenience corner radius (number)
//   tint           optional tint/accent color string
//   interactive    bool — springy press reaction on real Liquid Glass (default true)
//   clear          bool — more transparent "clear" glass (default false)
//   intensity      blur strength for the BlurView fallback, 0–100 (default 40)
//   dark           bool — force dark blur tint (default true; set false in light mode)

import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';

// Tier 1: real Liquid Glass (only present after an SDK 54 upgrade).
let GE = null;
try { GE = require('expo-glass-effect'); } catch (e) { GE = null; }

// Tier 2: expo-blur (already in your dependencies).
let BLUR = null;
try { BLUR = require('expo-blur'); } catch (e) { BLUR = null; }

function liquidAvailable() {
  if (!GE || Platform.OS !== 'ios') return false;
  try {
    if (typeof GE.isLiquidGlassAvailable === 'function') return GE.isLiquidGlassAvailable();
    if (typeof GE.isGlassEffectAPIAvailable === 'function') return GE.isGlassEffectAPIAvailable();
  } catch (e) {}
  return false;
}

export const isLiquidGlass = liquidAvailable;

// One-time diagnostic so you can see in the Metro logs which tier is rendering.
let _logged = false;
function logTierOnce() {
  if (_logged) return;
  _logged = true;
  try {
    console.log(
      '[Glass] package loaded:', !!GE,
      '| liquid glass available:', liquidAvailable(),
      '| platform:', Platform.OS, String(Platform.Version)
    );
  } catch (e) {}
}

export function Glass({
  children,
  style,
  radius,
  tint,
  interactive = true,
  clear = false,
  intensity = 40,
  dark = true,
  ...rest
}) {
  const shape = radius != null ? { borderRadius: radius } : null;
  logTierOnce();

  // Tier 1 — real Apple Liquid Glass.
  if (liquidAvailable() && GE.GlassView) {
    const GlassView = GE.GlassView;
    return (
      <GlassView
        style={[shape, style]}
        glassEffectStyle={clear ? 'clear' : 'regular'}
        tintColor={tint}
        isInteractive={interactive}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  // Tier 2 — frosted BlurView glass (works on SDK 52 + Android, today).
  if (BLUR && BLUR.BlurView) {
    const BlurView = BLUR.BlurView;
    return (
      <BlurView
        intensity={intensity}
        tint={dark ? 'dark' : 'light'}
        // overflow:hidden is required so the blur respects rounded corners.
        style={[{ overflow: 'hidden' }, shape, style]}
        {...rest}
      >
        {/* faint tint/highlight behind content to sell the "glass" surface */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.25)' },
            tint ? { backgroundColor: tint, opacity: 0.12 } : null,
          ]}
        />
        {children}
      </BlurView>
    );
  }

  // Tier 3 — plain translucent surface.
  return (
    <View
      style={[
        { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
        shape,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

// GlassGroup merges nearby Glass panes on real Liquid Glass; elsewhere it's a
// simple spacing container so your layout is identical across tiers.
export function GlassGroup({ children, spacing = 0, style, ...rest }) {
  if (liquidAvailable() && GE.GlassContainer) {
    const GlassContainer = GE.GlassContainer;
    return (
      <GlassContainer spacing={spacing} style={style} {...rest}>
        {children}
      </GlassContainer>
    );
  }
  return (
    <View style={[{ gap: spacing }, style]} {...rest}>
      {children}
    </View>
  );
}

export default Glass;
