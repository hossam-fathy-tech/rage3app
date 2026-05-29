import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Users, BookOpen, ChevronLeft, Loader2, Star, TrendingUp, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useTeachers, useCourses, useSubjects } from "@/hooks/useData";
import { useAuth } from "@/lib/auth";

type SortKey = "default" | "rating" | "views";

const sortOptions: { key: SortKey; label: string; icon: React.ElementType }[] = [
  { key: "default", label: "الأحدث", icon: Clock },
  { key: "rating", label: "الأعلى تقييمًا", icon: Star },
  { key: "views", label: "الأكثر مشاهدة", icon: TrendingUp },
];

const Teachers = () => {
  const { user } = useAuth();
  const { data: teachers = [], isLoading } = useTeachers();
  const { data: courses = [] } = useCourses(true);
  const { data: subjects = [] } = useSubjects();

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("default");

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

  const teacherSubjectsMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    courses.forEach((c: any) => {
      if (c.teachers && c.subject) {
        c.teachers.forEach((t: any) => {
          if (!map[t.id]) map[t.id] = new Set();
          map[t.id].add(c.subject.name);
        });
      }
    });
    return map;
  }, [courses]);

  const filtered = useMemo(() => {
    let result = teachers.filter((t) => {
      const matchSearch = !search || t.name.includes(search) || (t.specialty || "").includes(search);
      const subjectNames = teacherSubjectsMap[t.id];
      const matchSubject = selectedSubject === "all" ||
        (subjectNames && subjectNames.has(subjects.find((s: any) => s.id === selectedSubject)?.name || ""));
      return matchSearch && matchSubject;
    });

    // Sort
    if (sortBy === "rating") {
      result = [...result].sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    } else if (sortBy === "views") {
      result = [...result].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    }

    return result;
  }, [teachers, search, selectedSubject, sortBy, teacherSubjectsMap, subjects]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <BottomNav />

      <main className="lg:mr-[260px] pt-16 pb-28 lg:pb-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-5xl mx-auto mt-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">المعلمين</h1>
              <p className="text-sm text-muted-foreground">اختار معلملك وابدأ المذاكرة</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-white rounded-2xl border border-border/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن معلم..."
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="all">كل المواد</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Sort Tabs */}
            <div className="flex gap-2">
              {sortOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sortBy === opt.key
                        ? "bg-primary/10 text-primary font-bold"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Teachers Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((teacher) => {
              const courseCount = courseCountMap[teacher.id] || 0;
              const subjectNames = teacherSubjectsMap[teacher.id];
              return (
                <Link
                  key={teacher.id}
                  to={`/teacher/${teacher.id}`}
                  className="bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {teacher.avatar ? (
                        <img src={teacher.avatar} alt={teacher.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-black text-primary flex-shrink-0">
                          {teacher.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{teacher.name}</h3>
                        {teacher.specialty && <p className="text-xs text-muted-foreground mt-0.5 truncate">{teacher.specialty}</p>}
                        {subjectNames && subjectNames.size > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {[...subjectNames].slice(0, 3).map((name) => (
                              <span key={name} className="text-[10px] font-medium bg-primary/5 text-primary px-2 py-0.5 rounded-full">{name}</span>
                            ))}
                            {subjectNames.size > 3 && <span className="text-[10px] text-muted-foreground">+{subjectNames.size - 3}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer with rating + views + courses */}
                  <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Rating */}
                      {(teacher.rating_count ?? 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-foreground">{Number(teacher.rating_avg || 0).toFixed(1)}</span>
                          <span className="text-[10px] text-muted-foreground">({teacher.rating_count})</span>
                        </div>
                      )}
                      {/* Views */}
                      {(teacher.views_count ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-[10px] font-medium">{teacher.views_count}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{courseCount} كورس</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">مفيش معلمين</p>
            {(search || selectedSubject !== "all") && (
              <button onClick={() => { setSearch(""); setSelectedSubject("all"); }} className="text-primary text-sm font-medium mt-2 hover:underline">
                مسح الفلاتر
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Teachers;
