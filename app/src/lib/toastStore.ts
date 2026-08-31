import { create } from 'zustand';

export type ToastTone = 'default' | 'success' | 'pr' | 'warning';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastData {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
  duration: number;
}

interface ToastState {
  toast: ToastData | null;
  show: (opts: {
    message: string;
    tone?: ToastTone;
    action?: ToastAction;
    duration?: number;
  }) => void;
  dismiss: () => void;
}

const DEFAULT_DURATION_MS = 3000;
/** A toast with an action (undo) needs enough time to actually be pressed. */
const ACTION_MIN_DURATION_MS = 5000;

let nextId = 1;
// The store owns the dismiss timer so a replacement or manual dismiss can
// always cancel it — a stale timer must never dismiss a newer toast.
let timer: ReturnType<typeof setTimeout> | null = null;

/** One visible toast, latest wins. Render side lives in ui/ToastHost. */
export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: ({ message, tone = 'default', action, duration }) => {
    const base = duration ?? DEFAULT_DURATION_MS;
    const finalDuration = action ? Math.max(base, ACTION_MIN_DURATION_MS) : base;
    if (timer) clearTimeout(timer);
    set({ toast: { id: nextId++, message, tone, action, duration: finalDuration } });
    timer = setTimeout(() => {
      timer = null;
      set({ toast: null });
    }, finalDuration);
  },
  dismiss: () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    set({ toast: null });
  },
}));

/** Imperative API for screens/stores — usable outside React. */
export const toast = {
  show: (opts: Parameters<ToastState['show']>[0]) => useToastStore.getState().show(opts),
  success: (message: string) => useToastStore.getState().show({ message, tone: 'success' }),
  pr: (message: string) => useToastStore.getState().show({ message, tone: 'pr' }),
  undo: (message: string, onUndo: () => void) =>
    useToastStore.getState().show({ message, action: { label: 'Undo', onPress: onUndo } }),
  dismiss: () => useToastStore.getState().dismiss(),
};
