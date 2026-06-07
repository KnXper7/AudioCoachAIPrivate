import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Share, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Btn from '../components/Btn';
import { Glass, isLiquidGlass } from '../components/Glass';
import ScoreDisplay from '../components/ScoreDisplay';
import MetricBar from '../components/MetricBar';
import ResultMedia from '../components/ResultMedia';
import { useTheme, useTweaks } from '../theme/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function SuggestionItem({ s, open, onToggle, last }) {
  const t = useTheme();
  const glass = isLiquidGlass();
  const padX = glass ? 14 : 0;
  const header = (
    <Pressable
      onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.create(280, 'easeInEaseOut', 'opacity')); onToggle(); }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: glass ? 14 : 17, paddingHorizontal: padX }}
    >
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: t.accentA + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="spark" size={17} stroke={t.accentA} />
      </View>
      <Text style={{ flex: 1, fontFamily: t.fonts.sans, fontSize: 15.5, fontWeight: '600', color: t.ink }}>{s.title}</Text>
      <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
        <Icon name="chevDown" size={18} stroke={t.inkFaint} />
      </View>
    </Pressable>
  );
  const body = open ? (
    <Text style={{ paddingLeft: 42, paddingRight: padX, paddingBottom: glass ? 16 : 18, fontFamily: t.fonts.sans, fontSize: 14.5, lineHeight: 23, color: t.inkDim }}>{s.body}</Text>
  ) : null;

  if (glass) {
    return (
      <Glass radius={14} clear dark={!!t.dark} style={{ borderWidth: 1, borderColor: t.line, marginBottom: 10 }}>
        {header}
        {body}
      </Glass>
    );
  }
  return (
    <View style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: t.line }}>
      {header}
      {body}
    </View>
  );
}

export default function Results({ result, isPro, readOnly, onHome, onRecordAgain, onGetPro }) {
  const t = useTheme();
  const { scoreMode } = useTweaks();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(0);
  const reph = Array.isArray(result.rephrasings) ? result.rephrasings : [];
  const exer = Array.isArray(result.exercises) ? result.exercises : [];

  const onShare = async () => {
    try {
      await Share.share({
        message: `My ${result.intendedUse || 'delivery'} scored ${result.overall}/100 (${result.tier.label} · ${result.tier.name}) on AudioCoach AI. "${result.headline}"`,
      });
    } catch (e) {}
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        {/* header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Pressable onPress={onHome} hitSlop={10}><Icon name="back" size={22} stroke={t.ink} /></Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1, justifyContent: 'center' }}>
            <Icon name="voice" size={16} stroke={t.inkDim} />
            <Text numberOfLines={1} style={{ fontFamily: t.fonts.sans, fontSize: 13, fontWeight: '600', color: t.inkDim, maxWidth: 220 }}>{result.intendedUse || 'Voice Check'}</Text>
          </View>
          <Pressable onPress={onShare} hitSlop={10}><Icon name="share" size={21} stroke={t.ink} /></Pressable>
        </View>

        {/* hero */}
        <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 6 }}>
          <View style={{ position: 'absolute', top: -20, alignSelf: 'center', width: 260, height: 260 }} pointerEvents="none">
            <Svg width={260} height={260}>
              <Defs>
                <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={t.accentA} stopOpacity="0.28" />
                  <Stop offset="0.55" stopColor={t.accentA} stopOpacity="0.08" />
                  <Stop offset="1" stopColor={t.accentA} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="130" cy="130" r="130" fill="url(#heroGlow)" />
            </Svg>
          </View>
          <View style={{ width: '100%', alignItems: 'center' }}>
            <ScoreDisplay score={result.overall} tier={result.tier} mode={scoreMode} />
          </View>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 23, lineHeight: 29, color: t.ink, textAlign: 'center', marginTop: 22, maxWidth: 320 }}>{result.headline}</Text>
        </View>

        {/* progress vs last attempt */}
        {result.progress && (
          <Card style={{ marginTop: 20, gap: 12 }} pad={20}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="trophy" size={18} stroke={t.accentA} />
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 16, fontWeight: '700', color: t.ink }}>Attempt {result.attempt}</Text>
              <View style={{ flex: 1 }} />
              <Text style={{ fontFamily: t.fonts.serif, fontSize: 22, color: result.progress.overallDelta >= 0 ? t.accentA : t.inkDim, includeFontPadding: false }}>
                {result.progress.overallDelta >= 0 ? '+' : ''}{result.progress.overallDelta}
              </Text>
            </View>
            <Text style={{ fontFamily: t.fonts.serif, fontSize: 19, lineHeight: 26, color: t.ink }}>{result.progress.verdict}</Text>
            {result.progress.improved.length > 0 && (
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim, lineHeight: 20 }}>
                <Text style={{ color: t.accentA, fontWeight: '700' }}>Better: </Text>{result.progress.improved.join(', ')}
              </Text>
            )}
            {result.progress.fixed.length > 0 && (
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim, lineHeight: 20 }}>
                <Text style={{ color: t.accentA, fontWeight: '700' }}>Now fixed: </Text>{result.progress.fixed.join(', ')}
              </Text>
            )}
            {result.progress.remaining.length > 0 && (
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim, lineHeight: 20 }}>
                <Text style={{ color: t.ink, fontWeight: '700' }}>Still to fix: </Text>{result.progress.remaining.join(', ')}
              </Text>
            )}
            {result.progress.declined.length > 0 && (
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim, lineHeight: 20 }}>
                <Text style={{ color: t.ink, fontWeight: '700' }}>Slipped: </Text>{result.progress.declined.join(', ')}
              </Text>
            )}
          </Card>
        )}

        {/* what you nailed — lead with the wins */}
        {Array.isArray(result.strengths) && result.strengths.length > 0 && (
          <Card style={{ marginTop: 16, gap: 14 }} pad={22}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={18} stroke={t.good} />
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 16, fontWeight: '700', color: t.ink }}>What you nailed</Text>
            </View>
            {result.strengths.map((g, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.good, marginTop: 8 }} />
                <View style={{ flex: 1 }}>
                  {g.text ? (
                    <Text style={{ fontFamily: t.fonts.sans, fontSize: 14.5, fontWeight: '700', color: t.good }}>“{g.text}”</Text>
                  ) : null}
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim, lineHeight: 20, marginTop: g.text ? 3 : 0 }}>
                    {g.note || 'Strong, confident delivery here — keep doing exactly this.'}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* recording + transcript + flags */}
        <View style={{ marginTop: 16 }}>
          <ResultMedia result={result} />
        </View>

        {/* breakdown */}
        <Card style={{ marginTop: 16, gap: 20 }} pad={22}>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase' }}>Delivery breakdown</Text>
          {result.metrics.map((mt, k) => <MetricBar key={mt.label} {...mt} delay={k * 120} />)}
        </Card>

        {/* coaching */}
        <Card style={{ marginTop: 16 }} pad={22}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="spark" size={18} stroke={t.accentA} />
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 16, fontWeight: '700', color: t.ink }}>Coaching</Text>
          </View>
          <View>
            {result.suggestions.map((s, k) => (
              <SuggestionItem key={k} s={s} open={open === k} onToggle={() => setOpen(open === k ? -1 : k)} last={k === result.suggestions.length - 1} />
            ))}
          </View>
          {!readOnly && !(isPro ?? result.isPro) && (
            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.line, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="lock" size={16} stroke={t.accentA} />
                <Text style={{ flex: 1, fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkDim }}>Pro doubles your coaching and adds reworded lines + tailored vocal exercises.</Text>
              </View>
              <Btn size="sm" icon="spark" onPress={onGetPro}>Get Pro</Btn>
            </View>
          )}
        </Card>

        {/* Pro: say it better */}
        {result.isPro && reph.length > 0 && (
          <Card style={{ marginTop: 16, gap: 16 }} pad={22}>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase' }}>Say it better</Text>
            {reph.map((r, i) => (
              <View key={i} style={{ gap: 6 }}>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, color: t.inkDim, lineHeight: 20 }}>You said: “{r.before}”</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Icon name="spark" size={15} stroke={t.accentA} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, fontFamily: t.fonts.sans, fontSize: 15, fontWeight: '600', color: t.ink, lineHeight: 22 }}>“{r.after}”</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Pro: exercises */}
        {result.isPro && exer.length > 0 && (
          <Card style={{ marginTop: 16, gap: 14 }} pad={22}>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase' }}>Practice these</Text>
            {exer.map((e, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: t.accentA + '22', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, fontWeight: '700', color: t.accentA }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, fontWeight: '700', color: t.ink }}>{e.name}</Text>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim, lineHeight: 20, marginTop: 2 }}>{e.how}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        <View style={{ gap: 12, marginTop: 22 }}>
          {!readOnly && <Btn size="sm" onPress={onRecordAgain} icon="voice">Record a new one</Btn>}
          <Btn variant="ghost" size="sm" onPress={onHome}>Done</Btn>
        </View>
      </ScrollView>
    </Screen>
  );
}
