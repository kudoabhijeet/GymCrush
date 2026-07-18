import type { Prisma } from '@prisma/client';
import type {
  BodyProfile,
  Exercise,
  Food,
  MacroTarget,
  WorkoutPlan,
  WorkoutSession,
} from '@gymcrush/shared';

/**
 * Convert Prisma records into the shared DTO shapes (Dates → ISO strings,
 * derived fields like `isCustom`). Every handler returns mapped data so HTTP
 * responses line up with the `@gymcrush/shared` Zod types the app consumes.
 */

/* ------------------------------- Exercises ------------------------------- */

export function mapExercise(row: Prisma.ExerciseGetPayload<object>): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup,
    equipment: row.equipment,
    ownerId: row.ownerId,
    isCustom: row.ownerId !== null,
  };
}

/* --------------------------------- Plans --------------------------------- */

type PlanWithChildren = Prisma.WorkoutPlanGetPayload<{
  include: { days: { include: { exercises: true } } };
}>;

export function mapPlan(plan: PlanWithChildren): WorkoutPlan {
  return {
    id: plan.id,
    ownerId: plan.ownerId,
    name: plan.name,
    description: plan.description,
    goal: plan.goal,
    daysPerWeek: plan.daysPerWeek,
    isTemplate: plan.isTemplate,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    days: [...plan.days]
      .sort((a, b) => a.order - b.order)
      .map((day) => ({
        id: day.id,
        name: day.name,
        order: day.order,
        exercises: [...day.exercises]
          .sort((a, b) => a.order - b.order)
          .map((ex) => ({
            id: ex.id,
            exerciseId: ex.exerciseId,
            order: ex.order,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetRpe: ex.targetRpe,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
          })),
      })),
  };
}

/* -------------------------------- Sessions ------------------------------- */

type SessionWithChildren = Prisma.WorkoutSessionGetPayload<{
  include: { exercises: { include: { sets: true } } };
}>;

export function mapSession(session: SessionWithChildren): WorkoutSession {
  return {
    id: session.id,
    ownerId: session.ownerId,
    planId: session.planId,
    planDayId: session.planDayId,
    name: session.name,
    startedAt: session.startedAt.toISOString(),
    finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
    notes: session.notes,
    exercises: [...session.exercises]
      .sort((a, b) => a.order - b.order)
      .map((ex) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        order: ex.order,
        sets: [...ex.sets]
          .sort((a, b) => a.setNumber - b.setNumber)
          .map((set) => ({
            id: set.id,
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            isWarmup: set.isWarmup,
            completed: set.completed,
          })),
      })),
  };
}

/* ------------------------------- Nutrition ------------------------------- */

export function mapBodyProfile(row: Prisma.BodyProfileGetPayload<object>): BodyProfile {
  return {
    id: row.id,
    ownerId: row.ownerId,
    sex: row.sex,
    age: row.age,
    heightCm: row.heightCm,
    weightKg: row.weightKg,
    activityLevel: row.activityLevel,
    nutritionGoal: row.nutritionGoal,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapMacroTarget(row: Prisma.MacroTargetGetPayload<object>): MacroTarget {
  return {
    calories: row.calories,
    proteinG: row.proteinG,
    carbsG: row.carbsG,
    fatG: row.fatG,
  };
}

export function mapFood(row: Prisma.FoodGetPayload<object>): Food {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    servingLabel: row.servingLabel,
    calories: row.calories,
    proteinG: row.proteinG,
    carbsG: row.carbsG,
    fatG: row.fatG,
  };
}
