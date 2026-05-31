// theme.js — AuraCheck design tokens, ported 1:1 from the design handoff.
// Colors, fonts, accent presets and tier logic live here so screens stay clean.

export const FONTS = {
  sans: 'HankenGrotesk_600SemiBold',     // default weight used across UI
  sansRegular: 'HankenGrotesk_400Regular',
  sansMedium: 'HankenGrotesk_500Medium',
  sansBold: 'HankenGrotesk_700Bold',
  serif: 'InstrumentSerif_400Regular',
  mono: 'monospace',
};

// Accent gradient presets (the design's "Tweaks" panel options).
export const ACCENTS = [
  ['#9b8cff', '#4ad6c2'], // Aurora  (default)
  ['#b49bff', '#8f7bff'], // Amethyst
  ['#57d9bd', '#86e6c8'], // Mint
  ['#ff8fb0', '#ffb08c'], // Blush
  ['#e6cd93', '#d8ba78'], // Champagne
];

export const DARK = {
  bg: '#0b0c12',
  ink: '#f3f2f8',
  inkDim: 'rgba(243,242,248,0.64)',
  inkFaint: 'rgba(243,242,248,0.40)',
  surface: 'rgba(255,255,255,0.085)',
  line: 'rgba(255,255,255,0.17)',
  navBg: 'rgba(28,29,40,0.72)',
};

export const LIGHT = {
  bg: '#f3f2f8',
  ink: '#1a1a23',
  inkDim: 'rgba(26,26,35,0.62)',
  inkFaint: 'rgba(26,26,35,0.40)',
  surface: 'rgba(255,255,255,0.66)',
  line: 'rgba(24,22,52,0.10)',
  navBg: 'rgba(255,255,255,0.7)',
};

// Build a flat theme object used everywhere via useTheme().
export function makeTheme({ dark = true, accent = ACCENTS[0] } = {}) {
  const base = dark ? DARK : LIGHT;
  return {
    ...base,
    dark,
    accentA: accent[0],
    accentB: accent[1],
    fonts: FONTS,
    // text-on-accent (buttons use dark ink on bright gradient)
    onAccent: '#0b0b10',
  };
}

// ── tier logic (mirrors data.jsx) ──
export function tierFor(score) {
  if (score >= 93) return { label: 'S+', name: 'Transcendent' };
  if (score >= 88) return { label: 'S', name: 'Radiant' };
  if (score >= 83) return { label: 'A+', name: 'Magnetic' };
  if (score >= 78) return { label: 'A', name: 'Striking' };
  if (score >= 72) return { label: 'B+', name: 'Polished' };
  if (score >= 65) return { label: 'B', name: 'Grounded' };
  return { label: 'C', name: 'Emerging' };
}
