# AuraCheck AI

A sleek, dark-themed viral utility app that rates your **face** and your **outfit**,
gives you an Aura Score, breaks down the metrics, and serves AI coaching tips.
Built with **React Native + Expo**, recreated pixel-faithfully from the design handoff.

## What's built

- **Onboarding** — breathing aura orb, brand intro, "Check my aura".
- **Dashboard** — Face Check / Outfit Check cards, scans-left badge, last read.
- **Camera** — real `expo-camera` capture + gallery upload, mode-aware framing guide.
- **Analyzing** — "Reading your aura" scanning animation with live status + progress.
- **Results** — animated Aura Score (bar / ring / number / tier), metric breakdown,
  expandable AI Suggestions.
- **Paywall** — RevenueCat-style $9.99/mo screen, triggered after 3 free scans.
- **Profile** — stats, scan history, Pro badge, reset demo.

Everything works **right now** on a 2-second mock backend — no API keys needed.

## Run it

```bash
cd auracheck-ai
npm install
npx expo start      # then press i / a, or scan the QR with Expo Go
```

## Project structure

```
auracheck-ai/
├── App.js                      # state machine, scan gating, fonts, nav
├── app.json                    # Expo config + permissions
├── babel.config.js
├── package.json
├── AI_INTEGRATION.md           # 👈 how to add the real AI + RevenueCat
└── src/
    ├── components/             # Icon, AuraOrb, Btn, Card, ScoreDisplay,
    │                           #   MetricBar, BottomNav, Placeholder, Screen, MaskedText
    ├── screens/                # Onboarding, Dashboard, CameraScreen,
    │                           #   Analyzing, Results, Paywall, Profile
    ├── services/               # aiService (mock) + realAiService.example,
    │                           #   purchases (mock RevenueCat), storage
    └── theme/                  # tokens, tiers, ThemeContext (dark mode, accent, scoreMode)
```

## Next steps

See **`AI_INTEGRATION.md`** for the crucial, prioritized guide to:
1. swapping the mock AI for a real vision backend (with the exact JSON contract),
2. wiring real RevenueCat subscriptions,
3. building/shipping with EAS.

## Dependencies

expo, expo-camera, expo-image-picker, expo-linear-gradient, expo-blur, expo-font,
@expo-google-fonts/hanken-grotesk, @expo-google-fonts/instrument-serif,
@react-native-async-storage/async-storage, react-native-svg,
react-native-safe-area-context.
