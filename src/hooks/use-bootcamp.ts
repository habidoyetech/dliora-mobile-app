import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { BootcampOverview, Lesson, LessonDetail, LevelDetail, LessonProgressStatus } from '@/types/api';

/** `GET /bootcamp` — the journey overview with every level's progress. */
export function useBootcamp() {
  const request = useApi();

  return useQuery({
    queryKey: ['bootcamp'],
    queryFn: () => request<{ data: BootcampOverview }>('/bootcamp').then((r) => r.data),
  });
}

/** `GET /bootcamp/levels/{level}` — one level with its lessons and assignments. */
export function useLevel(level: string | undefined) {
  const request = useApi();

  return useQuery({
    queryKey: ['bootcamp', 'level', level],
    enabled: !!level,
    queryFn: () => request<{ data: LevelDetail }>(`/bootcamp/levels/${level}`).then((r) => r.data),
  });
}

/** `GET /bootcamp/lessons/{id}` — 403 when the previous lesson isn't done. */
export function useLesson(id: string | number | undefined) {
  const request = useApi();

  return useQuery({
    queryKey: ['lesson', String(id)],
    enabled: id !== undefined,
    queryFn: () => request<{ data: LessonDetail }>(`/bootcamp/lessons/${id}`).then((r) => r.data),
  });
}

/**
 * `PUT /bootcamp/lessons/{id}/progress` — marks the lesson in progress or
 * completed. Completing one awards Diamonds and may unlock the next level, so
 * everything that shows progress is refreshed.
 */
export function useLessonProgress(id: string | number | undefined) {
  const request = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: Extract<LessonProgressStatus, 'in_progress' | 'completed'>) =>
      request<{ data: Lesson }>(`/bootcamp/lessons/${id}/progress`, {
        method: 'PUT',
        body: { status },
      }).then((r) => r.data),
    onSuccess: (lesson) => {
      queryClient.invalidateQueries({ queryKey: ['lesson', String(id)] });
      queryClient.invalidateQueries({ queryKey: ['bootcamp'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      if (lesson.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['rewards'] });
      }
    },
  });
}
