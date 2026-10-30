import { useCallback } from 'react';

import { useSession } from '@/auth/session';
import { api } from '@/lib/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * `api()` with the session's token already attached, so no call site has to
 * remember it. Forgetting the token gives you a confusing 401 rather than a
 * compile error, which is exactly the kind of mistake worth designing out.
 *
 *   const request = useApi();
 *   useQuery({ queryKey: ['campaigns'], queryFn: () => request<Campaign[]>('/campaigns') });
 */
export function useApi() {
  const { token } = useSession();

  return useCallback(
    <T,>(path: string, options: RequestOptions = {}) => api<T>(path, { ...options, token }),
    [token],
  );
}
