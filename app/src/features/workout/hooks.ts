import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { WorkoutSession } from '@gymcrush/shared';
import { api } from '@/lib/api';

/**
 * Module-level cache of the user's recent sessions. `previousSetsFor` is called
 * synchronously from the active-session store (to ghost "previous" values) and
 * can't await, so `useSessions` keeps this warm.
 */
let sessionsCache: WorkoutSession[] = [];

/**
 * Must be called on sign-out: this cache seeds ghosted "previous" values that
 * get adopted into new sets, so leaving it warm would write one account's
 * history into the next account that signs in on this device.
 */
export function clearSessionsCache() {
  sessionsCache = [];
}

async function fetchSessions(limit = 50): Promise<WorkoutSession[]> {
  const { sessions } = await api<{ sessions: WorkoutSession[] }>(`/api/sessions?limit=${limit}`);
  return sessions;
}

export function useSessions() {
  const query = useQuery({
    queryKey: ['sessions'],
    queryFn: () => fetchSessions(),
  });

  useEffect(() => {
    if (query.data) sessionsCache = query.data;
  }, [query.data]);

  return query;
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: ['sessions', id],
    enabled: !!id,
    queryFn: async (): Promise<WorkoutSession | null> => {
      const { session } = await api<{ session: WorkoutSession }>(`/api/sessions/${id}`);
      return session;
    },
  });
}

export interface ExerciseHistoryPoint {
  sessionId: string;
  date: string;
  bestWeight: number;
  bestReps: number;
  /** Epley estimated 1RM from the best set. */
  e1rm: number;
  totalVolume: number;
}

/** Per-exercise training history (derived from the sessions list), newest first. */
export function useExerciseHistory(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ['exercise-history', exerciseId],
    enabled: !!exerciseId,
    queryFn: async (): Promise<ExerciseHistoryPoint[]> => {
      const sessions = await fetchSessions(100);
      const points: ExerciseHistoryPoint[] = [];
      for (const session of sessions) {
        const logged = session.exercises.filter((e) => e.exerciseId === exerciseId);
        if (logged.length === 0) continue;
        const sets = logged.flatMap((e) => e.sets).filter((s) => s.completed && !s.isWarmup);
        if (sets.length === 0) continue;

        const best = sets.reduce((a, b) => ((b.weight ?? 0) > (a.weight ?? 0) ? b : a));
        const bestWeight = best.weight ?? 0;
        const bestReps = best.reps ?? 0;
        points.push({
          sessionId: session.id,
          date: session.startedAt,
          bestWeight,
          bestReps,
          e1rm: Math.round(bestWeight * (1 + bestReps / 30) * 10) / 10,
          totalVolume: sets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0),
        });
      }
      return points.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });
}

/** Epley estimated 1RM — the app's single definition of "best" for a set. */
export function e1rmOf(weight: number | null, reps: number | null): number {
  return Math.round((weight ?? 0) * (1 + (reps ?? 0) / 30) * 10) / 10;
}

/**
 * Best e1RM ever recorded for an exercise, or null if it has never been trained.
 * Reads the module cache synchronously (same constraint as `previousSetsFor`) so
 * the active-session store can detect a PR the moment a set is completed.
 */
export function bestE1rmFor(exerciseId: string): number | null {
  let best: number | null = null;
  for (const session of sessionsCache) {
    for (const logged of session.exercises) {
      if (logged.exerciseId !== exerciseId) continue;
      for (const s of logged.sets) {
        if (!s.completed || s.isWarmup) continue;
        const e1rm = e1rmOf(s.weight, s.reps);
        if (best === null || e1rm > best) best = e1rm;
      }
    }
  }
  return best;
}

/**
 * Most recent completed working sets for an exercise (for ghost "previous"
 * values). Reads the module cache synchronously — kept warm by `useSessions`.
 */
export function previousSetsFor(
  exerciseId: string,
): { weight: number | null; reps: number | null }[] {
  const sorted = [...sessionsCache].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
  for (const session of sorted) {
    const logged = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (logged) {
      const working = logged.sets.filter((s) => !s.isWarmup);
      if (working.length > 0) return working.map((s) => ({ weight: s.weight, reps: s.reps }));
    }
  }
  return [];
}
