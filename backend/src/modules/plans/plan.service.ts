import type { PlanExplorerQuery, UpsertPlanInput, WorkoutPlan } from '@gymcrush/shared';
import { prisma } from '../../db/prisma.js';
import { TtlCache } from '../../lib/cache.js';
import { notFound } from '../../lib/errors.js';
import { mapPlan } from '../../lib/mappers.js';

const planInclude = { days: { include: { exercises: true } } } as const;

/** Turn an upsert payload's nested days/exercises into a Prisma nested `create`. */
function daysCreate(input: UpsertPlanInput) {
  return input.days.map((day, dayIndex) => ({
    name: day.name,
    order: day.order ?? dayIndex,
    exercises: {
      create: day.exercises.map((ex, exIndex) => ({
        exerciseId: ex.exerciseId,
        order: ex.order ?? exIndex,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetRpe: ex.targetRpe ?? null,
        restSeconds: ex.restSeconds ?? null,
        notes: ex.notes ?? null,
      })),
    },
  }));
}

/**
 * The curated templates are the same rows for every user and only change on a
 * re-seed, but they're read on every visit to the Explore tab and carry a nested
 * day/exercise tree — the most expensive read in the app to repeat. Personal
 * plans are deliberately *not* cached: they're user-specific and edited often,
 * so the correctness risk outweighs the saving.
 */
const templateCache = new TtlCache<WorkoutPlan[]>(10 * 60_000, 1);

function loadTemplates(): Promise<WorkoutPlan[]> {
  return templateCache.getOrLoad('templates', async () => {
    const rows = await prisma.workoutPlan.findMany({
      where: { isTemplate: true },
      include: planInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(mapPlan);
  });
}

/** The user's own plans plus any templates, with optional explorer filters. */
export async function listPlans(
  userId: string,
  filters: PlanExplorerQuery,
): Promise<WorkoutPlan[]> {
  if (filters.templatesOnly) {
    return (await loadTemplates())
      .filter((p) => (filters.goal ? p.goal === filters.goal : true))
      .filter((p) => (filters.daysPerWeek ? p.daysPerWeek === filters.daysPerWeek : true));
  }

  const rows = await prisma.workoutPlan.findMany({
    where: {
      OR: [{ ownerId: userId }, { isTemplate: true }],
      ...(filters.goal ? { goal: filters.goal } : {}),
      ...(filters.daysPerWeek ? { daysPerWeek: filters.daysPerWeek } : {}),
    },
    include: planInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(mapPlan);
}

/** A plan the user owns or that is a public template. */
export async function getPlan(userId: string, id: string): Promise<WorkoutPlan> {
  const plan = await prisma.workoutPlan.findFirst({
    where: { id, OR: [{ ownerId: userId }, { isTemplate: true }] },
    include: planInclude,
  });
  if (!plan) throw notFound('Plan not found');
  return mapPlan(plan);
}

export async function createPlan(userId: string, input: UpsertPlanInput): Promise<WorkoutPlan> {
  const plan = await prisma.workoutPlan.create({
    data: {
      ownerId: userId,
      name: input.name,
      description: input.description ?? null,
      goal: input.goal,
      daysPerWeek: input.daysPerWeek,
      // Templates are system-managed (seeded); user input can never set this.
      isTemplate: false,
      days: { create: daysCreate(input) },
    },
    include: planInclude,
  });
  return mapPlan(plan);
}

/**
 * Replace a plan's fields and its entire day/exercise tree. The editor sends the
 * full desired state, so we drop existing days (cascades to plan exercises) and
 * recreate — all inside one transaction.
 */
export async function updatePlan(
  userId: string,
  id: string,
  input: UpsertPlanInput,
): Promise<WorkoutPlan> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.workoutPlan.findFirst({ where: { id, ownerId: userId } });
    if (!existing) throw notFound('Plan not found');

    await tx.planDay.deleteMany({ where: { planId: id } });

    const plan = await tx.workoutPlan.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description ?? null,
        goal: input.goal,
        daysPerWeek: input.daysPerWeek,
        days: { create: daysCreate(input) },
      },
      include: planInclude,
    });
    return mapPlan(plan);
  });
}

/** Copy a plan (own or template) into a new user-owned, non-template plan. */
export async function duplicatePlan(userId: string, id: string): Promise<WorkoutPlan> {
  const source = await prisma.workoutPlan.findFirst({
    where: { id, OR: [{ ownerId: userId }, { isTemplate: true }] },
    include: planInclude,
  });
  if (!source) throw notFound('Plan not found');

  const copy = await prisma.workoutPlan.create({
    data: {
      ownerId: userId,
      // Adopting a template keeps its clean name; copying your own plan marks it.
      name: source.isTemplate ? source.name : `${source.name} (Copy)`,
      description: source.description,
      goal: source.goal,
      daysPerWeek: source.daysPerWeek,
      isTemplate: false,
      days: {
        create: source.days
          .sort((a, b) => a.order - b.order)
          .map((day) => ({
            name: day.name,
            order: day.order,
            exercises: {
              create: day.exercises
                .sort((a, b) => a.order - b.order)
                .map((ex) => ({
                  exerciseId: ex.exerciseId,
                  order: ex.order,
                  targetSets: ex.targetSets,
                  targetReps: ex.targetReps,
                  targetRpe: ex.targetRpe,
                  restSeconds: ex.restSeconds,
                  notes: ex.notes,
                })),
            },
          })),
      },
    },
    include: planInclude,
  });
  return mapPlan(copy);
}

export async function deletePlan(userId: string, id: string): Promise<void> {
  const existing = await prisma.workoutPlan.findFirst({ where: { id, ownerId: userId } });
  if (!existing) throw notFound('Plan not found');
  await prisma.workoutPlan.delete({ where: { id } });
}
