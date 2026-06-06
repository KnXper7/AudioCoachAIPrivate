// auracheck-worker.js — Cloudflare Worker for AudioCoach AI (Google Gemini).
// The API key lives here as a Worker SECRET and never ships in the app bundle.
// The Worker OWNS the prompt, so a leaked endpoint can't be used to run arbitrary
// prompts on your key — it can only ask for a voice-coaching analysis.
//
// DEPLOY:
//   wrangler secret put GEMINI_API_KEY      # paste your AIza... key
//   wrangler deploy
//
// POST /analyze   { audio(base64), audioMime, context, isPro }  ->  coaching JSON
//
// Hardening you should add before scale: device attestation (Apple App Attest /
// Firebase App Check) and per-user rate limiting (e.g. a KV / Durable Object
// counter). CORS is permissive here for testing; lock the origin down for web.

const LABELS = ['Pace', 'Pauses', 'Pitch', 'Volume', 'Breathing', 'Articulation'];
const GEMINI_MODEL = 'gemini-2.5-flash';

function buildPrompt(ctx, isPro) {
  const nSug = isPro ? 6 : 3;
  const ctxLine = ctx
    ? `The speaker said this is for: "${ctx}". Judge everything against how well it serves THAT goal — tone, word choice, emphasis, and where pauses should fall.`
    : `No context given; infer the most likely purpose and judge against it.`;
  const formLine = `Infer the appropriate level of formality from that purpose (e.g. a wedding toast is warm and casual; a board pitch is precise and authoritative) and judge their tone against what the moment calls for.`;
  const fairnessLine = `LENGTH FAIRNESS — this is critical: score on QUALITY PER SECOND, not on duration. Do NOT reward a clip just for being short, and do NOT penalize a longer clip for having more words. A tight 8-second answer and a well-structured 50-second pitch should both be able to score in the 90s; a rambling 8-second clip and a rambling 50-second clip should both score low. Judge density of value, clarity, and delivery relative to what THIS message needs — never let total length, word count, or number of detected issues by itself move the score. A longer take naturally surfaces more flags and cues; treat those proportionally (as a rate), so length alone never drags the score down.`;
  const metricSpec = LABELS.map((l) => `{"label":"${l}","value":<int 0-100>,"note":"<3-6 word note>"}`).join(',');
  const sugSpec = Array.from({ length: nSug }).map(() => `{"title":"<short imperative>","body":"<2-3 sentences, specific, non-generic>"}`).join(',');
  return (
    `You are AuraVoice, an elite executive communication coach and the user's speech buddy. ` +
    `Warm, direct, lightly witty (you may roast gently) — but every line must teach. VOICE & CONTENT only, never appearance. ` +
    ctxLine + ` ` + formLine + ` ` + fairnessLine + ` ` +
    `Judge audience engagement on: Hook & Bridge (did they open with a story/stat instead of a boring intro?), Radical Conciseness (cut filler & side-stories), Structural Mapping (key message early, Rule of Three, clear transitions), Vulnerability (genuine stake/emotion), Vocal Dynamics (cadence, the 3-second pause, pace variation). ` +
    `Listen to the audio. If there is no clear speech, set "visible" to false. Then:\n` +
    `1) "transcript": verbatim.\n` +
    `2) "intendedUse": 2-4 word label (e.g. "Investor pitch").\n` +
    `3) Score the six: Pace, Pauses, Pitch, Volume, Breathing, Articulation.\n` +
    `4) "flags": exact phrases that hurt delivery — each {"text":<exact phrase from transcript>,"metric":<one of the six>,"severity":<"high"|"med">,"note":<short fix>,"t":<approx seconds>}.\n` +
    `5) "strengths": 2-3 things they genuinely did WELL — each {"text":<exact phrase delivered well, or "" for a delivery-wide win>,"note":<specific, warm praise that names WHY it worked, 1-2 sentences>}. Be concrete and encouraging, not generic. Every strength MUST be a DISTINCT win about a different aspect — never repeat the same praise or compliment two things the same way.\n` +
    `6) "cues": 3-6 delivery cues placed on exact phrases from the transcript — each {"text":<exact phrase>,"type":<"pitch"|"pause"|"slow"|"volume">,"note":<short why, <=8 words>}. "pitch"=lift your pitch on this phrase, "pause"=insert a beat here, "slow"=slow down here, "volume"=change loudness here. Spread them across the speech.\n` +
    `7) "suggestions": ${nSug} DISTINCT items (never repeat an idea), covering a Hook Check, a Pruning Report, and Cadence & Flow.` +
    (isPro
      ? `\n8) "rephrasings": 3 {"before":<weak line they said>,"after":<sharper version for this goal>}.\n9) "exercises": 3 {"name":<drill>,"how":<one sentence>}; the FIRST is the single Daily Action Item for their biggest weakness.`
      : ``) +
    `\nReturn STRICT JSON ONLY:\n` +
    `{"visible":<true|false>,"overall":<int 0-100>,"intendedUse":"<label>","headline":"<one punchy sentence tied to their goal>",` +
    `"transcript":"<verbatim>","metrics":[${metricSpec}],` +
    `"flags":[{"text":"","metric":"","severity":"med","note":"","t":0}],"strengths":[{"text":"","note":""}],` +
    `"cues":[{"text":"","type":"pause","note":""}],` +
    `"suggestions":[${sugSpec}]` +
    (isPro ? `,"rephrasings":[{"before":"","after":""}],"exercises":[{"name":"","how":""}]` : ``) +
    `}`
  );
}

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(request.url);

    // Health check — open this in a browser to confirm the Worker is deployed.
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return new Response(
        JSON.stringify({ ok: true, service: 'audiocoach', hasKey: !!env.GEMINI_API_KEY, hint: 'POST audio to /analyze' }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (url.pathname !== '/analyze' || request.method !== 'POST') return new Response('Not found', { status: 404, headers: cors });

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'config', detail: 'GEMINI_API_KEY secret is not set on the Worker.' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    try {
      const { audio, audioMime, context, isPro } = await request.json();
      const prompt = buildPrompt((context || '').trim(), !!isPro);

      const parts = [{ text: prompt }];
      if (audio) parts.push({ inline_data: { mime_type: audioMime || 'audio/mp4', data: audio } });
      const body = JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.8, responseMimeType: 'application/json' } });

      // Smooth over usage spikes: retry transient errors (429 rate-limit / 503
      // overloaded / 500) with exponential backoff, and fall back to a lighter,
      // higher-availability model if the primary stays overloaded.
      const MODELS = [GEMINI_MODEL, 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
      const TRANSIENT = new Set([429, 500, 503]);
      let res, lastDetail = '';
      modelLoop:
      for (const model of MODELS) {
        for (let attempt = 0; attempt < 3; attempt++) {
          res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
          );
          if (res.ok) break modelLoop;
          lastDetail = (await res.text()).slice(0, 300);
          if (TRANSIENT.has(res.status)) {
            // back off 0.5s, 1s, 2s before retrying this model
            await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
            continue;
          }
          break; // non-transient (e.g. 400/403) — move to the next model
        }
      }
      if (!res || !res.ok) {
        const code = res ? res.status : 0;
        const overloaded = code === 429 || code === 503;
        return new Response(
          JSON.stringify({ error: 'gemini', overloaded, detail: lastDetail || 'request failed' }),
          { status: overloaded ? 503 : 502, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
      const gj = await res.json();
      const text = gj?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let data;
      try { data = JSON.parse(text); } catch (e) { return new Response(JSON.stringify({ error: 'parse', detail: 'model returned non-JSON' }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }); }
      return new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
  },
};
