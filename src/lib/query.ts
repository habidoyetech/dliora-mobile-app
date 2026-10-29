import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api';

/**
 * Don't burn retries on answers that won't change: a 401/403/404 or a
 * validation error means the request was wrong, not that the network blinked.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        // Mobile sessions are short and bursty — a minute of freshness avoids
        // refetching the same list every time a screen regains focus.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
      },
      mutations: { retry: false },
    },
  });
}
