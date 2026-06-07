// Glass.js — minimal, documentation-faithful Liquid Glass helpers.
//
// Philosophy: use the REAL native glass (expo-glass-effect's GlassView) only on
// iOS 26. Anywhere a native glass fit doesn't make sense, callers simply render
// their original (Android) design. No blur tiers, no hand-clipped surfaces —
// those caused the square/clipping/hidden-text bugs.
//
// Per Expo docs, GlassView honours `borderRadius` in its own style (capsule via
// 999, circle via size/2), and supports `glassEffectStyle` ('regular'|'clear'),
// `tintColor`, and `isInteractive`.
import React from 'react';
import { View, Pressable, Platform } from 'react-native';

let GE = null;
try { GE = require('expo-glass-effect'); } catch (e) { GE = null; }

// True only when real Apple Liquid Glass is available (iOS 26, built w/ Xcode 26).
export function isLiquidGlass() {
  if (!GE || Platform.OS !== 'ios') return false;
  try {
    if (typeof GE.isLiquidGlassAvailable === 'function') return GE.isLiquidGlassAvailable();
    if (typeof GE.isGlassEffectAPIAvailable === 'function') return GE.isGlassEffectAPIAvailable();
  } catch (e) {}
  return false;
}

// The raw native GlassView (or null if the package isn't installed).
export const NativeGlass = GE ? GE.GlassView : null;

// GlassCircle — a circular native glass button (close, play, camera, etc.).
// iOS 26 → real GlassView circle; otherwise a plain circle styled by
// `fallbackStyle` so the off-iOS look is exactly your original design.
export function GlassCircle({
  size = 40,
  onPress,
  children,
  tint,
  clear = true,
  style,
  fallbackStyle,
  disabled,
  hitSlop,
}) {
  const base = { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' };

  const surface = (isLiquidGlass() && NativeGlass) ? (
    <NativeGlass style={[base, style]} glassEffectStyle={clear ? 'clear' : 'regular'} tintColor={tint} isInteractive>
      {children}
    </NativeGlass>
  ) : (
    <View style={[base, fallbackStyle, style]}>{children}</View>
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
