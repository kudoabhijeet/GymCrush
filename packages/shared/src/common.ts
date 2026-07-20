import { z } from 'zod';

/** Shared primitives and enums used across auth, workout, and nutrition domains. */

export const idSchema = z.string().uuid();
export type Id = z.infer<typeof idSchema>;

export const isoDateTime = z.string().datetime();

export const Goal = z.enum([
  'strength',
  'hypertrophy',
  'fat_loss',
  'general_fitness',
  'endurance',
]);
export type Goal = z.infer<typeof Goal>;

export const Sex = z.enum(['male', 'female']);
export type Sex = z.infer<typeof Sex>;

export const ActivityLevel = z.enum([
  'sedentary', // little/no exercise
  'light', // 1-3 days/week
  'moderate', // 3-5 days/week
  'active', // 6-7 days/week
  'very_active', // hard exercise + physical job
]);
export type ActivityLevel = z.infer<typeof ActivityLevel>;

export const NutritionGoal = z.enum(['cut', 'maintain', 'lean_bulk']);
export type NutritionGoal = z.infer<typeof NutritionGoal>;

export const MuscleGroup = z.enum([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'forearms',
  'full_body',
]);
export type MuscleGroup = z.infer<typeof MuscleGroup>;

export const Equipment = z.enum([
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'band',
  'other',
]);
export type Equipment = z.infer<typeof Equipment>;

/** Standard paginated list envelope returned by list endpoints. */
export const paginationQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuery>;
