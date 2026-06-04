// theme.js — AudioCoach AI design tokens. Single indigo accent, light + dark.
export const FONTS = {
  sans: 'HankenGrotesk_600SemiBold',
  sansRegular: 'HankenGrotesk_400Regular',
  sansMedium: 'HankenGrotesk_500Medium',
  sansBold: 'HankenGrotesk_700Bold',
  serif: 'InstrumentSerif_400Regular',
  mono: 'monospace',
};

// Single accent (indigo). accentB is a lighter tint so gradients stay cohesive/mono.
export const ACCENT_A = '#6C5CE7';
export const ACCENT_B = '#8E80F2';

export const DARK = {
  bg: '#0b0c12',
  ink: '#f3f2f8',
  inkDim: 'rgba(243,242,248,0.64)',
  inkFaint: 'rgba(243,242,248,0.40)',
  surface: 'rgba(255,255,255,0.07)',
  line: 'rgba(255,255,255,0.14)',
  navBg: 'rgba(22,23,32,0.72)',
  elevated: '#16171f',
};

export const LIGHT = {
  bg: '#f5f5fa',
  ink: '#15151d',
  inkDim: 'rgba(21,21,29,0.62)',
  inkFaint: 'rgba(21,21,29,0.42)',
  surface: 'rgba(20,18,45,0.045)',
  line: 'rgba(20,18,45,0.12)',
  navBg: 'rgba(255,255,255,0.82)',
  elevated: '#ffffff',
};

export function makeTheme({ dark = true } = {}) {
  const base = dark ? DARK : LIGHT;
  return {
    ...base,
    dark,
    accentA: ACCENT_A,
    accentB: ACCENT_B,
    accent: ACCENT_A,
    fonts: FONTS,
    onAccent: '#ffffff', // white reads best on indigo
    good: '#3FB984',
    warn: '#E0A93B',
    bad: '#E5544B',
  };
}

// Tier logic (overall score → label/name)
export function tierFor(score) {
  if (score >= 93) return { label: 'S+', name: 'Commanding' };
  if (score >= 88) return { label: 'S', name: 'Compelling' };
  if (score >= 83) return { label: 'A+', name: 'Polished' };
  if (score >= 78) return { label: 'A', name: 'Confident' };
  if (score >= 72) return { label: 'B+', name: 'Steady' };
  if (score >= 65) return { label: 'B', name: 'Developing' };
  return { label: 'C', name: 'Emerging' };
}
