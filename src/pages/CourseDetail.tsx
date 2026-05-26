import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, BookMarked, PlayCircle, ChevronLeft, Loader2,
  CheckCircle2, Circle, ExternalLink, Link2, FileText, Wallet, Lock,
  HelpCircle, Download,
} from "lucide-react";
import Header from "@/components/layout/Header";
import LectureList from "@/components/features/LectureList";
import YouTubePlayer from "@/components/features/YouTubePlayer";
import {
  useCourse, useLectures, useUserProgress, useToggleProgress,
  useVideoChapters, useVideoLinks, useQuestions, useUserAnswers, useSummaries, useSubmitAnswer,
} from "@/hooks/useData";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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
  const navigate = useNavigate();
  const { data: course, isLoading: courseLoading } = useCourse(id!);
  const { data: lectures = [], isLoading: lecturesLoading } = useLectures(id!);
  const { data: completedLessonIds = [] } = useUserProgress(id);
  const toggleProgress = useToggleProgress();

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Discount State
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [finalPrice, setFinalPrice] = useState(0);

  useEffect(() => {
    if (course?.price) {
      setFinalPrice(course.price);
    }
  }, [course]);

  useEffect(() => {
    if (user && course?.is_paid) {
      checkEnrollment();
    } else {
      setCheckingEnrollment(false);
      setIsEnrolled(!course?.is_paid); // Free courses are always "enrolled"
    }
  }, [user, course]);

  const checkEnrollment = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", id)
      .maybeSingle();
    setIsEnrolled(!!data);
    setCheckingEnrollment(false);
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error("أدخل كود الخصم");
      return;
    }
    setApplyingDiscount(true);
    
    const { data: code, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", discountCode.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (error || !code) {
      toast.error("كود غير صحيح");
      setApplyingDiscount(false);
      return;
    }

    if (code.uses_limit > 0 && code.uses_count >= code.uses_limit) {
      toast.error("الكود منتهي الاستخدام");
      setApplyingDiscount(false);
      return;
    }

    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      toast.error("الكود منتهي الصلاحية");
      setApplyingDiscount(false);
      return;
    }

    // Check scope
    if (code.scope === "course" && code.scope_id !== id) {
      toast.error("هذا الكود غير صالح لهذا الكورس");
      setApplyingDiscount(false);
      return;
    }
    if (code.scope === "subject" && code.scope_id !== course?.subject_id) {
      toast.error("هذا الكود غير صالح لهذه المادة");
      setApplyingDiscount(false);
      return;
    }

    // Calculate discount
    let discountAmount = 0;
    if (code.discount_type === "percentage") {
      discountAmount = (course?.price || 0) * (code.discount_value / 100);
    } else {
      discountAmount = code.discount_value;
    }

    const newPrice = Math.max(0, (course?.price || 0) - discountAmount);
    setFinalPrice(newPrice);
    setAppliedDiscount({ ...code, amount: discountAmount });
    toast.success(`تم تطبيق الخصم! وفرت ${discountAmount} جنيه`);
    setApplyingDiscount(false);
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("سجّل دخولك أولاً");
      navigate("/login");
      return;
    }
    if (!course) return;

    setIsSubscribing(true);

    try {
      // 1. Check balance
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      const balance = wallet?.balance || 0;

      if (balance < finalPrice) {
        toast.error(`رصيدك غير كافٍ. رصيدك: ${balance} جنيه، المطلوب: ${finalPrice} جنيه`);
        setIsSubscribing(false);
        return;
      }

      // 2. Deduct balance
      const newBalance = balance - finalPrice;
      await supabase
        .from("user_wallets")
        .update({ balance: newBalance })
        .eq("user_id", user.id);

      // 3. Record transaction
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        amount: finalPrice,
        type: "debit",
        description: `اشتراك في كورس: ${course.title}${appliedDiscount ? ` (خصم ${appliedDiscount.code})` : ''}`
      });

      // 4. Create enrollment
      await supabase.from("course_enrollments").insert({
        user_id: user.id,
        course_id: id,
        discount_used: appliedDiscount?.amount || 0
      });

      // 5. Update discount usage if applied
      if (appliedDiscount) {
        await supabase
          .from("discount_codes")
          .update({ uses_count: appliedDiscount.uses_count + 1 })
          .eq("id", appliedDiscount.id);
      }

      toast.success("تم الاشتراك بنجاح! 🎉");
      setIsEnrolled(true);
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("حدث خطأ أثناء الاشتراك");
    } finally {
      setIsSubscribing(false);
    }
  };

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
      <main className="lg:mr-[260px] pt-16">
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
              {course.is_paid && !isEnrolled && !checkingEnrollment ? (
                /* Locked Content / Subscribe Card */
                <div className="bg-white rounded-2xl border-2 border-amber-200 p-8 text-center shadow-lg">
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">هذا الكورس مدفوع</h2>
                  <p className="text-muted-foreground mb-6">اشترك الآن للوصول لجميع المحاضرات والمحتوى</p>
                  
                  <div className="bg-amber-50 rounded-xl p-4 mb-6 inline-block">
                    {appliedDiscount ? (
                      <div>
                        <p className="text-sm text-amber-600 line-through">{course.price} جنيه</p>
                        <p className="text-3xl font-black text-green-700">{finalPrice} جنيه</p>
                        <p className="text-xs text-green-600">بعد خصم {appliedDiscount.code}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-3xl font-black text-amber-700">{course.price} جنيه</p>
                        <p className="text-sm text-amber-600">سعر الكورس كامل</p>
                      </div>
                    )}
                  </div>

                  {/* Discount Code Input */}
                  {!appliedDiscount && (
                    <div className="flex gap-2 mb-4 max-w-sm mx-auto">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="كود الخصم"
                        className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        dir="ltr"
                      />
                      <button
                        onClick={handleApplyDiscount}
                        disabled={applyingDiscount}
                        className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50"
                      >
                        {applyingDiscount ? <Loader2 className="w-5 h-5 animate-spin" /> : "تطبيق"}
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <button
                      onClick={handleSubscribe}
                      disabled={isSubscribing}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
                    >
                      {isSubscribing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Wallet className="w-6 h-6" />
                          اشترك الآن بـ {finalPrice} جنيه
                        </>
                      )}
                    </button>
                    <Link
                      to="/wallet"
                      className="text-sm text-muted-foreground hover:text-primary underline"
                    >
                      ليس لديك رصيد كافٍ؟ اشحن محفظتك
                    </Link>
                  </div>
                </div>
              ) : checkingEnrollment ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : (
                /* Normal Content */
                <>
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
                </>
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

          {/* Question Bank & Summaries */}
          {user && lectures.length > 0 && (
            <div className="mt-8">
              <CourseQuizSection lectures={lectures} />
            </div>
          )}

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

// ─── COURSE QUIZ SECTION (Questions + Summaries) ────────────────────────────────
function CourseQuizSection({ lectures }: { lectures: any[] }) {
  const [selectedLectureId, setSelectedLectureId] = useState(lectures[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"questions" | "summaries">("questions");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">بنك الأسئلة والملخصات</h3>
            <p className="text-xs text-gray-400">اختبر نفسك وحمّل الملخصات</p>
          </div>
        </div>

        {/* Lecture Selector */}
        <select
          value={selectedLectureId}
          onChange={(e) => setSelectedLectureId(e.target.value)}
          className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {lectures.map((l: any) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "questions"
                ? "bg-purple-500 text-white shadow-lg shadow-purple-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            الأسئلة
          </button>
          <button
            onClick={() => setActiveTab("summaries")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "summaries"
                ? "bg-red-500 text-white shadow-lg shadow-red-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            الملخصات
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {activeTab === "questions" ? (
          <QuestionsPanel lectureId={selectedLectureId} />
        ) : (
          <SummariesPanel lectureId={selectedLectureId} />
        )}
      </div>
    </div>
  );
}

// ─── QUESTIONS PANEL ───────────────────────────────────────────────────────────
function QuestionsPanel({ lectureId }: { lectureId: string }) {
  const { user } = useAuth();
  const { data: questions = [] } = useQuestions(lectureId);
  const { data: userAnswers = [] } = useUserAnswers(user?.id || "");
  const submitAnswer = useSubmitAnswer();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const getAnswer = (qId: string) => userAnswers.find((a: any) => a.question_id === qId);

  const handleSelect = (qId: string, option: string) => {
    if (getAnswer(qId)) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = async (q: any) => {
    const selected = selectedAnswers[q.id];
    if (!selected) return;
    const isCorrect = selected === q.correct_answer;
    await submitAnswer.mutateAsync({ user_id: user!.id, question_id: q.id, selected_answer: selected, is_correct });
    setSelectedAnswers((prev) => { const n = { ...prev }; delete n[q.id]; return n; });
  };

  const lectureQuestions = questions;
  const lectureAnswers = userAnswers.filter((a: any) => lectureQuestions.some((q: any) => q.id === a.question_id));
  const correctCount = lectureAnswers.filter((a: any) => a.is_correct).length;
  const totalCount = lectureAnswers.length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  if (lectureQuestions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">مفيش أسئلة للمحاضرة دي لسه</p>
      </div>
    );
  }

  return (
    <div>
      {totalCount > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-emerald-700">نتيجتك في المحاضرة دي</span>
            <span className="text-2xl font-black text-emerald-600">{score}%</span>
          </div>
          <div className="w-full h-2.5 bg-emerald-200 rounded-full">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
          </div>
          <p className="text-xs text-emerald-600 mt-2">{correctCount} إجابة صحيحة من {totalCount}</p>
        </div>
      )}

      <div className="space-y-4">
        {lectureQuestions.map((q: any, i: number) => {
          const answered = getAnswer(q.id);
          const selected = selectedAnswers[q.id];
          const difficultyColors: Record<string, string> = {
            easy: "bg-green-100 text-green-700",
            medium: "bg-amber-100 text-amber-700",
            hard: "bg-red-100 text-red-700",
          };

          return (
            <div key={q.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">س{i + 1}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${difficultyColors[q.difficulty] || ""}`}>
                  {q.difficulty === "easy" ? "سهل" : q.difficulty === "medium" ? "متوسط" : "صعب"}
                </span>
              </div>

              <p className="text-sm font-bold text-gray-800 mb-4 leading-relaxed">{q.question_text}</p>

              {!answered ? (
                <>
                  <div className="space-y-2 mb-4">
                    {[
                      { key: "a", label: q.option_a },
                      { key: "b", label: q.option_b },
                      { key: "c", label: q.option_c },
                      { key: "d", label: q.option_d },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleSelect(q.id, opt.key)}
                        className={`w-full text-right p-3 rounded-xl border-2 text-sm transition-all ${
                          selected === opt.key
                            ? "border-purple-500 bg-purple-50 text-purple-700 font-semibold"
                            : "border-gray-100 hover:border-purple-200 hover:bg-purple-50/50"
                        }`}
                      >
                        <span className="font-bold ml-2 text-base">{opt.key.toUpperCase()})</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {selected && (
                    <button
                      onClick={() => handleSubmit(q)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-200"
                    >
                      تأكيد الإجابة
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-2 mb-3">
                  {[
                    { key: "a", label: q.option_a },
                    { key: "b", label: q.option_b },
                    { key: "c", label: q.option_c },
                    { key: "d", label: q.option_d },
                  ].map((opt) => {
                    const isCorrect = opt.key === q.correct_answer;
                    const isSelected = opt.key === answered.selected_answer;
                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border-2 text-sm ${
                          isCorrect
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold"
                            : isSelected
                            ? "border-red-500 bg-red-50 text-red-700 font-semibold"
                            : "border-gray-100 text-gray-400"
                        }`}
                      >
                        <span className="font-bold ml-2 text-base">{opt.key.toUpperCase()})</span>
                        {opt.label}
                        {isCorrect && <span className="mr-2 text-emerald-600">✓</span>}
                        {isSelected && !isCorrect && <span className="mr-2 text-red-600">✗</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {answered && q.explanation && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 mb-1">💡 الشرح:</p>
                  <p className="text-sm text-blue-600 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SUMMARIES PANEL ───────────────────────────────────────────────────────────
function SummariesPanel({ lectureId }: { lectureId: string }) {
  const { data: summaries = [] } = useSummaries(lectureId);

  if (summaries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">مفيش ملخصات للمحاضرة دي لسه</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {summaries.map((s: any) => (
        <a
          key={s.id}
          href={s.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-200">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{s.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{(s.file_size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <Download className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
        </a>
      ))}
    </div>
  );
}

export default CourseDetail;
