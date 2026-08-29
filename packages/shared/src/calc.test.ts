import { describe, expect, it } from 'vitest';
import { calcBmr, calcMacroTarget, calcTdee, wasMacroTargetClamped, type CalcInput } from './calc.js';

/**
 * These formulas are the single source of truth for both the app's onboarding
 * preview and the backend's persisted targets, so the expected values here are
 * computed by hand from the documented equations rather than snapshotted from
 * the implementation — a snapshot would happily lock in a regression.
 */

const base: CalcInput = {
  sex: 'male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  activityLevel: 'moderate',
  nutritionGoal: 'maintain',
};

describe('calcBmr — Mifflin-St Jeor', () => {
  it('adds 5 for male', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5
    expect(calcBmr({ sex: 'male', age: 30, heightCm: 180, weightKg: 80 })).toBe(1780);
  });

  it('subtracts 161 for female', () => {
    // 10*65 + 6.25*165 - 5*28 - 161 = 650 + 1031.25 - 140 - 161
    expect(calcBmr({ sex: 'female', age: 28, heightCm: 165, weightKg: 65 })).toBe(1380.25);
  });

  it('differs by exactly 166 between sexes at identical metrics', () => {
    const metrics = { age: 30, heightCm: 180, weightKg: 80 } as const;
    expect(calcBmr({ ...metrics, sex: 'male' }) - calcBmr({ ...metrics, sex: 'female' })).toBe(166);
  });

  it('rises with weight and height, falls with age', () => {
    const bmr = calcBmr({ sex: 'male', age: 30, heightCm: 180, weightKg: 80 });
    expect(calcBmr({ sex: 'male', age: 30, heightCm: 180, weightKg: 81 })).toBeGreaterThan(bmr);
    expect(calcBmr({ sex: 'male', age: 30, heightCm: 181, weightKg: 80 })).toBeGreaterThan(bmr);
    expect(calcBmr({ sex: 'male', age: 31, heightCm: 180, weightKg: 80 })).toBeLessThan(bmr);
  });
});

describe('calcTdee', () => {
  it('applies the activity multiplier to BMR', () => {
    expect(calcTdee({ ...base, activityLevel: 'moderate' })).toBeCloseTo(1780 * 1.55, 6);
  });

  it.each([
    ['sedentary', 1.2],
    ['light', 1.375],
    ['moderate', 1.55],
    ['active', 1.725],
    ['very_active', 1.9],
  ] as const)('uses the PRD multiplier for %s', (activityLevel, multiplier) => {
    expect(calcTdee({ ...base, activityLevel })).toBeCloseTo(1780 * multiplier, 6);
  });

  it('increases monotonically across activity levels', () => {
    const levels = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
    const values = levels.map((activityLevel) => calcTdee({ ...base, activityLevel }));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it('stays within the PRD-documented 1.2–1.9 multiplier band', () => {
    const bmr = calcBmr(base);
    for (const activityLevel of ['sedentary', 'very_active'] as const) {
      const ratio = calcTdee({ ...base, activityLevel }) / bmr;
      expect(ratio).toBeGreaterThanOrEqual(1.2);
      expect(ratio).toBeLessThanOrEqual(1.9);
    }
  });
});

describe('calcMacroTarget — goal adjustment', () => {
  it('leaves calories at TDEE when maintaining', () => {
    const { calories } = calcMacroTarget({ ...base, nutritionGoal: 'maintain' });
    expect(calories).toBe(Math.round(calcTdee(base)));
  });

  it('cuts by 18% and lean-bulks by 12%', () => {
    const tdee = calcTdee(base);
    expect(calcMacroTarget({ ...base, nutritionGoal: 'cut' }).calories).toBe(
      Math.round(tdee * 0.82),
    );
    expect(calcMacroTarget({ ...base, nutritionGoal: 'lean_bulk' }).calories).toBe(
      Math.round(tdee * 1.12),
    );
  });

  it('orders cut < maintain < lean_bulk', () => {
    const cut = calcMacroTarget({ ...base, nutritionGoal: 'cut' }).calories;
    const maintain = calcMacroTarget({ ...base, nutritionGoal: 'maintain' }).calories;
    const bulk = calcMacroTarget({ ...base, nutritionGoal: 'lean_bulk' }).calories;
    expect(cut).toBeLessThan(maintain);
    expect(maintain).toBeLessThan(bulk);
  });
});

describe('calcMacroTarget — macro split', () => {
  it('uses 1.8 g/kg protein and 0.9 g/kg fat when calories allow', () => {
    const target = calcMacroTarget(base);
    expect(target.proteinG).toBe(Math.round(80 * 1.8));
    expect(target.fatG).toBe(Math.round(80 * 0.9));
  });

  it('stays inside the PRD g/kg guidance (protein 1.6–2.2, fat 0.8–1.0)', () => {
    const target = calcMacroTarget(base);
    expect(target.proteinG / base.weightKg).toBeGreaterThanOrEqual(1.6);
    expect(target.proteinG / base.weightKg).toBeLessThanOrEqual(2.2);
    expect(target.fatG / base.weightKg).toBeGreaterThanOrEqual(0.8);
    expect(target.fatG / base.weightKg).toBeLessThanOrEqual(1.0);
  });

  it('fills the remaining calories with carbs', () => {
    const { calories, proteinG, carbsG, fatG } = calcMacroTarget(base);
    // Rounding each macro to a whole gram costs at most a few kcal.
    expect(proteinG * 4 + carbsG * 4 + fatG * 9).toBeCloseTo(calories, -1);
  });

  it('returns whole grams for every macro', () => {
    const target = calcMacroTarget({ ...base, weightKg: 83.7, heightCm: 177.5, age: 41 });
    for (const value of [target.calories, target.proteinG, target.carbsG, target.fatG]) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe('calcMacroTarget — clamping at heavy bodyweight on an aggressive cut', () => {
  // Heavy + short + old + sedentary + cut drives calories low while the g/kg
  // rules drive protein and fat high: the case the scaling logic exists for.
  const heavyCut: CalcInput = {
    sex: 'female',
    age: 60,
    heightCm: 150,
    weightKg: 160,
    activityLevel: 'sedentary',
    nutritionGoal: 'cut',
  };

  it('reports the scenario as clamped', () => {
    expect(wasMacroTargetClamped(heavyCut)).toBe(true);
    expect(wasMacroTargetClamped(base)).toBe(false);
  });

  it('scales protein and fat below their raw g/kg values', () => {
    const target = calcMacroTarget(heavyCut);
    expect(target.proteinG).toBeLessThan(Math.round(160 * 1.8));
    expect(target.fatG).toBeLessThan(Math.round(160 * 0.9));
  });

  it('keeps protein+fat under the calorie target and leaves carbs non-negative', () => {
    const { calories, proteinG, carbsG, fatG } = calcMacroTarget(heavyCut);
    expect(proteinG * 4 + fatG * 9).toBeLessThanOrEqual(calories);
    expect(carbsG).toBeGreaterThanOrEqual(0);
  });

  it('preserves roughly the original protein:fat kcal ratio when scaling', () => {
    const rawRatio = (160 * 1.8 * 4) / (160 * 0.9 * 9);
    const { proteinG, fatG } = calcMacroTarget(heavyCut);
    expect((proteinG * 4) / (fatG * 9)).toBeCloseTo(rawRatio, 1);
  });

  it('agrees with wasMacroTargetClamped across the input space', () => {
    for (const weightKg of [50, 80, 120, 160, 200]) {
      for (const nutritionGoal of ['cut', 'maintain', 'lean_bulk'] as const) {
        const input: CalcInput = { ...heavyCut, weightKg, nutritionGoal };
        const target = calcMacroTarget(input);
        const unscaled =
          target.proteinG === Math.round(weightKg * 1.8) &&
          target.fatG === Math.round(weightKg * 0.9);
        expect(wasMacroTargetClamped(input)).toBe(!unscaled);
      }
    }
  });

  it('never produces a negative macro anywhere in the plausible input space', () => {
    for (const weightKg of [30, 80, 150, 300]) {
      for (const heightCm of [100, 175, 250]) {
        for (const age of [13, 40, 100]) {
          for (const sex of ['male', 'female'] as const) {
            const target = calcMacroTarget({
              sex,
              age,
              heightCm,
              weightKg,
              activityLevel: 'sedentary',
              nutritionGoal: 'cut',
            });
            expect(target.proteinG).toBeGreaterThanOrEqual(0);
            expect(target.carbsG).toBeGreaterThanOrEqual(0);
            expect(target.fatG).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });
});
