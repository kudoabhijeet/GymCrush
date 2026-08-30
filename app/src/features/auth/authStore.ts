import { create } from 'zustand';
import type { AuthResponse, BodyProfile, MacroTarget, PublicUser } from '@gymcrush/shared';
import { api, ApiError, resetAuthState } from '@/lib/api';
import { clearMmkv } from '@/lib/mmkvStorage';
import { cancelDailyReminder } from '@/lib/notifications';
import { queryClient } from '@/lib/queryClient';
import { tokenStore } from '@/lib/tokenStore';
import { clearExerciseCatalog } from '@/features/exercises/hooks';
import { useExercisePickerStore } from '@/features/exercises/pickerStore';
import { useOnboardingStore } from '@/features/profile/onboardingStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { useActiveSessionStore } from '@/features/workout/activeSessionStore';
import { clearSessionsCache } from '@/features/workout/hooks';
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
  deleteAccount: () => Promise<void>;
}

/**
 * Wipe every trace of the signed-in user from this device. The in-memory caches
 * matter as much as the persisted ones: `sessionsCache` seeds the ghosted
 * "previous" values that get adopted into new sets, so leaving it warm would
 * write one account's history into the next account signed in here.
 */
async function clearLocalUserData() {
  // `finally` so no single failing step can strand the rest: dropping the tokens
  // is the one part that must happen even if a cache wipe throws, and the cache
  // wipes must happen even if the keychain call rejects.
  try {
    useProfileStore.getState().clear();
    // Body metrics from an abandoned onboarding would otherwise be prefilled for —
    // and saved to — whoever signs in next.
    useOnboardingStore.getState().reset();
    // Before `clearMmkv`, so the persist write it triggers gets wiped too.
    useActiveSessionStore.getState().discard();
    useExercisePickerStore.getState().clear();
    clearMmkv();
    clearSessionsCache();
    clearExerciseCatalog();
    queryClient.clear();
  } finally {
    // Invalidates any refresh still in flight for the outgoing account.
    resetAuthState();
    await tokenStore.clear();
  }
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
    if (e instanceof ApiError && e.status === 404) {
      // No profile yet — genuinely needs onboarding.
      hydrateProfile(null, null);
    }
    // Any other error (network blip, 5xx) is transient: don't flip an
    // authenticated user into onboarding. Leave the store as-is (persisted
    // units stay; profile/target stay whatever they were). The gate falls
    // back to the last known `onboarded` value rather than forcing the flow.
  }
}

async function applyAuth(res: AuthResponse, set: (s: Partial<AuthState>) => void) {
  // A session always starts from a clean slate, so stale state can't survive
  // into the next account even if some sign-out path forgets to tear it down.
  // Must run before the new tokens are stored — it clears tokens too.
  await clearLocalUserData();
  await tokenStore.set(res.tokens);
  // Settle the profile (→ `onboarded`) BEFORE flipping status to authenticated,
  // so the routing gate never sees authenticated + stale onboarded=false and
  // wrongly bounces an already-onboarded user into onboarding.
  await syncProfileFromServer();
  set({ user: res.user, status: 'authenticated' });
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
      await syncProfileFromServer();
      set({ user, status: 'authenticated' });
    } catch {
      // Token invalid/expired beyond refresh — sign out.
      await clearLocalUserData();
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
    await clearLocalUserData();
    set({ user: null, status: 'unauthenticated' });
  },

  deleteAccount: async () => {
    await authApi.deleteAccount();
    // Rest timer is cancelled by discard() inside clearLocalUserData. The daily
    // reminder is a device pref that survives sign-out on purpose — cancel it
    // here so "time to train" doesn't fire after the account is gone.
    cancelDailyReminder();
    await clearLocalUserData();
    set({ user: null, status: 'unauthenticated' });
  },
}));
