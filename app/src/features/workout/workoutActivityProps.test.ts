import { describe, expect, it } from 'vitest';
import { buildWorkoutActivityProps } from './workoutActivityProps';

const names: Record<string, string> = {
  bench: 'Bench Press',
  row: 'Barbell Row',
};

const resolve = (id: string) => names[id] ?? 'Exercise';

describe('buildWorkoutActivityProps', () => {
  it('counts completed sets and focuses the first incomplete exercise', () => {
    const props = buildWorkoutActivityProps(
      {
        name: 'Push Day',
        startedAt: 1_700_000_000_000,
        exercises: [
          {
            exerciseId: 'bench',
            sets: [
              { setNumber: 1, weight: 100, reps: 8, completed: true },
              { setNumber: 2, weight: null, reps: null, completed: false },
              { setNumber: 3, weight: null, reps: null, completed: false },
            ],
          },
          {
            exerciseId: 'row',
            sets: [
              { setNumber: 1, weight: null, reps: null, completed: false },
              { setNumber: 2, weight: null, reps: null, completed: false },
            ],
          },
        ],
      },
      null,
      'kg',
      resolve,
    );

    expect(props).toMatchObject({
      workoutName: 'Push Day',
      startedAt: 1_700_000_000_000,
      setsDone: 1,
      setsTotal: 5,
      exercisesDone: 0,
      exercisesTotal: 2,
      sessionProgress: 0.2,
      currentExerciseName: 'Bench Press',
      currentSetNumber: 2,
      currentExerciseSetsDone: 1,
      currentExerciseSetsTotal: 3,
      exerciseProgress: 1 / 3,
      lastSetLabel: null,
      restStartedAt: null,
      restEndsAt: null,
    });
  });

  it('derives rest interval and last-set label while resting', () => {
    const now = Date.now();
    const props = buildWorkoutActivityProps(
      {
        name: 'Legs',
        startedAt: now,
        exercises: [
          {
            exerciseId: 'bench',
            sets: [
              { setNumber: 1, weight: 100, reps: 8, completed: true },
              { setNumber: 2, weight: null, reps: null, completed: false },
            ],
          },
        ],
      },
      { endsAt: now + 60_000, durationSec: 120 },
      'kg',
      resolve,
    );

    expect(props.restStartedAt).toBe(now + 60_000 - 120_000);
    expect(props.restEndsAt).toBe(now + 60_000);
    expect(props.lastSetLabel).toBe('100 kg × 8 · Set 1');
    expect(props.currentSetNumber).toBe(2);
  });

  it('formats last-set weight in lb when requested', () => {
    const props = buildWorkoutActivityProps(
      {
        name: 'Legs',
        startedAt: 1,
        exercises: [
          {
            exerciseId: 'bench',
            sets: [
              { setNumber: 1, weight: 100, reps: 5, completed: true },
              { setNumber: 2, weight: null, reps: null, completed: false },
            ],
          },
        ],
      },
      { endsAt: 1000, durationSec: 1 },
      'lb',
      resolve,
    );

    expect(props.lastSetLabel).toBe('220.5 lb × 5 · Set 1');
  });

  it('marks the session complete when every set is done', () => {
    const props = buildWorkoutActivityProps(
      {
        name: 'Done',
        startedAt: 1,
        exercises: [
          {
            exerciseId: 'bench',
            sets: [{ setNumber: 1, weight: 60, reps: 10, completed: true }],
          },
        ],
      },
      null,
      'kg',
      resolve,
    );

    expect(props.currentExerciseName).toBeNull();
    expect(props.currentSetNumber).toBeNull();
    expect(props.sessionProgress).toBe(1);
    expect(props.exerciseProgress).toBe(1);
    expect(props.exercisesDone).toBe(1);
  });
});
