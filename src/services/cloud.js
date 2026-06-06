// cloud.js — Firebase (anonymous auth + Firestore). No login UI: each install
// gets a hidden anonymous account, and usernames are GLOBALLY UNIQUE via a
// Firestore registry. Stores the username, Pro status, and purchases.
//
// Safe when unconfigured: if FIREBASE_CONFIG still has placeholders (or the
// firebase package isn't installed), cloudConfigured() is false and the app
// keeps working purely locally (usernames just aren't enforced unique offline).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '../config';

let M = null; // firebase modules
try {
  M = {
    app: require('firebase/app'),
    auth: require('firebase/auth'),
    fs: require('firebase/firestore'),
  };
} catch (e) { M = null; }

let app = null, auth = null, db = null, ready = false;

export function cloudConfigured() {
  return !!(M && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !String(FIREBASE_CONFIG.apiKey).includes('PASTE'));
}

const norm = (n) => String(n || '').trim();
const key = (n) => norm(n).toLowerCase();

// Initialize Firebase + sign in anonymously. Returns the uid, or null if cloud
// isn't configured / fails. Persists the anonymous user so the same install
// keeps the same identity (and username) across restarts.
export async function initCloud() {
  if (ready) return auth?.currentUser?.uid || null;
  if (!cloudConfigured()) return null;
  try {
    app = M.app.getApps().length ? M.app.getApp() : M.app.initializeApp(FIREBASE_CONFIG);
    try {
      auth = M.auth.initializeAuth(app, { persistence: M.auth.getReactNativePersistence(AsyncStorage) });
    } catch (e) {
      auth = M.auth.getAuth(app); // already initialized
    }
    db = M.fs.getFirestore(app);
    ready = true;
    if (!auth.currentUser) await M.auth.signInAnonymously(auth);
    return auth.currentUser?.uid || null;
  } catch (e) {
    ready = false;
    return null;
  }
}

// Returns the user's profile, creating one (with a unique default username) the
// first time. { username, isPro, purchases }.
export async function ensureProfile() {
  if (!ready || !auth.currentUser) return null;
  const { doc, getDoc, setDoc, serverTimestamp } = M.fs;
  const uid = auth.currentUser.uid;
  const uref = doc(db, 'users', uid);
  const snap = await getDoc(uref);
  if (snap.exists() && snap.data().username) return snap.data();

  const username = await allocateDefaultUsername(uid);
  const data = { username, isPro: false, purchases: [], createdAt: serverTimestamp() };
  await setDoc(uref, data, { merge: true });
  return data;
}

// Atomically grab the next free "user_NNN" using a shared counter + registry.
async function allocateDefaultUsername(uid) {
  const { doc, runTransaction } = M.fs;
  for (let i = 0; i < 50; i++) {
    const name = await runTransaction(db, async (tx) => {
      const cref = doc(db, 'meta', 'userCounter');
      const csnap = await tx.get(cref);
      const n = (csnap.exists() ? csnap.data().n : 0) + 1;
      const candidate = 'user_' + String(n).padStart(3, '0');
      const nref = doc(db, 'usernames', candidate.toLowerCase());
      const nsnap = await tx.get(nref);     // all reads before writes
      tx.set(cref, { n });                  // always advance the counter
      if (nsnap.exists()) return null;      // collision → loop tries the next n
      tx.set(nref, { uid });
      return candidate;
    });
    if (name) return name;
  }
  return 'user_' + Math.floor(Math.random() * 1000000);
}

// Claim a chosen username. Resolves the saved name, or throws Error('taken') if
// another user already holds it. Releases the user's previous name.
export async function claimUsername(desired) {
  const name = norm(desired) || 'user';
  if (!ready || !auth.currentUser) return name; // cloud off → accept locally
  const { doc, runTransaction } = M.fs;
  const uid = auth.currentUser.uid;
  const k = key(name);
  await runTransaction(db, async (tx) => {
    const nref = doc(db, 'usernames', k);
    const uref = doc(db, 'users', uid);
    const nsnap = await tx.get(nref);
    const usnap = await tx.get(uref);       // all reads before writes
    if (nsnap.exists() && nsnap.data().uid !== uid) throw new Error('taken');
    const old = usnap.exists() ? usnap.data().username : null;
    tx.set(nref, { uid });
    tx.set(uref, { username: name }, { merge: true });
    if (old && key(old) !== k) tx.delete(doc(db, 'usernames', key(old)));
  });
  return name;
}

// Mirror Pro status to the cloud.
export async function syncPro(isPro) {
  if (!ready || !auth.currentUser) return;
  try {
    await M.fs.setDoc(M.fs.doc(db, 'users', auth.currentUser.uid), { isPro: !!isPro }, { merge: true });
  } catch (e) {}
}

// Store the CURRENT subscription (which plan / renewal) on the user doc. Pass
// null when there's no active subscription. Overwrites the single "subscription"
// field so the user record always reflects their current plan.
export async function syncSubscription(sub) {
  if (!ready || !auth.currentUser) return;
  try {
    await M.fs.setDoc(
      M.fs.doc(db, 'users', auth.currentUser.uid),
      { isPro: !!sub, subscription: sub || null },
      { merge: true }
    );
  } catch (e) {}
}

// Append a purchase record (and mark Pro).
export async function recordPurchase(entry) {
  if (!ready || !auth.currentUser) return;
  try {
    const { doc, setDoc, arrayUnion } = M.fs;
    await setDoc(
      doc(db, 'users', auth.currentUser.uid),
      { isPro: true, purchases: arrayUnion({ ...(entry || {}), ts: Date.now() }) },
      { merge: true }
    );
  } catch (e) {}
}
