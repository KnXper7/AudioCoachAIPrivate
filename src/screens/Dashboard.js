import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Placeholder from '../components/Placeholder';
import { useTheme } from '../theme/ThemeContext';
import { MODE_META } from '../services/aiService';

const fmtDate = (ts) => {
  const d = new Date(ts);
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function ModeCard({ mode, onPress }) {
  const t = useTheme();
  const m = MODE_META[mode];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '100%',
        borderWidth: 1,
        borderColor: t.line,
        borderRadius: 26,
        padding: 22,
        overflow: 'hidden',
        backgroundColor: t.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ position: 'absolute', right: -40, top: -30, width: 180, height: 180 }}>
        <Svg width={180} height={180}>
          <Defs>
            <RadialGradient id={'mc' + mode} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={mode === 'face' ? t.accentA : t.accentB} stopOpacity="0.36" />
              <Stop offset="0.65" stopColor={mode === 'face' ? t.accentA : t.accentB} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="90" cy="90" r="90" fill={`url(#mc${mode})`} />
        </Svg>
      </View>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: t.accentA + '24',
          borderWidth: 1,
          borderColor: t.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={mode} size={28} stroke={t.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: t.fonts.serif, fontSize: 27, color: t.ink }}>{m.title}</Text>
        <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim, marginTop: 6 }}>{m.subtitle}</Text>
      </View>
      <Icon name="chevron" size={20} stroke={t.inkFaint} />
    </Pressable>
  );
}

export default function Dashboard({ scansLeft, isPro, history, onMode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const last = history[0];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, color: t.inkDim }}>{greet}</Text>
            <Text style={{ fontFamily: t.fonts.serif, fontSize: 34, color: t.ink, marginTop: 2 }}>Ready for a read?</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 13,
              borderRadius: 999,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.line,
              marginTop: 6,
            }}
          >
            <Icon name={isPro ? 'infinity' : 'bolt'} size={15} stroke={t.accentB} />
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, fontWeight: '600', color: t.ink }}>
              {isPro ? 'Pro' : scansLeft + ' left'}
            </Text>
          </View>
        </View>

        <View style={{ gap: 14, marginTop: 26 }}>
          <ModeCard mode="face" onPress={() => onMode('face')} />
          <ModeCard mode="outfit" onPress={() => onMode('outfit')} />
        </View>

        {last && (
          <View style={{ marginTop: 28 }}>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase', marginBottom: 12 }}>
              Last read
            </Text>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }} pad={16}>
              <View style={{ width: 46, height: 46, borderRadius: 14, overflow: 'hidden' }}>
                <Placeholder imageUri={last.imageUri} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, fontWeight: '600', color: t.ink }}>{MODE_META[last.mode].title}</Text>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkDim }}>{last.tier.name} · {fmtDate(last.ts)}</Text>
              </View>
              <Text style={{ fontFamily: t.fonts.serif, fontSize: 30, color: t.ink }}>{last.overall}</Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
