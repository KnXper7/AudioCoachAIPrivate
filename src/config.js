// config.js — AudioCoach AI configuration.
//
// AI: the app does NOT hold the Gemini key. All AI calls go through your
// Cloudflare Worker (backend/auracheck-worker.js), which keeps the key secret.
//   1. cd backend && wrangler secret put GEMINI_API_KEY
//   2. wrangler deploy
//   3. Put the deployed base URL below (no trailing slash, no /analyze).
export const WORKER_URL = 'https://audiocoach-api.just-tapping.workers.dev';

// ——— RevenueCat (in-app purchases) ———
// Public SDK keys from app.revenuecat.com → Project → API keys.
// In production these are platform-specific: iOS "appl_…", Android "goog_…".
// The key below was provided for setup/testing — replace each platform with its
// real public key before shipping. If purchases fail with an auth error, you're
// likely using the wrong key type (use the PUBLIC app-specific key, not a secret).
export const REVENUECAT_IOS_KEY = 'test_WcYGOeoYkHMWGmQTvRpCVlZDbiD';
export const REVENUECAT_ANDROID_KEY = 'test_WcYGOeoYkHMWGmQTvRpCVlZDbiD';

// Entitlement identifier — must EXACTLY match the identifier of the entitlement
// you created in RevenueCat (Project → Entitlements). Display name can be
// "AudioCoach AI Pro"; the identifier is typically short, e.g. "pro".
export const PRO_ENTITLEMENT = 'pro';

// Package identifiers in your RevenueCat Offering (Project → Offerings).
// RevenueCat's standard identifiers: '$rc_lifetime', '$rc_annual', '$rc_monthly'.
// We also accept your custom ids 'lifetime' / 'yearly' / 'monthly'.
export const PACKAGE_IDS = {
  lifetime: ['$rc_lifetime', 'lifetime'],
  yearly: ['$rc_annual', 'yearly', 'annual'],
  monthly: ['$rc_monthly', 'monthly'],
};
