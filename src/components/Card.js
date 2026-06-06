// Card.js — glass surface card.
// Renders through <Glass>: real Apple Liquid Glass on iOS 26, frosted blur
// glass everywhere else. Used across every screen, so this is the single place
// that turns the whole app glassy.
import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Glass } from './Glass';

export default function Card({ children, style, onPress, pad = 20 }) {
  const t = useTheme();

  const surface = (
    <Glass
      radius={24}
      dark={!!t.dark}
      intensity={t.dark ? 40 : 55}
      style={[
        { borderWidth: 1, borderColor: t.line, padding: pad },
        style,
      ]}
    >
      {children}
    </Glass>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, borderRadius: 24 })}
      >
        {surface}
      </Pressable>
    );
  }
  return surface;
}
