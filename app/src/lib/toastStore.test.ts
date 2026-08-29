import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast, useToastStore } from './toastStore';

const current = () => useToastStore.getState().toast;

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.getState().dismiss();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a toast and auto-dismisses after the default duration', () => {
    toast.success('Workout saved');
    expect(current()).toMatchObject({ message: 'Workout saved', tone: 'success' });

    vi.advanceTimersByTime(2999);
    expect(current()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(current()).toBeNull();
  });

  it('latest toast wins and restarts the clock', () => {
    toast.show({ message: 'first' });
    vi.advanceTimersByTime(2500);
    toast.show({ message: 'second' });

    // The first toast's timer must not kill the replacement.
    vi.advanceTimersByTime(600);
    expect(current()).toMatchObject({ message: 'second' });

    vi.advanceTimersByTime(2400);
    expect(current()).toBeNull();
  });

  it('gives action toasts at least the action minimum duration', () => {
    toast.undo('Entry removed', () => {});
    vi.advanceTimersByTime(4999);
    expect(current()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(current()).toBeNull();
  });

  it('respects a longer explicit duration on action toasts', () => {
    toast.show({ message: 'slow', action: { label: 'Undo', onPress: () => {} }, duration: 8000 });
    vi.advanceTimersByTime(7999);
    expect(current()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(current()).toBeNull();
  });

  it('manual dismiss clears the pending timer', () => {
    toast.show({ message: 'first' });
    vi.advanceTimersByTime(2900);
    toast.dismiss();
    expect(current()).toBeNull();

    // A toast shown right after must not be swept by the dead timer.
    toast.show({ message: 'second' });
    vi.advanceTimersByTime(200);
    expect(current()).toMatchObject({ message: 'second' });
  });

  it('undo helper wires the action callback', () => {
    const onUndo = vi.fn();
    toast.undo('Exercise removed', onUndo);
    current()?.action?.onPress();
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});
