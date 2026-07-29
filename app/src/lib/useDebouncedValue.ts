import { useEffect, useState } from 'react';

/**
 * Trailing-edge debounce for values that drive a query key.
 *
 * Search inputs feed straight into `useQuery`, so without this every keystroke
 * is a new key and therefore a new request — typing "paneer" fired six.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Empty resets immediately: clearing the field should show the full list at
    // once rather than appearing to hang for the delay.
    if (value === ('' as unknown as T)) {
      setDebounced(value);
      return;
    }
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
