import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import OrbMark from '../components/OrbMark';
import { useTheme } from '../theme/ThemeContext';
import { aiService } from '../services/ai';

export default function Analyzing({ uri, isPro, context, formality, durationSec, prev, liveTranscript, onDone, onFail }) {
  const t = useTheme();
  const steps = aiService.steps();
  const [i, setI] = useState(0);
  const [pct, setPct] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const [barW, setBarW] = useState(0);

  useEffect(() => {
    let result = null;
    let error = null;
    let timerDone = false;

    const fail = (err) => {
      Alert.alert(
        "Couldn't reach the coach",
        (err?.message ? err.message + '\n\n' : '') + 'Check your internet connection and try again.'
      );
      onFail && onFail(err);
    };

    aiService.analyze('voice', uri, { isPro, context, formality, durationSec, prev, liveTranscript })
      .then((r) => { result = r; if (timerDone) onDone(r); })
      .catch((err) => { error = err; if (timerDone) fail(err); });

    const t0 = Date.now();
    const total = 2000;
    const tick = setInterval(() => {
      const e = Date.now() - t0;
      setPct(Math.min(100, Math.round((e / total) * 100)));
      setI(Math.min(steps.length - 1, Math.floor((e / total) * steps.length)));
      if (e >= total) {
        clearInterval(tick);
        timerDone = true;
        if (result) onDone(result);
        else if (error) fail(error);
        // else: still waiting on the network — handlers above fire when it lands
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
        <OrbMark size={185} animate />
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 30, color: t.ink }}>Reading your delivery</Text>
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
