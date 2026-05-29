import { useParams, Link } from "react-router-dom";
import { ArrowRight, BookMarked, Users, ChevronLeft, Loader2, Star, Heart, Eye, Bell, BellOff, BellRing } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CourseCard from "@/components/features/CourseCard";
import { useTeacher, useCoursesByTeacher, useTeacherRating, useRateTeacher, useIsFollowingTeacher, useToggleFollowTeacher, useFollowNotifSetting, useUpdateFollowNotifSetting } from "@/hooks/useData";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useState } from "react";

const TeacherProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: teacher, isLoading: teacherLoading } = useTeacher(id!);
  const { data: courses = [], isLoading: coursesLoading } = useCoursesByTeacher(id!);
  const { data: myRating } = useTeacherRating(id!, user?.id);
  const rateTeacher = useRateTeacher();
  const { data: isFollowing } = useIsFollowingTeacher(id!, user?.id);
  const toggleFollow = useToggleFollowTeacher();
  const { data: notifSetting } = useFollowNotifSetting(id!, user?.id);
  const updateNotifSetting = useUpdateFollowNotifSetting();
  const [hoverRating, setHoverRating] = useState(0);

  if (teacherLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <h2 className="text-2xl font-bold text-foreground mb-2">المعلم غير موجود</h2>
          <Link to="/teachers" className="text-primary font-bold hover:underline">الرجوع لصفحة المعلمين</Link>
        </div>
      </div>
    );
  }

  const handleRate = async (rating: number) => {
    if (!user) { toast.error("سجّل الدخول الأول"); return; }
    try {
      await rateTeacher.mutateAsync({ teacherId: id!, userId: user.id, rating });
      toast.success("تم التقييم بنجاح");
    } catch {
      toast.error("فشل التقييم");
    }
  };

  const handleFollow = async () => {
    if (!user) { toast.error("سجّل الدخول الأول"); return; }
    try {
      await toggleFollow.mutateAsync({ teacherId: id!, userId: user.id, isFollowing: !!isFollowing });
      toast.success(isFollowing ? "تم إلغاء المتابعة" : "تم المتابعة");
    } catch {
      toast.error("حدث خطأ");
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <BottomNav />

      <main className="lg:mr-[260px] pt-16 pb-28 lg:pb-8">
        {/* Hero Section */}
        <div className="bg-[#0F172A] py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {teacher.avatar ? (
                  <img src={teacher.avatar} alt={teacher.name} className="w-28 h-28 rounded-2xl object-cover shadow-2xl ring-4 ring-white/10" />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-primary/20 flex items-center justify-center text-4xl font-black text-primary shadow-2xl ring-4 ring-white/10">
                    {teacher.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-center sm:text-right flex-1">
                <p className="text-white/40 text-xs font-medium mb-1 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Users className="w-3.5 h-3.5" />
                  معلم
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{teacher.name}</h1>
                {teacher.specialty && (
                  <span className="inline-block bg-white/10 text-white/70 text-xs font-medium px-3 py-1 rounded-full mb-4">
                    {teacher.specialty}
                  </span>
                )}
                {teacher.bio && (
                  <p className="text-white/50 text-sm leading-relaxed max-w-2xl">{teacher.bio}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 mt-6 justify-center sm:justify-start flex-wrap">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{courses.length}</p>
                    <p className="text-white/40 text-xs mt-0.5">كورس</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">
                      {courses.reduce((sum, c) => sum + (c.lecture_count ?? 0), 0)}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">محاضرة</p>
                  </div>
                  {(teacher.rating_count ?? 0) > 0 && (
                    <>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="text-center">
                        <p className="text-2xl font-black text-amber-400 flex items-center gap-1 justify-center">
                          <Star className="w-5 h-5 fill-amber-400" />
                          {Number(teacher.rating_avg || 0).toFixed(1)}
                        </p>
                        <p className="text-white/40 text-xs mt-0.5">{teacher.rating_count} تقييم</p>
                      </div>
                    </>
                  )}
                  {(teacher.views_count ?? 0) > 0 && (
                    <>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="text-center">
                        <p className="text-2xl font-black text-white flex items-center gap-1 justify-center">
                          <Eye className="w-5 h-5 text-white/60" />
                          {teacher.views_count}
                        </p>
                        <p className="text-white/40 text-xs mt-0.5">مشاهدة</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-6 justify-center sm:justify-start">
                  {/* Follow Button */}
                  {user && (
                    <button
                      onClick={handleFollow}
                      disabled={toggleFollow.isPending}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isFollowing
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/15"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFollowing ? "fill-primary" : ""}`} />
                      {isFollowing ? "متابع" : "متابعة"}
                    </button>
                  )}

                  {/* Notif Setting Button */}
                  {user && isFollowing && (
                    <button
                      onClick={async () => {
                        if (!id || !user) return;
                        const options = ["all", "courses_only", "lessons_only", "muted"];
                        const idx = options.indexOf(notifSetting || "all");
                        const next = options[(idx + 1) % options.length];
                        await updateNotifSetting.mutateAsync({ teacherId: id, userId: user.id, notify_setting: next });
                        const labels: Record<string, string> = {
                          all: "🔔 كل الإشعارات",
                          courses_only: "📚 الكورسات فقط",
                          lessons_only: "▶️ الدروس فقط",
                          muted: "🔇 كتم الإشعارات",
                        };
                        toast.success(labels[next] || next);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        notifSetting === "muted"
                          ? "bg-white/5 text-white/40 border-white/5"
                          : "bg-white/10 text-white/70 border-white/10 hover:bg-white/15"
                      }`}
                    >
                      {notifSetting === "muted" ? <BellOff className="w-3.5 h-3.5" /> : notifSetting === "courses_only" || notifSetting === "lessons_only" ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      {notifSetting === "all" ? "إشعارات" : notifSetting === "courses_only" ? "كورسات" : notifSetting === "lessons_only" ? "دروس" : "مكتوم"}
                    </button>
                  )}

                  {/* Rate Button */}
                  {user && !myRating && (
                    <div className="flex items-center gap-1 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star className={`w-5 h-5 ${(hoverRating || 0) >= star ? "text-amber-400 fill-amber-400" : "text-white/30"}`} />
                        </button>
                      ))}
                    </div>
                  )}

                  {user && myRating && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-amber-400">تقييمك: {myRating.rating}/5</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookMarked className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">كورسات {teacher.name}</h2>
              <p className="text-muted-foreground text-xs">{courses.length} كورس متاح</p>
            </div>
          </div>

          {coursesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium">لا توجد كورسات بعد</p>
            </div>
          )}

          <div className="mt-8">
            <Link to="/teachers" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              <ArrowRight className="w-4 h-4" />
              الرجوع لصفحة المعلمين
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherProfile;
