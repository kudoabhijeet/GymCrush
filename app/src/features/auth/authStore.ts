import { create } from 'zustand';
import type { PublicUser } from '@gymcrush/shared';
import { tokenStore } from '@/lib/tokenStore';
import { authApi } from './authApi';

interface AuthState {
  user: PublicUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  /** On app start: if we have stored tokens, consider the user signed in. */
  hydrate: async () => {
    const tokens = await tokenStore.get();
    set({ status: tokens ? 'authenticated' : 'unauthenticated' });
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    await tokenStore.set(res.tokens);
    set({ user: res.user, status: 'authenticated' });
  },

  register: async (email, password, displayName) => {
    const res = await authApi.register({ email, password, displayName });
    await tokenStore.set(res.tokens);
    set({ user: res.user, status: 'authenticated' });
  },

  logout: async () => {
    const tokens = await tokenStore.get();
    if (tokens) await authApi.logout(tokens.refreshToken).catch(() => {});
    await tokenStore.clear();
    set({ user: null, status: 'unauthenticated' });
  },
}));
