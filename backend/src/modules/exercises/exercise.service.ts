import type { CreateExerciseInput, Exercise, MuscleGroup } from '@gymcrush/shared';
import { prisma } from '../../db/prisma.js';
import { TtlCache } from '../../lib/cache.js';
import { forbidden, notFound } from '../../lib/errors.js';
import { mapExercise } from '../../lib/mappers.js';

interface ListParams {
  search?: string;
  muscleGroup?: MuscleGroup;
}

/**
 * The seeded catalog (~100 rows) is identical for every user and only changes on
 * a re-seed, so it's held in memory and filtered in JS. A user's own custom
 * exercises are cached per user and evicted on write, which keeps creates and
 * deletes immediately visible.
 *
 * Net effect: the common "open the exercise picker" path does no DB work at all
 * once warm, instead of a query per user per app launch.
 */
const CATALOG_TTL_MS = 10 * 60_000;
const globalCatalog = new TtlCache<Exercise[]>(CATALOG_TTL_MS, 1);
const customByUser = new TtlCache<Exercise[]>(CATALOG_TTL_MS, 2000);

function loadGlobalCatalog(): Promise<Exercise[]> {
  return globalCatalog.getOrLoad('global', async () => {
    const rows = await prisma.exercise.findMany({ where: { ownerId: null } });
    return rows.map(mapExercise);
  });
}

function loadCustom(userId: string): Promise<Exercise[]> {
  return customByUser.getOrLoad(userId, async () => {
    const rows = await prisma.exercise.findMany({ where: { ownerId: userId } });
    return rows.map(mapExercise);
  });
}

/** Mirrors the previous SQL: case-insensitive `contains` + exact muscle group. */
function applyFilters(list: Exercise[], { search, muscleGroup }: ListParams): Exercise[] {
  const needle = search?.trim().toLowerCase();
  return list
    .filter((e) => (muscleGroup ? e.muscleGroup === muscleGroup : true))
    .filter((e) => (needle ? e.name.toLowerCase().includes(needle) : true))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Global catalog exercises plus the user's own custom ones. */
export async function listExercises(userId: string, params: ListParams): Promise<Exercise[]> {
  const [global, custom] = await Promise.all([loadGlobalCatalog(), loadCustom(userId)]);
  return applyFilters([...global, ...custom], params);
}

export async function createExercise(
  userId: string,
  input: CreateExerciseInput,
): Promise<Exercise> {
  const row = await prisma.exercise.create({
    data: { ...input, ownerId: userId },
  });
  customByUser.delete(userId);
  return mapExercise(row);
}

export async function deleteExercise(userId: string, id: string): Promise<void> {
  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing) throw notFound('Exercise not found');
  if (existing.ownerId === null) throw forbidden('Cannot delete a catalog exercise');
  if (existing.ownerId !== userId) throw forbidden('Not your exercise');
  await prisma.exercise.delete({ where: { id } });
  customByUser.delete(userId);
}
