// MetricBar.js — horizontal metric row with animated gradient fill
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

export default function MetricBar({ label, value, note, delay = 0 }) {
  const t = useTheme();
  const w = useRef(new Animated.Value(0)).current;
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      Animated.timing(w, {
        toValue: value / 100,
        duration: 1000,
        easing: Easing.bezier(0.2, 0.7, 0.2, 1),
        useNativeDriver: false,
      }).start();
    }, 120 + delay);
    return () => clearTimeout(id);
  }, [value]);

  const fillWidth = w.interpolate({ inputRange: [0, 1], outputRange: [0, containerW] });

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, fontWeight: '600', color: t.ink }}>{label}</Text>
        <Text style={{ fontFamily: t.fonts.serif, fontSize: 20, color: t.ink }}>{value}</Text>
      </View>
      <View
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
        style={{ height: 7, borderRadius: 999, backgroundColor: t.line, overflow: 'hidden' }}
      >
        <Animated.View style={{ height: '100%', width: fillWidth, borderRadius: 999 }}>
          <LinearGradient
            colors={[t.accentA, t.accentB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: 999 }}
          />
        </Animated.View>
      </View>
      <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkDim }}>{note}</Text>
    </View>
  );
}
