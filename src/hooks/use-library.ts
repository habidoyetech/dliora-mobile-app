import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type {
  LibraryCategories,
  LibraryResource,
  LibraryResourceDetail,
  Paginated,
  ResourceType,
} from '@/types/api';

export type LibraryFilter = {
  q?: string;
  category?: number | null;
  type?: ResourceType | null;
  sort?: 'newest' | 'popular';
};

/** `GET /training/library` — published resources for creators. */
export function useLibrary(filter: LibraryFilter = {}) {
  const request = useApi();

  const query = new URLSearchParams({ per_page: '30' });
  if (filter.q?.trim()) query.set('q', filter.q.trim());
  if (filter.category) query.set('category', String(filter.category));
  if (filter.type) query.set('type', filter.type);
  if (filter.sort) query.set('sort', filter.sort);

  return useQuery({
    queryKey: ['library', filter.q ?? '', filter.category ?? null, filter.type ?? null, filter.sort ?? 'newest'],
    // Keeps the current list on screen while a new search runs, rather than
    // flashing a spinner on every keystroke.
    placeholderData: keepPreviousData,
    queryFn: () => request<Paginated<LibraryResource>>(`/training/library?${query.toString()}`),
  });
}

/** The Trending hero — the most-viewed video of the last 30 days. */
export function useTrending() {
  const request = useApi();

  return useQuery({
    queryKey: ['library', 'trending'],
    queryFn: () =>
      request<{ data: LibraryResource | null }>('/training/library/trending').then((r) => r.data),
  });
}

export function useLibraryCategories() {
  const request = useApi();

  return useQuery({
    queryKey: ['library', 'categories'],
    staleTime: 10 * 60 * 1000,
    queryFn: () => request<{ data: LibraryCategories }>('/training/library/categories').then((r) => r.data),
  });
}

/** The resource page. Opening it counts as a view on the server. */
export function useLibraryResource(id: string | number | undefined) {
  const request = useApi();

  return useQuery({
    queryKey: ['library', 'resource', String(id)],
    enabled: id !== undefined,
    queryFn: () =>
      request<{ data: LibraryResourceDetail }>(`/training/library/${id}`).then((r) => r.data),
  });
}

/**
 * `PUT /training/library/{id}/progress` — how far through a video they are.
 * Called every few percent rather than on every frame.
 */
export function useLibraryProgress(id: string | number | undefined) {
  const request = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (percent: number) =>
      request<{ data: { percent: number; completed: boolean } }>(`/training/library/${id}/progress`, {
        method: 'PUT',
        body: { percent },
      }).then((r) => r.data),
    onSuccess: (progress) => {
      if (progress.completed) queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

/** Marks a "<Level> Unlocked!" celebration as shown, so it only appears once. */
export function useCelebrationSeen() {
  const request = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: number) =>
      request<{ message: string }>(`/bootcamp/celebrations/${trackId}/seen`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bootcamp'] }),
  });
}
