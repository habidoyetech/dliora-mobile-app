import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import { useSession } from '@/auth/session';
import { uploadToTarget } from '@/lib/uploads';
import type {
  AnswerDraft,
  Assignment,
  AssignmentDetail,
  AssignmentSubmission,
  Paginated,
  UploadTarget,
} from '@/types/api';

export type AssignmentFilter = {
  level?: string;
  status?: 'not_submitted' | 'pending' | 'under_review' | 'changes_required' | 'rejected' | 'approved';
};

/** `GET /assignments` — published assignments in active levels, journey order. */
export function useAssignments(filter: AssignmentFilter = {}) {
  const request = useApi();
  const query = new URLSearchParams({ per_page: '50' });
  if (filter.level) query.set('level', filter.level);
  if (filter.status) query.set('status', filter.status);

  return useQuery({
    queryKey: ['assignments', filter.level ?? null, filter.status ?? null],
    queryFn: () => request<Paginated<Assignment>>(`/assignments?${query.toString()}`),
  });
}

/** `GET /assignments/{id}` — questions (never the correct answers) and the hand-in. */
export function useAssignment(id: string | number | undefined) {
  const request = useApi();

  return useQuery({
    queryKey: ['assignment', String(id)],
    enabled: id !== undefined,
    queryFn: () => request<{ data: AssignmentDetail }>(`/assignments/${id}`).then((r) => r.data),
  });
}

type SubmitResult = {
  data: AssignmentSubmission;
  /** Quiz assignments: whether the pass mark was met. */
  correct?: boolean;
  /** Everything in the level is now handed in and waiting on review. */
  tier_all_submitted?: boolean;
};

/**
 * Hand in an assignment. Files are already in storage by this point (see
 * {@link useAssignmentUpload}), so this is plain JSON — the multipart path the
 * web portal uses isn't needed.
 */
export function useSubmitAssignment(id: string | number | undefined) {
  const request = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (drafts: Record<number, AnswerDraft>) => {
      const answers: Record<string, { text?: string; option_ids?: number[] }> = {};
      const uploaded: Record<string, { path: string; name: string }[]> = {};

      for (const [questionId, draft] of Object.entries(drafts)) {
        const answer: { text?: string; option_ids?: number[] } = {};
        if (draft.text?.trim()) answer.text = draft.text.trim();
        if (draft.option_ids?.length) answer.option_ids = draft.option_ids;
        if (Object.keys(answer).length > 0) answers[questionId] = answer;
        if (draft.uploaded?.length) uploaded[questionId] = draft.uploaded;
      }

      return request<SubmitResult>(`/assignments/${id}/submission`, {
        method: 'POST',
        body: { answers, uploaded },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', String(id)] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['bootcamp'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}

/**
 * Sends one picked file straight to storage, as the web portal does: ask the
 * API where it goes, then upload there. The returned `{path, name}` is what
 * the submission carries.
 */
export function useAssignmentUpload(id: string | number | undefined) {
  const request = useApi();
  const { token } = useSession();

  return useMutation({
    mutationFn: async (file: { uri: string; name: string; size: number; mimeType?: string }) => {
      const target = await request<{ data: UploadTarget }>(`/assignments/${id}/uploads`, {
        method: 'POST',
        body: { filename: file.name, size: file.size },
      }).then((r) => r.data);

      await uploadToTarget(target, file, token);

      return { path: target.path, name: file.name };
    },
  });
}
