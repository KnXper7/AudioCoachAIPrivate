// Btn.js — pill button. On iOS 26 every variant is real Liquid Glass (purple
// tinted for the primary action, following Apple's tinted-glass convention).
// On Android / older iOS it keeps the original gradient/solid look — no blur,
// no surprises. Variants: solid (primary), ghost (secondary), quiet (text).
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass, isLiquidGlass } from './Glass';
import { useTheme } from '../theme/ThemeContext';
import Icon from './Icon';

export default function Btn({ children, onPress, variant = 'solid', size = 'lg', icon, style, disabled }) {
  const t = useTheme();
  const big = size === 'lg';
  const glass = isLiquidGlass();

  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
      {icon ? (
        <Icon name={icon} size={big ? 20 : 18} stroke={variant === 'solid' ? t.onAccent : t.ink} />
      ) : null}
      <Text
        style={{
          fontFamily: t.fonts.sans,
          fontWeight: '600',
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
    surface = glass ? (
      <Glass radius={999} tint={t.accentA} clear={false} interactive dark={!!t.dark} style={[pad, center]}>
        {inner}
      </Glass>
    ) : (
      <LinearGradient colors={[t.accentA, t.accentB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[radius, pad, center]}>
        {inner}
      </LinearGradient>
    );
  } else if (variant === 'ghost') {
    surface = glass ? (
      <Glass radius={999} clear interactive dark={!!t.dark} style={[pad, center, { borderWidth: 1, borderColor: t.line }]}>
        {inner}
      </Glass>
    ) : (
      <View style={[radius, pad, center, { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }]}>
        {inner}
      </View>
    );
  } else {
    // quiet — plain text button, no surface
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
