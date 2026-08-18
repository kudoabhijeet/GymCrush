import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * Synchronous key/value storage for larger app state (MMKV on native, localStorage
 * on web via MMKV's own web implementation).
 *
 * Deliberately separate from `kvStorage` in ./storage: SecureStore caps values at
 * ~2KB on Android, which an in-progress workout session exceeds. Small device
 * prefs stay on SecureStore; bulk state lives here.
 *
 * Everything in this instance is treated as user-scoped and is wiped wholesale on
 * sign-out — do not put device preferences (units, theme) here.
 */
const mmkv = createMMKV({ id: 'gymcrush' });

export const mmkvStorage: StateStorage = {
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: (key) => {
    mmkv.remove(key);
  },
};

/**
 * Wipes the whole instance rather than named keys: the leak this guards against
 * was a new store being added and silently escaping cleanup.
 */
export function clearMmkv() {
  mmkv.clearAll();
}
