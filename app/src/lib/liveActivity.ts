import { Platform } from 'react-native';
import type { LiveActivity } from 'expo-widgets';
import {
  buildWorkoutActivityProps,
  type WorkoutActivityProps,
} from '@/features/workout/workoutActivityProps';

export { buildWorkoutActivityProps, type WorkoutActivityProps };

const DEEP_LINK = 'gymcrush://workout/active';

export interface WorkoutActivityFactoryLike {
  start: (props: WorkoutActivityProps, url?: string) => LiveActivity<WorkoutActivityProps>;
  getInstances: () => LiveActivity<WorkoutActivityProps>[];
}

/** Module-level handle; ActivityKit owns the on-screen surface across process restarts. */
let instance: LiveActivity<WorkoutActivityProps> | null = null;
let factory: WorkoutActivityFactoryLike | null = null;

function isSupported() {
  return Platform.OS === 'ios';
}

function getFactory(): WorkoutActivityFactoryLike {
  if (!factory) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('../features/workout/WorkoutLiveActivity').default as WorkoutActivityFactoryLike;
    factory = loaded;
  }
  return factory;
}

/** @internal Vitest hook — avoids mocking the lazy require path. */
export function __setWorkoutActivityFactoryForTests(next: WorkoutActivityFactoryLike | null) {
  factory = next;
  instance = null;
}

function bindInstance(next: LiveActivity<WorkoutActivityProps> | null) {
  instance = next;
}

function existingInstances() {
  return getFactory().getInstances();
}

/** Start a fresh Live Activity for an active workout. Ends any prior instance first. */
export function startWorkoutActivity(props: WorkoutActivityProps): void {
  if (!isSupported()) return;
  void endWorkoutActivity();
  bindInstance(getFactory().start(props, DEEP_LINK));
}

/** Push new props to the running activity, re-binding if the process restarted. */
export async function updateWorkoutActivity(props: WorkoutActivityProps): Promise<void> {
  if (!isSupported()) return;

  if (instance) {
    await instance.update(props);
    return;
  }

  const orphans = existingInstances();
  if (orphans.length > 0) {
    const rebound = orphans[0]!;
    bindInstance(rebound);
    await rebound.update(props);
    return;
  }

  startWorkoutActivity(props);
}

/** Remove the workout Live Activity from the Lock Screen / Dynamic Island. */
export async function endWorkoutActivity(): Promise<void> {
  if (!isSupported()) return;

  if (instance) {
    await instance.end('immediate');
    bindInstance(null);
    return;
  }

  for (const orphan of existingInstances()) {
    await orphan.end('immediate');
  }
}

/**
 * After MMKV rehydration, align the system surface with the restored session.
 * `restTimer` is not persisted, so a cold start always resumes without rest.
 */
export async function syncWorkoutActivityOnHydrate(
  session: Parameters<typeof buildWorkoutActivityProps>[0] | null,
  restTimer: Parameters<typeof buildWorkoutActivityProps>[1],
  weightUnit: 'kg' | 'lb' = 'kg',
  resolveExerciseName: (exerciseId: string) => string = (id) => id,
): Promise<void> {
  if (!isSupported()) return;

  if (!session) {
    await endWorkoutActivity();
    return;
  }

  const props = buildWorkoutActivityProps(session, restTimer, weightUnit, resolveExerciseName);
  const orphans = existingInstances();

  if (orphans.length > 0) {
    const rebound = orphans[0]!;
    bindInstance(rebound);
    await rebound.update(props);
    return;
  }

  startWorkoutActivity(props);
}
