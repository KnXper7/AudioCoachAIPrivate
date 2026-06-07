// Btn.android.js — flat pill button (no glass). Used on Android and as the
// fallback on iOS when Liquid Glass isn't available (older iOS / Expo Go).
// Always a pill shape. Primary = solid accent, no icon. Ghost = bordered
// surface (icon allowed). Quiet = plain text.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Icon from './Icon';

export default function Btn({ children, onPress, variant = 'solid', size = 'lg', icon, style, disabled }) {
  const t = useTheme();
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
  const pill = { borderRadius: 999, alignItems: 'center', justifyContent: 'center' };

  let surface;
  if (variant === 'solid') surface = <View style={[pill, pad, { backgroundColor: t.accent }]}>{inner}</View>;
  else if (variant === 'ghost') surface = <View style={[pill, pad, { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }]}>{inner}</View>;
  else surface = <View style={[pill, pad]}>{inner}</View>;

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
