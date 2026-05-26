import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck, CheckCircle2, Circle, Lock, Clock, BookOpen,
  PlayCircle, ChevronLeft, Loader2, Trophy, Flame, Target,
  FileText, ChevronDown, ChevronUp, List, Users,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import YouTubePlayer from "@/components/features/YouTubePlayer";
import ConfettiCelebration from "@/components/features/ConfettiCelebration";
import { useChallenges, useActiveChallenge, useChallengeTasks, useUserChallengeProgress, useToggleChallengeDay, useVideoChapters, useChallengeParticipantCount } from "@/hooks/useData";
import { useAuth } from "@/lib/auth";
import type { ChallengeTask } from "@/types/db";

// ─── UTILS ───────────────────────────────────────────────────────────────────

function ParticipantCount({ challengeId }: { challengeId: string }) {
  const { data: count = 0 } = useChallengeParticipantCount(challengeId);
  return <>{count}</>;
}

function extractYouTubeId(url: string): string {
  if (!url) return "";
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? "";
}

function getTaskVideos(task: ChallengeTask): { id: string; title: string; lessonId?: string }[] {
  const videos: { id: string; title: string; lessonId?: string }[] = [];

  // Primary lesson
  if (task.lesson) {
    const vid = task.lesson.youtube_video_id || extractYouTubeId(task.lesson.video_url || "");
    if (vid) videos.push({ id: vid, title: task.lesson.title, lessonId: task.lesson.id });
  }

  // task_lessons (multiple)
  for (const tl of task.task_lessons ?? []) {
    let vid = "";
    let lessonId: string | undefined;
    if (tl.lesson) {
      vid = tl.lesson.youtube_video_id || extractYouTubeId(tl.lesson.video_url || "");
      lessonId = tl.lesson.id;
    } else {
      vid = extractYouTubeId(tl.custom_video_url || "");
    }
    if (vid) {
      const title = tl.custom_video_title || tl.lesson?.title || "فيديو";
      videos.push({ id: vid, title, lessonId });
    }
  }

  // Legacy custom_video_url
  if (task.custom_video_url) {
    const vid = extractYouTubeId(task.custom_video_url);
    if (vid && !videos.find((v) => v.id === vid)) {
      videos.push({ id: vid, title: "فيديو اليوم" });
    }
  }

  return videos;
}

function getTaskFiles(task: ChallengeTask): { url: string; name: string }[] {
  const files: { url: string; name: string }[] = [];

  for (const tf of task.task_files ?? []) {
    if (tf.file_url) files.push({ url: tf.file_url, name: tf.file_name || "ملف مرفق" });
  }

  if (task.custom_file_url && !files.find((f) => f.url === task.custom_file_url)) {
    files.push({ url: task.custom_file_url, name: "ملف مرفق" });
  }

  return files;
}

// ─── VIDEO WITH CHAPTERS ─────────────────────────────────────────────────────

interface VideoWithChaptersProps {
  video: { id: string; title: string; lessonId?: string };
  showTitle?: boolean;
}

function VideoWithChapters({ video, showTitle }: VideoWithChaptersProps) {
  const { data: chapters = [] } = useVideoChapters(video.lessonId);
  return (
    <div className="rounded-xl overflow-hidden shadow-lg">
      <YouTubePlayer
        key={video.id}
        videoId={video.id}
        title={showTitle ? video.title : undefined}
        chapters={chapters}
      />
    </div>
  );
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: ChallengeTask;
  isCompleted: boolean;
  isLoggedIn: boolean;
  isPending: boolean;
  onToggle: () => void;
  taskIndex?: number;
  totalTasksInDay?: number;
}

function TaskCard({ task, isCompleted, isLoggedIn, isPending, onToggle, taskIndex, totalTasksInDay }: TaskCardProps) {
  const videos = getTaskVideos(task);
  const files = getTaskFiles(task);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [showAllVideos, setShowAllVideos] = useState(false);

  const activeVideo = videos[activeVideoIdx];

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`p-5 ${isCompleted ? "bg-accent/5 border-b border-accent/20" : "bg-primary/5 border-b border-primary/10"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-black px-3 py-1 rounded-full ${isCompleted ? "bg-accent text-white" : "bg-primary text-white"}`}>
                اليوم {task.day_number}
                {(totalTasksInDay ?? 0) > 1 && taskIndex !== undefined && (
                  <span className="mr-1 opacity-80">— مهمة {taskIndex + 1}</span>
                )}
              </span>
              {task.subject && (
                <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
                  {task.subject.icon} {task.subject.name}
                </span>
              )}
              {task.estimated_minutes && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.estimated_minutes} دقيقة
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-foreground">{task.title}</h2>
            {task.teacher && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <span>👨‍🏫</span>
                {task.teacher.name}
              </p>
            )}
          </div>

          <button
            onClick={onToggle}
            disabled={isPending || !isLoggedIn}
            title={!isLoggedIn ? "سجّل دخولك لمتابعة التقدم" : ""}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
              isCompleted
                ? "bg-accent text-white hover:bg-accent/90"
                : "bg-muted text-muted-foreground hover:bg-primary hover:text-white"
            }`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
            {isCompleted ? "مكتمل ✓" : "تم الإنجاز"}
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Notes */}
        {task.notes && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-900 leading-relaxed">
            <p className="font-bold text-yellow-800 mb-1">📝 ملاحظات:</p>
            <p>{task.notes}</p>
          </div>
        )}

        {/* Linked Lesson info */}
        {task.lesson && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/40 px-4 py-2.5 flex items-center gap-2 text-sm font-bold text-foreground border-b border-border">
              <PlayCircle className="w-4 h-4 text-primary" />
              الدرس المطلوب
            </div>
            <div className="p-4">
              <p className="font-semibold text-foreground mb-1">{task.lesson.title}</p>
              {task.lecture && (
                <p className="text-xs text-muted-foreground mb-3">
                  {task.course?.title && `${task.course.title} — `}{task.lecture.title}
                </p>
              )}
              {task.course && (
                <Link
                  to={`/course/${task.course.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  فتح الكورس
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Video Player */}
        {videos.length > 0 && (
          <div>
            {/* Video tabs (if multiple) */}
            {videos.length > 1 && (
              <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1">
                <List className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                {videos.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVideoIdx(i)}
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                      activeVideoIdx === i
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {v.title.length > 25 ? v.title.slice(0, 25) + "…" : v.title}
                  </button>
                ))}
              </div>
            )}

            {/* Player with chapters */}
            {activeVideo && (
              <VideoWithChapters
                video={activeVideo}
                showTitle={videos.length > 1}
              />
            )}

            {/* Video list toggle */}
            {videos.length > 1 && (
              <button
                onClick={() => setShowAllVideos((v) => !v)}
                className="mt-2 text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                {showAllVideos ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showAllVideos ? "إخفاء" : "عرض"} قائمة الفيديوهات ({videos.length})
              </button>
            )}

            {showAllVideos && (
              <div className="mt-2 border border-border rounded-xl overflow-hidden divide-y divide-border">
                {videos.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVideoIdx(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                      activeVideoIdx === i ? "bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activeVideoIdx === i ? "bg-primary" : "bg-muted"}`}>
                      <PlayCircle className={`w-3.5 h-3.5 ${activeVideoIdx === i ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{v.title}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Files */}
        {files.length > 0 && (
          <div>
            <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              الملفات المرفقة ({files.length})
            </p>
            <div className="flex flex-col gap-2">
              {files.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-3 transition-colors"
                >
                  <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-blue-800 text-sm truncate">{f.name}</p>
                    <p className="text-xs text-blue-600">اضغط للتحميل / المشاهدة</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Not logged in */}
        {!isLoggedIn && (
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">سجّل دخولك لتتابع تقدمك في التحدي</p>
            <Link to="/login" className="btn-primary text-sm inline-flex items-center gap-2">
              تسجيل الدخول
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHALLENGE CARD ────────────────────────────────────────────────────────────────

function ChallengeCard({ 
  challenge, 
  isActive, 
  onSelect, 
  onJoin, 
  isJoined, 
  isLoggedIn 
}: { 
  challenge: Challenge; 
  isActive: boolean;
  onSelect: () => void;
  onJoin: () => void;
  isJoined: boolean;
  isLoggedIn: boolean;
}) {
  const { data: participantCount = 0 } = useChallengeParticipantCount(challenge.id);
  
  return (
    <div
      onClick={onSelect}
      className={`border rounded-xl p-4 transition-all cursor-pointer ${
        isActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-bold text-foreground">{challenge.title}</h4>
        {!challenge.is_active && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">منتهي</span>
        )}
      </div>
      {challenge.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{challenge.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarCheck className="w-3 h-3" />
            {challenge.duration_days} يوم{challenge.hours ? ` و ${challenge.hours} ساعة` : ''}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {participantCount}
          </span>
        </div>
        {isLoggedIn && !isJoined && challenge.is_active && (
          <button
            onClick={(e) => { e.stopPropagation(); onJoin(); }}
            className="text-sm bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/90"
          >
            انضم
          </button>
        )}
        {isJoined && (
          <span className="text-xs bg-accent text-white px-2 py-1 rounded-lg">منضم ✓</span>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const Challenges = () => {
  const { user } = useAuth();
  const { data: allChallenges = [], isLoading: challengesLoading } = useChallenges();
  const { data: challenge, isLoading: challengeLoading } = useActiveChallenge();

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<"day" | "challenge" | null>(null);

  const activeChallenge = selectedChallengeId 
    ? allChallenges.find(c => c.id === selectedChallengeId) 
    : challenge;

  const { data: tasks = [], isLoading: tasksLoading } = useChallengeTasks(activeChallenge?.id);
  const { data: progressData } = useUserChallengeProgress(activeChallenge?.id);
  const completedDays = progressData?.days ?? [];
  const joinedAt = progressData?.joinedAt;
  const toggleDay = useToggleChallengeDay();

  const handleJoin = (challengeId: string) => {
    if (!user) {
      toast.error("سجّل دخولك أولاً");
      return;
    }
    setSelectedChallengeId(challengeId);
    toast.success("انضممت للتحدي!");
  };

  // Track previously completed days to detect new completions
  const prevCompletedRef = useRef<number[]>([]);

  useEffect(() => {
    if (!challenge || completedDays.length === 0) return;
    const prev = prevCompletedRef.current;

    // Check if new day was just completed
    const newlyCompleted = completedDays.filter((d) => !prev.includes(d));
    if (newlyCompleted.length > 0 && prev.length > 0) {
      if (completedDays.length >= activeChallenge?.duration_days) {
        setCelebration("challenge");
      } else {
        setCelebration("day");
      }
    }

    prevCompletedRef.current = completedDays;
  }, [completedDays, challenge]);

  const totalDays = challenge?.duration_days ?? 30;
  const totalHours = challenge?.hours ?? 0;
  const completedCount = completedDays.length;
  const progress = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
  const durationText = totalHours > 0 ? `${totalDays} يوم و ${totalHours} ساعة` : `${totalDays} يوم`;
  
  // Check if challenge has expired
  const isExpired = (() => {
    if (!joinedAt || !challenge) return false;
    const startTime = new Date(joinedAt).getTime();
    const durationMs = (totalDays * 24 * 60 * 60 * 1000) + (totalHours * 60 * 60 * 1000);
    const endTime = startTime + durationMs;
    return Date.now() > endTime;
  })();

  // Group tasks by day
  const tasksByDay = tasks.reduce<Record<number, ChallengeTask[]>>((acc, t) => {
    if (!t.is_visible) return acc;
    if (!acc[t.day_number]) acc[t.day_number] = [];
    acc[t.day_number].push(t);
    return acc;
  }, {});

  // Find today's day (first incomplete)
  const todayDay = tasks.find(
    (t) => t.is_visible && !completedDays.includes(t.day_number)
  )?.day_number ?? tasks[0]?.day_number ?? 1;

  const activeDayNumber = selectedDay ?? todayDay;
  const activeTasks = tasksByDay[activeDayNumber] ?? [];

  const handleToggleDay = async (dayNumber: number) => {
    if (!user) { toast.error("سجّل دخولك لمتابعة تقدمك"); return; }
    if (!activeChallenge) return;
    if (isExpired) { toast.error("انتهى وقت التحدي! لم يعد يمكنك إكمال الأيام"); return; }
    const isDone = completedDays.includes(dayNumber);
    await toggleDay.mutateAsync({ challengeId: activeChallenge.id, dayNumber, completed: !isDone });
    if (!isDone) {
      toast.success("أحسنت! يوم مكتمل ✓");
    } else {
      toast.success("تم إلغاء إكمال اليوم");
    }
  };

  if (challengeLoading || challengesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeChallenge && allChallenges.length === 0) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header />
        <main className="lg:mr-[260px] pt-16">
          <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CalendarCheck className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-3">لا توجد تحديات حالياً</h2>
              <p className="text-muted-foreground mb-6">سيتم إطلاق تحديات جديدة قريباً!</p>
              <Link to="/courses" className="btn-primary inline-flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                تصفح الكورسات
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      {/* Confetti Celebration */}
      {celebration && (
        <ConfettiCelebration
          type={celebration}
          onClose={() => setCelebration(null)}
        />
      )}

      <main className="lg:mr-[260px] pt-16">
        {/* All Challenges List */}
        {allChallenges.length > 0 && (
          <div className="bg-white border-b border-border">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <h3 className="text-sm font-bold text-muted-foreground mb-3">التحديات المتاحة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allChallenges.map((ch) => (
                  <ChallengeCard 
                    key={ch.id} 
                    challenge={ch} 
                    isActive={activeChallenge?.id === ch.id}
                    onSelect={() => setSelectedChallengeId(ch.id)}
                    onJoin={() => handleJoin(ch.id)}
                    isJoined={activeChallenge?.id === ch.id}
                    isLoggedIn={!!user}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hero Banner */}
        {activeChallenge ? (
          <div className="gradient-hero py-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-right">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    <Flame className="w-4 h-4" />
                    تحدي نشط
                  </div>
                  <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    <Clock className="w-4 h-4" />
                    {durationText}
                  </div>
                  {isExpired && (
                    <div className="inline-flex items-center gap-2 bg-red-500/80 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                      <Lock className="w-4 h-4" />
                      ended
                    </div>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">{activeChallenge.title}</h1>
                {activeChallenge.description && (
                  <p className="text-white/70 mb-6 max-w-lg">{activeChallenge.description}</p>
                )}
                <div className="flex items-center gap-6 justify-center md:justify-start">
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">{completedCount}</p>
                    <p className="text-white/60 text-xs">يوم مكتمل</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">{totalDays - completedCount}</p>
                    <p className="text-white/60 text-xs">يوم متبقي</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">{progress}%</p>
                    <p className="text-white/60 text-xs">مكتمل</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">
                      {activeChallenge && <ParticipantCount challengeId={activeChallenge.id} />}
                    </p>
                    <p className="text-white/60 text-xs">منضم</p>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke="white" strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <Trophy className="w-8 h-8 text-white mb-0.5" />
                    <p className="text-white font-black text-lg leading-none">{progress}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-white/50 text-xs mt-1.5">
                <span>اليوم 1</span>
                <span>اليوم {totalDays}</span>
              </div>
            </div>
          </div>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-white/70">اختر تحدي من الأعلى للبدء</p>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Day Grid */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-border p-5 shadow-sm sticky top-20">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="font-black text-foreground">أيام التحدي</h3>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                    const dayTasks = tasksByDay[day];
                    const isDone = completedDays.includes(day);
                    const isActive = day === activeDayNumber;
                    const hasTask = !!dayTasks && dayTasks.length > 0;
                    const taskCount = dayTasks?.length ?? 0;

                    return (
                      <button
                        key={day}
                        onClick={() => { if (hasTask) setSelectedDay(day); }}
                        disabled={!hasTask}
                        className={`
                          aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative
                          ${isDone ? "bg-accent text-white shadow-sm" : ""}
                          ${isActive && !isDone ? "bg-primary text-white shadow-md scale-105" : ""}
                          ${!isDone && !isActive && hasTask ? "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary" : ""}
                          ${!hasTask ? "bg-muted/40 text-muted-foreground/40 cursor-not-allowed" : ""}
                        `}
                      >
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : day}
                        {taskCount > 1 && (
                          <span className={`text-[8px] leading-none mt-0.5 ${isDone || isActive ? "text-white/70" : "text-muted-foreground/60"}`}>
                            {taskCount}م
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-accent rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span>مكتمل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-primary rounded-lg" />
                    <span>اليوم المحدد</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-muted rounded-lg" />
                    <span>لم يكتمل</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">الرقم الصغير = عدد المهام في اليوم</p>
                </div>
              </div>
            </div>

            {/* Task Detail */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {tasksLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : activeTasks.length > 0 ? (
                <>
                  {activeTasks.length > 1 && (
                    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
                      <List className="w-4 h-4 text-primary" />
                      <p className="text-sm font-bold text-primary">
                        اليوم {activeDayNumber} يحتوي على {activeTasks.length} مهام
                      </p>
                    </div>
                  )}
                  {activeTasks.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isCompleted={completedDays.includes(task.day_number)}
                      isLoggedIn={!!user}
                      isPending={toggleDay.isPending}
                      onToggle={() => handleToggleDay(task.day_number)}
                      taskIndex={i}
                      totalTasksInDay={activeTasks.length}
                    />
                  ))}
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm">
                  <Lock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="font-bold text-foreground mb-1">اختر يوماً من الشبكة</p>
                  <p className="text-sm text-muted-foreground">اضغط على أي يوم لعرض مهامه</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Challenges;
