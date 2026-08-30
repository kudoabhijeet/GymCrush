import { create } from 'zustand';
import type { ActivityLevel, NutritionGoal, Sex, UpsertBodyProfileInput } from '@gymcrush/shared';

/** In-progress onboarding answers before they're committed to the profile store. */
interface OnboardingDraft {
  nutritionGoal: NutritionGoal | null;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel | null;
  setGoal: (goal: NutritionGoal) => void;
  setBody: (patch: Partial<Pick<OnboardingDraft, 'sex' | 'age' | 'heightCm' | 'weightKg'>>) => void;
  setActivity: (level: ActivityLevel) => void;
  /** Prefill from a saved profile when re-running the calculator. */
  hydrateFromProfile: (profile: UpsertBodyProfileInput) => void;
  reset: () => void;
}

const initial = {
  nutritionGoal: null as NutritionGoal | null,
  sex: 'male' as Sex,
  age: 28,
  heightCm: 175,
  weightKg: 75,
  activityLevel: null as ActivityLevel | null,
};

export const useOnboardingStore = create<OnboardingDraft>((set) => ({
  ...initial,
  setGoal: (nutritionGoal) => set({ nutritionGoal }),
  setBody: (patch) => set(patch),
  setActivity: (activityLevel) => set({ activityLevel }),
  hydrateFromProfile: (profile) =>
    set({
      nutritionGoal: profile.nutritionGoal,
      sex: profile.sex,
      age: profile.age,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
    }),
  reset: () => set(initial),
}));
