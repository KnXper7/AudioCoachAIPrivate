// ResultMedia.js — voice playback with a YouTube-style draggable scrubber that
// loops, marks your mistakes on the timeline, and a color-coded transcript.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '../theme/ThemeContext';
import Icon from './Icon';

// Delivery cues shown inline in the transcript.
const CUE_META = {
  pitch: { label: 'raise pitch', symbol: '↑' },
  pause: { label: 'pause', symbol: '‖' },
  slow: { label: 'slow down', symbol: '↘' },
  volume: { label: 'vary volume', symbol: '◊' },
};
const normCue = (type) => (CUE_META[type] ? type : 'pause');

function buildSegments(transcript, flags, strengths, cues) {
  if (!transcript) return [];
  const ranges = [];
  (flags || []).forEach((f, i) => {
    if (!f.text) return;
    const idx = transcript.indexOf(f.text);
    if (idx >= 0) ranges.push({ start: idx, end: idx + f.text.length, kind: f.severity === 'high' ? 'high' : 'med', flag: i, prio: 0 });
  });
  (strengths || []).forEach((g) => {
    if (!g.text) return;
    const idx = transcript.indexOf(g.text);
    if (idx >= 0) ranges.push({ start: idx, end: idx + g.text.length, kind: 'good', flag: null, prio: 1 });
  });
  (cues || []).forEach((c) => {
    if (!c.text) return;
    const idx = transcript.indexOf(c.text);
    if (idx >= 0) ranges.push({ start: idx, end: idx + c.text.length, kind: 'cue', flag: null, cue: normCue(c.type), note: c.note || '', prio: 2 });
  });
  ranges.sort((a, b) => (a.start - b.start) || (a.prio - b.prio));
  const segs = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start < cursor) continue;
    if (r.start > cursor) segs.push({ text: transcript.slice(cursor, r.start), kind: null, flag: null });
    segs.push({ text: transcript.slice(r.start, r.end), kind: r.kind, flag: r.flag, cue: r.cue });
    cursor = r.end;
  }
  if (cursor < transcript.length) segs.push({ text: transcript.slice(cursor), kind: null, flag: null });
  return segs;
}

const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;

export default function ResultMedia({ result }) {
  const t = useTheme();
  const [playing, setPlaying] = useState(false);
  const [posMs, setPosMs] = useState(0);
  const [durMs, setDurMs] = useState(0);
  const [trackW, setTrackW] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  const soundRef = useRef(null);
  const trackWRef = useRef(0);
  const durRef = useRef(0);
  const scrubRef = useRef(false);

  const flags = Array.isArray(result.flags) ? result.flags : [];
  const cues = Array.isArray(result.cues) ? result.cues : [];
  const segs = buildSegments(result.transcript, flags, result.strengths, cues);

  const estDur = Math.max(1, ...flags.map((f) => (f.t || 0) + 2), 8);
  const durSec = durMs > 0 ? durMs / 1000 : estDur;

  useEffect(() => () => { if (soundRef.current) soundRef.current.unloadAsync().catch(() => {}); }, []);

  const ensureSound = async () => {
    if (!soundRef.current && result.audioUri) {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound, status } = await Audio.Sound.createAsync({ uri: result.audioUri }, { isLooping: true });
      soundRef.current = sound;
      if (status?.durationMillis) { setDurMs(status.durationMillis); durRef.current = status.durationMillis; }
      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        if (s.durationMillis) { durRef.current = s.durationMillis; setDurMs(s.durationMillis); }
        if (!scrubRef.current) setPosMs(s.positionMillis || 0);
        setPlaying(!!s.isPlaying);
      });
    }
    return soundRef.current;
  };

  const toggle = async () => {
    const snd = await ensureSound();
    if (!snd) return;
    try {
      const s = await snd.getStatusAsync();
      if (s.isPlaying) await snd.pauseAsync();
      else await snd.playAsync();
    } catch (e) {}
  };

  const seekToMs = async (ms) => {
    const snd = await ensureSound();
    if (!snd) return;
    const clamped = Math.max(0, Math.min((durRef.current || durSec * 1000) - 50, ms));
    try { await snd.setPositionAsync(Math.round(clamped)); } catch (e) {}
  };

  const seekToSec = (sec) => seekToMs(sec * 1000);

  // Draggable scrubber
  const fracToMs = (frac) => frac * (durRef.current || durSec * 1000);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        scrubRef.current = true;
        setScrubbing(true);
        const x = e.nativeEvent.locationX;
        const frac = trackWRef.current ? Math.max(0, Math.min(1, x / trackWRef.current)) : 0;
        setPosMs(fracToMs(frac));
      },
      onPanResponderMove: (e, g) => {
        const x = Math.max(0, Math.min(trackWRef.current, g.moveX - (g.x0 - e.nativeEvent.locationX)));
        const frac = trackWRef.current ? Math.max(0, Math.min(1, x / trackWRef.current)) : 0;
        setPosMs(fracToMs(frac));
      },
      onPanResponderRelease: async (e) => {
        const frac = trackWRef.current ? Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWRef.current)) : 0;
        const ms = fracToMs(frac);
        await seekToMs(ms);
        scrubRef.current = false;
        setScrubbing(false);
      },
      onPanResponderTerminate: () => { scrubRef.current = false; setScrubbing(false); },
    })
  ).current;

  const progress = durSec > 0 ? Math.min(1, posMs / 1000 / durSec) : 0;
  if (!result.audioUri) return null;

  return (
    <View style={{ gap: 14 }}>
      {/* playback + draggable timeline */}
      <View style={{ padding: 16, borderRadius: 20, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable onPress={toggle} style={{ width: 46, height: 46, borderRadius: 999, backgroundColor: t.accentA, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={playing ? 'pause' : 'play'} size={20} stroke={t.onAccent} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 14.5, fontWeight: '600', color: t.ink }}>Your recording</Text>
            <Text style={{ fontFamily: t.fonts.mono, fontSize: 12, color: t.inkDim }}>{fmtT(posMs / 1000)} / {fmtT(durSec)} · loops</Text>
          </View>
        </View>

        {/* scrubber: bigger touch target, draggable, with handle + markers */}
        <View {...pan.panHandlers} style={{ height: 34, justifyContent: 'center', marginTop: 12 }}>
          <View onLayout={(e) => { const w = e.nativeEvent.layout.width; setTrackW(w); trackWRef.current = w; }} style={{ height: 6, borderRadius: 999, backgroundColor: t.line, overflow: 'visible', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', left: 0, top: 0, height: 6, width: `${progress * 100}%`, backgroundColor: t.accentA, borderRadius: 999 }} />
            {/* drag handle */}
            <View style={{ position: 'absolute', left: `${progress * 100}%`, width: 18, height: 18, borderRadius: 999, backgroundColor: t.accentA, borderWidth: 3, borderColor: t.bg, transform: [{ translateX: -9 }, { scale: scrubbing ? 1.25 : 1 }] }} />
          </View>
        </View>
        <Text style={{ fontFamily: t.fonts.sans, fontSize: 11.5, color: t.inkFaint, marginTop: 8 }}>Drag to scrub · loops automatically.</Text>
      </View>

      {/* transcript with highlighted mistakes */}
      {result.transcript ? (
        <View style={{ padding: 18, borderRadius: 20, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase' }}>Transcript</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.good }} /><Text style={{ fontFamily: t.fonts.sans, fontSize: 10.5, color: t.inkFaint }}>strong</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.warn }} /><Text style={{ fontFamily: t.fonts.sans, fontSize: 10.5, color: t.inkFaint }}>minor</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.bad }} /><Text style={{ fontFamily: t.fonts.sans, fontSize: 10.5, color: t.inkFaint }}>fix</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text style={{ fontFamily: t.fonts.sans, fontSize: 11, color: t.accentA, fontWeight: '700' }}>↑‖</Text><Text style={{ fontFamily: t.fonts.sans, fontSize: 10.5, color: t.inkFaint }}>cue</Text></View>
            </View>
          </View>
          <Text style={{ fontFamily: t.fonts.serif, fontSize: 19, lineHeight: 32, color: t.ink }}>
            {segs.map((seg, k) => {
              if (seg.kind === null) return <Text key={k}>{seg.text}</Text>;
              if (seg.kind === 'cue') {
                const m = CUE_META[seg.cue] || CUE_META.pause;
                return (
                  <Text key={k}>
                    <Text style={{ color: t.accentA, textDecorationLine: 'underline', textDecorationColor: t.accentA + '88' }}>{seg.text}</Text>
                    <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, color: t.accentA, fontWeight: '700' }}> {m.symbol}{' '}{m.label} </Text>
                  </Text>
                );
              }
              const color = seg.kind === 'high' ? t.bad : seg.kind === 'med' ? t.warn : t.good;
              const press = seg.flag != null ? () => seekToSec(flags[seg.flag].t || 0) : undefined;
              return (
                <Text key={k} onPress={press} style={{ color, textDecorationLine: 'underline', textDecorationColor: color, fontWeight: '700' }}>
                  {seg.text}
                </Text>
              );
            })}
          </Text>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 11.5, lineHeight: 17, color: t.inkFaint, marginTop: 10 }}>
            Cues in indigo show how to deliver: ↑ raise pitch · ‖ pause · ↘ slow down · ◊ vary volume.
          </Text>
        </View>
      ) : null}

      {/* flagged mistakes */}
      {flags.length > 0 ? (
        <View style={{ padding: 18, borderRadius: 20, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, gap: 14 }}>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase' }}>What to fix · {flags.length}</Text>
          {flags.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: f.severity === 'high' ? t.bad : t.warn, marginTop: 8 }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 14.5, fontWeight: '700', color: t.ink }}>“{f.text}”</Text>
                  <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: t.accentA + '22' }}>
                    <Text style={{ fontFamily: t.fonts.sans, fontSize: 11, fontWeight: '600', color: t.accentA }}>{f.metric}</Text>
                  </View>
                  {typeof f.t === 'number' ? (
                    <Pressable onPress={() => seekToSec(f.t)} style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1, borderColor: t.line }}>
                      <Text style={{ fontFamily: t.fonts.mono, fontSize: 11, color: t.inkDim }}>{fmtT(f.t)}</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim, lineHeight: 20, marginTop: 3 }}>{f.note}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
