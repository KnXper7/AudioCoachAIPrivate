// aiService.js — MOCK AI vision backend.
// Simulates a ~2s API call and returns randomized-but-realistic JSON so the whole
// app works end-to-end before any real backend exists.
//
// 👉 To plug in REAL AI, replace `analyze()` body with a fetch to your endpoint.
//    See AI_INTEGRATION.md and realAiService.example.js. The shape returned here
//    is the contract the UI depends on — keep it identical.

import { tierFor } from '../theme/theme';

const rint = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
  const a = [...arr];
  const out = [];
  while (out.length < n && a.length) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  return out;
};

// ── content pools ──────────────────────────────────────
const HEADLINES = {
  high: [
    'Operating on a different frequency.',
    'Genuinely rare — a top-percentile read.',
    'This is the version of you that turns heads.',
  ],
  mid: [
    'Strong foundation, clear next moves.',
    "You're ninety percent there. The last ten is detail.",
    "Quietly magnetic. Let's make it loud.",
  ],
  low: [
    'Solid base, and the upside is loud.',
    'Real potential here — time to sharpen it.',
    'Good bones. Now we refine.',
  ],
};
const headlineFor = (score) => pick(score >= 88 ? HEADLINES.high : score >= 76 ? HEADLINES.mid : HEADLINES.low);

const NOTES = {
  Harmony: ['Features in real balance', 'Proportions read effortless', 'Slightly heavy through the mid-face', 'Classically balanced'],
  Glow: ['Healthy, even radiance', 'Hydration could go further', 'Minor T-zone shine', 'Skin looks rested'],
  Symmetry: ['Near-mirrored, very clean', 'Strong central alignment', 'Lighting is flattening one side', 'Subtle, natural asymmetry'],
  Color: ['Cohesive, lightly safe', 'Palette agrees with itself', 'One tone is fighting the rest', 'Confident, warm range'],
  Fit: ['Boxy through the shoulders', 'Tailored and intentional', 'Length is just slightly off', 'Clean silhouette'],
  Vibe: ['Reads deliberate', 'Effortless, not trying', 'Plays it a touch safe', 'Distinct point of view'],
};

const SUGGESTIONS = {
  face: [
    { title: 'Lean into your structure', body: "Your bone structure is carrying real weight here. A defined brow line and a clean hairline edge frame it — book a shape-up, not a full cut." },
    { title: 'Chase the glow, not the shine', body: "Your radiance is sitting just below its ceiling. Swap to a matte moisturizer and add a morning SPF; the T-zone stops reading oily and your glow score climbs within a week." },
    { title: 'Let the light do the work', body: "Symmetry is strong — lighting is your real lever. Face a window at eye level instead of an overhead, and the camera rewards the same face with a higher read." },
    { title: 'Fix the tired-eye tax', body: "The area under your eyes is quietly dragging the number down. A caffeine eye serum and one extra hour of sleep are the cheapest upgrades you own." },
    { title: 'Define the jaw you already have', body: "The jawline is there — give it room. A shorter side fade or a sharper shave line draws the eye to it and lifts overall harmony." },
    { title: 'Hydrate before you decorate', body: "Most of your lost points are texture, not features. Three days of consistent hydration will do more than any new product on the shelf." },
  ],
  outfit: [
    { title: 'Sharpen the silhouette', body: "Your palette discipline is strong, but the fit reads slightly boxy up top. A half-tuck or a size down through the shoulders tightens the whole look." },
    { title: 'Risk one unexpected accent', body: "Your colors agree with each other — almost too politely. One deliberate accent (a rust belt, a forest scarf) turns 'fine' into 'intentional'." },
    { title: 'Win the proportion game', body: "The pieces are fighting your proportions. Cropping the top layer an inch higher lengthens the leg line and instantly raises the fit score." },
    { title: 'Break the flatness', body: "Monochrome reads as effort, not ease, under flash. Introduce one warm tone near your face to give the camera something to land on." },
    { title: 'Respect the texture you have', body: "Texture is doing the talking here — keep it. Add a single matte piece so the look does not go shiny and lose depth in photos." },
    { title: 'Upgrade the footwear', body: "Footwear is the weak link in an otherwise precise fit. A leaner sole matches the discipline of everything above the ankle." },
  ],
};

export const METRICS = {
  face: ['Harmony', 'Glow', 'Symmetry'],
  outfit: ['Color', 'Fit', 'Vibe'],
};

export const MODE_META = {
  face: { title: 'Face Check', subtitle: 'Harmony · Glow · Grooming', guide: 'circle', frameLabel: 'center your face' },
  outfit: { title: 'Outfit Check', subtitle: 'Color · Fit · Styling', guide: 'rect', frameLabel: 'frame your full fit' },
};

// ── the mock service ───────────────────────────────────
export const aiService = {
  // mode: 'face' | 'outfit'.  imageUri is accepted (and ignored by the mock) so
  // the call signature already matches the real backend.
  analyze(mode, imageUri) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const labels = METRICS[mode];
        const metrics = labels.map((label) => ({
          label,
          value: rint(63, 96),
          note: pick(NOTES[label]),
        }));
        const overall = Math.round(metrics.reduce((s, m) => s + m.value, 0) / metrics.length + rint(-2, 2));
        const clamped = Math.max(60, Math.min(98, overall));
        resolve({
          id: 'scan_' + Date.now(),
          mode,
          imageUri: imageUri || null,
          overall: clamped,
          tier: tierFor(clamped),
          headline: headlineFor(clamped),
          metrics,
          suggestions: pickN(SUGGESTIONS[mode], 3),
          ts: Date.now(),
        });
      }, 2000);
    });
  },

  // status lines streamed on the analyzing screen
  steps(mode) {
    return mode === 'face'
      ? ['Mapping facial geometry', 'Reading skin & glow', 'Scoring harmony', 'Calibrating your aura']
      : ['Detecting garments', 'Reading color relationships', 'Scoring fit & proportion', 'Calibrating your aura'];
  },
};
