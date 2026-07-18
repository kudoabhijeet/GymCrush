import { create } from 'zustand';
import type { LoggedExercise, WorkoutSession } from '@gymcrush/shared';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { previousSetsFor } from './hooks';

export interface ActiveSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
  /** Ghosted values from the last time this exercise was trained. */
  prev?: { weight: number | null; reps: number | null };
}

export interface ActiveExercise {
  id: string;
  exerciseId: string;
  sets: ActiveSet[];
  targetRestSeconds: number | null;
}

interface ActiveSession {
  name: string;
  planId: string | null;
  planDayId: string | null;
  startedAt: number; // epoch ms
  exercises: ActiveExercise[];
}

interface StartOptions {
  name: string;
  planId?: string;
  planDayId?: string;
  /** Prefill from a plan day: exerciseId + prescribed sets + rest. */
  prescriptions?: { exerciseId: string; targetSets: number; restSeconds: number | null }[];
}

interface ActiveSessionState {
  session: ActiveSession | null;
  /** Rest countdown target (epoch ms) + total, or null when not resting. */
  restTimer: { endsAt: number; durationSec: number } | null;
  saving: boolean;
  start: (opts: StartOptions) => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (activeExerciseId: string) => void;
  addSet: (activeExerciseId: string) => void;
  updateSet: (
    activeExerciseId: string,
    setId: string,
    patch: Partial<Pick<ActiveSet, 'weight' | 'reps' | 'rpe'>>,
  ) => void;
  toggleSetComplete: (activeExerciseId: string, setId: string) => void;
  skipRest: () => void;
  discard: () => void;
  /**
   * Persist the session to the API: start → replay completed sets → finish.
   * Returns the server session id, or null on failure (local state is kept so
   * the user can retry).
   */
  finish: () => Promise<string | null>;
}

/** Local-only ids for the in-progress session (never sent to the server). */
let localSeq = 0;
const localId = (prefix: string) => `${prefix}_${++localSeq}`;

function buildSets(count: number, prev: { weight: number | null; reps: number | null }[]): ActiveSet[] {
  return Array.from({ length: Math.max(count, 1) }, (_, i) => ({
    id: localId('aset'),
    setNumber: i + 1,
    weight: null,
    reps: null,
    rpe: null,
    completed: false,
    prev: prev[i],
  }));
}

export const useActiveSessionStore = create<ActiveSessionState>((set, get) => ({
  session: null,
  restTimer: null,
  saving: false,

  start: ({ name, planId, planDayId, prescriptions }) => {
    const exercises: ActiveExercise[] = (prescriptions ?? []).map((p) => ({
      id: localId('aex'),
      exerciseId: p.exerciseId,
      targetRestSeconds: p.restSeconds,
      sets: buildSets(p.targetSets, previousSetsFor(p.exerciseId)),
    }));
    set({
      session: {
        name,
        planId: planId ?? null,
        planDayId: planDayId ?? null,
        startedAt: Date.now(),
        exercises,
      },
      restTimer: null,
      saving: false,
    });
  },

  addExercise: (exerciseId) => {
    const { session } = get();
    if (!session) return;
    const exercise: ActiveExercise = {
      id: localId('aex'),
      exerciseId,
      targetRestSeconds: 120,
      sets: buildSets(3, previousSetsFor(exerciseId)),
    };
    set({ session: { ...session, exercises: [...session.exercises, exercise] } });
  },

  removeExercise: (activeExerciseId) => {
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        exercises: session.exercises.filter((e) => e.id !== activeExerciseId),
      },
    });
  },

  addSet: (activeExerciseId) => {
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        exercises: session.exercises.map((e) => {
          if (e.id !== activeExerciseId) return e;
          const prevValues = previousSetsFor(e.exerciseId);
          return {
            ...e,
            sets: [
              ...e.sets,
              {
                id: localId('aset'),
                setNumber: e.sets.length + 1,
                weight: null,
                reps: null,
                rpe: null,
                completed: false,
                prev: prevValues[e.sets.length],
              },
            ],
          };
        }),
      },
    });
  },

  updateSet: (activeExerciseId, setId, patch) => {
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        exercises: session.exercises.map((e) =>
          e.id === activeExerciseId
            ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
            : e,
        ),
      },
    });
  },

  toggleSetComplete: (activeExerciseId, setId) => {
    const { session } = get();
    if (!session) return;
    let startRest: number | null = null;

    const exercises = session.exercises.map((e) => {
      if (e.id !== activeExerciseId) return e;
      return {
        ...e,
        sets: e.sets.map((s) => {
          if (s.id !== setId) return s;
          const completed = !s.completed;
          if (completed) startRest = e.targetRestSeconds ?? 120;
          return {
            ...s,
            completed,
            // Completing an empty set adopts the ghosted previous values.
            weight: completed && s.weight == null ? (s.prev?.weight ?? null) : s.weight,
            reps: completed && s.reps == null ? (s.prev?.reps ?? null) : s.reps,
          };
        }),
      };
    });

    set({
      session: { ...session, exercises },
      restTimer: startRest
        ? { endsAt: Date.now() + startRest * 1000, durationSec: startRest }
        : get().restTimer,
    });
  },

  skipRest: () => set({ restTimer: null }),

  discard: () => set({ session: null, restTimer: null, saving: false }),

  finish: async () => {
    const { session, saving } = get();
    if (!session || saving) return null;
    set({ saving: true });

    try {
      // 1. Start the session server-side. Passing planDayId would prefill
      //    exercises server-side, so we start empty and add our own exercises
      //    to keep the local order/content authoritative.
      const { session: started } = await api<{ session: WorkoutSession }>('/api/sessions', {
        method: 'POST',
        body: {
          name: session.name,
          ...(session.planId ? { planId: session.planId } : {}),
        },
      });

      // 2. Recreate each exercise that has at least one completed set, then
      //    replay those sets.
      for (const exercise of session.exercises) {
        const completedSets = exercise.sets.filter((s) => s.completed);
        if (completedSets.length === 0) continue;

        const { loggedExercise } = await api<{ loggedExercise: LoggedExercise }>(
          `/api/sessions/${started.id}/exercises`,
          { method: 'POST', body: { exerciseId: exercise.exerciseId } },
        );

        let setNumber = 1;
        for (const s of completedSets) {
          await api<{ session: WorkoutSession }>('/api/sessions/sets', {
            method: 'POST',
            body: {
              loggedExerciseId: loggedExercise.id,
              setNumber: setNumber++,
              weight: s.weight,
              reps: s.reps,
              rpe: s.rpe,
              completed: true,
            },
          });
        }
      }

      // 3. Finish.
      await api<{ session: WorkoutSession }>(`/api/sessions/${started.id}/finish`, {
        method: 'PATCH',
        body: {},
      });

      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-history'] });
      set({ session: null, restTimer: null, saving: false });
      return started.id;
    } catch {
      // Keep the local session so the user can retry.
      set({ saving: false });
      return null;
    }
  },
}));
