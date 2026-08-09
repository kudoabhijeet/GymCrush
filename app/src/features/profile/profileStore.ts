import { create } from 'zustand';
import { colorScheme } from 'nativewind';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MacroTarget, UpsertBodyProfileInput } from '@gymcrush/shared';
import { kvStorage } from '@/lib/storage';

export type Units = 'kg' | 'lb';
export type ThemeChoice = 'system' | 'light' | 'dark';

interface ProfileState {
  bodyProfile: UpsertBodyProfileInput | null;
  macroTarget: MacroTarget | null;
  units: Units;
  theme: ThemeChoice;
  onboarded: boolean;
  /** Set the profile + target after saving to (or loading from) the API. */
  setBodyProfile: (profile: UpsertBodyProfileInput, target: MacroTarget) => void;
  setMacroTarget: (target: MacroTarget) => void;
  setUnits: (units: Units) => void;
  setTheme: (theme: ThemeChoice) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  /** On login/hydrate: adopt the server's profile+target and mark onboarded. */
  hydrateFromServer: (
    profile: UpsertBodyProfileInput | null,
    target: MacroTarget | null,
  ) => void;
  /** On logout: clear personal data (keep unit/theme device prefs). */
  clear: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      bodyProfile: null,
      macroTarget: null,
      units: 'kg',
      theme: 'system',
      onboarded: false,

      setBodyProfile: (bodyProfile, macroTarget) => set({ bodyProfile, macroTarget }),
      setMacroTarget: (macroTarget) => set({ macroTarget }),
      setUnits: (units) => set({ units }),
      setTheme: (theme) => {
        set({ theme });
        colorScheme.set(theme);
      },
      completeOnboarding: () => set({ onboarded: true }),
      resetOnboarding: () => set({ onboarded: false }),

      hydrateFromServer: (profile, target) =>
        set({
          bodyProfile: profile,
          macroTarget: target,
          // A saved server profile means onboarding is already done.
          onboarded: profile !== null,
        }),

      clear: () => set({ bodyProfile: null, macroTarget: null, onboarded: false }),
    }),
    {
      name: 'gc.profile',
      // Persist only device preferences; profile/target come from the API.
      partialize: (state) => ({ units: state.units, theme: state.theme }),
      storage: createJSONStorage(() => kvStorage),
      // Apply the saved theme as soon as it's read back, so the app doesn't
      // paint in the wrong scheme first.
      onRehydrateStorage: () => (state) => {
        if (state?.theme) colorScheme.set(state.theme);
      },
    },
  ),
);
