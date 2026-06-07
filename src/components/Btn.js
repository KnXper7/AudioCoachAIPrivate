// Btn.js — pill button (always pill shape, never a rounded rectangle).
//   PRIMARY (solid): prominent glass — bold label on a tinted glass pill, no
//     gradient, no icon. iOS 26 → tinted GlassView fill; else flat accent pill.
//   GHOST (secondary): clear glass pill (iOS 26) / bordered surface pill.
//   QUIET: plain text button.
//
// Glass is rendered as an absolute-fill layer inside a sized, clipped pill so it
// always shows up at the right size and shape.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { isLiquidGlass, NativeGlass, GlassFill } from './Glass';
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
  const pill = { borderRadius: 999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };

  let surface;
  if (variant === 'solid') {
    surface = glass ? (
      <View style={[pill, pad]}>
        <GlassFill tint={t.accent} clear={false} />
        {inner}
      </View>
    ) : (
      <View style={[pill, pad, { backgroundColor: t.accent }]}>{inner}</View>
    );
  } else if (variant === 'ghost') {
    surface = glass ? (
      <View style={[pill, pad, { borderWidth: 1, borderColor: t.line }]}>
        <GlassFill clear />
        {inner}
      </View>
    ) : (
      <View style={[pill, pad, { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }]}>{inner}</View>
    );
  } else {
    surface = <View style={[pill, pad]}>{inner}</View>;
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
