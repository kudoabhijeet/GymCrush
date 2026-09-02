import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The store pulls the whole data layer in; everything native or network-bound
// is stubbed so these tests exercise only the rest-timer/session state logic.
vi.mock('@/lib/api', () => ({ api: vi.fn() }));
vi.mock('@/lib/queryClient', () => ({ queryClient: { invalidateQueries: vi.fn() } }));
vi.mock('@/lib/notifications', () => ({
  scheduleRestNotification: vi.fn(),
  cancelRestNotification: vi.fn(),
  scheduleDailyReminder: vi.fn(),
  cancelDailyReminder: vi.fn(),
  hasNotificationPermission: vi.fn(async () => true),
  requestNotificationPermission: vi.fn(async () => true),
}));
vi.mock('@/lib/liveActivity', () => ({
  buildWorkoutActivityProps: vi.fn(() => ({
    workoutName: 'Test',
    startedAt: 0,
    setsDone: 0,
    setsTotal: 0,
    exercisesDone: 0,
    exercisesTotal: 0,
    sessionProgress: 0,
    currentExerciseName: null,
    currentSetNumber: null,
    currentExerciseSetsDone: 0,
    currentExerciseSetsTotal: 0,
    exerciseProgress: 0,
    lastSetLabel: null,
    restStartedAt: null,
    restEndsAt: null,
  })),
  startWorkoutActivity: vi.fn(),
  updateWorkoutActivity: vi.fn(async () => undefined),
  endWorkoutActivity: vi.fn(async () => undefined),
  syncWorkoutActivityOnHydrate: vi.fn(async () => undefined),
}));
vi.mock('./hooks', () => ({
  bestE1rmFor: () => null,
  e1rmOf: (w: number | null, r: number | null) => (w ?? 0) * (1 + (r ?? 0) / 30),
  previousSetsFor: () => [],
}));

import { cancelRestNotification, scheduleRestNotification } from '@/lib/notifications';
import { toast, useToastStore } from '@/lib/toastStore';
import { useNotificationStore } from '@/features/profile/notificationStore';
import { useActiveSessionStore, type ActiveExercise } from './activeSessionStore';

const store = useActiveSessionStore;

/** Start a freestyle session with one exercise and complete its first set. */
function startResting() {
  store.getState().start({ name: 'Test' });
  store.getState().addExercise('ex1');
  const session = store.getState().session!;
  const exercise = session.exercises[0];
  store.getState().toggleSetComplete(exercise.id, exercise.sets[0].id);
  return exercise;
}

describe('activeSessionStore rest timer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 1_000_000 });
    vi.clearAllMocks();
    store.setState({ session: null, restTimer: null, saving: false, justPR: null });
    useNotificationStore.setState({ restTimer: false });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('completing a set starts the freestyle 120s rest', () => {
    startResting();
    expect(store.getState().restTimer).toEqual({
      endsAt: 1_000_000 + 120_000,
      durationSec: 120,
    });
  });

  describe('adjustRest', () => {
    it('is a no-op without a running rest', () => {
      store.getState().adjustRest(15);
      expect(store.getState().restTimer).toBeNull();
    });

    it('+15 extends both the deadline and the total', () => {
      startResting();
      store.getState().adjustRest(15);
      expect(store.getState().restTimer).toEqual({
        endsAt: 1_000_000 + 135_000,
        durationSec: 135,
      });
    });

    it('shrinking keeps the total at least the remaining time', () => {
      startResting();
      store.getState().adjustRest(-115);
      // 5s remain; total clamps to 5 so progress stays ≤ 1.
      expect(store.getState().restTimer).toEqual({
        endsAt: 1_000_000 + 5_000,
        durationSec: 5,
      });
    });

    it('adjusting to zero or below behaves like Skip: timer cleared, alert cancelled', () => {
      startResting();
      store.getState().adjustRest(-120);
      expect(store.getState().restTimer).toBeNull();
      expect(cancelRestNotification).toHaveBeenCalled();
      expect(scheduleRestNotification).not.toHaveBeenCalled();
    });

    it('re-arms the background alert with the new remaining time when the pref is on', () => {
      useNotificationStore.setState({ restTimer: true });
      startResting();
      vi.mocked(scheduleRestNotification).mockClear();
      store.getState().adjustRest(15);
      expect(scheduleRestNotification).toHaveBeenCalledWith(135);
    });

    it('does not schedule an alert when the pref is off', () => {
      startResting();
      store.getState().adjustRest(15);
      expect(scheduleRestNotification).not.toHaveBeenCalled();
    });
  });

  describe('restoreExercise', () => {
    it('puts a removed exercise back at its old index', () => {
      store.getState().start({ name: 'Test' });
      store.getState().addExercise('ex1');
      store.getState().addExercise('ex2');
      store.getState().addExercise('ex3');

      const session = store.getState().session!;
      const removed: ActiveExercise = session.exercises[1];
      store.getState().removeExercise(removed.id);
      expect(store.getState().session!.exercises).toHaveLength(2);

      store.getState().restoreExercise(removed, 1);
      const ids = store.getState().session!.exercises.map((e) => e.exerciseId);
      expect(ids).toEqual(['ex1', 'ex2', 'ex3']);
    });

    it('clamps an out-of-range index to the end', () => {
      store.getState().start({ name: 'Test' });
      store.getState().addExercise('ex1');
      const session = store.getState().session!;
      const removed = session.exercises[0];
      store.getState().removeExercise(removed.id);

      store.getState().restoreExercise(removed, 5);
      expect(store.getState().session!.exercises.map((e) => e.exerciseId)).toEqual(['ex1']);
    });
  });

  // A remove-exercise undo toast holds a snapshot of an exercise from *this*
  // session. If it survived the session it would inject that exercise (and its
  // completed sets) into whatever session came next.
  describe('ending a session clears pending undo toasts', () => {
    it('discard() dismisses an outstanding toast', () => {
      startResting();
      toast.undo('Removed Bench Press', () => {});
      expect(useToastStore.getState().toast).not.toBeNull();

      store.getState().discard();
      expect(useToastStore.getState().toast).toBeNull();
    });

    it('finish() dismisses an outstanding toast', async () => {
      startResting();
      toast.undo('Removed Bench Press', () => {});

      // `api` is mocked to return undefined, so the save fails and finish()
      // returns null — the dismissal happens before the round-trip either way.
      await store.getState().finish();
      expect(useToastStore.getState().toast).toBeNull();
    });
  });
});
