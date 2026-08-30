import type {
  CommitSessionInput,
  LoggedExercise,
  LoggedSet,
  LogSetInput,
  StartSessionInput,
  UpdateSetInput,
  WorkoutSession,
} from '@gymcrush/shared';
import { prisma } from '../../db/prisma.js';
import { badRequest, notFound } from '../../lib/errors.js';
import { mapSession } from '../../lib/mappers.js';

const sessionInclude = { exercises: { include: { sets: true } } } as const;

/**
 * Start a session. When a `planDayId` is given, prefill logged exercises from
 * that plan day's prescriptions (sets are logged later via `logSet`).
 */
export async function startSession(
  userId: string,
  input: StartSessionInput,
): Promise<WorkoutSession> {
  let exerciseCreate: { exerciseId: string; order: number }[] = [];

  if (input.planDayId) {
    const day = await prisma.planDay.findUnique({
      where: { id: input.planDayId },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });
    if (!day) throw notFound('Plan day not found');
    exerciseCreate = day.exercises.map((ex, i) => ({ exerciseId: ex.exerciseId, order: i }));
  }

  const session = await prisma.workoutSession.create({
    data: {
      ownerId: userId,
      name: input.name,
      planId: input.planId ?? null,
      planDayId: input.planDayId ?? null,
      ...(input.startedAt ? { startedAt: new Date(input.startedAt) } : {}),
      exercises: exerciseCreate.length ? { create: exerciseCreate } : undefined,
    },
    include: sessionInclude,
  });
  return mapSession(session);
}

/**
 * Persist a finished workout in one transaction: session + exercises + sets.
 * Carries `planDayId` without triggering the startSession prefill path.
 */
export async function commitSession(
  userId: string,
  input: CommitSessionInput,
): Promise<WorkoutSession> {
  const exerciseIds = [...new Set(input.exercises.map((e) => e.exerciseId))];
  const allowed = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds }, OR: [{ ownerId: null }, { ownerId: userId }] },
    select: { id: true },
  });
  if (allowed.length !== exerciseIds.length) throw notFound('Exercise not found');

  let planId: string | null = input.planId ?? null;
  let planDayId: string | null = input.planDayId ?? null;
  if (planDayId) {
    const day = await prisma.planDay.findFirst({
      where: {
        id: planDayId,
        plan: { OR: [{ ownerId: userId }, { isTemplate: true }] },
      },
      select: { id: true, planId: true },
    });
    if (!day) throw notFound('Plan day not found');
    planDayId = day.id;
    planId = day.planId;
  } else if (planId) {
    const plan = await prisma.workoutPlan.findFirst({
      where: { id: planId, OR: [{ ownerId: userId }, { isTemplate: true }] },
      select: { id: true },
    });
    if (!plan) throw notFound('Plan not found');
  }

  const session = await prisma.workoutSession.create({
    data: {
      ownerId: userId,
      name: input.name,
      planId,
      planDayId,
      startedAt: new Date(input.startedAt),
      finishedAt: new Date(),
      notes: input.notes ?? null,
      exercises: {
        create: input.exercises.map((ex, order) => ({
          exerciseId: ex.exerciseId,
          order,
          sets: {
            create: ex.sets.map((s) => ({
              setNumber: s.setNumber,
              weight: s.weight ?? null,
              reps: s.reps ?? null,
              rpe: s.rpe ?? null,
              isWarmup: s.isWarmup,
              completed: true,
            })),
          },
        })),
      },
    },
    include: sessionInclude,
  });
  return mapSession(session);
}

interface ListParams {
  limit: number;
}

/** The user's sessions, most recent first. */
export async function listSessions(
  userId: string,
  { limit }: ListParams,
): Promise<WorkoutSession[]> {
  const sessions = await prisma.workoutSession.findMany({
    where: { ownerId: userId },
    include: sessionInclude,
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
  return sessions.map(mapSession);
}

export async function getSession(userId: string, id: string): Promise<WorkoutSession> {
  const session = await prisma.workoutSession.findFirst({
    where: { id, ownerId: userId },
    include: sessionInclude,
  });
  if (!session) throw notFound('Session not found');
  return mapSession(session);
}

/** Append an exercise to an in-progress session. */
export async function addExercise(
  userId: string,
  sessionId: string,
  exerciseId: string,
): Promise<LoggedExercise> {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, ownerId: userId },
  });
  if (!session) throw notFound('Session not found');

  const order = await prisma.loggedExercise.count({ where: { sessionId } });
  const logged = await prisma.loggedExercise.create({
    data: { sessionId, exerciseId, order },
    include: { sets: true },
  });
  return {
    id: logged.id,
    exerciseId: logged.exerciseId,
    order: logged.order,
    sets: [],
  };
}

/**
 * Create or update a set by (loggedExercise, setNumber). Verifies the logged
 * exercise belongs to a session owned by the caller.
 */
export async function logSet(userId: string, input: LogSetInput): Promise<WorkoutSession> {
  const logged = await prisma.loggedExercise.findUnique({
    where: { id: input.loggedExerciseId },
    include: { session: true },
  });
  if (!logged || logged.session.ownerId !== userId) throw notFound('Logged exercise not found');
  if (logged.session.finishedAt) throw badRequest('Session already finished');

  const existing = await prisma.loggedSet.findFirst({
    where: { loggedExerciseId: input.loggedExerciseId, setNumber: input.setNumber },
  });

  const data = {
    weight: input.weight ?? null,
    reps: input.reps ?? null,
    rpe: input.rpe ?? null,
    isWarmup: input.isWarmup,
    completed: input.completed,
  };

  if (existing) {
    await prisma.loggedSet.update({ where: { id: existing.id }, data });
  } else {
    await prisma.loggedSet.create({
      data: { loggedExerciseId: input.loggedExerciseId, setNumber: input.setNumber, ...data },
    });
  }

  return getSession(userId, logged.sessionId);
}

/**
 * Correct weight/reps/RPE on an existing set — including finished sessions.
 * Returns the set only so clients can patch cache without re-downloading trees.
 */
export async function updateSet(
  userId: string,
  setId: string,
  input: UpdateSetInput,
): Promise<LoggedSet> {
  const existing = await prisma.loggedSet.findUnique({
    where: { id: setId },
    include: { loggedExercise: { include: { session: true } } },
  });
  if (!existing || existing.loggedExercise.session.ownerId !== userId) {
    throw notFound('Set not found');
  }

  const updated = await prisma.loggedSet.update({
    where: { id: setId },
    data: {
      ...(input.weight !== undefined ? { weight: input.weight } : {}),
      ...(input.reps !== undefined ? { reps: input.reps } : {}),
      ...(input.rpe !== undefined ? { rpe: input.rpe } : {}),
    },
  });

  return {
    id: updated.id,
    setNumber: updated.setNumber,
    weight: updated.weight,
    reps: updated.reps,
    rpe: updated.rpe,
    isWarmup: updated.isWarmup,
    completed: updated.completed,
  };
}

/** Mark a session finished (sets finishedAt, optional notes). */
export async function finishSession(
  userId: string,
  id: string,
  notes?: string,
): Promise<WorkoutSession> {
  const session = await prisma.workoutSession.findFirst({ where: { id, ownerId: userId } });
  if (!session) throw notFound('Session not found');

  const updated = await prisma.workoutSession.update({
    where: { id },
    data: { finishedAt: new Date(), notes: notes ?? session.notes },
    include: sessionInclude,
  });
  return mapSession(updated);
}

export async function deleteSession(userId: string, id: string): Promise<void> {
  const session = await prisma.workoutSession.findFirst({ where: { id, ownerId: userId } });
  if (!session) throw notFound('Session not found');
  await prisma.workoutSession.delete({ where: { id } });
}
