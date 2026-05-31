import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Btn from '../components/Btn';
import ScoreDisplay from '../components/ScoreDisplay';
import MetricBar from '../components/MetricBar';
import { useTheme, useTweaks } from '../theme/ThemeContext';
import { MODE_META } from '../services/aiService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function SuggestionItem({ s, open, onToggle, last }) {
  const t = useTheme();
  return (
    <View style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: t.line }}>
      <Pressable
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.create(280, 'easeInEaseOut', 'opacity'));
          onToggle();
        }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17 }}
      >
        <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: t.accentA + '29', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="spark" size={17} stroke={t.accentB} />
        </View>
        <Text style={{ flex: 1, fontFamily: t.fonts.sans, fontSize: 15.5, fontWeight: '600', color: t.ink }}>{s.title}</Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name="chevDown" size={18} stroke={t.inkFaint} />
        </View>
      </Pressable>
      {open && (
        <Text style={{ paddingLeft: 42, paddingBottom: 18, fontFamily: t.fonts.sans, fontSize: 14.5, lineHeight: 23, color: t.inkDim }}>
          {s.body}
        </Text>
      )}
    </View>
  );
}

export default function Results({ result, onAgain, onHome }) {
  const t = useTheme();
  const { scoreMode } = useTweaks();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(0);
  const m = MODE_META[result.mode];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        {/* header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Pressable onPress={onHome}>
            <Icon name="back" size={22} stroke={t.ink} />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Icon name={result.mode} size={16} stroke={t.inkDim} />
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, fontWeight: '600', color: t.inkDim }}>{m.title}</Text>
          </View>
          <Pressable>
            <Icon name="share" size={21} stroke={t.ink} />
          </Pressable>
        </View>

        {/* hero */}
        <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 6 }}>
          <View style={{ position: 'absolute', top: -20, width: 260, height: 260 }} pointerEvents="none">
            <Svg width={260} height={260}>
              <Defs>
                <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={t.accentA} stopOpacity="0.22" />
                  <Stop offset="0.6" stopColor={t.accentA} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="130" cy="130" r="130" fill="url(#heroGlow)" />
            </Svg>
          </View>
          <View style={{ width: '100%', alignItems: 'center' }}>
            <ScoreDisplay score={result.overall} tier={result.tier} mode={scoreMode} />
          </View>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 23, lineHeight: 29, color: t.ink, textAlign: 'center', marginTop: 22, maxWidth: 320 }}>
            {result.headline}
          </Text>
        </View>

        {/* breakdown */}
        <Card style={{ marginTop: 26, gap: 20 }} pad={22}>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase' }}>Breakdown</Text>
          {result.metrics.map((mt, k) => (
            <MetricBar key={mt.label} {...mt} delay={k * 140} />
          ))}
        </Card>

        {/* suggestions */}
        <Card style={{ marginTop: 16 }} pad={22}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="spark" size={18} stroke={t.accentB} />
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 16, fontWeight: '700', color: t.ink }}>AI Suggestions</Text>
          </View>
          <View>
            {result.suggestions.map((s, k) => (
              <SuggestionItem key={k} s={s} open={open === k} onToggle={() => setOpen(open === k ? -1 : k)} last={k === result.suggestions.length - 1} />
            ))}
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
          <View style={{ flex: 1 }}>
            <Btn variant="ghost" size="sm" onPress={onHome}>Done</Btn>
          </View>
          <View style={{ flex: 1.4 }}>
            <Btn size="sm" onPress={onAgain} icon="camera">Scan again</Btn>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          <Icon name="check" size={14} stroke={t.accentB} />
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkFaint }}>Saved to your scans</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
