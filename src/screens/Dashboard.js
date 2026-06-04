import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Icon from '../components/Icon';
import { useTheme } from '../theme/ThemeContext';

const fmtDate = (ts) => {
  const d = new Date(ts);
  const diff = (Date.now() - ts) / 1000;
  if (diff < 3600) return Math.max(1, Math.floor(diff / 60)) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function SessionCard({ group, onPress }) {
  const t = useTheme();
  const atts = group.attempts || [];
  const best = atts.length ? Math.max(...atts.map((a) => a.overall)) : 0;
  const latest = atts[atts.length - 1];
  const first = atts[0];
  const delta = atts.length > 1 ? latest.overall - first.overall : 0;
  return (
    <Card onPress={onPress} pad={18} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: t.accentA + '1f', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="voice" size={21} stroke={t.accentA} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: t.fonts.sans, fontSize: 16, fontWeight: '700', color: t.ink }}>{group.title || 'Untitled'}</Text>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkDim }}>{atts.length} take{atts.length === 1 ? '' : 's'} · {fmtDate(latest ? latest.ts : group.ts)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 30, lineHeight: 36, color: t.ink, includeFontPadding: false }}>{best}</Text>
          {atts.length > 1 && <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, fontWeight: '700', color: delta >= 0 ? t.good : t.bad }}>{delta >= 0 ? '+' : ''}{delta}</Text>}
        </View>
      </View>
      {atts.length > 1 && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 26 }}>
          {atts.slice(-12).map((a, i) => (
            <View key={i} style={{ flex: 1, height: `${Math.max(12, a.overall)}%`, backgroundColor: t.accentA + (i === atts.slice(-12).length - 1 ? 'ff' : '55'), borderRadius: 3 }} />
          ))}
        </View>
      )}
    </Card>
  );
}

export default function Dashboard({ isPro, scansLeft, groups, onNew, onOpenGroup, onRecordInto }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState(false);
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

  // Record button: if sessions exist, ask new-vs-existing; else start fresh.
  const onRecordPress = () => {
    if (groups.length > 0) setPicker(true);
    else onNew();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, color: t.inkDim }}>{greet}</Text>
            <Text style={{ fontFamily: t.fonts.serif, fontSize: 34, lineHeight: 42, color: t.ink, marginTop: 2, includeFontPadding: false }}>Let's rehearse.</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, marginTop: 6 }}>
            <Icon name={isPro ? 'infinity' : 'bolt'} size={15} stroke={t.accentA} />
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, fontWeight: '600', color: t.ink }}>{isPro ? 'Pro' : scansLeft + ' left'}</Text>
          </View>
        </View>

        <Pressable onPress={onRecordPress} style={({ pressed }) => ({ marginTop: 24, borderWidth: 1, borderColor: t.line, borderRadius: 28, paddingVertical: 32, paddingHorizontal: 24, overflow: 'hidden', backgroundColor: t.surface, alignItems: 'center', opacity: pressed ? 0.92 : 1 })}>
          <View style={{ position: 'absolute', top: -40, width: 260, height: 260 }}>
            <Svg width={260} height={260}>
              <Defs>
                <RadialGradient id="vGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={t.accentA} stopOpacity="0.34" />
                  <Stop offset="0.45" stopColor={t.accentA} stopOpacity="0.12" />
                  <Stop offset="1" stopColor={t.accentA} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="130" cy="130" r="130" fill="url(#vGlow)" />
            </Svg>
          </View>
          {/* big circular mic — the unmistakable record button */}
          <View style={{ width: 104, height: 104, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.accentA + '40' }}>
            <View style={{ position: 'absolute', width: 104, height: 104, borderRadius: 999, backgroundColor: t.accentA + '14' }} />
            <LinearGradient colors={[t.accentA, t.accentB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 78, height: 78, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="voice" size={38} stroke={t.onAccent} />
            </LinearGradient>
          </View>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 26, lineHeight: 32, color: t.ink, includeFontPadding: false, marginTop: 18 }}>Tap to record</Text>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, lineHeight: 19, color: t.inkDim, marginTop: 6, textAlign: 'center' }}>Speak for up to a minute and get instant coaching on how you sound.</Text>
        </Pressable>

        {groups.length > 0 && (
          <>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 }}>Your sessions</Text>
            <View style={{ gap: 12 }}>
              {groups.map((g) => <SessionCard key={g.id} group={g} onPress={() => onOpenGroup(g)} />)}
            </View>
          </>
        )}
      </ScrollView>

      {/* session chooser */}
      <Modal visible={picker} transparent animationType="fade" onRequestClose={() => setPicker(false)}>
        <Pressable onPress={() => setPicker(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.elevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: insets.bottom + 22, borderWidth: 1, borderColor: t.line, maxHeight: '75%' }}>
            <Text style={{ fontFamily: t.fonts.serif, fontSize: 24, color: t.ink, marginBottom: 4 }}>Record into…</Text>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkDim, marginBottom: 16 }}>Add a take to a session to track your progress, or start fresh.</Text>
            <Pressable onPress={() => { setPicker(false); onNew(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: t.accentA, backgroundColor: t.accentA + '14', marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.accentA, alignItems: 'center', justifyContent: 'center' }}><Icon name="spark" size={20} stroke={t.onAccent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 15.5, fontWeight: '700', color: t.ink }}>New session</Text>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkDim }}>A new line, pitch, or speech</Text>
              </View>
            </Pressable>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 11.5, letterSpacing: 1.2, color: t.inkFaint, textTransform: 'uppercase', marginBottom: 8 }}>Add to existing</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              <View style={{ gap: 8 }}>
                {groups.map((g) => (
                  <Pressable key={g.id} onPress={() => { setPicker(false); onRecordInto(g); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface }}>
                    <Icon name="voice" size={18} stroke={t.accentA} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontFamily: t.fonts.sans, fontSize: 14.5, fontWeight: '600', color: t.ink }}>{g.title || 'Untitled'}</Text>
                      <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, color: t.inkDim }}>{(g.attempts || []).length} take{(g.attempts || []).length === 1 ? '' : 's'} · next take compares to your last</Text>
                    </View>
                    <Icon name="chevron" size={16} stroke={t.inkFaint} />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
