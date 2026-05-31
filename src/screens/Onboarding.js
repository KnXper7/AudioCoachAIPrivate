import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import AuraOrb from '../components/AuraOrb';
import Btn from '../components/Btn';
import { useTheme } from '../theme/ThemeContext';

export default function Onboarding({ onStart }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Screen>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 30,
          paddingHorizontal: 28,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <AuraOrb size={250} speed={8} />
          <Text style={{ marginTop: -6, fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 4, color: t.accentB, fontWeight: '600' }}>
            AURACHECK
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 46, lineHeight: 48, color: t.ink, textAlign: 'center' }}>
            See your aura.{'\n'}Then sharpen it.
          </Text>
          <Text
            style={{
              fontFamily: t.fonts.sans,
              fontSize: 16,
              lineHeight: 24,
              color: t.inkDim,
              textAlign: 'center',
              marginTop: 18,
              maxWidth: 300,
            }}
          >
            An honest read on your face and your fit — scored, broken down, and coached. No flattery, just the next move.
          </Text>
        </View>

        <View style={{ width: '100%', gap: 14 }}>
          <Btn onPress={onStart} icon="spark">Check my aura</Btn>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkFaint, textAlign: 'center' }}>
            3 free scans · no account needed
          </Text>
        </View>
      </View>
    </Screen>
  );
}
