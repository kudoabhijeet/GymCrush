import { useEffect, useState } from 'react';

function isEmptyQuery<T>(value: T): boolean {
  return value === ('' as unknown as T);
}

/**
 * Trailing-edge debounce for values that drive a query key.
 *
 * Search inputs feed straight into `useQuery`, so without this every keystroke
 * is a new key and therefore a new request — typing "paneer" fired six.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  // Empty resets immediately: clearing the field should show the full list at
  // once rather than appearing to hang for the delay. Written into `debounced`
  // during render (same pattern as the weight field) so a keystroke that
  // follows within `delayMs` doesn't fall through to the previous query.
  // Derived-only would skip this write and food/exercise search would keep
  // showing the old hits.
  if (isEmptyQuery(value) && debounced !== value) {
    setDebounced(value);
  }

  useEffect(() => {
    if (isEmptyQuery(value)) return;
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return isEmptyQuery(value) ? value : debounced;
}
