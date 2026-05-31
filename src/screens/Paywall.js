import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import AuraOrb from '../components/AuraOrb';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import { useTheme } from '../theme/ThemeContext';
import { purchasePro } from '../services/purchases';

const BENEFITS = [
  { icon: 'infinity', t: 'Unlimited scans', d: 'Read your face & fit as often as you like' },
  { icon: 'spark', t: 'Deeper breakdowns', d: 'Sub-metrics and per-feature coaching' },
  { icon: 'history', t: 'Progress tracking', d: 'Watch your aura climb week over week' },
  { icon: 'bolt', t: 'Priority analysis', d: 'Faster reads, no queue' },
];

export default function Paywall({ onClose, onUnlock }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [unlocking, setUnlocking] = useState(false);

  const go = async () => {
    setUnlocking(true);
    try {
      const ok = await purchasePro(); // mock: resolves true after ~1.1s
      if (ok) onUnlock();
      else setUnlocking(false);
    } catch (e) {
      setUnlocking(false);
    }
  };

  return (
    <Screen>
      <View style={{ position: 'absolute', top: -60, left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
        <Svg width={320} height={320}>
          <Defs>
            <RadialGradient id="pwGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={t.accentA} stopOpacity="0.3" />
              <Stop offset="0.62" stopColor={t.accentA} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="160" cy="160" r="160" fill="url(#pwGlow)" />
        </Svg>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: insets.bottom + 24, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={onClose}
          style={{ alignSelf: 'flex-end', width: 38, height: 38, borderRadius: 999, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="close" size={19} stroke={t.inkDim} />
        </Pressable>

        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <AuraOrb size={120} speed={6} />
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, letterSpacing: 1.5, color: t.accentB, fontWeight: '600', marginTop: 8 }}>
            YOU'VE USED YOUR 3 FREE SCANS
          </Text>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 38, lineHeight: 40, color: t.ink, marginTop: 10, textAlign: 'center' }}>
            Go Pro,{'\n'}keep glowing.
          </Text>
        </View>

        <View style={{ marginTop: 26 }}>
          {BENEFITS.map((b) => (
            <View key={b.t} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 4 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.accentA + '26', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={b.icon} size={20} stroke={t.accentB} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 15.5, fontWeight: '600', color: t.ink }}>{b.t}</Text>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkDim }}>{b.d}</Text>
              </View>
              <Icon name="check" size={18} stroke={t.accentB} />
            </View>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 18 }} />

        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginTop: 16, marginBottom: 16 }}>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 40, color: t.ink }}>$9.99</Text>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, color: t.inkDim }}>/ month</Text>
        </View>

        <Btn onPress={go} disabled={unlocking} icon={unlocking ? null : 'lock'}>
          {unlocking ? 'Unlocking…' : 'Unlock AuraCheck Pro'}
        </Btn>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 16 }}>
          {['Restore', 'Terms', 'Privacy'].map((x) => (
            <Text key={x} style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkFaint }}>{x}</Text>
          ))}
        </View>
        <Text style={{ textAlign: 'center', marginTop: 14, fontFamily: t.fonts.mono, fontSize: 10.5, letterSpacing: 0.5, color: t.inkFaint }}>
          SECURED BY REVENUECAT · CANCEL ANYTIME
        </Text>
      </ScrollView>
    </Screen>
  );
}
