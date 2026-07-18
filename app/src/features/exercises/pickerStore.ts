import { create } from 'zustand';
import type { Exercise } from '@gymcrush/shared';

/**
 * Bridges the exercise-picker modal route back to whichever screen opened it.
 * The opener registers a callback, navigates to /exercise/picker, and the
 * picker resolves it on selection.
 */
interface PickerState {
  onPick: ((exercise: Exercise) => void) | null;
  requestPick: (callback: (exercise: Exercise) => void) => void;
  resolve: (exercise: Exercise) => void;
  clear: () => void;
}

export const useExercisePickerStore = create<PickerState>((set, get) => ({
  onPick: null,
  requestPick: (onPick) => set({ onPick }),
  resolve: (exercise) => {
    get().onPick?.(exercise);
    set({ onPick: null });
  },
  clear: () => set({ onPick: null }),
}));
