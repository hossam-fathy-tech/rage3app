import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowRight, BookMarked, PlayCircle, ChevronLeft, Loader2,
  CheckCircle2, Circle, ExternalLink, Link2, FileText,
} from "lucide-react";
import Header from "@/components/layout/Header";
import LectureList from "@/components/features/LectureList";
import YouTubePlayer from "@/components/features/YouTubePlayer";
import {
  useCourse, useLectures, useUserProgress, useToggleProgress,
  useVideoChapters, useVideoLinks,
} from "@/hooks/useData";
import { useAuth } from "@/lib/auth";
import type { Lesson } from "@/types/db";
import { toast } from "sonner";

const colorPalette = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-green-500 to-green-700",
  "from-teal-500 to-teal-700",
];

function extractYouTubeId(url: string): string {
  if (!url) return "";
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? "";
}

function getLinkIcon(url: string): string {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    if (host.includes("drive.google")) return "📁";
    if (host.includes("t.me") || host.includes("telegram")) return "📢";
    if (url.match(/\.pdf(\?|$)/i)) return "📄";
    if (host.includes("youtube") || host.includes("youtu.be")) return "▶️";
    if (host.includes("docs.google")) return "📝";
    return "🔗";
  } catch {
    return "🔗";
  }
}

// ─── Lesson Video Panel ───────────────────────────────────────────────────────

interface LessonPanelProps {
  lesson: Lesson;
  lectureTitle: string;
  courseId?: string;
  isCompleted: boolean;
  isPending: boolean;
  isLoggedIn: boolean;
  onToggleComplete: () => void;
}

function LessonPanel({
  lesson, lectureTitle, isCompleted, isPending, isLoggedIn, onToggleComplete,
}: LessonPanelProps) {
  const youtubeId = lesson.youtube_video_id || extractYouTubeId(lesson.video_url || "");
  const { data: chapters = [] } = useVideoChapters(lesson.id);
  const { data: links = [] } = useVideoLinks(lesson.id);

  return (
    <div className="flex flex-col gap-4">
      {/* Player */}
      <div className="rounded-2xl overflow-hidden shadow-xl bg-black">
        {youtubeId ? (
          <YouTubePlayer
            key={lesson.id}
            videoId={youtubeId}
            title={lesson.title}
            chapters={chapters}
          />
        ) : lesson.video_url ? (
          <video
            key={lesson.id}
            src={lesson.video_url}
            controls
            className="w-full aspect-video"
          />
        ) : (
          <div className="aspect-video flex items-center justify-center">
            <div className="text-center text-white/60">
              <PlayCircle className="w-16 h-16 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">لا يوجد فيديو لهذا الدرس</p>
            </div>
          </div>
        )}
      </div>

      {/* Lesson info + complete button */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground mb-1 leading-snug">{lesson.title}</h2>
            {lesson.description && (
              <p className="text-sm text-muted-foreground mb-1 leading-relaxed">{lesson.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {lesson.duration && `المدة: ${lesson.duration} • `}
              {lectureTitle}
            </p>
          </div>
          {isLoggedIn && (
            <button
              onClick={onToggleComplete}
              disabled={isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
                isCompleted
                  ? "bg-accent/10 text-accent border-2 border-accent"
                  : "bg-muted text-muted-foreground border-2 border-transparent hover:border-accent/50 hover:text-accent"
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              {isCompleted ? "مكتمل" : "تحديد كمكتمل"}
            </button>
          )}
        </div>
      </div>

      {/* Video Links */}
      {links.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground">روابط المحاضرة</h3>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
              {links.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <span className="text-xl flex-shrink-0">{getLinkIcon(link.url)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {link.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: course, isLoading: courseLoading } = useCourse(id!);
  const { data: lectures = [], isLoading: lecturesLoading } = useLectures(id!);
  const { data: completedLessonIds = [] } = useUserProgress(id);
  const toggleProgress = useToggleProgress();

  const firstLesson = lectures[0]?.lessons?.[0] ?? null;
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeLectureId, setActiveLectureId] = useState<string>("");

  const currentLesson = activeLesson ?? firstLesson;
  const currentLectureId = activeLectureId || lectures[0]?.id || "";
  const currentLecture = lectures.find((l) => l.id === currentLectureId);

  const handleLessonSelect = (lesson: Lesson, lectureId: string) => {
    setActiveLesson(lesson);
    setActiveLectureId(lectureId);
  };

  const handleToggleComplete = async () => {
    if (!user) { toast.error("سجّل دخولك لمتابعة تقدمك"); return; }
    if (!currentLesson) return;
    const isCompleted = completedLessonIds.includes(currentLesson.id);
    await toggleProgress.mutateAsync({ lessonId: currentLesson.id, completed: !isCompleted });
    toast.success(isCompleted ? "تم إلغاء الإكمال" : "تم تحديد الدرس كمكتمل ✓");
  };

  const totalLessons = lectures.reduce((sum, l) => sum + (l.lessons?.length ?? 0), 0);
  const completedCount = completedLessonIds.length;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <h2 className="text-2xl font-bold text-foreground mb-2">الكورس مش موجود</h2>
          <Link to="/courses" className="text-primary font-bold hover:underline">الرجوع للكورسات</Link>
        </div>
      </div>
    );
  }

  const teacher = course.teachers?.[0];
  const subject = course.subject;
  const subjectColor = colorPalette[0];
  const isCurrentCompleted = currentLesson ? completedLessonIds.includes(currentLesson.id) : false;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="pt-16">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-border px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">الرئيسية</Link>
            <ChevronLeft className="w-4 h-4" />
            <Link to="/courses" className="hover:text-foreground transition-colors">الكورسات</Link>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{course.title}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Course Meta */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {subject && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${subjectColor} text-white`}>
                  {subject.name}
                </span>
              )}
              {course.level && (
                <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full font-medium">
                  {course.level}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">{course.title}</h1>
            <p className="text-muted-foreground mb-4">{course.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              {teacher && (
                <Link
                  to={`/teacher/${teacher.id}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  {teacher.avatar ? (
                    <img src={teacher.avatar} alt={teacher.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {teacher.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold text-foreground hover:text-primary transition-colors">{teacher.name}</span>
                </Link>
              )}
              {course.duration && (
                <div className="flex items-center gap-1.5">
                  <BookMarked className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4" />
                <span>{totalLessons} درس</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {user && totalLessons > 0 && (
            <div className="bg-white rounded-2xl border border-border p-4 mb-6 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-foreground">تقدمك في الكورس</span>
                  <span className="font-bold text-primary">{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="text-center text-sm">
                <p className="font-bold text-foreground text-lg">{completedCount}/{totalLessons}</p>
                <p className="text-muted-foreground text-xs">درس</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video + Lesson Info */}
            <div className="lg:col-span-2">
              {currentLesson ? (
                <LessonPanel
                  lesson={currentLesson}
                  lectureTitle={currentLecture?.title ?? ""}
                  courseId={id}
                  isCompleted={isCurrentCompleted}
                  isPending={toggleProgress.isPending}
                  isLoggedIn={!!user}
                  onToggleComplete={handleToggleComplete}
                />
              ) : (
                <div className="bg-black rounded-2xl overflow-hidden aspect-video shadow-xl flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <PlayCircle className="w-16 h-16 mx-auto mb-3 opacity-40" />
                    <p className="text-lg font-medium">اختر درسًا من القائمة</p>
                  </div>
                </div>
              )}

              {!user && (
                <div className="mt-4 bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">سجّل دخولك لمتابعة تقدمك وحفظ الدروس المكتملة</p>
                  <Link to="/login" className="btn-primary text-sm inline-flex items-center gap-2">
                    تسجيل الدخول
                  </Link>
                </div>
              )}
            </div>

            {/* Lecture Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-muted/40 rounded-2xl p-4 sticky top-20">
                <h3 className="font-black text-foreground mb-4 text-lg">قائمة المحاضرات</h3>
                {lecturesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : lectures.length > 0 ? (
                  <LectureList
                    lectures={lectures}
                    activeLessonId={currentLesson?.id || ""}
                    completedLessonIds={completedLessonIds}
                    onLessonSelect={handleLessonSelect}
                  />
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <p className="text-4xl mb-2">📭</p>
                    <p className="text-sm">لا توجد محاضرات بعد</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              الرجوع للكورسات
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;
