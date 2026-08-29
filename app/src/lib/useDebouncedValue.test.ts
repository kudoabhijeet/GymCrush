// @vitest-environment jsdom
import { createElement, useState, act, type Dispatch, type SetStateAction } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * Tiny renderHook stand-in. The app's vitest config is node-only and
 * deliberately skips the jest-expo component stack; this file opts into jsdom
 * just to drive the debounce hook through real React state + effects.
 */

interface Harness {
  result: { current: string };
  setValue: (next: string) => void;
  unmount: () => void;
}

function renderDebounced(initial: string, delayMs: number): Harness {
  const result = { current: initial };
  let setValue: Dispatch<SetStateAction<string>> = () => {
    throw new Error('setValue called before mount');
  };

  function Probe() {
    const [value, set] = useState(initial);
    setValue = set;
    result.current = useDebouncedValue(value, delayMs);
    return null;
  }

  const el = document.createElement('div');
  document.body.appendChild(el);
  let root: Root;
  act(() => {
    root = createRoot(el);
    root.render(createElement(Probe));
  });

  return {
    result,
    setValue: (next) => {
      act(() => {
        setValue(next);
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      el.remove();
    },
  };
}

let harness: Harness | undefined;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  harness?.unmount();
  harness = undefined;
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('trails non-empty updates until the delay elapses', () => {
    harness = renderDebounced('', 300);
    harness.setValue('p');
    expect(harness.result.current).toBe('');
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(harness.result.current).toBe('');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(harness.result.current).toBe('p');
  });

  it('returns empty immediately when the field is cleared', () => {
    harness = renderDebounced('', 300);
    harness.setValue('paneer');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(harness.result.current).toBe('paneer');

    harness.setValue('');
    expect(harness.result.current).toBe('');
  });

  it('does not revive the previous query if typing resumes within the delay', () => {
    harness = renderDebounced('', 300);
    harness.setValue('paneer');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(harness.result.current).toBe('paneer');

    // Clear, then type a new letter before the debounce window would have
    // fired. The query key must stay empty (full list) rather than jumping
    // back to "paneer" — that's the derived-return bug.
    harness.setValue('');
    expect(harness.result.current).toBe('');

    harness.setValue('c');
    expect(harness.result.current).toBe('');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(harness.result.current).toBe('c');
  });
});
