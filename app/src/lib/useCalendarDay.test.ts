// @vitest-environment jsdom
import { createElement, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { msUntilNextLocalMidnight, startOfLocalDay } from './format';
import { useCalendarDay } from './useCalendarDay';

interface Harness {
  result: { current: number };
  unmount: () => void;
}

function renderCalendarDay(): Harness {
  const result = { current: 0 };

  function Probe() {
    result.current = useCalendarDay();
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
  vi.setSystemTime(new Date(2026, 7, 29, 23, 30, 0));
});

afterEach(() => {
  harness?.unmount();
  harness = undefined;
  vi.useRealTimers();
});

describe('startOfLocalDay', () => {
  it('returns local midnight for the given instant', () => {
    const noon = new Date(2026, 7, 29, 12, 34, 56);
    expect(startOfLocalDay(noon)).toBe(new Date(2026, 7, 29, 0, 0, 0, 0).getTime());
  });
});

describe('msUntilNextLocalMidnight', () => {
  it('counts down to the next local midnight', () => {
    const now = new Date(2026, 7, 29, 23, 30, 0).getTime();
    expect(msUntilNextLocalMidnight(now)).toBe(30 * 60 * 1000);
  });
});

describe('useCalendarDay', () => {
  it('starts at today’s local midnight', () => {
    harness = renderCalendarDay();
    expect(harness.result.current).toBe(startOfLocalDay());
  });

  it('rolls forward at local midnight without user interaction', () => {
    harness = renderCalendarDay();
    const before = harness.result.current;

    act(() => {
      vi.advanceTimersByTime(msUntilNextLocalMidnight());
    });

    expect(harness.result.current).toBe(before + 86_400_000);
  });
});
