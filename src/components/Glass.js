// Glass.js — "Liquid Glass" material, correctly clipped to its shape.
//
// KEY CONVENTION: glass is a *material*, so it must be clipped to a rounded
// shape. We render the effect (GlassView or BlurView) as an absolute-fill layer
// INSIDE an `overflow: 'hidden'` rounded container, with content on top. That
// guarantees capsules/circles/rounded-rects instead of squares, in every tier.
//
// THREE TIERS (best available wins, never crashes):
//   1. iOS 26 + expo-glass-effect → real Apple Liquid Glass.
//   2. else expo-blur → frosted blur glass (SDK 52, Android, older iOS).
//   3. else → translucent View.
//
// PROPS (Glass)
//   style       layout (width/height/padding/flex/border). borderRadius here or
//               via `radius` is used as the clip shape.
//   radius      corner radius (number). For a circle pass size/2.
//   tint        tint/accent color for the glass (don't match it to your text!).
//   clear       true = more transparent "clear" glass; false = "regular".
//   interactive springy press reaction on real Liquid Glass (default true).
//   intensity   blur strength for the fallback, 0–100 (default 40).
//   dark        dark vs light blur tint (default true).

import React from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';

let GE = null;
try { GE = require('expo-glass-effect'); } catch (e) { GE = null; }

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
  logTierOnce();

  const flat = StyleSheet.flatten(style) || {};
  const br = radius != null ? radius : (flat.borderRadius != null ? flat.borderRadius : 0);
  // Container carries layout + clips the material to the rounded shape.
  const container = [style, { borderRadius: br, overflow: 'hidden' }];

  // Tier 1 — real Apple Liquid Glass as a clipped fill layer.
  if (liquidAvailable() && GE.GlassView) {
    const GlassView = GE.GlassView;
    return (
      <View style={container} {...rest}>
        <GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle={clear ? 'clear' : 'regular'}
          tintColor={tint}
          isInteractive={interactive}
        />
        {children}
      </View>
    );
  }

  // Tier 2 — frosted blur as a clipped fill layer.
  if (BLUR && BLUR.BlurView) {
    const BlurView = BLUR.BlurView;
    return (
      <View style={container} {...rest}>
        <BlurView intensity={intensity} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.18)' },
            tint ? { backgroundColor: tint, opacity: 0.2 } : null,
          ]}
        />
        {children}
      </View>
    );
  }

  // Tier 3 — translucent surface.
  return (
    <View style={[container, { backgroundColor: tint || (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') }]} {...rest}>
      {children}
    </View>
  );
}

// GlassGroup merges nearby panes on real Liquid Glass; else a spacing container.
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

// GlassCircle — a perfectly round Liquid Glass button (X close, play, etc.).
// Uses real glass on iOS 26; otherwise a plain circle styled by `fallbackStyle`.
export function GlassCircle({
  size = 40,
  onPress,
  children,
  tint,
  clear = true,
  interactive = true,
  dark = true,
  style,
  fallbackStyle,
  disabled,
  hitSlop,
}) {
  const base = { width: size, height: size, alignItems: 'center', justifyContent: 'center' };
  const surface = liquidAvailable()
    ? (
      <Glass radius={size / 2} clear={clear} tint={tint} interactive={interactive} dark={dark} style={[base, style]}>
        {children}
      </Glass>
    )
    : (
      <View style={[base, { borderRadius: size / 2, overflow: 'hidden' }, fallbackStyle, style]}>{children}</View>
    );

  if (!onPress) return surface;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.8 : 1 })}
    >
      {surface}
    </Pressable>
  );
}

export default Glass;
