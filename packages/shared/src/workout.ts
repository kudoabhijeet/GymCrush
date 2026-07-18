import { z } from 'zod';
import { Equipment, Goal, MuscleGroup } from './common.js';

/* ------------------------------- Exercises ------------------------------- */

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroup: MuscleGroup,
  equipment: Equipment,
  /** null for catalog (global) exercises; set for user-custom ones. */
  ownerId: z.string().nullable(),
  isCustom: z.boolean(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const createExerciseSchema = z.object({
  name: z.string().min(1).max(80),
  muscleGroup: MuscleGroup,
  equipment: Equipment,
});
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;

/* ------------------------------ Workout Plans ---------------------------- */

/** A prescribed set scheme on a plan (targets, not actuals). */
export const planExerciseSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  order: z.number().int().nonnegative(),
  targetSets: z.number().int().min(1).max(20),
  /** Rep target as a range, e.g. "8-12". Free-form to allow AMRAP, time, etc. */
  targetReps: z.string().min(1).max(20),
  targetRpe: z.number().min(1).max(10).nullable(),
  restSeconds: z.number().int().min(0).max(1800).nullable(),
  notes: z.string().max(500).nullable(),
});
export type PlanExercise = z.infer<typeof planExerciseSchema>;

export const planDaySchema = z.object({
  id: z.string(),
  name: z.string(), // e.g. "Push A", "Lower Body"
  order: z.number().int().nonnegative(),
  exercises: z.array(planExerciseSchema),
});
export type PlanDay = z.infer<typeof planDaySchema>;

export const workoutPlanSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  goal: Goal,
  daysPerWeek: z.number().int().min(1).max(7),
  isTemplate: z.boolean(),
  days: z.array(planDaySchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WorkoutPlan = z.infer<typeof workoutPlanSchema>;

/* Create/update payloads (nested upsert; ids optional for new children). */

const upsertPlanExercise = z.object({
  id: z.string().optional(),
  exerciseId: z.string(),
  order: z.number().int().nonnegative(),
  targetSets: z.number().int().min(1).max(20),
  targetReps: z.string().min(1).max(20),
  targetRpe: z.number().min(1).max(10).nullable().optional(),
  restSeconds: z.number().int().min(0).max(1800).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const upsertPlanDay = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(60),
  order: z.number().int().nonnegative(),
  exercises: z.array(upsertPlanExercise),
});

export const upsertPlanSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(1000).nullable().optional(),
  goal: Goal,
  daysPerWeek: z.number().int().min(1).max(7),
  isTemplate: z.boolean().default(false),
  days: z.array(upsertPlanDay),
});
export type UpsertPlanInput = z.infer<typeof upsertPlanSchema>;

export const planExplorerQuery = z.object({
  goal: Goal.optional(),
  daysPerWeek: z.coerce.number().int().min(1).max(7).optional(),
  templatesOnly: z.coerce.boolean().optional(),
});
export type PlanExplorerQuery = z.infer<typeof planExplorerQuery>;

/* ------------------------------ Workout Logs ----------------------------- */

export const loggedSetSchema = z.object({
  id: z.string(),
  setNumber: z.number().int().min(1),
  weight: z.number().min(0).nullable(),
  reps: z.number().int().min(0).nullable(),
  rpe: z.number().min(1).max(10).nullable(),
  isWarmup: z.boolean(),
  completed: z.boolean(),
});
export type LoggedSet = z.infer<typeof loggedSetSchema>;

export const loggedExerciseSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  order: z.number().int().nonnegative(),
  sets: z.array(loggedSetSchema),
});
export type LoggedExercise = z.infer<typeof loggedExerciseSchema>;

export const workoutSessionSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  planId: z.string().nullable(),
  planDayId: z.string().nullable(),
  name: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  notes: z.string().nullable(),
  exercises: z.array(loggedExerciseSchema),
});
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;

export const startSessionSchema = z.object({
  name: z.string().min(1).max(80),
  planId: z.string().optional(),
  planDayId: z.string().optional(),
});
export type StartSessionInput = z.infer<typeof startSessionSchema>;

export const logSetSchema = z.object({
  loggedExerciseId: z.string(),
  setNumber: z.number().int().min(1),
  weight: z.number().min(0).nullable().optional(),
  reps: z.number().int().min(0).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  isWarmup: z.boolean().default(false),
  completed: z.boolean().default(true),
});
export type LogSetInput = z.infer<typeof logSetSchema>;
