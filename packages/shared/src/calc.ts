import type { ActivityLevel, NutritionGoal, Sex } from './common.js';
import type { MacroTarget } from './nutrition.js';

/**
 * Single source of truth for calorie/macro math. Used by both the app (for live
 * previews during onboarding) and the backend (to persist derived targets).
 */

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Percentage adjustment applied to TDEE per nutrition goal. */
const GOAL_ADJUSTMENT: Record<NutritionGoal, number> = {
  cut: -0.18,
  maintain: 0,
  lean_bulk: 0.12,
};

export interface CalcInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  nutritionGoal: NutritionGoal;
}

/** Basal Metabolic Rate — Mifflin-St Jeor equation. */
export function calcBmr(input: Pick<CalcInput, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return input.sex === 'male' ? base + 5 : base - 161;
}

/** Total Daily Energy Expenditure. */
export function calcTdee(input: Omit<CalcInput, 'nutritionGoal'>): number {
  return calcBmr(input) * ACTIVITY_MULTIPLIER[input.activityLevel];
}

/**
 * Derive daily calorie + macro targets from body metrics and goal.
 * - Protein: 1.8 g/kg bodyweight
 * - Fat: 0.9 g/kg bodyweight
 * - Carbs: remaining calories (4 kcal/g protein & carbs, 9 kcal/g fat)
 */
export function calcMacroTarget(input: CalcInput): MacroTarget {
  const tdee = calcTdee(input);
  const calories = Math.round(tdee * (1 + GOAL_ADJUSTMENT[input.nutritionGoal]));

  const proteinG = Math.round(input.weightKg * 1.8);
  const fatG = Math.round(input.weightKg * 0.9);

  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const carbsG = Math.max(0, Math.round((calories - proteinKcal - fatKcal) / 4));

  return { calories, proteinG, carbsG, fatG };
}
