import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export type Region = {
  id: number;
  name: string;
  code: string;
  /** Where the applicant finishes up inside TikTok, per region. */
  tiktok_link: string | null;
};

/**
 * Public — the join-agency form needs this before anyone has a token.
 * Regions change rarely, so hold them for the session rather than refetching
 * every time the form opens.
 */
export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => api<{ data: Region[] }>('/regions').then((r) => r.data),
    staleTime: 60 * 60_000,
  });
}
