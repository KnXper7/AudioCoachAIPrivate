// AuraOrb.js — the signature breathing aura orb.
// RN has no CSS blur on Android, so we approximate the design's soft glow with
// layered radial gradients + an Animated "breath" loop. A scanline sweeps when scanning.
import React, { useEffect, useRef } from 'react';
import { Animated, View, Easing } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, LinearGradient, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

const AView = Animated.createAnimatedComponent(View);

export default function AuraOrb({ size = 220, intensity = 1, speed = 7, scanning = false }) {
  const t = useTheme();
  const breath = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: speed * 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: speed * 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [speed]);

  useEffect(() => {
    if (!scanning) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanning]);

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.13] });
  const opacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.5 * intensity, 0.74 * intensity] });
  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.18, size * 0.18] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <AView style={{ position: 'absolute', width: size, height: size, transform: [{ scale }], opacity }}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="glowA" cx="38%" cy="34%" r="62%">
              <Stop offset="0" stopColor={t.accentA} stopOpacity="0.9" />
              <Stop offset="1" stopColor={t.accentA} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="glowB" cx="66%" cy="70%" r="60%">
              <Stop offset="0" stopColor={t.accentB} stopOpacity="0.85" />
              <Stop offset="1" stopColor={t.accentB} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glowA)" />
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glowB)" />
        </Svg>
      </AView>

      {/* inner core */}
      <Svg width={size * 0.7} height={size * 0.7} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="core" cx="40%" cy="36%" r="70%">
            <Stop offset="0" stopColor={t.accentA} stopOpacity="0.6" />
            <Stop offset="1" stopColor={t.accentA} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size * 0.35} cy={size * 0.35} r={size * 0.35} fill="url(#core)" />
      </Svg>

      {/* thin ring */}
      <View
        style={{
          position: 'absolute',
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: size * 0.2,
          borderWidth: 1,
          borderColor: t.accentB + '80',
        }}
      />

      {scanning && (
        <AView
          style={{
            position: 'absolute',
            width: size * 0.72,
            height: 2,
            borderRadius: 2,
            backgroundColor: t.accentB,
            transform: [{ translateY: scanY }],
          }}
        />
      )}
    </View>
  );
}
