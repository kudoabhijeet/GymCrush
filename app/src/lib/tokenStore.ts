import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from '@gymcrush/shared';

const ACCESS_KEY = 'gc.accessToken';
const REFRESH_KEY = 'gc.refreshToken';

/**
 * Low-level key/value backend. expo-secure-store is native-only (keychain /
 * keystore), so on web we fall back to localStorage. Tokens on web are already
 * exposed to JS, so this is the standard trade-off for the web target.
 */
const backend = {
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

/** Persist JWTs in the device keychain/keystore (native) or localStorage (web). */
export const tokenStore = {
  async get(): Promise<AuthTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      backend.getItem(ACCESS_KEY),
      backend.getItem(REFRESH_KEY),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },

  async set(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      backend.setItem(ACCESS_KEY, tokens.accessToken),
      backend.setItem(REFRESH_KEY, tokens.refreshToken),
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all([backend.removeItem(ACCESS_KEY), backend.removeItem(REFRESH_KEY)]);
  },
};
