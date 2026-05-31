// purchases.js — MOCK RevenueCat layer.
// The UI calls purchasePro(); the mock resolves true after a short delay so the
// paywall flow works without native config.
//
// 👉 To wire REAL RevenueCat, see AI_INTEGRATION.md ("RevenueCat" section).
//    Swap these functions for react-native-purchases (Purchases.purchasePackage,
//    Purchases.getCustomerInfo, etc.). Keep the same async boolean signatures.

export const PRO_ENTITLEMENT = 'pro';
export const MONTHLY_PRODUCT_ID = 'auracheck_pro_monthly'; // $9.99/mo

export function purchasePro() {
  return new Promise((resolve) => setTimeout(() => resolve(true), 1100));
}

export function restorePurchases() {
  return new Promise((resolve) => setTimeout(() => resolve(false), 800));
}

// Returns whether the user currently has Pro. Mock always false on cold start;
// real implementation reads Purchases.getCustomerInfo().entitlements.active.
export function checkProStatus() {
  return Promise.resolve(false);
}
