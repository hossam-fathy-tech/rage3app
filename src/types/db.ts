// DB types matching Supabase schema

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
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
  expires_at: string | null; // ISO timestamp
  is_active: boolean;
  created_at: string;
  created_by: string | null; // ID of admin who created
}
