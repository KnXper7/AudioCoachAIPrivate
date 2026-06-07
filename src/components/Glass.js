// Glass.js — Liquid Glass helpers (documentation-faithful).
//
// KEY FIX: GlassView does NOT size itself to its children. So we render a normal
// sized View that clips to a pill/circle (borderRadius + overflow hidden), with
// the GlassView as an absolute-fill layer BEHIND the content. That guarantees:
//   • the element actually has size and shows up,
//   • the glass material is visible,
//   • a true pill / circle shape (never a rounded rectangle).
//
// Real glass only on iOS 26; otherwise callers render their original design.
import React from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';

let GE = null;
try { GE = require('expo-glass-effect'); } catch (e) { GE = null; }

export function isLiquidGlass() {
  if (!GE || Platform.OS !== 'ios') return false;
  try {
    if (typeof GE.isLiquidGlassAvailable === 'function') return GE.isLiquidGlassAvailable();
    if (typeof GE.isGlassEffectAPIAvailable === 'function') return GE.isGlassEffectAPIAvailable();
  } catch (e) {}
  return false;
}

export const NativeGlass = GE ? GE.GlassView : null;

// GlassFill — the glass material as an absolute-fill background layer.
export function GlassFill({ tint, clear = false }) {
  if (!NativeGlass) return null;
  return (
    <NativeGlass
      style={StyleSheet.absoluteFill}
      glassEffectStyle={clear ? 'clear' : 'regular'}
      tintColor={tint}
    />
  );
}

// GlassCircle — a visible circular glass button (close X, play, etc.).
export function GlassCircle({
  size = 40,
  onPress,
  children,
  tint,
  clear = false,
  style,
  fallbackStyle,
  disabled,
  hitSlop,
}) {
  const glass = isLiquidGlass() && NativeGlass;
  const base = { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };

  const surface = glass ? (
    <View style={[base, style]}>
      <GlassFill tint={tint} clear={clear} />
      {children}
    </View>
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
