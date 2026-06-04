// AuraOrb.js — the signature breathing aura orb.
// Soft blurred glow is achieved with wide multi-stop radial gradients (a smooth
// Gaussian-like falloff that reads as a real blur) — no SVG filter, so it renders
// reliably on every device. Two layers breathe out of phase + a slow drift give a
// living feel; a scanline sweeps while analyzing.
import React, { useEffect, useRef } from 'react';
import { Animated, View, Easing } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

const AView = Animated.createAnimatedComponent(View);

// a soft radial blob with many stops → blurred-looking edge
function Blob({ size, color, cyFactor = 1, r = 0.34 }) {
  const id = 'g' + Math.round(Math.random() * 1e9);
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity="0.9" />
          <Stop offset="0.35" stopColor={color} stopOpacity="0.55" />
          <Stop offset="0.6" stopColor={color} stopOpacity="0.28" />
          <Stop offset="0.8" stopColor={color} stopOpacity="0.1" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={(size / 2) * cyFactor} r={size * r} fill={`url(#${id})`} />
    </Svg>
  );
}

export default function AuraOrb({ size = 220, intensity = 1, speed = 7, scanning = false }) {
  const t = useTheme();

  const breath = useRef(new Animated.Value(0)).current;
  const breath2 = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;

  const loop = (val, dur, delay = 0) =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration: dur, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

  useEffect(() => {
    const a = loop(breath, speed * 500);
    const b = loop(breath2, speed * 640, 400);
    const d = loop(drift, speed * 900);
    a.start(); b.start(); d.start();
    return () => { a.stop(); b.stop(); d.stop(); };
  }, [speed]);

  useEffect(() => {
    if (!scanning) return;
    const s = loop(scan, 1400);
    s.start();
    return () => s.stop();
  }, [scanning]);

  const scale1 = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const op1 = breath.interpolate({ inputRange: [0, 1], outputRange: [0.5 * intensity, 0.8 * intensity] });
  const scale2 = breath2.interpolate({ inputRange: [0, 1], outputRange: [1.06, 0.92] });
  const op2 = breath2.interpolate({ inputRange: [0, 1], outputRange: [0.4 * intensity, 0.65 * intensity] });
  const driftX = drift.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.03, size * 0.03] });
  const driftY = drift.interpolate({ inputRange: [0, 1], outputRange: [size * 0.025, -size * 0.025] });
  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.18, size * 0.18] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Layer 1 — accent A glow */}
      <AView style={{ position: 'absolute', width: size, height: size, transform: [{ scale: scale1 }, { translateX: driftX }, { translateY: driftY }], opacity: op1 }}>
        <Blob size={size} color={t.accentA} cyFactor={0.86} r={0.36} />
      </AView>

      {/* Layer 2 — accent B glow */}
      <AView style={{ position: 'absolute', width: size, height: size, transform: [{ scale: scale2 }, { translateX: driftY }, { translateY: driftX }], opacity: op2 }}>
        <Blob size={size} color={t.accentB} cyFactor={1.16} r={0.34} />
      </AView>

      {/* Inner core */}
      <View style={{ position: 'absolute', opacity: 0.9 }}>
        <Blob size={size * 0.62} color={t.accentA} cyFactor={1} r={0.4} />
      </View>

      {/* thin crisp ring */}
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
            shadowColor: t.accentB,
            shadowOpacity: 0.9,
            shadowRadius: 8,
          }}
        />
      )}
    </View>
  );
}
