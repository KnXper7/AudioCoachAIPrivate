import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Btn from '../components/Btn';
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

export default function Profile({ isPro, history, onOpen, onReset, onMode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const avg = history.length ? Math.round(history.reduce((s, r) => s + r.overall, 0) / history.length) : 0;
  const best = history.length ? Math.max(...history.map((r) => r.overall)) : 0;
  const stats = [
    { k: 'Scans', v: history.length },
    { k: 'Average', v: avg || '—' },
    { k: 'Best', v: best || '—' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 66, height: 66, borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: t.line }}>
            <Placeholder />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.fonts.serif, fontSize: 26, color: t.ink }}>Your aura</Text>
            {isPro ? (
              <LinearGradient
                colors={[t.accentA, t.accentB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 }}
              >
                <Icon name="infinity" size={13} stroke={t.onAccent} />
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, fontWeight: '700', color: t.onAccent }}>PRO MEMBER</Text>
              </LinearGradient>
            ) : (
              <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
                <Icon name="bolt" size={13} stroke={t.accentB} />
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, fontWeight: '700', color: t.ink }}>FREE PLAN</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
          {stats.map((s) => (
            <Card key={s.k} pad={16} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontFamily: t.fonts.serif, fontSize: 32, color: t.ink }}>{s.v}</Text>
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, color: t.inkDim, marginTop: 6 }}>{s.k}</Text>
            </Card>
          ))}
        </View>

        <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 }}>
          Scan history
        </Text>

        {history.length === 0 ? (
          <Card pad={28} style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 14.5, color: t.inkDim, lineHeight: 22, textAlign: 'center' }}>
              No scans yet.{'\n'}Your reads will collect here.
            </Text>
            <View style={{ marginTop: 16, width: '100%' }}>
              <Btn size="sm" onPress={() => onMode('face')} icon="spark">Take your first scan</Btn>
            </View>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {history.map((r) => (
              <Card key={r.id} onPress={() => onOpen(r)} pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 13, overflow: 'hidden' }}>
                  <Placeholder imageUri={r.imageUri} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, fontWeight: '600', color: t.ink }}>{MODE_META[r.mode].title}</Text>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkDim }}>{r.tier.label} · {r.tier.name} · {fmtDate(r.ts)}</Text>
                </View>
                <Text style={{ fontFamily: t.fonts.serif, fontSize: 28, color: t.ink }}>{r.overall}</Text>
                <Icon name="chevron" size={17} stroke={t.inkFaint} />
              </Card>
            ))}
          </View>
        )}

        <Pressable onPress={onReset} style={{ alignSelf: 'center', marginTop: 26 }}>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkFaint, textDecorationLine: 'underline' }}>
            Reset demo (clear scans & Pro)
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
