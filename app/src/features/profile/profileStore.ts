import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MacroTarget, UpsertBodyProfileInput } from '@gymcrush/shared';
import { kvStorage } from '@/lib/storage';

export type Units = 'kg' | 'lb';

interface ProfileState {
  bodyProfile: UpsertBodyProfileInput | null;
  macroTarget: MacroTarget | null;
  units: Units;
  onboarded: boolean;
  /** Set the profile + target after saving to (or loading from) the API. */
  setBodyProfile: (profile: UpsertBodyProfileInput, target: MacroTarget) => void;
  setMacroTarget: (target: MacroTarget) => void;
  setUnits: (units: Units) => void;
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
      onboarded: false,

      setBodyProfile: (bodyProfile, macroTarget) => set({ bodyProfile, macroTarget }),
      setMacroTarget: (macroTarget) => set({ macroTarget }),
      setUnits: (units) => set({ units }),
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
      partialize: (state) => ({ units: state.units }),
      storage: createJSONStorage(() => kvStorage),
    },
  ),
);
