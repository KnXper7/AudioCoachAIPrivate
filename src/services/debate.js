// debate.js — Debate Mode client. Talks to the Worker's /debate endpoint.
//   debateTurn:    sends the user's recorded turn (+ history) → { you, ai }
//   debateAnalyze: sends the full transcript → coaching JSON
import * as FileSystem from 'expo-file-system/legacy';
import { WORKER_URL } from '../config';

async function audioToBase64(uri) {
  if (!uri) return null;
  try {
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  } catch (e) {
    return null;
  }
}

export async function debateTurn({ topic, side, history, audioUri }) {
  const audio = await audioToBase64(audioUri);
  const res = await fetch(`${WORKER_URL}/debate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'turn', topic, side, history: history || [], audio, audioMime: 'audio/mp4' }),
  });
  if (!res.ok) {
    let overloaded = false;
    try { overloaded = (await res.json()).overloaded; } catch (e) {}
    const err = new Error('turn_failed');
    err.overloaded = overloaded;
    throw err;
  }
  return res.json(); // { you, ai }
}

export async function debateAnalyze({ topic, side, transcript }) {
  const res = await fetch(`${WORKER_URL}/debate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'analyze', topic, side, transcript }),
  });
  if (!res.ok) throw new Error('analyze_failed');
  return res.json();
}

// A small rotating pool of debate topics. Pro can debate any of these.
export const DEBATE_TOPICS = [
  'Social media does more harm than good',
  'Remote work is better than working in an office',
  'AI will create more jobs than it destroys',
  'College is no longer worth the cost',
  'Pineapple belongs on pizza',
  'Self-driving cars should be mandatory',
  'A four-day work week should be the standard',
  'Homework should be abolished in schools',
  'Space exploration is a good use of money',
  'Cash should be replaced entirely by digital money',
];

export function randomTopic(exclude) {
  const pool = DEBATE_TOPICS.filter((x) => x !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}
