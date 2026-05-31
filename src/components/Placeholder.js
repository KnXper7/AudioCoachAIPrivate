// Placeholder.js — striped image placeholder used before a real photo exists.
// If an imageUri is passed, it renders the actual photo instead.
import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function Placeholder({ label = '', imageUri, style }) {
  const t = useTheme();
  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={[{ width: '100%', height: '100%' }, style]} resizeMode="cover" />;
  }
  return (
    <View
      style={[
        {
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {label ? (
        <Text
          style={{
            fontFamily: t.fonts.mono,
            fontSize: 11,
            letterSpacing: 0.5,
            color: t.inkFaint,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}
