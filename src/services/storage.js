// storage.js — persists app state via AsyncStorage.
// groups: [{ id, title, context, attempts: [result, ...], ts }]
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE = 'audiocoach_state_v1';

const DEFAULT = { seen: false, scanCount: 0, isPro: false, profilePic: null, userName: 'User_001', takeTimes: [], groups: [] };

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
  } catch (e) {}
}

export { DEFAULT as DEFAULT_STATE };
