// realAiService.example.js — DROP-IN replacement for the mock aiService.
// ────────────────────────────────────────────────────────────────────────
// This is a reference implementation. When your backend is ready:
//   1. Fill in API_URL (and auth).
//   2. Rename this file's `aiService` export and import it in the screens
//      INSTEAD of ./aiService  (or just paste analyze() into aiService.js).
//
// The UI only cares that analyze() resolves an object with this shape:
//   { id, mode, imageUri, overall, tier, headline, metrics:[{label,value,note}],
//     suggestions:[{title,body}], ts }
// Keep that contract identical and nothing in the UI needs to change.
//
// Two common backend patterns are shown below. Pick ONE.

import { tierFor } from '../theme/theme';
import { METRICS, MODE_META } from './aiService';

// 🔧 set these
const API_URL = 'https://YOUR-BACKEND.example.com';
const API_KEY = 'YOUR_KEY'; // prefer sending from a server, not bundled in the app

// ── Pattern A: your own backend that wraps a vision model ──────────────────
// Your server receives the image, runs the model (OpenAI Vision, Google Gemini,
// AWS Rekognition, a custom CV model, etc.) and returns the JSON the UI needs.
async function analyzeViaBackend(mode, imageUri) {
  // Build multipart form so the raw image is uploaded.
  const form = new FormData();
  form.append('mode', mode);
  form.append('image', {
    uri: imageUri,
    name: 'scan.jpg',
    type: 'image/jpeg',
  });

  const res = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      // NOTE: don't set Content-Type manually for FormData in RN; let fetch do it.
    },
    body: form,
  });
  if (!res.ok) throw new Error(`Analyze failed: ${res.status}`);
  const data = await res.json();

  // Normalize whatever your backend returns into the UI contract.
  const overall = Math.max(0, Math.min(100, Math.round(data.overall)));
  return {
    id: data.id || 'scan_' + Date.now(),
    mode,
    imageUri,
    overall,
    tier: tierFor(overall),
    headline: data.headline,
    metrics: data.metrics, // [{ label, value, note }]
    suggestions: data.suggestions, // [{ title, body }]
    ts: Date.now(),
  };
}

// ── Pattern B: call a multimodal LLM directly (e.g. via your proxy) ─────────
// You send a base64 image + a strict JSON instruction and parse the reply.
// IMPORTANT: never ship a raw provider key inside the app — route through a
// thin server/Edge function that holds the key. This shows the request shape.
async function analyzeViaLLM(mode, imageUri, base64) {
  const labels = METRICS[mode]; // e.g. ['Color','Fit','Vibe']
  const prompt = `You are AuraCheck, a ${MODE_META[mode].title} rater.
Return STRICT JSON only:
{"overall": <0-100 int>, "headline": "<one punchy sentence>",
 "metrics": [${labels.map((l) => `{"label":"${l}","value":<0-100>,"note":"<short>"}`).join(',')}],
 "suggestions": [{"title":"<short>","body":"<2 sentences of concrete coaching>"}]}
Rate the person/outfit in the image honestly but kindly.`;

  const res = await fetch(`${API_URL}/llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      // your proxy forwards this to the model with the image attached
      prompt,
      image_base64: base64,
      mode,
    }),
  });
  if (!res.ok) throw new Error(`LLM analyze failed: ${res.status}`);
  const { text } = await res.json();
  const data = JSON.parse(text); // model returns JSON per the prompt
  const overall = Math.max(0, Math.min(100, Math.round(data.overall)));
  return {
    id: 'scan_' + Date.now(),
    mode,
    imageUri,
    overall,
    tier: tierFor(overall),
    headline: data.headline,
    metrics: data.metrics,
    suggestions: data.suggestions,
    ts: Date.now(),
  };
}

export const aiService = {
  analyze(mode, imageUri /*, base64 */) {
    // choose your pattern:
    return analyzeViaBackend(mode, imageUri);
    // return analyzeViaLLM(mode, imageUri, base64);
  },
  steps(mode) {
    return mode === 'face'
      ? ['Mapping facial geometry', 'Reading skin & glow', 'Scoring harmony', 'Calibrating your aura']
      : ['Detecting garments', 'Reading color relationships', 'Scoring fit & proportion', 'Calibrating your aura'];
  },
};
