// ScoreDisplay.js — the Aura Score hero. Four display styles (Tweaks panel):
//   'bar' (default) | 'ring' | 'number' | 'tier'
// Serif numerals use a generous lineHeight + includeFontPadding:false so the
// tall Instrument Serif digits are never vertically clipped on Android.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGrad, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import MaskedText from './MaskedText';

function useCountUp(target, animate = true, dur = 1100) {
  const [shown, setShown] = useState(animate ? 0 : target);
  useEffect(() => {
    if (!animate) {
      setShown(target);
      return;
    }
    let raf, start;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, animate]);
  return shown;
}

export default function ScoreDisplay({ score, tier, mode = 'bar', animate = true }) {
  const t = useTheme();
  const shown = useCountUp(score, animate);

  if (mode === 'ring') {
    const R = 78;
    const C = 2 * Math.PI * R;
    const ringW = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(ringW, { toValue: score / 100, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }, [score]);
    const AnimCircle = Animated.createAnimatedComponent(Circle);
    const dashoffset = ringW.interpolate({ inputRange: [0, 1], outputRange: [C, 0] });
    return (
      <View style={{ width: 196, height: 196, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={196} height={196} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Defs>
            <SvgGrad id="auraRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={t.accentA} />
              <Stop offset="1" stopColor={t.accentB} />
            </SvgGrad>
          </Defs>
          <Circle cx="98" cy="98" r={R} fill="none" stroke={t.line} strokeWidth="10" />
          <AnimCircle
            cx="98" cy="98" r={R} fill="none" stroke="url(#auraRing)" strokeWidth="10"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={dashoffset}
          />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 64, lineHeight: 80, color: t.ink, includeFontPadding: false, textAlign: 'center' }}>{shown}</Text>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 2, color: t.accentB, marginTop: 4, fontWeight: '600' }}>
            {tier.label} · {tier.name.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  }

  if (mode === 'number') {
    return (
      <View style={{ alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 116, lineHeight: 144, color: t.ink, includeFontPadding: false, textAlign: 'center' }}>{shown}</Text>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 34, lineHeight: 44, color: t.inkFaint, includeFontPadding: false }}>/100</Text>
        </View>
        <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, letterSpacing: 2, color: t.accentB, fontWeight: '600', marginTop: 6 }}>
          {tier.label} · {tier.name.toUpperCase()}
        </Text>
      </View>
    );
  }

  if (mode === 'tier') {
    return (
      <View style={{ alignItems: 'center' }}>
        <MaskedText
          text={tier.label}
          colors={[t.accentA, t.accentB]}
          style={{ fontFamily: t.fonts.serif, fontSize: 110, lineHeight: 110 }}
        />
        <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, letterSpacing: 3, color: t.ink, fontWeight: '600', marginTop: 2 }}>
          {tier.name.toUpperCase()}
        </Text>
        <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkFaint, marginTop: 8 }}>Aura score {shown}/100</Text>
      </View>
    );
  }

  const [barW, setBarW] = useState(0);
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fill, { toValue: score / 100, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [score]);
  const fillW = fill.interpolate({ inputRange: [0, 1], outputRange: [0, barW] });

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
        <Text style={{ fontFamily: t.fonts.serif, fontSize: 84, lineHeight: 104, color: t.ink, includeFontPadding: false, textAlign: 'center' }}>{shown}</Text>
        <Text style={{ fontFamily: t.fonts.serif, fontSize: 26, lineHeight: 34, color: t.inkFaint, includeFontPadding: false }}>/100</Text>
        <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 2, color: t.accentB, fontWeight: '600', marginLeft: 4 }}>{tier.label}</Text>
      </View>
      <View
        onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
        style={{ width: '100%', height: 12, borderRadius: 999, backgroundColor: t.line, overflow: 'hidden' }}
      >
        <Animated.View style={{ height: '100%', width: fillW, borderRadius: 999 }}>
          <LinearGradient colors={[t.accentA, t.accentB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 999 }} />
        </Animated.View>
      </View>
      <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, letterSpacing: 1, color: t.inkDim, marginTop: 12, fontWeight: '500' }}>{tier.name}</Text>
    </View>
  );
}
