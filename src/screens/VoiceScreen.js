import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import Btn from '../components/Btn';
import { GlassCircle } from '../components/Glass';
import { useTheme } from '../theme/ThemeContext';

// Optional on-device live transcription. Only present in a dev/EAS build; in
// Expo Go this require fails and we simply skip live captions (still records).
let Voice = null;
try { Voice = require('@react-native-voice/voice').default; } catch (e) { Voice = null; }

const MAX_SECONDS = 60;

export default function VoiceScreen({ onClose, onCapture, lockedContext, lockedTitle }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [perm, setPerm] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [title, setTitle] = useState(lockedTitle || '');
  const [context, setContext] = useState(lockedContext || '');
  const [focused, setFocused] = useState(false);
  const [liveText, setLiveText] = useState('');
  const liveRef = useRef('');
  const recRef = useRef(null);
  const timerRef = useRef(null);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const res = await Audio.requestPermissionsAsync();
      setPerm(res.granted);
    })();
    if (Voice) {
      const onResults = (e) => {
        const txt = (e.value && e.value[0]) || '';
        liveRef.current = txt;
        setLiveText(txt);
      };
      Voice.onSpeechPartialResults = onResults;
      Voice.onSpeechResults = onResults;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recRef.current) recRef.current.stopAndUnloadAsync().catch(() => {});
      if (Voice) { Voice.destroy().then(() => Voice.removeAllListeners()).catch(() => {}); }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isRecording]);

  const newSession = lockedContext == null;
  const ready = !newSession || (!!title.trim() && !!context.trim());

  const start = async () => {
    if (!ready) return;
    Keyboard.dismiss();
    try {
      if (!perm) {
        const res = await Audio.requestPermissionsAsync();
        setPerm(res.granted);
        if (!res.granted) return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recRef.current = recording;
      liveRef.current = '';
      setLiveText('');
      if (Voice) { try { await Voice.start('en-US'); } catch (e) {} }
      setIsRecording(true);
      setSecs(0);
      timerRef.current = setInterval(() => {
        setSecs((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stop();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {}
  };

  const stop = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    try {
      const rec = recRef.current;
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recRef.current = null;
      if (Voice) { try { await Voice.stop(); } catch (e) {} }
      onCapture(uri || null, payload());
    } catch (e) {
      onCapture(null, payload());
    }
  };

  const payload = () => ({
    title: (lockedTitle != null ? lockedTitle : title).trim(),
    context: (lockedContext != null ? lockedContext : context).trim(),
    transcript: liveRef.current.trim(),
    durationSec: secs,
  });

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  const fieldStyle = (filled) => ({
    fontFamily: t.fonts.sans,
    fontSize: 16,
    color: t.ink,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: filled ? t.line : t.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  });
  const label = { fontFamily: t.fonts.sans, fontSize: 11.5, letterSpacing: 1.4, color: t.inkFaint, textTransform: 'uppercase', marginBottom: 6 };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <View style={{ flex: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }}>
          {/* top bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <GlassCircle size={38} onPress={onClose} hitSlop={10} clear dark={!!t.dark} fallbackStyle={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
              <Icon name="close" size={19} stroke={t.ink} />
            </GlassCircle>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="voice" size={16} stroke={t.inkDim} />
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, fontWeight: '600', color: t.inkDim }}>Voice Check</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          {/* top region: form / practice / live */}
          <View style={{ marginTop: 18 }}>
            {!isRecording && newSession && (
              <View>
                <Text style={{ fontFamily: t.fonts.serif, fontSize: 25, lineHeight: 31, color: t.ink, marginBottom: 4 }}>Set up your take</Text>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, lineHeight: 19, color: t.inkDim, marginBottom: 16 }}>Tell the coach what you're about to say. Then tap the mic and speak.</Text>

                <Text style={label}>Session title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  returnKeyType="next"
                  placeholder="e.g. Series A pitch"
                  placeholderTextColor={t.inkFaint}
                  style={{ ...fieldStyle(!!title.trim()), marginBottom: 12 }}
                />
                <Text style={label}>What you're saying & to whom</Text>
                <TextInput
                  value={context}
                  onChangeText={setContext}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  returnKeyType="done"
                  placeholder="e.g. pitching a slideshow"
                  placeholderTextColor={t.inkFaint}
                  style={fieldStyle(!!context.trim())}
                />
              </View>
            )}

            {!isRecording && !newSession && (
              <View style={{ alignItems: 'center', marginTop: 24 }}>
                <Text style={label}>Practice run</Text>
                <Text style={{ fontFamily: t.fonts.serif, fontSize: 26, lineHeight: 34, color: t.ink, textAlign: 'center' }}>Say it again.</Text>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, lineHeight: 20, color: t.inkDim, marginTop: 10, textAlign: 'center' }}>{lockedContext ? 'For: ' + lockedContext + '\n' : ''}I'll tell you exactly what improved.</Text>
              </View>
            )}

            {isRecording && (
              <View style={{ alignItems: 'center', marginTop: 12 }}>
                <Text style={{ fontFamily: t.fonts.serif, fontSize: 26, lineHeight: 34, color: t.ink, textAlign: 'center' }}>Listening…</Text>
                {!!liveText && (
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 16, lineHeight: 24, color: t.ink, marginTop: 14, textAlign: 'center' }}>{liveText}</Text>
                )}
                {context ? (
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, color: t.inkDim, marginTop: 8, textAlign: 'center' }}>Coaching for: {context}</Text>
                ) : null}
              </View>
            )}
          </View>

          {/* flexible spacer keeps the mic pinned low and collapses when keyboard is up */}
          <View style={{ flex: 1, minHeight: 16 }} />

          {/* timer */}
          <Text style={{ fontFamily: t.fonts.mono, fontSize: 14, letterSpacing: 2, color: isRecording ? t.accentA : t.inkFaint, textAlign: 'center', marginBottom: 14 }}>
            {mm}:{ss} {isRecording ? '· REC' : `· up to ${MAX_SECONDS}s`}
          </Text>

          {/* record button */}
          <View style={{ alignItems: 'center' }}>
            <Pressable onPress={isRecording ? stop : start} disabled={!isRecording && !ready} style={{ width: 92, height: 92, alignItems: 'center', justifyContent: 'center', opacity: !isRecording && !ready ? 0.4 : 1 }}>
              <Animated.View style={{ position: 'absolute', width: 92, height: 92, borderRadius: 999, backgroundColor: t.accentA, opacity: isRecording ? glow : 0.22, transform: [{ scale: isRecording ? scale : 1 }] }} />
              {isRecording ? (
                <View style={{ width: 80, height: 80, borderRadius: 999, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#fff' }} />
                </View>
              ) : (
                <LinearGradient colors={[t.accentA, t.accentB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 80, height: 80, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="voice" size={34} stroke={t.onAccent} />
                </LinearGradient>
              )}
            </Pressable>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkDim, marginTop: 14, textAlign: 'center' }}>
              {isRecording ? 'Tap to stop & analyze' : perm === false ? 'Microphone access needed' : !ready ? 'Fill in both fields to start' : 'Tap the mic to record'}
            </Text>
            {perm === false && (
              <View style={{ marginTop: 14, width: '100%' }}>
                <Btn size="sm" onPress={async () => { const r = await Audio.requestPermissionsAsync(); setPerm(r.granted); }}>Enable microphone</Btn>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
