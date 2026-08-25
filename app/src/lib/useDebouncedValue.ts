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
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  // Empty resets immediately: clearing the field should show the full list at
  // once rather than appearing to hang for the delay. Derived here rather than
  // written back from the effect, which would cost a second render pass.
  return value === ('' as unknown as T) ? value : debounced;
}
