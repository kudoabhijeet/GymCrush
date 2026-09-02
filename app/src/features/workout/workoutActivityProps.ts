import { formatWeight, weightUnitLabel } from '@/lib/format';

/** Props serialized to the WorkoutActivity Live Activity layout. */
export type WorkoutActivityProps = {
  workoutName: string;
  startedAt: number;
  setsDone: number;
  setsTotal: number;
  exercisesDone: number;
  exercisesTotal: number;
  sessionProgress: number;
  currentExerciseName: string | null;
  currentSetNumber: number | null;
  currentExerciseSetsDone: number;
  currentExerciseSetsTotal: number;
  exerciseProgress: number;
  lastSetLabel: string | null;
  /** Epoch ms; both null when not resting. */
  restStartedAt: number | null;
  restEndsAt: number | null;
};

type SetSlice = {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
};

type ExerciseSlice = {
  exerciseId: string;
  sets: SetSlice[];
};

export type SessionSlice = {
  name: string;
  startedAt: number;
  exercises: ExerciseSlice[];
};

type RestTimerSlice = { endsAt: number; durationSec: number } | null;

type FocusExercise = {
  exerciseId: string;
  setsDone: number;
  setsTotal: number;
  nextSetNumber: number;
  lastCompleted: SetSlice | null;
};

function focusExercise(exercises: ExerciseSlice[]): FocusExercise | null {
  for (const exercise of exercises) {
    const setsDone = exercise.sets.filter((s) => s.completed).length;
    const setsTotal = exercise.sets.length;
    if (setsDone < setsTotal) {
      const nextSet = exercise.sets.find((s) => !s.completed);
      const lastCompleted =
        exercise.sets
          .filter((s) => s.completed)
          .sort((a, b) => b.setNumber - a.setNumber)[0] ?? null;
      return {
        exerciseId: exercise.exerciseId,
        setsDone,
        setsTotal,
        nextSetNumber: nextSet?.setNumber ?? setsDone + 1,
        lastCompleted,
      };
    }
  }
  return null;
}

function formatSetLabel(set: SetSlice, weightUnit: 'kg' | 'lb'): string {
  const w = formatWeight(set.weight, weightUnit);
  const unit = weightUnitLabel(weightUnit);
  const reps = set.reps ?? '—';
  return `${w} ${unit} × ${reps} · Set ${set.setNumber}`;
}

function ratio(done: number, total: number): number {
  if (total <= 0) return 0;
  return done / total;
}

export function buildWorkoutActivityProps(
  session: SessionSlice,
  restTimer: RestTimerSlice,
  weightUnit: 'kg' | 'lb' = 'kg',
  resolveExerciseName: (exerciseId: string) => string = (id) => id,
): WorkoutActivityProps {
  let setsDone = 0;
  let setsTotal = 0;
  let exercisesDone = 0;
  const exercisesTotal = session.exercises.length;

  for (const exercise of session.exercises) {
    let exerciseComplete = exercise.sets.length > 0;
    for (const set of exercise.sets) {
      setsTotal += 1;
      if (set.completed) {
        setsDone += 1;
      } else {
        exerciseComplete = false;
      }
    }
    if (exerciseComplete) exercisesDone += 1;
  }

  const focus = focusExercise(session.exercises);
  const resting = restTimer != null;

  const currentExerciseName = focus ? resolveExerciseName(focus.exerciseId) : null;
  const currentSetNumber = focus?.nextSetNumber ?? null;
  const currentExerciseSetsDone = focus?.setsDone ?? (setsTotal > 0 ? setsDone : 0);
  const currentExerciseSetsTotal = focus?.setsTotal ?? 0;
  const exerciseProgress = focus ? ratio(focus.setsDone, focus.setsTotal) : setsTotal > 0 ? 1 : 0;
  const sessionProgress = ratio(setsDone, setsTotal);

  const lastSetLabel =
    resting && focus?.lastCompleted ? formatSetLabel(focus.lastCompleted, weightUnit) : null;

  return {
    workoutName: session.name,
    startedAt: session.startedAt,
    setsDone,
    setsTotal,
    exercisesDone,
    exercisesTotal,
    sessionProgress,
    currentExerciseName,
    currentSetNumber,
    currentExerciseSetsDone,
    currentExerciseSetsTotal,
    exerciseProgress,
    lastSetLabel,
    restStartedAt: restTimer ? restTimer.endsAt - restTimer.durationSec * 1000 : null,
    restEndsAt: restTimer?.endsAt ?? null,
  };
}
