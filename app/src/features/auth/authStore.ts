import { create } from 'zustand';
import type { AuthResponse, BodyProfile, MacroTarget, PublicUser } from '@gymcrush/shared';
import { api, ApiError } from '@/lib/api';
import { tokenStore } from '@/lib/tokenStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { authApi } from './authApi';

/** Local dev convenience: auto-sign-in with the seeded dev account. */
const DEV_LOGIN = process.env.EXPO_PUBLIC_DEV_LOGIN === '1';
const DEV_EMAIL = 'dev@gymcrush.app';
const DEV_PASSWORD = 'devpassword123';

interface AuthState {
  user: PublicUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

/** Load the user's server-side profile + targets into the profile store. */
async function syncProfileFromServer() {
  const hydrateProfile = useProfileStore.getState().hydrateFromServer;
  try {
    const [{ profile }, { target }] = await Promise.all([
      api<{ profile: BodyProfile }>('/api/nutrition/profile'),
      api<{ target: MacroTarget }>('/api/nutrition/targets'),
    ]);
    hydrateProfile(profile, target);
  } catch (e) {
    // 404 = no profile yet (needs onboarding); anything else, leave unonboarded.
    if (e instanceof ApiError && e.status === 404) hydrateProfile(null, null);
    else hydrateProfile(null, null);
  }
}

async function applyAuth(res: AuthResponse, set: (s: Partial<AuthState>) => void) {
  await tokenStore.set(res.tokens);
  set({ user: res.user, status: 'authenticated' });
  await syncProfileFromServer();
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  /** On app start: validate stored tokens via /me (or dev auto-login). */
  hydrate: async () => {
    const tokens = await tokenStore.get();

    if (!tokens) {
      if (DEV_LOGIN) {
        try {
          const res = await authApi.login({ email: DEV_EMAIL, password: DEV_PASSWORD });
          await applyAuth(res, set);
          return;
        } catch {
          // Dev account not seeded — fall through to the login screen.
        }
      }
      set({ status: 'unauthenticated' });
      return;
    }

    try {
      const { user } = await authApi.me();
      set({ user, status: 'authenticated' });
      await syncProfileFromServer();
    } catch {
      // Token invalid/expired beyond refresh — sign out.
      await tokenStore.clear();
      set({ user: null, status: 'unauthenticated' });
    }
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    await applyAuth(res, set);
  },

  register: async (email, password, displayName) => {
    const res = await authApi.register({ email, password, displayName });
    await applyAuth(res, set);
  },

  logout: async () => {
    const tokens = await tokenStore.get();
    if (tokens) await authApi.logout(tokens.refreshToken).catch(() => {});
    await tokenStore.clear();
    useProfileStore.getState().clear();
    set({ user: null, status: 'unauthenticated' });
  },
}));
