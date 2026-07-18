import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Minimal async key/value storage: SecureStore on native (keychain/keystore),
 * localStorage on web. Shared by the token store and persisted zustand stores.
 */
export const kvStorage = {
  getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};
