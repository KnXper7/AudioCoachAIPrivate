// DebateScreen.js — Debate Mode (Pro, or 1 free trial). A live, turn-based
// spoken debate against the AI, then a full coaching analysis. Caps: 4 user
// turns or 2 minutes total, whichever comes first.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Easing, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Btn from '../components/Btn';
import Icon from '../components/Icon';
import { GlassCircle } from '../components/Glass';
import ScoreDisplay from '../components/ScoreDisplay';
import MetricBar from '../components/MetricBar';
import { useTheme } from '../theme/ThemeContext';
import { tierFor } from '../theme/theme';
import { debateTurn, debateAnalyze, randomTopic } from '../services/debate';

const MAX_TURNS = 4;
const MAX_TOTAL = 120; // seconds across the whole debate
const MAX_TURN = 30;   // seconds per single turn

export default function DebateScreen({ isPro, isFreeTrial, onClose, onStartTrial, onGetPro }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState('setup'); // setup | debating | analyzing | result
  const [topic, setTopic] = useState(randomTopic());
  const [side, setSide] = useState('For');
  const [history, setHistory] = useState([]); // {role:'user'|'ai', text}
  const [isRec, setIsRec] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [totalSecs, setTotalSecs] = useState(0);
  const [turnSecs, setTurnSecs] = useState(0);
  const [turns, setTurns] = useState(0);
  const [analysis, setAnalysis] = useState(null);

  const recRef = useRef(null);
  const timerRef = useRef(null);
  const totalRef = useRef(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recRef.current) recRef.current.stopAndUnloadAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isRec) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isRec]);

  const maxedOut = turns >= MAX_TURNS || totalSecs >= MAX_TOTAL;

  const begin = () => {
    if (onStartTrial) onStartTrial(); // counts the free trial (if applicable)
    setPhase('debating');
  };

  const startRec = async () => {
    if (thinking || maxedOut) return;
    try {
      const p = await Audio.requestPermissionsAsync();
      if (!p.granted) { Alert.alert('Microphone needed', 'Enable mic access to debate.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recRef.current = recording;
      setIsRec(true);
      setTurnSecs(0);
      timerRef.current = setInterval(() => {
        setTurnSecs((s) => {
          totalRef.current += 1;
          setTotalSecs(totalRef.current);
          if (s + 1 >= MAX_TURN || totalRef.current >= MAX_TOTAL) { stopRec(); }
          return s + 1;
        });
      }, 1000);
    } catch (e) {}
  };

  const stopRec = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRec(false);
    const rec = recRef.current;
    recRef.current = null;
    if (!rec) return;
    let uri = null;
    try { await rec.stopAndUnloadAsync(); uri = rec.getURI(); } catch (e) {}
    if (!uri) return;
    setThinking(true);
    try {
      const res = await debateTurn({ topic, side, history, audioUri: uri });
      const you = (res && res.you) || '…';
      const ai = (res && res.ai) || 'Interesting — but that does not hold up.';
      setHistory((h) => [...h, { role: 'user', text: you }, { role: 'ai', text: ai }]);
      setTurns((n) => n + 1);
      setTimeout(() => scrollRef.current && scrollRef.current.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert(e && e.overloaded ? 'Model busy' : 'Connection issue', 'Could not reach the coach. Try that turn again.');
    } finally {
      setThinking(false);
    }
  };

  const finish = async () => {
    setPhase('analyzing');
    const transcript = history.map((h) => `${h.role === 'ai' ? 'You' : 'User'}: ${h.text}`).join('\n');
    try {
      const a = await debateAnalyze({ topic, side, transcript });
      setAnalysis(a);
      setPhase('result');
    } catch (e) {
      Alert.alert('Analysis failed', 'Could not score the debate. Try again.');
      setPhase('debating');
    }
  };

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
  const remaining = Math.max(0, MAX_TOTAL - totalSecs);
  const mm = String(Math.floor(remaining / 60)).padStart(1, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  // ---------- SETUP ----------
  if (phase === 'setup') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 22, paddingBottom: insets.bottom + 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <GlassCircle size={38} onPress={onClose} fallbackStyle={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
              <Icon name="close" size={19} stroke={t.ink} />
            </GlassCircle>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, fontWeight: '600', color: t.inkDim }}>Debate Mode</Text>
            <View style={{ width: 38 }} />
          </View>

          <Text style={{ fontFamily: t.fonts.serif, fontSize: 34, lineHeight: 40, color: t.ink }}>Debate the AI.</Text>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, lineHeight: 22, color: t.inkDim, marginTop: 8 }}>
            Pick a side and argue it out loud. The AI fights back. After {Math.floor(MAX_TOTAL / 60)} minutes you get coached on your delivery and your argument.
          </Text>

          {isFreeTrial && !isPro && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, alignSelf: 'flex-start', backgroundColor: t.accentA + '1f' }}>
              <Icon name="spark" size={14} stroke={t.accentA} />
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, fontWeight: '700', color: t.accentA }}>1 free trial</Text>
            </View>
          )}

          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase', marginTop: 26, marginBottom: 10 }}>Topic</Text>
          <Card pad={18}>
            <Text style={{ fontFamily: t.fonts.serif, fontSize: 21, lineHeight: 28, color: t.ink }}>{topic}</Text>
            <Pressable onPress={() => setTopic(randomTopic(topic))} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, opacity: pressed ? 0.6 : 1 })}>
              <Icon name="history" size={15} stroke={t.accentA} />
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, fontWeight: '600', color: t.accentA }}>Shuffle topic</Text>
            </Pressable>
          </Card>

          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 }}>Your side</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {['For', 'Against'].map((s) => {
              const on = side === s;
              return (
                <Pressable key={s} onPress={() => setSide(s)} style={{ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: on ? t.accentA : t.line, backgroundColor: on ? t.accentA + '1f' : 'transparent' }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, fontWeight: '700', color: on ? t.accentA : t.inkDim }}>{s}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 28 }}>
            <Btn onPress={begin} icon="spark">Start the debate</Btn>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // ---------- ANALYZING ----------
  if (phase === 'analyzing') {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <ActivityIndicator size="large" color={t.accentA} />
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 22, color: t.ink }}>Scoring your debate…</Text>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, color: t.inkDim }}>Delivery and argument.</Text>
        </View>
      </Screen>
    );
  }

  // ---------- RESULT ----------
  if (phase === 'result' && analysis) {
    const scores = Array.isArray(analysis.scores) ? analysis.scores : [];
    const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
    const improvements = Array.isArray(analysis.improvements) ? analysis.improvements : [];
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <GlassCircle size={38} onPress={onClose} fallbackStyle={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
              <Icon name="close" size={19} stroke={t.ink} />
            </GlassCircle>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, fontWeight: '600', color: t.inkDim }}>Debate result</Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <ScoreDisplay score={analysis.overall || 0} tier={tierFor(analysis.overall || 0)} mode="bar" />
            <Text style={{ fontFamily: t.fonts.serif, fontSize: 22, lineHeight: 28, color: t.ink, textAlign: 'center', marginTop: 18, maxWidth: 320 }}>{analysis.verdict || 'Debate complete.'}</Text>
          </View>

          {scores.length > 0 && (
            <Card style={{ marginTop: 18, gap: 18 }} pad={22}>
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase' }}>Breakdown</Text>
              {scores.map((s, k) => <MetricBar key={s.label || k} label={s.label} value={s.value} note={s.note} delay={k * 110} />)}
            </Card>
          )}

          {strengths.length > 0 && (
            <Card style={{ marginTop: 16, gap: 12 }} pad={22}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="check" size={18} stroke={t.good} />
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 16, fontWeight: '700', color: t.ink }}>What you did well</Text>
              </View>
              {strengths.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.good, marginTop: 7 }} />
                  <Text style={{ flex: 1, fontFamily: t.fonts.sans, fontSize: 14, lineHeight: 21, color: t.inkDim }}>{typeof s === 'string' ? s : s.text}</Text>
                </View>
              ))}
            </Card>
          )}

          {improvements.length > 0 && (
            <Card style={{ marginTop: 16, gap: 14 }} pad={22}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="spark" size={18} stroke={t.accentA} />
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 16, fontWeight: '700', color: t.ink }}>Sharpen this</Text>
              </View>
              {improvements.map((s, i) => (
                <View key={i} style={{ gap: 3 }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, fontWeight: '700', color: t.ink }}>{s.title}</Text>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, lineHeight: 20, color: t.inkDim }}>{s.body}</Text>
                </View>
              ))}
            </Card>
          )}

          {(analysis.bestLine || analysis.nextTip || typeof analysis.fillerWords === 'number') && (
            <Card style={{ marginTop: 16, gap: 12 }} pad={22}>
              {analysis.bestLine ? (
                <View>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.2, color: t.inkFaint, textTransform: 'uppercase', marginBottom: 4 }}>Your best line</Text>
                  <Text style={{ fontFamily: t.fonts.serif, fontSize: 18, lineHeight: 25, color: t.ink }}>“{analysis.bestLine}”</Text>
                </View>
              ) : null}
              {typeof analysis.fillerWords === 'number' ? (
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim }}>Filler words used: <Text style={{ fontWeight: '700', color: t.ink }}>{analysis.fillerWords}</Text></Text>
              ) : null}
              {analysis.nextTip ? (
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, lineHeight: 21, color: t.inkDim }}><Text style={{ color: t.accentA, fontWeight: '700' }}>Next time: </Text>{analysis.nextTip}</Text>
              ) : null}
            </Card>
          )}

          <View style={{ gap: 12, marginTop: 22 }}>
            {isPro ? (
              <Btn size="sm" icon="voice" onPress={() => { setHistory([]); setTurns(0); setTotalSecs(0); totalRef.current = 0; setAnalysis(null); setTopic(randomTopic(topic)); setPhase('setup'); }}>Debate again</Btn>
            ) : (
              <Btn size="sm" icon="spark" onPress={onGetPro}>Unlock unlimited debates</Btn>
            )}
            <Btn variant="ghost" size="sm" onPress={onClose}>Done</Btn>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // ---------- DEBATING ----------
  return (
    <Screen>
      <View style={{ flex: 1, paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <GlassCircle size={38} onPress={onClose} fallbackStyle={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
            <Icon name="close" size={19} stroke={t.ink} />
          </GlassCircle>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: t.fonts.mono, fontSize: 15, fontWeight: '700', color: remaining <= 20 ? t.bad : t.ink }}>{mm}:{ss}</Text>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 11, color: t.inkFaint }}>Turn {Math.min(turns + 1, MAX_TURNS)} / {MAX_TURNS}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <View style={{ paddingHorizontal: 2, marginBottom: 8 }}>
          <Text numberOfLines={2} style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkDim }}>
            <Text style={{ fontWeight: '700', color: t.accentA }}>{side}: </Text>{topic}
          </Text>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8, gap: 10 }} showsVerticalScrollIndicator={false}>
          {history.length === 0 && (
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, color: t.inkFaint, textAlign: 'center', marginTop: 30 }}>Hold the mic and make your opening argument.</Text>
          )}
          {history.map((h, i) => {
            const me = h.role === 'user';
            return (
              <View key={i} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', color: t.inkFaint, marginBottom: 3, textAlign: me ? 'right' : 'left' }}>{me ? 'You' : 'AI'}</Text>
                <View style={{ paddingVertical: 11, paddingHorizontal: 14, borderRadius: 18, backgroundColor: me ? t.accentA + '24' : t.surface, borderWidth: 1, borderColor: me ? t.accentA + '40' : t.line }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 14.5, lineHeight: 21, color: t.ink }}>{h.text}</Text>
                </View>
              </View>
            );
          })}
          {thinking && (
            <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
              <ActivityIndicator size="small" color={t.accentA} />
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkDim }}>AI is countering…</Text>
            </View>
          )}
        </ScrollView>

        <View style={{ alignItems: 'center', paddingTop: 10 }}>
          {maxedOut ? (
            <View style={{ width: '100%' }}>
              <Btn onPress={finish} icon="spark">End & get my coaching</Btn>
            </View>
          ) : (
            <>
              <Pressable onPress={isRec ? stopRec : startRec} disabled={thinking}>
                <Animated.View style={{ transform: [{ scale: isRec ? scale : 1 }], width: 84, height: 84, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: isRec ? t.bad : t.accentA, opacity: thinking ? 0.5 : 1 }}>
                  <Icon name={isRec ? 'pause' : 'voice'} size={34} stroke={t.onAccent} />
                </Animated.View>
              </Pressable>
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkDim, marginTop: 10 }}>
                {thinking ? 'Hang on…' : isRec ? `Recording — tap to send (${turnSecs}s)` : 'Tap to make your point'}
              </Text>
              {turns > 0 && (
                <Pressable onPress={finish} style={{ marginTop: 8 }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, fontWeight: '600', color: t.accentA }}>End early & get coaching</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
