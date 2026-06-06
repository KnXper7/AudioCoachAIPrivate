// realAiService.gemini.js — REAL AI via the Cloudflare Worker (backend/auracheck-worker.js).
// The Gemini key lives on the Worker as a secret; the device only knows WORKER_URL.
// The device reads the audio, POSTs it to the Worker, then applies the length
// adjustment, score clamps, and field sanitization to whatever the model returns.
// SDK 54 moved readAsStringAsync / EncodingType to the legacy entry point.
import * as FileSystem from 'expo-file-system/legacy';
import { tierFor } from '../theme/theme';
import { WORKER_URL } from '../config';

const LABELS = ['Pace', 'Pauses', 'Pitch', 'Volume', 'Breathing', 'Articulation'];

// Compares a take to the previous one in the same session to describe progress.
function compareProgress(prev, curr) {
  if (!prev || !curr) return null;
  const overallDelta = curr.overall - prev.overall;
  const prevM = Object.fromEntries((prev.metrics || []).map((m) => [m.label, m.value]));
  const perMetric = (curr.metrics || []).map((m) => ({ label: m.label, delta: m.value - (prevM[m.label] ?? m.value) }));
  const improved = perMetric.filter((x) => x.delta >= 3).map((x) => x.label);
  const declined = perMetric.filter((x) => x.delta <= -3).map((x) => x.label);
  const prevF = new Set((prev.flags || []).map((f) => f.metric));
  const currF = new Set((curr.flags || []).map((f) => f.metric));
  const fixed = [...prevF].filter((m) => !currF.has(m));
  const remaining = [...currF];
  const newIssues = [...currF].filter((m) => !prevF.has(m));
  let verdict;
  if (curr.overall >= 90) verdict = 'Dialed in — this is podium-ready.';
  else if (overallDelta >= 4) verdict = 'Clear improvement. Run it again.';
  else if (overallDelta <= -4) verdict = 'Slipped — you had it cleaner last time.';
  else verdict = 'About the same. Change one thing and go again.';
  return { overallDelta, perMetric, improved, declined, fixed, remaining, newIssues, verdict };
}

function mimeFor(uri) {
  const u = (uri || '').toLowerCase();
  if (u.endsWith('.wav')) return 'audio/wav';
  if (u.endsWith('.mp3')) return 'audio/mp3';
  if (u.endsWith('.aac')) return 'audio/aac';
  if (u.endsWith('.ogg')) return 'audio/ogg';
  if (u.endsWith('.flac')) return 'audio/flac';
  return 'audio/mp4'; // expo-av default (.m4a / AAC in MP4)
}

// Length adjustment — the model tends to over-reward very short clips and is
// stingy on longer ones. Nudge short takes down and long takes slightly up so a
// 5-second blurb and a 50-second pitch are judged on a comparable curve.
function lengthAdjust(sec) {
  const s = Number(sec) || 0;
  if (s <= 0) return 0;       // unknown duration → no change
  if (s < 6) return -14;      // ~5s blurb
  if (s < 10) return -10;
  if (s < 15) return -5;
  if (s < 25) return 0;       // neutral band
  if (s < 40) return 3;
  if (s < 55) return 5;
  return 7;                   // full-length take
}

// ——— safety nets: never trust the model's JSON blindly ———
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const clampScore = (n) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? clamp(v, 0, 100) : 0;
};
const str = (v, max = 200) => (v == null ? '' : String(v)).slice(0, max);
const arr = (v) => (Array.isArray(v) ? v : []);

// Always return exactly the six metrics, each a valid 0–100 int.
function normMetrics(raw) {
  const by = {};
  arr(raw).forEach((m) => { if (m && m.label && LABELS.includes(m.label)) by[m.label] = m; });
  return LABELS.map((label) => ({ label, value: clampScore(by[label] && by[label].value), note: str(by[label] && by[label].note, 40) }));
}
function normFlags(raw) {
  return arr(raw)
    .filter((f) => f && f.text)
    .slice(0, 12)
    .map((f) => ({
      text: str(f.text, 120),
      metric: LABELS.includes(f.metric) ? f.metric : 'Pace',
      severity: f.severity === 'high' ? 'high' : 'med',
      note: str(f.note, 140),
      t: Number.isFinite(Number(f.t)) ? Math.max(0, Number(f.t)) : null,
    }));
}
const CUE_TYPES = ['pitch', 'pause', 'slow', 'volume'];
function normCues(raw) {
  return arr(raw).filter((c) => c && c.text).slice(0, 8).map((c) => ({ text: str(c.text, 120), type: CUE_TYPES.includes(c.type) ? c.type : 'pause', note: str(c.note, 80) }));
}
function normStrengths(raw) {
  return arr(raw).filter((g) => g && (g.text || g.note)).slice(0, 3).map((g) => ({ text: str(g.text, 120), note: str(g.note, 180) }));
}
function normSuggestions(raw, max) {
  return arr(raw).filter((s) => s && (s.title || s.body)).slice(0, max).map((s) => ({ title: str(s.title, 80), body: str(s.body, 400) }));
}
function normPairs(raw, max) {
  return arr(raw).filter((r) => r && (r.before || r.after)).slice(0, max).map((r) => ({ before: str(r.before, 200), after: str(r.after, 200) }));
}
function normExercises(raw, max) {
  return arr(raw).filter((e) => e && (e.name || e.how)).slice(0, max).map((e) => ({ name: str(e.name, 80), how: str(e.how, 200) }));
}

export const aiService = {
  async analyze(mode, uri, opts = {}) {
    const isPro = !!opts.isPro;
    const ctx = opts.context || '';
    const durationSec = opts.durationSec || 0;

    if (!WORKER_URL || WORKER_URL.includes('PASTE_YOUR_WORKER')) {
      throw new Error('Backend not configured. Deploy the Worker and set WORKER_URL in src/config.js.');
    }

    let audioB64 = null;
    if (uri) audioB64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

    const endpoint = WORKER_URL.replace(/\/+$/, '') + '/analyze';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioB64, audioMime: mimeFor(uri), context: ctx, isPro }),
    });
    if (!res.ok) {
      let detail = '', overloaded = res.status === 503;
      try { const j = await res.json(); detail = j.detail || ''; overloaded = overloaded || !!j.overloaded; } catch (e) {}
      if (overloaded) {
        throw new Error('The coach is busy right now — lots of people are recording. Give it a few seconds and try again.');
      }
      throw new Error(`Coach backend error (${res.status})${detail ? ': ' + String(detail).slice(0, 140) : ''}`);
    }
    let data;
    try { data = await res.json(); } catch (e) { throw new Error('Backend returned an invalid response.'); }
    if (data && data.error) throw new Error(String(data.detail || data.error).slice(0, 160));

    if (!data || data.visible === false) {
      return { mode: 'voice', visible: false };
    }

    const overall = clampScore(clampScore(data.overall) + lengthAdjust(durationSec));
    const out = {
      id: 'rec_' + Date.now(),
      mode: 'voice',
      audioUri: uri,
      durationSec,
      visible: true,
      isPro,
      context: ctx,
      intendedUse: str(data.intendedUse, 60) || ctx || 'A spoken delivery',
      overall,
      tier: tierFor(overall),
      headline: str(data.headline, 240),
      metrics: normMetrics(data.metrics),
      suggestions: normSuggestions(data.suggestions, isPro ? 6 : 3),
      transcript: data.transcript ? str(data.transcript, 5000) : null,
      flags: normFlags(data.flags),
      strengths: normStrengths(data.strengths),
      cues: normCues(data.cues),
      rephrasings: isPro ? normPairs(data.rephrasings, 3) : [],
      exercises: isPro ? normExercises(data.exercises, 3) : [],
      attempt: opts.prev ? (opts.prev.attempt || 1) + 1 : 1,
      ts: Date.now(),
    };
    out.progress = opts.prev ? compareProgress(opts.prev, out) : null;
    return out;
  },

  steps() {
    return ['Transcribing your speech', 'Reading pace & pauses', 'Checking pitch & breathing', 'Weighing it against your goal', 'Writing your coaching'];
  },
};
