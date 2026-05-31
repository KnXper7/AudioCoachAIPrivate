# AuraCheck AI — Wiring up the real AI (and everything else that matters)

This prototype runs **fully end-to-end today** using a mock backend
(`src/services/aiService.js`). Every screen works: scan gating, results,
history, paywall. The sections below are the crucial steps to make it real,
in priority order.

---

## 1. Swap the mock AI for a real vision backend (the important one)

The whole app depends on **one function**: `aiService.analyze(mode, imageUri)`.
It must resolve an object with this exact shape (the "UI contract"):

```js
{
  id: 'scan_...',
  mode: 'face' | 'outfit',
  imageUri: '<local uri or remote url>',
  overall: 88,                       // int 0–100
  tier: { label: 'S', name: 'Radiant' },   // use tierFor(overall)
  headline: 'Quietly magnetic...',
  metrics: [ { label: 'Color', value: 84, note: '...' }, ... ],
  suggestions: [ { title: '...', body: '...' }, ... ],
  ts: 1716950000000,
}
```

As long as `analyze()` returns this shape, **no screen needs to change.**

### The recommended architecture

> **Do NOT call a vision/LLM provider directly from the app with a hard-coded
> key.** A key shipped in the app binary can be extracted. Always route through
> a thin server you control (Express, a serverless function, Supabase Edge,
> Cloudflare Worker, etc.) that holds the key and returns the JSON above.

```
App  ──(image)──▶  Your backend  ──▶  Vision model (OpenAI/Gemini/Rekognition/custom CV)
App  ◀──(JSON)───  Your backend  ◀──  model response (normalized to the UI contract)
```

### Steps

1. **Stand up an `/analyze` endpoint** that accepts an uploaded image + `mode`,
   runs your model, and returns the contract JSON. A reference prompt that makes
   a multimodal model emit exactly this JSON is in
   `src/services/realAiService.example.js` (Pattern B).

2. **Point the app at it.** Open `src/services/realAiService.example.js`,
   set `API_URL` / auth, choose Pattern A (your backend) or B (LLM via proxy),
   then either:
   - rename it to `aiService.js` (replacing the mock), **or**
   - in `Analyzing.js` change the import from
     `../services/aiService` → `../services/realAiService`.

3. **The image is already captured** for you. `CameraScreen.js` takes a real
   photo (or gallery pick) and passes its `imageUri` all the way to
   `Analyzing.js`, which forwards it into `analyze(mode, imageUri)`. If your
   backend needs base64 instead of a file upload, read the file with
   `expo-file-system`:
   ```js
   import * as FileSystem from 'expo-file-system';
   const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
   ```

### Which model?

Any of these can produce the metrics + coaching text:
- **OpenAI** `gpt-4o` / vision models, or **Google Gemini** (multimodal) — easiest;
  give it the prompt in `realAiService.example.js` and parse the JSON reply.
- **AWS Rekognition / Azure Face / Google Vision** — for raw face attributes;
  you then map those numbers into your scoring.
- **A custom CV model** (e.g. a fine-tuned model on Replicate/HuggingFace) for a
  proprietary "aura" score.

Keep the scoring logic (and the `tierFor` thresholds in `src/theme/theme.js`)
server-side eventually, so you can tune it without shipping an app update.

---

## 2. Real RevenueCat subscriptions (the paywall)

Today `src/services/purchases.js` is a mock that "unlocks" after 1 second.
To make the $9.99/mo subscription real:

1. **Install the SDK**
   ```bash
   npx expo install react-native-purchases
   ```
   (RevenueCat needs native modules, so you must use an **EAS Development
   Build** — it will not run in plain Expo Go. See §4.)

2. **Create products** in App Store Connect + Google Play Console:
   a monthly auto-renewing subscription priced at $9.99. Add them to a
   RevenueCat **Offering**, and create an **Entitlement** called `pro`.

3. **Configure on app start** (in `App.js`, inside the effect that hydrates state):
   ```js
   import Purchases from 'react-native-purchases';
   Purchases.configure({ apiKey: Platform.select({ ios: 'appl_...', android: 'goog_...' }) });
   ```

4. **Replace the mock functions** in `src/services/purchases.js` with real calls
   (same async signatures, so `Paywall.js` keeps working unchanged):
   ```js
   import Purchases from 'react-native-purchases';

   export async function purchasePro() {
     const offerings = await Purchases.getOfferings();
     const pkg = offerings.current?.monthly ?? offerings.current?.availablePackages[0];
     const { customerInfo } = await Purchases.purchasePackage(pkg);
     return !!customerInfo.entitlements.active['pro'];
   }
   export async function restorePurchases() {
     const info = await Purchases.restorePurchases();
     return !!info.entitlements.active['pro'];
   }
   export async function checkProStatus() {
     const info = await Purchases.getCustomerInfo();
     return !!info.entitlements.active['pro'];
   }
   ```

5. **Sync Pro on launch** so paying users stay unlocked across reinstalls — call
   `checkProStatus()` in `App.js` after configure and `setSt(s => ({...s, isPro}))`.

The free-scan limit (`FREE_SCANS = 3`) lives at the top of `App.js`.

---

## 3. Camera & permissions (already wired — what to know)

- `CameraScreen.js` uses **expo-camera** (`CameraView`) for live capture and
  **expo-image-picker** for gallery upload. Both are real.
- Permission strings are already declared in `app.json`
  (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, Android
  `CAMERA`). If a user denies the camera, the screen still lets them upload
  from the gallery.
- Capture, gallery pick, and flip-camera all work; the shutter passes the real
  `imageUri` forward.

---

## 4. Running the app

```bash
cd auracheck-ai
npm install
npx expo start          # press i (iOS sim), a (Android), or scan the QR in Expo Go
```

- **Mock build (no native deps):** runs in **Expo Go** as-is.
- **Once you add RevenueCat** (native module), build a dev client instead:
  ```bash
  npm install -g eas-cli
  eas build --profile development --platform ios     # or android
  ```
  then `npx expo start --dev-client`.

To ship: `eas build --profile production --platform all`, then
`eas submit`.

---

## 5. Quick file map

| Area | File |
|---|---|
| App state machine, scan gating, fonts | `App.js` |
| **Mock AI** (replace this) | `src/services/aiService.js` |
| **Real AI reference** | `src/services/realAiService.example.js` |
| Mock RevenueCat (replace this) | `src/services/purchases.js` |
| Persistence | `src/services/storage.js` |
| Theme tokens / tiers | `src/theme/theme.js`, `src/theme/ThemeContext.js` |
| Screens | `src/screens/*` |
| Reusable UI | `src/components/*` |

---

## 6. Optional next steps (nice-to-have, not crucial)

- **Score-display style:** the design supports `bar` / `ring` / `number` /
  `tier`. Change the default in `ThemeContext.js` (`scoreMode`) or expose a
  settings toggle.
- **Light mode & accent themes:** already supported in `ThemeContext.js`
  (`setDark`, `setAccent`) — just add UI to toggle them.
- **Cloud history:** today history is on-device (AsyncStorage). Move it to your
  backend/auth if you want cross-device sync.
- **Share results:** the share icon on the results screen is a stub — wire it to
  `react-native` `Share.share()` or a screenshot library for virality.
