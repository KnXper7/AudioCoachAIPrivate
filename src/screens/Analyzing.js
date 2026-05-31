import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import AuraOrb from '../components/AuraOrb';
import { useTheme } from '../theme/ThemeContext';
import { aiService } from '../services/aiService';

export default function Analyzing({ mode, imageUri, onDone }) {
  const t = useTheme();
  const steps = aiService.steps(mode);
  const [i, setI] = useState(0);
  const [pct, setPct] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const [barW, setBarW] = useState(0);

  useEffect(() => {
    let result = null;
    let done = false;
    aiService.analyze(mode, imageUri).then((r) => {
      result = r;
      if (done) onDone(r);
    });

    const t0 = Date.now();
    const total = 2000;
    const tick = setInterval(() => {
      const e = Date.now() - t0;
      setPct(Math.min(100, Math.round((e / total) * 100)));
      setI(Math.min(steps.length - 1, Math.floor((e / total) * steps.length)));
      if (e >= total) {
        clearInterval(tick);
        done = true;
        if (result) onDone(result);
      }
    }, 60);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [i]);

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <AuraOrb size={230} speed={3.2} scanning intensity={1.15} />
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 30, color: t.ink }}>Reading your aura</Text>
          <Animated.Text
            style={{
              fontFamily: t.fonts.sans,
              fontSize: 15,
              color: t.accentB,
              marginTop: 10,
              height: 22,
              opacity: fade,
              transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            }}
          >
            {steps[i]}…
          </Animated.Text>
        </View>
        <View
          onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
          style={{ width: 200, height: 4, borderRadius: 999, backgroundColor: t.line, marginTop: 34, overflow: 'hidden' }}
        >
          <View style={{ height: '100%', width: (pct / 100) * barW, borderRadius: 999 }}>
            <LinearGradient colors={[t.accentA, t.accentB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 999 }} />
          </View>
        </View>
        <Text style={{ fontFamily: t.fonts.mono, fontSize: 12, color: t.inkFaint, marginTop: 12, letterSpacing: 1 }}>{pct}%</Text>
      </View>
    </Screen>
  );
}
