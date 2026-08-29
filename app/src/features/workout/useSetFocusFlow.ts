import { useCallback, useMemo, useRef } from 'react';
import { Keyboard, type TextInput } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useActiveSessionStore } from './activeSessionStore';

/** Shared by both weight and reps inputs — numeric keypads have no Return key. */
export const SET_ROW_ACCESSORY_ID = 'set-row-accessory';

/**
 * The one path that completes a set: Check tap, reps-submit, and the
 * above-keyboard "Next" all funnel through this so haptics + PR detection
 * (inside the store) stay identical everywhere.
 */
export function fireSetComplete(exerciseId: string, setId: string, wasCompleted: boolean) {
  if (!wasCompleted) haptics.setComplete();
  useActiveSessionStore.getState().toggleSetComplete(exerciseId, setId);
}

export type SetFocusFlow = ReturnType<typeof useSetFocusFlow>;

/**
 * Keyboard flow for the logger: a flat weight/reps ref registry so focus can
 * jump across exercise-card boundaries (weight -> reps -> next set's weight).
 *
 * Everything returned is referentially stable — handlers read the session via
 * `getState()` at call time instead of closing over it — so memoized set rows
 * never re-render because of a new callback identity.
 */
export function useSetFocusFlow() {
  const weightRefs = useRef<Record<string, TextInput | null>>({});
  const repsRefs = useRef<Record<string, TextInput | null>>({});
  // Plain ref, not state: the accessory bar reads this on tap, and turning it
  // into state would re-render the whole screen on every field focus.
  const activeFieldRef = useRef<{ setId: string; field: 'weight' | 'reps' } | null>(null);

  const registerWeightRef = useCallback((setId: string, el: TextInput | null) => {
    weightRefs.current[setId] = el;
  }, []);
  const registerRepsRef = useCallback((setId: string, el: TextInput | null) => {
    repsRefs.current[setId] = el;
  }, []);
  const onFieldFocus = useCallback((setId: string, field: 'weight' | 'reps') => {
    activeFieldRef.current = { setId, field };
  }, []);
  const focusReps = useCallback((setId: string) => {
    repsRefs.current[setId]?.focus();
  }, []);

  const focusAfter = useCallback((setId: string) => {
    const session = useActiveSessionStore.getState().session;
    const flatSetIds = session ? session.exercises.flatMap((e) => e.sets.map((s) => s.id)) : [];
    const idx = flatSetIds.indexOf(setId);
    const nextId = idx >= 0 ? flatSetIds[idx + 1] : undefined;
    const nextInput = nextId ? weightRefs.current[nextId] : null;
    if (nextInput) nextInput.focus();
    else Keyboard.dismiss();
  }, []);

  /** The above-keyboard "Next": weight -> reps, reps -> complete + next set. */
  const advance = useCallback(() => {
    const active = activeFieldRef.current;
    if (!active) return;
    if (active.field === 'weight') {
      focusReps(active.setId);
      return;
    }
    const session = useActiveSessionStore.getState().session;
    const found = session?.exercises
      .flatMap((e) => e.sets.map((s) => ({ exerciseId: e.id, set: s })))
      .find((x) => x.set.id === active.setId);
    if (found && !found.set.completed) {
      fireSetComplete(found.exerciseId, found.set.id, found.set.completed);
    }
    focusAfter(active.setId);
  }, [focusAfter, focusReps]);

  return useMemo(
    () => ({ registerWeightRef, registerRepsRef, onFieldFocus, focusReps, focusAfter, advance }),
    [registerWeightRef, registerRepsRef, onFieldFocus, focusReps, focusAfter, advance],
  );
}
