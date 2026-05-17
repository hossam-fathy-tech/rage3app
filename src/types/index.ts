export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  courseCount: number;
}

export interface Teacher {
  id: string;
  name: string;
  avatar: string;
  subjects: string[];
  bio: string;
  courseCount: number;
}

export interface Video {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
  order: number;
}

export interface Lecture {
  id: string;
  title: string;
  courseId: string;
  order: number;
  videos: Video[];
  completed?: boolean;
}

export interface Course {
  id: string;
  title: string;
  subjectId: string;
  teacherId: string;
  description: string;
  thumbnail: string;
  lectureCount: number;
  level: string;
  isVisible: boolean;
  progress?: number;
}
