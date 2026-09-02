import { beforeEach, describe, expect, it, vi } from 'vitest';

const liveActivity = {
  update: vi.fn(async () => undefined),
  end: vi.fn(async () => undefined),
};

const factory = {
  start: vi.fn(() => liveActivity),
  getInstances: vi.fn(() => [] as typeof liveActivity[]),
};

const baseProps = {
  workoutName: 'Push',
  startedAt: 1_000,
  setsDone: 0,
  setsTotal: 3,
  exercisesDone: 0,
  exercisesTotal: 1,
  sessionProgress: 0,
  currentExerciseName: 'Bench Press',
  currentSetNumber: 1,
  currentExerciseSetsDone: 0,
  currentExerciseSetsTotal: 3,
  exerciseProgress: 0,
  lastSetLabel: null,
  restStartedAt: null,
  restEndsAt: null,
};

async function loadModule(platform: 'ios' | 'android') {
  vi.resetModules();
  vi.doMock('react-native', () => ({
    Platform: { OS: platform, select: (spec: Record<string, unknown>) => spec[platform] ?? spec.default },
  }));
  const m = await import('./liveActivity.js');
  m.__setWorkoutActivityFactoryForTests(platform === 'ios' ? (factory as never) : null);
  return m;
}

beforeEach(() => {
  vi.clearAllMocks();
  factory.getInstances.mockReturnValue([]);
});

describe('liveActivity facade', () => {
  it('startWorkoutActivity is a no-op off iOS', async () => {
    const m = await loadModule('android');
    m.startWorkoutActivity(baseProps);
    expect(factory.start).not.toHaveBeenCalled();
  });

  it('startWorkoutActivity starts with the deep link on iOS', async () => {
    const m = await loadModule('ios');
    const props = {
      ...baseProps,
      setsDone: 1,
      sessionProgress: 1 / 3,
      currentExerciseSetsDone: 1,
      restStartedAt: 1_000,
      restEndsAt: 121_000,
    };
    m.startWorkoutActivity(props);
    expect(factory.start).toHaveBeenCalledWith(props, 'gymcrush://workout/active');
  });

  it('updateWorkoutActivity rebinds to an orphan instance after a process restart', async () => {
    const orphan = {
      update: vi.fn(async () => undefined),
      end: vi.fn(async () => undefined),
    };
    factory.getInstances.mockReturnValue([orphan]);

    const m = await loadModule('ios');
    const props = { ...baseProps, setsDone: 2, sessionProgress: 2 / 3 };
    await m.updateWorkoutActivity(props);

    expect(factory.start).not.toHaveBeenCalled();
    expect(orphan.update).toHaveBeenCalledWith(props);
  });

  it('endWorkoutActivity ends orphan instances when the module lost its handle', async () => {
    const orphan = {
      update: vi.fn(async () => undefined),
      end: vi.fn(async () => undefined),
    };
    factory.getInstances.mockReturnValue([orphan]);

    const m = await loadModule('ios');
    await m.endWorkoutActivity();

    expect(orphan.end).toHaveBeenCalledWith('immediate');
  });

  it('syncWorkoutActivityOnHydrate starts when a session exists but nothing is on screen', async () => {
    const m = await loadModule('ios');
    await m.syncWorkoutActivityOnHydrate(
      {
        name: 'Pull',
        startedAt: 5_000,
        exercises: [
          {
            exerciseId: 'row',
            sets: [{ setNumber: 1, weight: null, reps: null, completed: false }],
          },
        ],
      },
      null,
      'kg',
      () => 'Barbell Row',
    );

    expect(factory.start).toHaveBeenCalledWith(
      {
        workoutName: 'Pull',
        startedAt: 5_000,
        setsDone: 0,
        setsTotal: 1,
        exercisesDone: 0,
        exercisesTotal: 1,
        sessionProgress: 0,
        currentExerciseName: 'Barbell Row',
        currentSetNumber: 1,
        currentExerciseSetsDone: 0,
        currentExerciseSetsTotal: 1,
        exerciseProgress: 0,
        lastSetLabel: null,
        restStartedAt: null,
        restEndsAt: null,
      },
      'gymcrush://workout/active',
    );
  });

  it('syncWorkoutActivityOnHydrate ends when storage is empty', async () => {
    const orphan = {
      update: vi.fn(async () => undefined),
      end: vi.fn(async () => undefined),
    };
    factory.getInstances.mockReturnValue([orphan]);

    const m = await loadModule('ios');
    await m.syncWorkoutActivityOnHydrate(null, null);

    expect(orphan.end).toHaveBeenCalledWith('immediate');
  });
});
