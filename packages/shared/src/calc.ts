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
 * Smallest share of calories left for carbs once protein and fat are allocated.
 * A product judgement for a general-audience app, not a clinical threshold.
 */
const MIN_CARB_SHARE = 0.1;

/**
 * Derive daily calorie + macro targets from body metrics and goal.
 * - Protein: 1.8 g/kg bodyweight
 * - Fat: 0.9 g/kg bodyweight
 * - Carbs: remaining calories (4 kcal/g protein & carbs, 9 kcal/g fat)
 *
 * At a heavy bodyweight combined with an aggressive cut, bodyweight-derived
 * protein and fat alone can exceed the calorie target. Scaling both down
 * proportionally keeps the macro split consistent with the headline calories
 * instead of silently overshooting it.
 */
export function calcMacroTarget(input: CalcInput): MacroTarget {
  const tdee = calcTdee(input);
  const calories = Math.round(tdee * (1 + GOAL_ADJUSTMENT[input.nutritionGoal]));

  let proteinG = Math.round(input.weightKg * 1.8);
  let fatG = Math.round(input.weightKg * 0.9);

  const ceiling = calories * (1 - MIN_CARB_SHARE);
  const uncappedKcal = proteinG * 4 + fatG * 9;
  if (uncappedKcal > ceiling) {
    const scale = ceiling / uncappedKcal;
    proteinG = Math.round(proteinG * scale);
    fatG = Math.round(fatG * scale);
  }

  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return { calories, proteinG, carbsG, fatG };
}

/**
 * Whether `calcMacroTarget` had to scale protein/fat down to fit the calorie
 * target — lets the UI explain why targets look lower than the g/kg guidance.
 */
export function wasMacroTargetClamped(input: CalcInput): boolean {
  const tdee = calcTdee(input);
  const calories = Math.round(tdee * (1 + GOAL_ADJUSTMENT[input.nutritionGoal]));
  const uncappedKcal = Math.round(input.weightKg * 1.8) * 4 + Math.round(input.weightKg * 0.9) * 9;
  return uncappedKcal > calories * (1 - MIN_CARB_SHARE);
}
