import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import OrbMark from '../components/OrbMark';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import { useTheme } from '../theme/ThemeContext';
import { purchasePro, restorePurchases, getProPackage } from '../services/purchases';

const BENEFITS = [
  { icon: 'infinity', t: 'Unlimited checks', d: 'Rehearse as often as you like' },
  { icon: 'spark', t: '2x deeper coaching', d: 'Twice the mentor-grade, non-repeating advice' },
  { icon: 'voice', t: 'Reworded lines', d: 'Sharper ways to say exactly what you said' },
  { icon: 'history', t: 'Tailored exercises', d: 'Vocal drills picked for your weak spots' },
];

export default function Paywall({ onClose, onUnlock, usedFree }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [unlocking, setUnlocking] = useState(false);
  const [price, setPrice] = useState('$4.99'); // fallback until the store price loads

  React.useEffect(() => {
    let alive = true;
    getProPackage().then((pkg) => {
      const p = pkg && pkg.product && pkg.product.priceString;
      if (alive && p) setPrice(p);
    });
    return () => { alive = false; };
  }, []);

  const go = async () => {
    setUnlocking(true);
    try {
      const ok = await purchasePro();
      if (ok) onUnlock();
      else setUnlocking(false);
    } catch (e) {
      setUnlocking(false);
      // Don't nag on a user-initiated cancel; surface anything else.
      if (!e?.userCancelled) Alert.alert('Purchase not completed', e?.message || 'Please try again.');
    }
  };

  const restore = async () => {
    try {
      const ok = await restorePurchases();
      if (ok) onUnlock();
      else Alert.alert('Nothing to restore', "We couldn't find an active subscription on this account.");
    } catch (e) {
      Alert.alert('Restore failed', e?.message || 'Please try again.');
    }
  };

  return (
    <Screen>
      <View style={{ position: 'absolute', top: -60, left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
        <Svg width={320} height={320}>
          <Defs>
            <RadialGradient id="pwGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={t.accentA} stopOpacity="0.34" />
              <Stop offset="0.4" stopColor={t.accentA} stopOpacity="0.18" />
              <Stop offset="0.7" stopColor={t.accentA} stopOpacity="0.05" />
              <Stop offset="1" stopColor={t.accentA} stopOpacity="0" />
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
          <OrbMark size={96} />
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, letterSpacing: 1.5, color: t.accentB, fontWeight: '600', marginTop: 8 }}>
            {usedFree ? "YOU'VE USED YOUR 3 FREE CHECKS" : 'AUDIOCOACH PRO'}
          </Text>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 38, lineHeight: 40, color: t.ink, marginTop: 10, textAlign: 'center' }}>
            Go Pro,{'\n'}sound unstoppable.
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
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 40, color: t.ink }}>{price}</Text>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, color: t.inkDim }}>/ month</Text>
        </View>

        <Btn onPress={go} disabled={unlocking} icon={unlocking ? null : 'lock'}>
          {unlocking ? 'Unlocking…' : 'Unlock AudioCoach Pro'}
        </Btn>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 16 }}>
          <Pressable onPress={restore}><Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkFaint }}>Restore</Text></Pressable>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkFaint }}>Terms</Text>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkFaint }}>Privacy</Text>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 14, fontFamily: t.fonts.mono, fontSize: 10.5, letterSpacing: 0.5, color: t.inkFaint }}>
          SECURED BY REVENUECAT · CANCEL ANYTIME
        </Text>
      </ScrollView>
    </Screen>
  );
}
