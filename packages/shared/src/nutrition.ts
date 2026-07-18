import { z } from 'zod';
import { ActivityLevel, NutritionGoal, Sex } from './common.js';

export const Meal = z.enum(['breakfast', 'lunch', 'dinner', 'snacks']);
export type Meal = z.infer<typeof Meal>;

export const bodyProfileSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  sex: Sex,
  age: z.number().int().min(13).max(100),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  activityLevel: ActivityLevel,
  nutritionGoal: NutritionGoal,
  updatedAt: z.string(),
});
export type BodyProfile = z.infer<typeof bodyProfileSchema>;

export const upsertBodyProfileSchema = z.object({
  sex: Sex,
  age: z.number().int().min(13).max(100),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  activityLevel: ActivityLevel,
  nutritionGoal: NutritionGoal,
});
export type UpsertBodyProfileInput = z.infer<typeof upsertBodyProfileSchema>;

export const macroTargetSchema = z.object({
  calories: z.number().int(),
  proteinG: z.number().int(),
  carbsG: z.number().int(),
  fatG: z.number().int(),
});
export type MacroTarget = z.infer<typeof macroTargetSchema>;

/* -------------------------------- Food logs ------------------------------ */

export const foodSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string().nullable(),
  /** Per serving. */
  servingLabel: z.string(), // e.g. "100g", "1 scoop"
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
});
export type Food = z.infer<typeof foodSchema>;

export const createFoodSchema = z.object({
  name: z.string().min(1).max(80),
  servingLabel: z.string().min(1).max(40),
  calories: z.number().min(0).max(10000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(1000),
  fatG: z.number().min(0).max(1000),
});
export type CreateFoodInput = z.infer<typeof createFoodSchema>;

export const foodEntrySchema = z.object({
  id: z.string(),
  foodId: z.string(),
  servings: z.number().min(0.01).max(100),
  meal: Meal,
});
export type FoodEntry = z.infer<typeof foodEntrySchema>;

export const logFoodSchema = z.object({
  /** ISO date (yyyy-mm-dd) for the day this entry belongs to. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  foodId: z.string(),
  servings: z.number().min(0.01).max(100),
  meal: Meal.default('breakfast'),
});
export type LogFoodInput = z.infer<typeof logFoodSchema>;

/* ------------------------------- Daily log ------------------------------- */

/** Macro totals for an entry or a whole day. */
export const macrosSchema = z.object({
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
});
export type Macros = z.infer<typeof macrosSchema>;

/** A logged entry enriched with its food and computed macros (server-shaped). */
export const dailyLogEntrySchema = z.object({
  id: z.string(),
  foodId: z.string(),
  servings: z.number(),
  meal: Meal,
  food: foodSchema,
  macros: macrosSchema,
});
export type DailyLogEntry = z.infer<typeof dailyLogEntrySchema>;

export const dailyLogSchema = z.object({
  date: z.string(),
  entries: z.array(dailyLogEntrySchema),
  totals: macrosSchema,
});
export type DailyLog = z.infer<typeof dailyLogSchema>;

export const weightEntrySchema = z.object({
  id: z.string(),
  weightKg: z.number(),
  loggedAt: z.string(),
});
export type WeightEntry = z.infer<typeof weightEntrySchema>;
