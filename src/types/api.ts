/**
 * Shapes returned by the D-LIORA API, mirroring `app/Http/Resources` on the
 * backend. Keep these in step with the resources — the backend is the contract.
 */

export type LevelSlug = 'bronze' | 'silver' | 'gold' | 'platinum';

/** `TrainingTrackSummary` — the compact tier nested in lessons and assignments. */
export type TrackSummary = {
  id: number;
  key: string;
  name: string;
  caption: string | null;
  image_url: string | null;
  position: number | null;
};

export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

/** `LessonResource`. */
export type Lesson = {
  id: number;
  level: LevelSlug | string | null;
  track: TrackSummary | null;
  type: string;
  title: string;
  summary: string | null;
  /** Expiring link to the original upload — only until the HLS version exists. */
  video_url: string | null;
  hls_url: string | null;
  thumbnail_url: string | null;
  video_qualities: string[] | null;
  duration_minutes: number | null;
  position: number | null;
  number: number | null;
  of_total: number | null;
  locked: boolean;
  status: LessonProgressStatus;
  completed_at: string | null;
  last_watched_at: string | null;
};

export type SubmissionStatus =
  | 'pending'
  | 'under_review'
  | 'changes_required'
  | 'approved'
  | 'rejected';

/** `AssignmentResource`. */
export type Assignment = {
  id: number;
  level: LevelSlug | string | null;
  level_title: string | null;
  track: TrackSummary | null;
  /** quiz (marked on submit) | review (an admin reads it) | instant (completes on submit) */
  kind: 'quiz' | 'review' | 'instant';
  kind_label: string;
  questions_count: number;
  short_title: string;
  title: string;
  lesson: { id: number; title: string } | null;
  number: number | null;
  of_total: number | null;
  locked_reason: string | null;
  description: string | null;
  position: number | null;
  due_days: number | null;
  needs_files: boolean;
  locked: boolean;
  submission_status: SubmissionStatus | null;
  submission_status_label: string;
  submitted_at: string | null;
  /** The reviewer's note while changes are required ("Resubmit"). */
  review_notes: string | null;
};

/** `CommunityUpdateResource`. */
export type CommunityUpdate = {
  id: number;
  body: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  is_mine: boolean;
  author: { name: string | null; d_liora_id: string | null } | null;
  published_at: string | null;
  created_at: string;
};

/** `AnnouncementResource` — body is cleaned HTML. */
export type Announcement = {
  id: number;
  title: string;
  body: string;
  audience: string;
  audience_label: string;
  context: { datetime: string | null; link: string | null; text: string | null };
  starts_at: string | null;
  ends_at: string | null;
  is_read: boolean;
};

/** `LeaderboardResource`. */
export type LeaderboardEntry = {
  rank: number | null;
  points: number;
  previous_rank: number | null;
  trend: 'up' | 'down' | 'same' | null;
  is_you: boolean;
  creator: {
    id: number;
    name: string | null;
    d_liora_id: string | null;
    tiktok_handle: string | null;
    tiktok_username: string | null;
    avatar_url: string | null;
    bootcamp_level: LevelSlug | string | null;
  } | null;
};

export type Leaderboard = {
  id: number;
  title: string | null;
  region: { id: number; name: string; code: string } | null;
  is_visible: boolean;
  published_at: string | null;
  updated_at: string | null;
  entries: LeaderboardEntry[];
};

/** `DiamondAwardResource`. */
export type DiamondAward = {
  id: number;
  diamonds: number;
  reason: string | null;
  kind: 'lesson' | 'tier';
  tier: { id: number; key: string; name: string } | null;
  awarded_at: string | null;
};

/** One row of the notification tray. */
export type AppNotification = {
  id: string;
  category: string;
  title: string | null;
  body: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
};

export type Restriction = { reason: string | null; restricted_at: string | null };

export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

export type LessonType = 'video' | 'text' | 'pdf';

/** `LessonDetailResource` — the lesson screen's full payload. */
export type LessonDetail = Omit<Lesson, 'level'> & {
  level: LevelSlug | string | null;
  level_title: string | null;
  /** Cleaned HTML, for text lessons. */
  body: string | null;
  pdf: {
    name: string | null;
    size: number | null;
    /** API path to fetch with the learner's token. */
    path: string;
    allow_download: boolean;
    download_url: string | null;
  } | null;
  prev_lesson_id: number | null;
  next_lesson_id: number | null;
  assignments: Assignment[];
};

/** `TrainingProgressService::trackRow` — one level on the journey. */
export type TrackRow = {
  key: LevelSlug | string;
  id: number;
  name: string;
  title: string;
  caption: string | null;
  description: string | null;
  image_url: string | null;
  badge: string | null;
  position: number | null;
  unlocked: boolean;
  lessons_total: number;
  lessons_completed: number;
  assignments_total: number;
  assignments_completed: number;
  progress: number;
  status: 'locked' | 'in_progress' | 'completed';
  placed: boolean;
};

/** `TrainingProgressService::trackSummary` — assignment counts for a level. */
export type TrackAssignmentSummary = {
  total: number;
  completed: number;
  under_review: number;
  changes_required: number;
  rejected: number;
  not_submitted: number;
  all_submitted: boolean;
};

/** `GET /bootcamp` — "Your Creator Journey". */
export type BootcampOverview = {
  current_level: LevelSlug | null;
  current_level_title: string | null;
  current_track: TrackSummary | null;
  overall_progress: number;
  lessons_completed: number;
  lessons_total: number;
  assignments_completed: number;
  assignments_total: number;
  finished: boolean;
  /** A newly reached level to congratulate on, once. */
  celebrate: TrackSummary | null;
  current_summary: TrackAssignmentSummary | null;
  continue_lesson: Lesson | null;
  levels: TrackRow[];
};

/** `GET /bootcamp/levels/{level}`. */
export type LevelDetail = TrackRow & {
  assignments_summary: TrackAssignmentSummary;
  lessons: Lesson[];
  assignments: Assignment[];
};

export type QuestionType = 'text' | 'file' | 'quiz' | 'choice' | 'document';

export type AssignmentQuestion = {
  id: number;
  number: number;
  type: QuestionType;
  type_label: string;
  prompt: string;
  /** Cleaned HTML. */
  details: string | null;
  /** Never says which are correct. */
  options: { id: number; label: string }[];
  /** How many options may be picked; null when the question takes no options. */
  max_choices: number | null;
  /** "Fill in a document": the file to download, on a plain storage URL. */
  template: {
    path: string;
    name: string;
    size: number | null;
    mime_type: string | null;
    url: string;
  } | null;
};

export type SubmissionAttachment = {
  id: number;
  question_id: number | null;
  name: string;
  size: number | null;
  url: string | null;
};

/** `AssignmentSubmissionResource` — the learner's own hand-in. */
export type AssignmentSubmission = {
  id: number;
  assignment_id: number;
  status: SubmissionStatus;
  status_label: string;
  /** `{ [questionId]: { text?: string; option_ids?: number[] } }` */
  answers: Record<string, { text?: string; option_ids?: number[] }>;
  score: number | null;
  quiz_total: number | null;
  required_correct: number | null;
  attempts: number;
  attempts_left: number | null;
  review_notes: string | null;
  can_resubmit: boolean;
  submitted_at: string | null;
  reviewed_at: string | null;
  attachments: SubmissionAttachment[];
};

/** `AssignmentDetailResource`. */
export type AssignmentDetail = {
  id: number;
  level: LevelSlug | string | null;
  level_title: string | null;
  track: TrackSummary | null;
  short_title: string;
  title: string;
  kind: 'quiz' | 'review' | 'instant';
  kind_label: string;
  lesson: { id: number; title: string } | null;
  number: number | null;
  of_total: number | null;
  locked_reason: string | null;
  /** Cleaned HTML. */
  description: string | null;
  requirements: string[];
  related_video: {
    id: number;
    title: string;
    description: string | null;
    type: string;
    format: string | null;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    views_count: number;
  } | null;
  questions: AssignmentQuestion[];
  quiz_questions: number;
  pass_mark: number | null;
  required_correct: number | null;
  max_attempts: number | null;
  attempts_left: number | null;
  position: number | null;
  due_days: number | null;
  locked: boolean;
  submission: AssignmentSubmission | null;
};

/** What the learner is putting together for one question before they submit. */
export type AnswerDraft = {
  text?: string;
  option_ids?: number[];
  /** Files already sent to storage, named on submit. */
  uploaded?: { path: string; name: string }[];
};

/** `POST /assignments/{id}/uploads` — where to send a file, and under what path. */
export type UploadTarget = {
  method: 'PUT' | 'POST';
  url: string;
  headers: Record<string, string>;
  path: string;
  /** Local-disk fallback: the multipart field name and extra fields. */
  field?: string;
  fields?: Record<string, string>;
};

export type ConversationType = 'direct' | 'group' | 'support' | string;

export type ChatCounterpart = {
  id: number;
  name: string | null;
  role: string;
  d_liora_id: string | null;
  tiktok_username: string | null;
  avatar_url: string | null;
};

/** The other side's "delivered up to" / "read up to"; null in the Community Group. */
export type ChatReceipts = { delivered_up_to: number | null; read_up_to: number | null } | null;

/** `ConversationResource`. */
export type Conversation = {
  id: number;
  type: ConversationType;
  title: string;
  closed: boolean;
  avatar_url: string | null;
  members_count: number | null;
  counterpart: ChatCounterpart | null;
  last_message: { body: string | null; author_name: string | null; created_at: string } | null;
  unread_count: number;
  receipts: ChatReceipts;
  can_reply: boolean;
  muted: boolean;
  last_message_at: string | null;
};

export type ChatAttachment = {
  id: number;
  name: string;
  mime_type: string | null;
  size: number | null;
  kind: 'image' | 'video' | 'file';
  /** An expiring private link. */
  url: string | null;
  download_url: string | null;
};

/** `ChatMessageResource` — the author is "D-Liora Admin" in a support thread. */
export type ChatMessage = {
  id: number;
  conversation_id: number;
  body: string | null;
  attachments: ChatAttachment[];
  is_mine: boolean;
  author: {
    id: number | null;
    name: string | null;
    d_liora_id: string | null;
    tiktok_username: string | null;
    role: string;
    avatar_url: string | null;
    bootcamp_level: string | null;
    is_team: boolean;
  } | null;
  edited_at: string | null;
  edited_by_team: boolean;
  deleted: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
};

export type MessagesPage = {
  data: ChatMessage[];
  meta: {
    conversation_id: number;
    closed: boolean;
    has_more?: boolean;
    receipts: ChatReceipts;
  };
};

export type ResourceType = 'video' | 'document' | 'text';

/** `ResourceResource` — a Training Library card. */
export type LibraryResource = {
  id: number;
  title: string;
  description: string | null;
  type: ResourceType;
  type_label: string;
  /** "MP4" / "PDF" / "Text". */
  format: string | null;
  category: { id: number; title: string } | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size: number | null;
  views_count: number;
  published_at: string | null;
  progress: { percent: number; completed: boolean } | null;
};

/** `ResourceResource::detail()` — the resource page. */
export type LibraryResourceDetail = LibraryResource & {
  /** The HLS playlist, once converted; null while the video is being prepared. */
  playlist_url: string | null;
  video_ready: boolean | null;
  download_url: string | null;
  is_pdf: boolean;
  allow_download: boolean;
  file_name: string | null;
  body: string | null;
  related: LibraryResource[];
};

export type LibraryCategories = {
  total: number;
  categories: { id: number; title: string; count: number }[];
};
