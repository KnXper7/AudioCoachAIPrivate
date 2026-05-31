// Screen.js — themed background wrapper with the app's radial-gradient aura field.
// RN can't stack radial gradients like CSS, so we layer two soft AuraOrb-style
// glows behind a solid bg to evoke the same ambient look.
import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

export default function Screen({ children, style }) {
  const t = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: t.bg }, style]}>
      <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
        <Defs>
          <RadialGradient id="bgA" cx="15%" cy="-8%" r="80%">
            <Stop offset="0" stopColor={t.accentA} stopOpacity={t.dark ? 0.16 : 0.1} />
            <Stop offset="0.58" stopColor={t.accentA} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="bgB" cx="95%" cy="6%" r="80%">
            <Stop offset="0" stopColor={t.accentB} stopOpacity={t.dark ? 0.13 : 0.08} />
            <Stop offset="0.52" stopColor={t.accentB} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgA)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgB)" />
      </Svg>
      {children}
    </View>
  );
}
