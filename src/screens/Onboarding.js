import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import OrbMark from '../components/OrbMark';
import Btn from '../components/Btn';
import { useTheme } from '../theme/ThemeContext';

export default function Onboarding({ onStart }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingTop: insets.top + 60, paddingBottom: insets.bottom + 30, paddingHorizontal: 28 }}>
        <View style={{ alignItems: 'center' }}>
          <OrbMark size={100} style={{marginTop: 50}} />
          <Text style={{ marginTop: 20, fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 4, color: t.accentA, fontWeight: '600' }}>AUDIOCOACH AI</Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 46, lineHeight: 48, color: t.ink, textAlign: 'center' }}>
            Sound like{'\n'}you mean it.
          </Text>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 16, lineHeight: 24, color: t.inkDim, textAlign: 'center', marginTop: 18, maxWidth: 320 }}>
            Tell it what you're about to say, record yourself, and get mentor-grade coaching on your pace, pauses, pitch, and presence — tuned to your goal.
          </Text>
        </View>

        <View style={{ width: '100%', gap: 14 }}>
          <Btn onPress={onStart} icon="spark">Get started</Btn>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkFaint, textAlign: 'center' }}>3 free checks · no account needed</Text>
        </View>
      </View>
    </Screen>
  );
}
