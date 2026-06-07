// Btn.ios.js — iOS pill button with real Liquid Glass when available.
//   PRIMARY (solid): prominent glass — tinted glass pill, bold label, no icon.
//   GHOST: clear glass pill.
//   QUIET: plain text.
// When Liquid Glass isn't available (older iOS / Expo Go) it renders the flat
// Android version so it always shows up.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Flat from './Btn.android';
import { isLiquidGlass, NativeGlass, GlassFill } from './Glass';
import { useTheme } from '../theme/ThemeContext';
import Icon from './Icon';

export default function Btn(props) {
  const t = useTheme();
  if (!(isLiquidGlass() && NativeGlass)) return <Flat {...props} />;

  const { children, onPress, variant = 'solid', size = 'lg', icon, style, disabled } = props;
  const big = size === 'lg';
  const showIcon = icon && variant !== 'solid';

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
    surface = (
      <View style={[pill, pad]}>
        <GlassFill tint={t.accent} radius={999} />
        {inner}
      </View>
    );
  } else if (variant === 'ghost') {
    surface = (
      <View style={[pill, pad, { borderWidth: 1, borderColor: t.line }]}>
        <GlassFill clear radius={999} />
        {inner}
      </View>
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
