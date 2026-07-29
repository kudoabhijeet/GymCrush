import { QueryClient } from '@tanstack/react-query';

/**
 * Seeded catalog data (exercises, foods, curated templates) only changes on a
 * re-seed, so it's cached far longer than the 30s default that suits mutable
 * user data. Matches the backend's own catalog TTL — see `backend/src/lib/cache.ts`.
 */
export const CATALOG_STALE_MS = 10 * 60_000;
export const TEMPLATE_STALE_MS = 30 * 60_000;
/** Keep catalogs resident so navigating back to a picker is instant. */
export const CATALOG_GC_MS = 30 * 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
