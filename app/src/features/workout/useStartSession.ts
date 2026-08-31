import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import type { WorkoutPlan } from '@gymcrush/shared';
import { haptics } from '@/lib/haptics';
import { useActiveSessionStore } from './activeSessionStore';

type PlanDay = WorkoutPlan['days'][number];

/**
 * The one way a workout starts: builds the prescriptions, seeds the store,
 * fires the start haptic, and lands on the logger. Replaces the copy-pasted
 * start blocks on Home, Log, and the plan detail screen.
 */
export function useStartSession() {
  const router = useRouter();
  const start = useActiveSessionStore((s) => s.start);

  const startPlanDay = useCallback(
    (plan: WorkoutPlan, day: PlanDay) => {
      haptics.tap();
      start({
        name: day.name,
        planId: plan.id,
        planDayId: day.id,
        prescriptions: day.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          targetRpe: e.targetRpe,
          restSeconds: e.restSeconds,
          notes: e.notes,
        })),
      });
      router.push('/workout/active');
    },
    [router, start],
  );

  const startFreestyle = useCallback(
    (name = 'Freestyle workout') => {
      haptics.tap();
      start({ name });
      router.push('/workout/active');
    },
    [router, start],
  );

  return { startPlanDay, startFreestyle };
}
