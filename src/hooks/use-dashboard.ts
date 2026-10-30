import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type {
  Announcement,
  CommunityUpdate,
  LevelSlug,
  Lesson,
  Restriction,
  TrackSummary,
} from '@/types/api';

/** One row of the "Top creators" teaser on the home screen. */
export type LeaderboardTeaser = {
  user_id: number;
  name: string | null;
  d_liora_id: string | null;
  avatar_url: string | null;
  points: number;
  rank: number | null;
  trend: 'up' | 'down' | 'same' | null;
  is_you: boolean;
};

/** `GET /dashboard` — an aggregate of every module, built by DashboardController. */
export type Dashboard = {
  creator: {
    name: string | null;
    first_name: string | null;
    greeting_name: string | null;
    d_liora_id: string | null;
    tiktok_handle: string | null;
  };
  /** Null while the creator is restricted, suspended or without a manager. */
  manager: {
    id: number;
    name: string | null;
    alias: string | null;
    display_name: string | null;
    tiktok_username: string | null;
    avatar_url: string | null;
  } | null;
  greeting: string;
  restriction: Restriction | null;
  current_level: LevelSlug | null;
  current_level_title: string | null;
  current_track: TrackSummary | null;
  overall_progress: number;
  lessons_completed: number;
  lessons_total: number;
  assignments_completed: number;
  assignments_total: number;
  assignments_pending_review: number;
  continue_lesson: Lesson | null;
  rewards: { count: number; diamonds: number };
  points: { points: number; rank: number | null };
  leaderboard: LeaderboardTeaser[];
  announcements: Announcement[];
  updates: CommunityUpdate[];
  notifications: { unread: number };
};

export function useDashboard() {
  const request = useApi();

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => request<{ data: Dashboard }>('/dashboard').then((r) => r.data),
  });
}
