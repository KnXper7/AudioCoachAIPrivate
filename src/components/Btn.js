// Btn.js — pill button.
//   PRIMARY (solid): prominent glass — bold label on a tinted glass capsule, no
//     gradient, no icon. iOS 26 → tinted GlassView; otherwise a flat accent
//     capsule (always clearly visible).
//   GHOST (secondary): clear glass capsule (iOS 26) / bordered surface otherwise.
//   QUIET: plain text button.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { isLiquidGlass, NativeGlass } from './Glass';
import { useTheme } from '../theme/ThemeContext';
import Icon from './Icon';

export default function Btn({ children, onPress, variant = 'solid', size = 'lg', icon, style, disabled }) {
  const t = useTheme();
  const big = size === 'lg';
  const glass = isLiquidGlass() && NativeGlass;
  const showIcon = icon && variant !== 'solid'; // prominent buttons carry no icon

  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
      {showIcon ? <Icon name={icon} size={big ? 20 : 18} stroke={t.ink} /> : null}
      <Text
        style={{
          fontFamily: t.fonts.sans,
          fontWeight: '700',
          fontSize: big ? 17 : 15,
          letterSpacing: -0.2,
          color: variant === 'solid' ? t.onAccent : variant === 'quiet' ? t.inkDim : t.ink,
        }}
      >
        {children}
      </Text>
    </View>
  );

  const pad = { paddingVertical: big ? 17 : 12, paddingHorizontal: big ? 22 : 18 };
  const radius = { borderRadius: 999 };
  const center = { alignItems: 'center', justifyContent: 'center' };

  let surface;
  if (variant === 'solid') {
    // Prominent glass — tinted, more opaque feel; no gradient.
    surface = glass ? (
      <NativeGlass style={[radius, pad, center]} glassEffectStyle="regular" tintColor={t.accent} isInteractive>
        {inner}
      </NativeGlass>
    ) : (
      <View style={[radius, pad, center, { backgroundColor: t.accent }]}>{inner}</View>
    );
  } else if (variant === 'ghost') {
    surface = glass ? (
      <NativeGlass style={[radius, pad, center]} glassEffectStyle="clear" isInteractive>
        {inner}
      </NativeGlass>
    ) : (
      <View style={[radius, pad, center, { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }]}>
        {inner}
      </View>
    );
  } else {
    surface = <View style={[radius, pad, center, { backgroundColor: 'transparent' }]}>{inner}</View>;
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { width: '100%', opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.975 : 1 }] },
        style,
      ]}
    >
      {surface}
    </Pressable>
  );
}
