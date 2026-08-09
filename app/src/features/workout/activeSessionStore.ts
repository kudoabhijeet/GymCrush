import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LoggedExercise, WorkoutSession } from '@gymcrush/shared';
import { api } from '@/lib/api';
import { mmkvStorage } from '@/lib/mmkvStorage';
import { queryClient } from '@/lib/queryClient';
import { bestE1rmFor, e1rmOf, previousSetsFor } from './hooks';

export interface ActiveSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
  completed: boolean;
  /** Ghosted values from the last time this exercise was trained. */
  prev?: { weight: number | null; reps: number | null };
}

/** What the plan prescribes for an exercise. `targetReps` is free-form ("8-12", "AMRAP"). */
export interface PlanPrescription {
  targetSets: number;
  targetReps: string;
  targetRpe: number | null;
  restSeconds: number | null;
  notes: string | null;
}

export interface ActiveExercise {
  id: string;
  exerciseId: string;
  sets: ActiveSet[];
  targetRestSeconds: number | null;
  /** Null for freestyle exercises and anything the plan doesn't cover. */
  prescription: PlanPrescription | null;
}

interface ActiveSession {
  name: string;
  planId: string | null;
  planDayId: string | null;
  startedAt: number; // epoch ms
  exercises: ActiveExercise[];
  /** Keyed by exerciseId, so re-adding a plan exercise mid-session restores its targets. */
  planPrescriptions: Record<string, PlanPrescription>;
}

interface StartOptions {
  name: string;
  planId?: string;
  planDayId?: string;
  /** Prefill from a plan day. */
  prescriptions?: ({ exerciseId: string } & PlanPrescription)[];
}

interface ActiveSessionState {
  session: ActiveSession | null;
  /** Rest countdown target (epoch ms) + total, or null when not resting. */
  restTimer: { endsAt: number; durationSec: number } | null;
  saving: boolean;
  /** False until the persisted session has been read back from storage. */
  hydrated: boolean;
  /** Set that just beat its exercise's best e1RM, awaiting its celebration. */
  justPR: { activeExerciseId: string; setId: string; e1rm: number } | null;
  start: (opts: StartOptions) => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (activeExerciseId: string) => void;
  addSet: (activeExerciseId: string) => void;
  removeSet: (activeExerciseId: string, setId: string) => void;
  updateSet: (
    activeExerciseId: string,
    setId: string,
    patch: Partial<Pick<ActiveSet, 'weight' | 'reps' | 'rpe' | 'isWarmup'>>,
  ) => void;
  toggleSetComplete: (activeExerciseId: string, setId: string) => void;
  clearPR: () => void;
  skipRest: () => void;
  discard: () => void;
  /**
   * Persist the session to the API: start → replay completed sets → finish.
   * Returns the server session id, or null on failure (local state is kept so
   * the user can retry).
   */
  finish: () => Promise<string | null>;
}

/**
 * Local-only ids for the in-progress session (never sent to the server).
 * The counter lives in memory, so a rehydrated session must bump it past the
 * ids it already contains or newly added sets would collide with restored ones.
 */
let localSeq = 0;
const localId = (prefix: string) => `${prefix}_${++localSeq}`;

function reseedLocalSeq(session: ActiveSession | null) {
  if (!session) return;
  const ids = session.exercises.flatMap((e) => [e.id, ...e.sets.map((s) => s.id)]);
  const highest = ids.reduce((max, id) => {
    const n = Number(id.split('_')[1]);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  localSeq = Math.max(localSeq, highest);
}

function buildSets(
  count: number,
  prev: { weight: number | null; reps: number | null }[],
): ActiveSet[] {
  return Array.from({ length: Math.max(count, 1) }, (_, i) => ({
    id: localId('aset'),
    setNumber: i + 1,
    weight: null,
    reps: null,
    rpe: null,
    isWarmup: false,
    completed: false,
    prev: prev[i],
  }));
}

export const useActiveSessionStore = create<ActiveSessionState>()(
  persist(
    (set, get) => ({
      session: null,
      restTimer: null,
      saving: false,
      hydrated: false,
      justPR: null,

      start: ({ name, planId, planDayId, prescriptions }) => {
        const planPrescriptions: Record<string, PlanPrescription> = {};
        const exercises: ActiveExercise[] = (prescriptions ?? []).map(({ exerciseId, ...rx }) => {
          planPrescriptions[exerciseId] = rx;
          return {
            id: localId('aex'),
            exerciseId,
            targetRestSeconds: rx.restSeconds,
            prescription: rx,
            sets: buildSets(rx.targetSets, previousSetsFor(exerciseId)),
          };
        });
        set({
          session: {
            name,
            planId: planId ?? null,
            planDayId: planDayId ?? null,
            startedAt: Date.now(),
            exercises,
            planPrescriptions,
          },
          restTimer: null,
          saving: false,
          justPR: null,
        });
      },

      addExercise: (exerciseId) => {
        const { session } = get();
        if (!session) return;
        // Re-adding an exercise the plan covers should restore its prescription
        // rather than silently fall back to the freestyle defaults.
        // A session persisted before this field existed rehydrates without it.
        const rx = session.planPrescriptions?.[exerciseId] ?? null;
        const exercise: ActiveExercise = {
          id: localId('aex'),
          exerciseId,
          targetRestSeconds: rx?.restSeconds ?? 120,
          prescription: rx,
          sets: buildSets(rx?.targetSets ?? 3, previousSetsFor(exerciseId)),
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
                    isWarmup: false,
                    completed: false,
                    prev: prevValues[e.sets.length],
                  },
                ],
              };
            }),
          },
        });
      },

      removeSet: (activeExerciseId, setId) => {
        const { session } = get();
        if (!session) return;
        set({
          session: {
            ...session,
            exercises: session.exercises.map((e) => {
              if (e.id !== activeExerciseId) return e;
              // An exercise with no sets has no way back to a set row, so keep the last one.
              if (e.sets.length <= 1) return e;
              return {
                ...e,
                sets: e.sets
                  .filter((s) => s.id !== setId)
                  .map((s, i) => ({ ...s, setNumber: i + 1 })),
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
        let pr: ActiveSessionState['justPR'] = null;

        const exercises = session.exercises.map((e) => {
          if (e.id !== activeExerciseId) return e;
          return {
            ...e,
            sets: e.sets.map((s) => {
              if (s.id !== setId) return s;
              const completed = !s.completed;
              if (completed) startRest = e.targetRestSeconds ?? 120;
              // Completing an empty set adopts the ghosted previous values.
              const weight = completed && s.weight == null ? (s.prev?.weight ?? null) : s.weight;
              const reps = completed && s.reps == null ? (s.prev?.reps ?? null) : s.reps;

              if (completed && !s.isWarmup) {
                // Beat both the server history and anything already hit in this
                // session, so a descending top set can't re-trigger the moment.
                const historyBest = bestE1rmFor(e.exerciseId);
                const sessionBest = e.sets.reduce<number | null>((max, other) => {
                  if (other.id === setId || !other.completed || other.isWarmup) return max;
                  const value = e1rmOf(other.weight, other.reps);
                  return max === null || value > max ? value : max;
                }, null);
                // No history at all means there's nothing to beat yet — a
                // first-ever set isn't a PR.
                const best =
                  historyBest === null ? null : Math.max(historyBest, sessionBest ?? historyBest);
                const e1rm = e1rmOf(weight, reps);
                if (best !== null && e1rm > best) {
                  pr = { activeExerciseId, setId, e1rm };
                }
              }

              return { ...s, completed, weight, reps };
            }),
          };
        });

        set({
          session: { ...session, exercises },
          restTimer: startRest
            ? { endsAt: Date.now() + startRest * 1000, durationSec: startRest }
            : get().restTimer,
          justPR: pr ?? get().justPR,
        });
      },

      clearPR: () => set({ justPR: null }),

      skipRest: () => set({ restTimer: null }),

      discard: () => set({ session: null, restTimer: null, saving: false, justPR: null }),

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
              startedAt: new Date(session.startedAt).toISOString(),
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
                  isWarmup: s.isWarmup,
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
          // The workout is on the server now, so drop the saved copy before
          // handing off: a kill during the navigation below would otherwise
          // restore it and let the user submit the whole session a second time.
          await useActiveSessionStore.persist.clearStorage();
          // Keep `session` in memory so the discard-effect on the active screen
          // doesn't fire a competing navigation; the caller navigates to the
          // summary and then calls `discard()`.
          set({ restTimer: null, saving: false });
          return started.id;
        } catch {
          // Keep the local session so the user can retry.
          set({ saving: false });
          return null;
        }
      },
    }),
    {
      name: 'gc.active-session',
      storage: createJSONStorage(() => mmkvStorage),
      // Only the session is worth restoring. `saving` rehydrated as true would
      // leave Finish permanently disabled, and a restored `restTimer` holds an
      // absolute `endsAt` that is always long expired by the time we read it.
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        reseedLocalSeq(state?.session ?? null);
        // MMKV is synchronous, so this callback runs inside `create()` — defer
        // the flag until the store binding exists.
        queueMicrotask(() => useActiveSessionStore.setState({ hydrated: true }));
      },
    },
  ),
);
