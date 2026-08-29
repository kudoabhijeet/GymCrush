import { useEffect, useState } from 'react';
import { msUntilNextLocalMidnight, startOfLocalDay } from './format';

/**
 * Epoch ms at local midnight for "today", kept current across midnight even when
 * the screen has no other reason to re-render.
 */
export function useCalendarDay(): number {
  const [today, setToday] = useState(() => startOfLocalDay());

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        setToday(startOfLocalDay());
        schedule();
      }, msUntilNextLocalMidnight());
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  return today;
}
