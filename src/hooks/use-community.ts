import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type {
  Announcement,
  AppNotification,
  CommunityUpdate,
  DiamondAward,
  Leaderboard,
  Paginated,
} from '@/types/api';

/** `GET /leaderboard` — the creator's region board, or null when there's none. */
export function useLeaderboard() {
  const request = useApi();

  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => request<{ data: Leaderboard | null }>('/leaderboard').then((r) => r.data),
  });
}

/** `GET /rewards` — Bootcamp Diamonds, newest first, with the running total. */
export function useRewards() {
  const request = useApi();

  return useQuery({
    queryKey: ['rewards'],
    queryFn: () =>
      request<Paginated<DiamondAward> & { meta: { total_diamonds: number } }>('/rewards?per_page=50'),
  });
}

/** `GET /community/updates` — approved posts plus the creator's own pending ones. */
export function useUpdates() {
  const request = useApi();

  return useQuery({
    queryKey: ['community-updates'],
    queryFn: () => request<Paginated<CommunityUpdate>>('/community/updates'),
  });
}

/** `POST /community/updates` — posts go to an admin for review before they appear. */
export function usePostUpdate() {
  const request = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      request<{ data: CommunityUpdate; message: string }>('/community/updates', {
        method: 'POST',
        body: { body },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-updates'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

type NotificationsPage = {
  data: AppNotification[];
  meta: { current_page: number; last_page: number; per_page: number; total: number; unread: number };
};

export function useNotifications() {
  const request = useApi();

  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => request<NotificationsPage>('/notifications'),
  });
}

export function useAnnouncements() {
  const request = useApi();

  return useQuery({
    queryKey: ['announcements'],
    queryFn: () => request<Paginated<Announcement> & { meta: { unread: number } }>('/announcements'),
  });
}

/** Marks everything in the tray read, then refreshes the badge on the dashboard. */
export function useMarkNotificationsRead() {
  const request = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => request<{ message: string }>('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useMarkAnnouncementsRead() {
  const request = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => request<{ message: string }>('/announcements/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
