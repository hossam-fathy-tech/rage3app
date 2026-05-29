import { Award, BookOpen, Target, Clock, Star, CheckCircle2, Trophy, Flame } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export function getUserAchievements(stats: {
  coursesCompleted: number;
  questionsAnswered: number;
  daysStreak: number;
  lessonsCompleted: number;
}): Achievement[] {
  return [
    {
      id: "first_lesson",
      title: "أول درس",
      description: "أكمل أول درس ليك",
      icon: BookOpen,
      color: "bg-primary/10 text-primary",
      unlocked: stats.lessonsCompleted >= 1,
    },
    {
      id: "ten_lessons",
      title: "متعلم نشط",
      description: "أكمل 10 دروس",
      icon: Target,
      color: "bg-blue-500/10 text-blue-500",
      unlocked: stats.lessonsCompleted >= 10,
      progress: Math.min(stats.lessonsCompleted, 10),
      maxProgress: 10,
    },
    {
      id: "fifty_questions",
      title: "محترف الأسئلة",
      description: "جاوب على 100 سؤال",
      icon: Star,
      color: "bg-amber-500/10 text-amber-500",
      unlocked: stats.questionsAnswered >= 100,
      progress: Math.min(stats.questionsAnswered, 100),
      maxProgress: 100,
    },
    {
      id: "course_master",
      title: "خبير المادة",
      description: "خلص كورس كامل",
      icon: Trophy,
      color: "bg-emerald-500/10 text-emerald-600",
      unlocked: stats.coursesCompleted >= 1,
    },
    {
      id: "week_streak",
      title: "التزام أسبوعي",
      description: "7 أيام التزام متواصل",
      icon: Flame,
      color: "bg-orange-500/10 text-orange-500",
      unlocked: stats.daysStreak >= 7,
      progress: Math.min(stats.daysStreak, 7),
      maxProgress: 7,
    },
    {
      id: "all_courses",
      title: "خريج المنصة",
      description: "خلص كل الكورسات",
      icon: Award,
      color: "bg-purple-500/10 text-purple-500",
      unlocked: stats.coursesCompleted >= 5,
      progress: Math.min(stats.coursesCompleted, 5),
      maxProgress: 5,
    },
  ];
}
