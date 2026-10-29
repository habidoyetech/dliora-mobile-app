import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession, type User } from '@/auth/session';
import { useApi } from '@/hooks/use-api';
import { API_URL } from '@/lib/config';

export type ProfileUpdate = {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string | null;
  tiktok_username?: string;
  region?: string | null;
  niche?: string | null;
};

/** `GET /settings/profile` — the signed-in person's own account. */
export function useProfile() {
  const request = useApi();
  const { user } = useSession();

  return useQuery({
    queryKey: ['profile'],
    // The cached session profile renders instantly while this refreshes.
    initialData: user ? ({ ...user } as User) : undefined,
    queryFn: () => request<{ data: User }>('/settings/profile').then((r) => r.data),
  });
}

/** The niche list behind the profile picker. */
export function useProfileOptions() {
  const request = useApi();

  return useQuery({
    queryKey: ['profile', 'options'],
    staleTime: 60 * 60 * 1000,
    queryFn: () =>
      request<{ data: { niches: { value: string; label: string }[] } }>('/settings/options').then(
        (r) => r.data,
      ),
  });
}

/**
 * `PATCH /settings/profile`. Changing the TikTok username changes what they
 * sign in with, so the held session profile is replaced on success.
 */
export function useUpdateProfile() {
  const request = useApi();
  const queryClient = useQueryClient();
  const { refreshUser } = useSession();

  return useMutation({
    mutationFn: (update: ProfileUpdate) =>
      request<{ data: User }>('/settings/profile', { method: 'PATCH', body: update }).then((r) => r.data),
    onSuccess: async (profile) => {
      await refreshUser(profile);
      queryClient.setQueryData(['profile'], profile);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * `POST /settings/profile/avatar` — multipart, so it goes through `fetch`
 * directly rather than the JSON wrapper.
 */
export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const { token, refreshUser } = useSession();

  return useMutation({
    mutationFn: async (file: { uri: string; name: string; mimeType?: string }) => {
      const form = new FormData();
      form.append('avatar', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

      const response = await fetch(`${API_URL}/settings/profile/avatar`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      const payload = (await response.json().catch(() => null)) as { data?: User; message?: string } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message ?? 'That picture couldn’t be saved.');
      }
      return payload.data;
    },
    onSuccess: async (profile) => {
      await refreshUser(profile);
      queryClient.setQueryData(['profile'], profile);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
