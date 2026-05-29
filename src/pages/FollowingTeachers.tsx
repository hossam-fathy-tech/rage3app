import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, ChevronLeft, Loader2, Star, BookOpen, Users as UsersIcon, Bell, BellOff, Video, GraduationCap, SlidersHorizontal, X } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useFollowedTeachers, useUpdateFollowNotifSetting, useTeachers, useCourses } from "@/hooks/useData";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const sortOptions = [
  { key: "recent", label: "آخر متابعة" },
  { key: "rating", label: "الأعلى تقييمًا" },
  { key: "views", label: "الأكثر مشاهدة" },
  { key: "name", label: "الاسم" },
];

const FollowingTeachers = () => {
  const { user } = useAuth();
  const { data: followed, isLoading } = useFollowedTeachers(user?.id);
  const { data: teachers = [] } = useTeachers();
  const { data: courses = [] } = useCourses(true);
  const updateNotif = useUpdateFollowNotifSetting();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterNotif, setFilterNotif] = useState<string>("all");

  const courseCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    courses.forEach((c: any) => {
      if (c.teachers) {
        c.teachers.forEach((t: any) => {
          map[t.id] = (map[t.id] || 0) + 1;
        });
      }
    });
    return map;
  }, [courses]);

  const followerCounts = useMemo(() => {
    const map: Record<string, number> = {};
    followed?.forEach((f: any) => {
      map[f.teacher_id] = (map[f.teacher_id] || 0) + 1;
    });
    // Also count from teachers list to get total followers per teacher
    const totalMap: Record<string, number> = {};
    // This would need a separate query - skip for now
    return map;
  }, [followed]);

  const sorted = useMemo(() => {
    if (!followed) return [];
    let list = [...followed];

    // Filter by notification setting
    if (filterNotif !== "all") {
      list = list.filter((f: any) => f.notify_setting === filterNotif);
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f: any) => f.teacher?.name?.toLowerCase().includes(q) || f.teacher?.specialty?.toLowerCase().includes(q));
    }

    // Sort
    if (sortBy === "rating") {
      list.sort((a: any, b: any) => (b.teacher?.rating_avg || 0) - (a.teacher?.rating_avg || 0));
    } else if (sortBy === "views") {
      list.sort((a: any, b: any) => (b.teacher?.views_count || 0) - (a.teacher?.views_count || 0));
    } else if (sortBy === "name") {
      list.sort((a: any, b: any) => a.teacher?.name?.localeCompare(b.teacher?.name || "") || 0);
    }
    // 'recent' is default order from query

    return list;
  }, [followed, search, sortBy, filterNotif]);

  const handleNotifSetting = async (teacherId: string, currentSetting: string) => {
    if (!user) return;
    const options = ["all", "courses_only", "lessons_only", "muted"];
    const idx = options.indexOf(currentSetting);
    const next = options[(idx + 1) % options.length];
    await updateNotif.mutateAsync({ teacherId, userId: user.id, notify_setting: next });
    toast.success(getNotifLabel(next));
  };

  const getNotifLabel = (setting: string) => {
    const labels: Record<string, string> = {
      all: "🔔 كل الإشعارات",
      courses_only: "📚 الكورسات فقط",
      lessons_only: "▶️ الدروس فقط",
      muted: "🔇 كتم الإشعارات",
    };
    return labels[setting] || setting;
  };

  const getNotifIcon = (setting: string) => {
    if (setting === "muted") return BellOff;
    return Bell;
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <BottomNav />

      <main className="lg:mr-[260px] pt-16 pb-28 lg:pb-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-5xl mx-auto mt-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">المعلمين المتابَعين</h1>
              <p className="text-sm text-muted-foreground">تابع كل جديد من معلمينك المفضلين</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-white rounded-2xl border border-border/60 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن معلم..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sortBy === opt.key
                      ? "bg-primary/10 text-primary font-bold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <div className="flex-1" />
              {/* Notif filter */}
              {["all", "muted"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterNotif(f === filterNotif ? "all" : f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterNotif === f
                      ? "bg-primary/10 text-primary font-bold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {f === "muted" ? "مكتوم" : "الكل"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sorted.length > 0 ? (
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map((follow: any) => {
              const teacher = follow.teacher;
              if (!teacher) return null;
              const courseCount = courseCountMap[teacher.id] || 0;
              const NotifIcon = getNotifIcon(follow.notify_setting);
              const notifColors: Record<string, string> = {
                all: "text-primary",
                courses_only: "text-amber-500",
                lessons_only: "text-blue-500",
                muted: "text-muted-foreground/40",
              };

              return (
                <div key={follow.id} className="bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                  {/* Main card */}
                  <Link to={`/teacher/${teacher.id}`} className="block p-5">
                    <div className="flex items-start gap-4">
                      {teacher.avatar ? (
                        <img src={teacher.avatar} alt={teacher.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-black text-primary flex-shrink-0">
                          {teacher.name?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{teacher.name}</h3>
                        {teacher.specialty && <p className="text-xs text-muted-foreground mt-0.5 truncate">{teacher.specialty}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          {(teacher.rating_count ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="text-xs font-bold text-foreground">{Number(teacher.rating_avg || 0).toFixed(1)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{courseCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between">
                    {/* Notif setting toggle */}
                    <button
                      onClick={() => handleNotifSetting(teacher.id, follow.notify_setting)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${notifColors[follow.notify_setting] || "text-muted-foreground"} hover:text-primary`}
                      title={getNotifLabel(follow.notify_setting)}
                    >
                      <NotifIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {follow.notify_setting === "muted" ? "مكتوم" : follow.notify_setting === "courses_only" ? "كورسات" : follow.notify_setting === "lessons_only" ? "دروس" : "كل الإشعارات"}
                      </span>
                    </button>

                    {/* Unfollow */}
                    <button
                      onClick={async () => {
                        if (!user) return;
                        const { useToggleFollowTeacher } = await import("@/hooks/useData");
                        // Simpler: use the existing hook via direct supabase call
                        const { supabase } = await import("@/lib/supabase");
                        await supabase.from("teacher_followers").delete().eq("teacher_id", teacher.id).eq("user_id", user.id);
                        toast.success("تم إلغاء متابعة " + teacher.name);
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive font-medium transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      إلغاء المتابعة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium mb-2">مفيش معلمين متابعين</p>
            <p className="text-sm text-muted-foreground/60 mb-6">تابع معلمين عشان يوصلك كل جديد</p>
            <Link to="/teachers" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
              <UsersIcon className="w-4 h-4" />
              تصفح المعلمين
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default FollowingTeachers;
