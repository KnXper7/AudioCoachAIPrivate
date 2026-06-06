// purchases.js — RevenueCat in-app purchases (react-native-purchases v8) plus the
// hosted Paywall and Customer Center (react-native-purchases-ui).
//
// Safe in Expo Go: those packages are native and absent there, so we detect that
// (purchasesAvailable()/uiAvailable() === false) and degrade gracefully instead
// of crashing. Real purchases require an EAS dev build.
import { Platform } from 'react-native';
import { REVENUECAT_IOS_KEY, REVENUECAT_ANDROID_KEY, PRO_ENTITLEMENT, PACKAGE_IDS } from '../config';

// Guarded native requires — never throw at import time in Expo Go.
let Purchases = null;
let LOG_LEVEL = null;
let RevenueCatUI = null;
let PAYWALL_RESULT = null;
try {
  const rc = require('react-native-purchases');
  Purchases = rc.default;
  LOG_LEVEL = rc.LOG_LEVEL;
} catch (e) { Purchases = null; }
try {
  const ui = require('react-native-purchases-ui');
  RevenueCatUI = ui.default;
  PAYWALL_RESULT = ui.PAYWALL_RESULT;
} catch (e) { RevenueCatUI = null; }

let configured = false;

export const purchasesAvailable = () => !!Purchases;
export const uiAvailable = () => !!RevenueCatUI;

function apiKey() {
  return Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
}

function hasPro(info) {
  const active = info && info.entitlements && info.entitlements.active;
  if (!active) return false;
  if (active[PRO_ENTITLEMENT]) return true;
  // Single-tier app: any active entitlement means Pro. This makes us robust to a
  // small mismatch between PRO_ENTITLEMENT and the dashboard's entitlement id,
  // so a valid purchase is never lost just because the name doesn't line up.
  return Object.keys(active).length > 0;
}

// Configure once on app launch. Returns true if RevenueCat is live.
export async function initPurchases() {
  if (!Purchases || configured) return configured;
  const key = apiKey();
  if (!key || key.includes('PASTE_')) return false;
  try {
    if (__DEV__ && LOG_LEVEL) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: key });
    configured = true;
    return true;
  } catch (e) {
    return false;
  }
}

// Subscribe to entitlement changes. RevenueCat pushes updates (renewals,
// expirations, purchases on other devices). Returns an unsubscribe function.
export function onProStatusChange(cb) {
  if (!Purchases) return () => {};
  const listener = (info) => cb(hasPro(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    try { Purchases.removeCustomerInfoUpdateListener(listener); } catch (e) {}
  };
}

// Current Pro state from RevenueCat. Returns true/false when we get a definitive
// answer, or NULL when we couldn't reach RevenueCat — callers must NOT downgrade
// a stored Pro state on null (that's what was wiping purchases at launch).
export async function checkProStatus() {
  if (!Purchases || !configured) return null;
  try {
    return hasPro(await Purchases.getCustomerInfo());
  } catch (e) {
    return null;
  }
}

export async function getCustomerInfo() {
  if (!Purchases || !configured) return null;
  try { return await Purchases.getCustomerInfo(); } catch (e) { return null; }
}

// Details of the user's active subscription (which product, period, renewal),
// or null if they have none. Used to record WHAT plan they hold in the cloud.
export async function getActiveSubscription() {
  if (!Purchases || !configured) return null;
  try {
    const info = await Purchases.getCustomerInfo();
    const active = (info && info.entitlements && info.entitlements.active) || {};
    const ks = Object.keys(active);
    if (!ks.length) return null;
    const ent = active[PRO_ENTITLEMENT] || active[ks[0]];
    return {
      entitlement: ent.identifier,
      productId: ent.productIdentifier,
      store: ent.store,
      periodType: ent.periodType,
      willRenew: ent.willRenew,
      latestPurchaseDate: ent.latestPurchaseDate,
      expirationDate: ent.expirationDate || null,
    };
  } catch (e) {
    return null;
  }
}

// The current offering's packages, keyed by tier when we can match them.
export async function getOffering() {
  if (!Purchases || !configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings && offerings.current ? offerings.current : null;
  } catch (e) {
    return null;
  }
}

function matchPackage(offering, tier) {
  if (!offering || !offering.availablePackages) return null;
  const ids = PACKAGE_IDS[tier] || [];
  return (
    offering.availablePackages.find((p) => ids.includes(p.identifier)) ||
    offering.availablePackages.find((p) => p.packageType && ids.includes(String(p.packageType).toLowerCase())) ||
    null
  );
}

// Buy a specific tier ('lifetime' | 'yearly' | 'monthly'). Resolves true if Pro
// is active afterward. Throws on real errors; sets e.userCancelled on cancel.
export async function purchaseTier(tier) {
  if (!Purchases || !configured) throw new Error('In-app purchases need a dev build (not Expo Go).');
  const offering = await getOffering();
  const pkg = matchPackage(offering, tier) || (offering && offering.availablePackages && offering.availablePackages[0]);
  if (!pkg) throw new Error('No subscription is available right now. Check your RevenueCat offering.');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return hasPro(customerInfo);
}

// Default purchase entry (monthly) — kept for the simple paths.
export async function purchasePro() {
  return purchaseTier('monthly');
}

export async function restorePurchases() {
  if (!Purchases || !configured) throw new Error('Restore needs a dev build (not Expo Go).');
  return hasPro(await Purchases.restorePurchases());
}

// ——— Hosted UI (react-native-purchases-ui) ———

// Presents RevenueCat's dashboard-designed Paywall. Returns:
//   'PURCHASED' | 'RESTORED' | 'CANCELLED' | 'ERROR' | 'NOT_PRESENTED' | null
// Caller treats PURCHASED/RESTORED as "now Pro".
export async function presentPaywall() {
  if (!RevenueCatUI) return null;
  try {
    const result = await RevenueCatUI.presentPaywall();
    return String(result);
  } catch (e) {
    return 'ERROR';
  }
}

// Presents the paywall only if the user lacks Pro. Same return contract.
export async function presentPaywallIfNeeded() {
  if (!RevenueCatUI) return null;
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: PRO_ENTITLEMENT });
    return String(result);
  } catch (e) {
    return 'ERROR';
  }
}

export function paywallResultIsPro(result) {
  return result === 'PURCHASED' || result === 'RESTORED' ||
    (PAYWALL_RESULT && (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED));
}

// Self-service subscription management (manage/cancel, restore, refunds, etc.).
export async function presentCustomerCenter() {
  if (!RevenueCatUI) return false;
  try {
    await RevenueCatUI.presentCustomerCenter();
    return true;
  } catch (e) {
    return false;
  }
}
