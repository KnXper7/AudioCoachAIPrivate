// Card.js — surface card. Real Liquid Glass on iOS 26; your original solid
// surface on Android / older iOS (no blur, no surprises). Used across every
// screen, so this is the single switch for card surfaces app-wide.
import React from 'react';
import { View, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Glass, isLiquidGlass } from './Glass';

export default function Card({ children, style, onPress, pad = 20 }) {
  const t = useTheme();
  const glass = isLiquidGlass();

  const surface = glass ? (
    <Glass
      radius={24}
      clear
      dark={!!t.dark}
      style={[{ borderWidth: 1, borderColor: t.line, padding: pad }, style]}
    >
      {children}
    </Glass>
  ) : (
    <View
      style={[
        { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 24, padding: pad },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, borderRadius: 24 })}>
        {surface}
      </Pressable>
    );
  }
  return surface;
}
