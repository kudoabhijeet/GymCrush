import type { AuthTokens } from '@gymcrush/shared';
import { kvStorage } from './storage';

const ACCESS_KEY = 'gc.accessToken';
const REFRESH_KEY = 'gc.refreshToken';

/** Persist JWTs in the device keychain/keystore (native) or localStorage (web). */
export const tokenStore = {
  async get(): Promise<AuthTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      kvStorage.getItem(ACCESS_KEY),
      kvStorage.getItem(REFRESH_KEY),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },

  async set(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      kvStorage.setItem(ACCESS_KEY, tokens.accessToken),
      kvStorage.setItem(REFRESH_KEY, tokens.refreshToken),
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all([kvStorage.removeItem(ACCESS_KEY), kvStorage.removeItem(REFRESH_KEY)]);
  },
};
