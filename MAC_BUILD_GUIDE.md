# AudioCoach AI — Mac iOS Build Guide (SDK 54 + Liquid Glass)

Start-to-finish. Do these in order on your Mac. You already pushed the
`sdk54-liquid-glass` branch from Windows, so the Mac just pulls and builds.

---

## 0. What you need first
- A Mac on **macOS Sequoia or newer** (required for Xcode 26 / iOS 26).
- An **Apple Developer account** ($99/year) for signing + App Store. Free account
  works for running on your own device/simulator, but not for App Store upload.
- Your GitHub repo URL.

---

## 1. Install Xcode 26 (the iOS 26 SDK = Liquid Glass)
1. Install **Xcode 26** from the Mac App Store (large download).
2. Open it once and let it finish "Installing components."
3. In Terminal:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   xcodebuild -version
   ```
   It should print **Xcode 26.x**. If not, you opened the wrong Xcode.
4. Accept the license if prompted:
   ```bash
   sudo xcodebuild -license accept
   ```

---

## 2. Install the build tools
If you don't have Homebrew, install it from https://brew.sh, then:
```bash
brew install node watchman cocoapods git
node -v        # should be v20+; SDK 54 wants a modern Node
pod --version  # confirms CocoaPods installed
```

---

## 3. Get the project (the branch you pushed)
```bash
cd ~
git clone <YOUR-REPO-URL> auracheck-ai
cd auracheck-ai
git checkout sdk54-liquid-glass
```
(Already cloned earlier? Just: `git fetch origin && git checkout sdk54-liquid-glass && git pull`.)

---

## 4. Fix two things BEFORE building
Open the project in any editor and edit these:

**a) Match the bundle id.** In `app.json`, Android is `com.audiocoach.ai` but iOS
is `com.auracheck.ai`. Make them the same (recommended `com.audiocoach.ai`):
```json
"ios": {
  "bundleIdentifier": "com.audiocoach.ai",
  ...
}
```

**b) Real RevenueCat iOS key.** In `src/config.js`, replace the placeholder:
```js
export const REVENUECAT_IOS_KEY = 'appl_XXXXXXXXXXXX';  // from RevenueCat → API keys
```
Without this, iOS purchases fail.

**c) Confirm** `app.json` has `"newArchEnabled": true` (needed for SDK 54).

---

## 5. Install JS dependencies
```bash
npm install --legacy-peer-deps
```
(The `--legacy-peer-deps` flag is required — same reason it was on Windows.)

---

## 6. Generate the native iOS project
```bash
npx expo prebuild -p ios --clean
```
This creates the `ios/` folder from `app.json` and runs `pod install`
automatically. If pods fail, run manually:
```bash
cd ios && pod install && cd ..
```

---

## 7. Open in Xcode and set signing
```bash
open ios/*.xcworkspace
```
> Always open the **.xcworkspace**, never the .xcodeproj.

In Xcode:
1. Click the project in the left sidebar → select the app **target**.
2. Go to **Signing & Capabilities**.
3. Check **Automatically manage signing**.
4. Choose your **Team** (your Apple Developer account).
   Xcode generates the provisioning profile for you.

---

## 8. Run it (see the glass)
- At the top of Xcode, pick an **iPhone 16 / iOS 26 Simulator** as the destination.
- Press **▶ (Run)**, or from Terminal: `npx expo run:ios`.
- Anywhere you've wrapped UI in `<Glass>`, you'll see **real Liquid Glass** on the
  iOS 26 simulator. (On Android / older iOS it falls back to blur glass.)

To run on a **physical iPhone**:
1. Plug it in, select it as the destination in Xcode, press ▶.
2. First time: on the iPhone, Settings → General → VPN & Device Management →
   trust your developer certificate.

---

## 9. Smoke-test before shipping
- Record a clip → confirm AI analysis works (your Cloudflare Worker).
- Open the paywall → confirm RevenueCat loads (no error 23) with the `appl_` key.
- Check the You page → username shows, Glass cards render.
- Confirm Firebase: a `users/<uid>` doc appears in Firebase Console → Firestore.

---

## 10. Ship to the App Store / TestFlight
1. In Xcode, set the destination to **Any iOS Device (arm64)**.
2. Menu: **Product → Archive**.
3. When the Organizer window opens: **Distribute App → App Store Connect → Upload**.
4. In **App Store Connect** (appstoreconnect.apple.com): your app → **TestFlight**
   shows the build in ~10–30 min for testing; then submit for App Store review.

> You must create the app record in App Store Connect first (same bundle id as
> step 4a) before the upload will attach to it.

---

## Troubleshooting
- **`npm install` ERESOLVE** → always use `--legacy-peer-deps`.
- **Pods error / weird native errors after edits** → `cd ios && pod install`, or
  re-run `npx expo prebuild -p ios --clean`.
- **"Signing requires a development team"** → step 7, pick your Team.
- **Glass not showing** → confirm you're on an **iOS 26** simulator/device and that
  `expo-glass-effect` installed; on anything older it intentionally shows blur glass.
- **Build cache acting up** → in Xcode, Product → Clean Build Folder (⇧⌘K), rebuild.
- **Stuck** → copy the exact Xcode/Terminal error and send it to me.
