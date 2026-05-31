// storage.js — persists app state (scans seen, scan count, Pro, history) via AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE = 'auracheck_state_v1';

const DEFAULT = { seen: false, scanCount: 0, isPro: false, history: [] };

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(STORE);
    return { ...DEFAULT, ...(raw ? JSON.parse(raw) : {}) };
  } catch (e) {
    return { ...DEFAULT };
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(STORE, JSON.stringify(state));
  } catch (e) {
    // ignore write errors in the prototype
  }
}

export { DEFAULT as DEFAULT_STATE };
