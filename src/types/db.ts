// DB types matching Supabase schema

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
  tracks?: string[];
  created_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  specialty: string;
  order_index: number;
  created_at: string;
}

export interface Course {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: string;
  duration: string;
  order_index: number;
  is_published: boolean;
  highlight?: string; // 'important' | 'review' | 'exam'
  created_at: string;
  // joined relations
  subject?: Subject;
  teachers?: Teacher[];
  lecture_count?: number;
}

export interface Lecture {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  duration: string;
  is_preview: boolean;
  highlight?: string; // 'important' | 'review' | 'exam'
  created_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  lecture_id: string;
  title: string;
  description: string;
  video_url: string;
  youtube_video_id: string;
  duration: string;
  order_index: number;
  is_preview: boolean;
  is_completed: boolean;
  created_at: string;
}

// ─── CHALLENGES ──────────────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  hours: number;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface ChallengeTaskLesson {
  id: string;
  task_id: string;
  lesson_id: string | null;
  custom_video_url: string;
  custom_video_title: string;
  order_index: number;
  created_at: string;
  // joined
  lesson?: Lesson;
}

export interface ChallengeTaskFile {
  id: string;
  task_id: string;
  file_url: string;
  file_name: string;
  order_index: number;
  created_at: string;
}

export interface ChallengeTask {
  id: string;
  challenge_id: string;
  day_number: number;
  task_order: number;
  title: string;
  notes: string;
  subject_id: string | null;
  teacher_id: string | null;
  course_id: string | null;
  lecture_id: string | null;
  lesson_id: string | null;
  custom_video_url: string;
  custom_file_url: string;
  estimated_minutes: number;
  is_visible: boolean;
  created_at: string;
  // joined
  subject?: Subject;
  teacher?: Teacher;
  course?: Course;
  lecture?: Lecture;
  lesson?: Lesson;
  task_lessons?: ChallengeTaskLesson[];
  task_files?: ChallengeTaskFile[];
}

export interface UserChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  day_number: number;
  is_completed: boolean;
  completed_at: string;
  created_at: string;
}

export interface VideoChapter {
  id: string;
  lesson_id: string;
  title: string;
  start_time_seconds: number;
  order_index: number;
  is_visible: boolean;
  created_at: string;
}

export interface VideoLink {
  id: string;
  lesson_id: string;
  title: string;
  url: string;
  order_index: number;
  is_visible: boolean;
  created_at: string;
}

export interface Playlist {
  id: string;
  playlist_id: string;
  title: string;
  description: string;
  thumbnail: string;
  is_visible: boolean;
  created_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

// ─── QUESTION BANK ──────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  lecture_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string; // 'a' | 'b' | 'c' | 'd'
  explanation: string;
  difficulty: string; // 'easy' | 'medium' | 'hard'
  order_index: number;
  created_at: string;
}

export interface UserAnswer {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  created_at: string;
}

// ─── SUMMARIES ──────────────────────────────────────────────────────────────────

export interface Summary {
  id: string;
  lecture_id: string;
  title: string;
  file_url: string;
  file_type: string; // 'file' | 'link'
  file_size: number;
  order_index: number;
  created_at: string;
}

// ─── HOME BLOCKS ────────────────────────────────────────────────────────────────

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export type NotificationType = "video" | "lecture" | "course" | "file" | "questions" | "teacher_content" | "admin_announcement" | "offer" | "platform_update" | "maintenance";

export type NotificationPriority = "normal" | "important" | "urgent";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  target_type: "all" | "track" | "subject" | "teacher" | "user";
  target_id: string | null;
  priority: NotificationPriority;
  is_pinned: boolean;
  created_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  notification?: AppNotification;
}

export interface NotificationSetting {
  id: string;
  user_id: string;
  notify_videos: boolean;
  notify_lectures: boolean;
  notify_courses: boolean;
  notify_files: boolean;
  notify_questions: boolean;
  notify_teacher_content: boolean;
  notify_admin: boolean;
  notify_offers: boolean;
  notify_maintenance: boolean;
  created_at: string;
}

export interface HomeBlock {
  id: string;
  type: 'hero' | 'post' | 'offer' | 'featured' | 'announcement';
  title: string;
  content: string;
  image_url: string;
  link_url: string;
  highlight: string;
  tracks: string[];
  is_visible: boolean;
  order_index: number;
  created_at: string;
}
