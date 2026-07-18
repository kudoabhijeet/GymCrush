import type { CreateExerciseInput, Exercise, MuscleGroup } from '@gymcrush/shared';
import { prisma } from '../../db/prisma.js';
import { forbidden, notFound } from '../../lib/errors.js';
import { mapExercise } from '../../lib/mappers.js';

interface ListParams {
  search?: string;
  muscleGroup?: MuscleGroup;
}

/** Global catalog exercises plus the user's own custom ones. */
export async function listExercises(
  userId: string,
  { search, muscleGroup }: ListParams,
): Promise<Exercise[]> {
  const rows = await prisma.exercise.findMany({
    where: {
      OR: [{ ownerId: null }, { ownerId: userId }],
      ...(muscleGroup ? { muscleGroup } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { name: 'asc' },
  });
  return rows.map(mapExercise);
}

export async function createExercise(
  userId: string,
  input: CreateExerciseInput,
): Promise<Exercise> {
  const row = await prisma.exercise.create({
    data: { ...input, ownerId: userId },
  });
  return mapExercise(row);
}

export async function deleteExercise(userId: string, id: string): Promise<void> {
  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing) throw notFound('Exercise not found');
  if (existing.ownerId === null) throw forbidden('Cannot delete a catalog exercise');
  if (existing.ownerId !== userId) throw forbidden('Not your exercise');
  await prisma.exercise.delete({ where: { id } });
}
