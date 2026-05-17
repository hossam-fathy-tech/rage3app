import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CourseCard from "@/components/features/CourseCard";
import { useCourses, useSubjects, useTeachers } from "@/hooks/useData";

const Courses = () => {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get("subject") || "all";

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedTeacher, setSelectedTeacher] = useState("all");

  const { data: courses = [], isLoading: coursesLoading } = useCourses(true);
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();

  const filtered = courses.filter((c) => {
    const matchSubject = selectedSubject === "all" || c.subject_id === selectedSubject;
    const matchTeacher =
      selectedTeacher === "all" ||
      (c.teachers ?? []).some((t) => t.id === selectedTeacher);
    const matchSearch =
      c.title.includes(search) || (c.description || "").includes(search);
    return matchSubject && matchTeacher && matchSearch;
  });

  const reset = () => {
    setSearch("");
    setSelectedSubject("all");
    setSelectedTeacher("all");
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="pt-24 pb-16">
        {/* Page Header */}
        <div className="gradient-hero py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-black text-white mb-3">الكورسات</h1>
            <p className="text-white/75 text-lg">
              {courses.length} كورس متاح من أفضل المعلمين
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-8">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث عن كورس..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm text-right"
                />
              </div>

              {/* Subject Filter */}
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs text-muted-foreground font-medium">المادة</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-right"
                >
                  <option value="all">كل المواد</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Teacher Filter */}
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs text-muted-foreground font-medium">المعلم</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-right"
                >
                  <option value="all">كل المعلمين</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Reset */}
              <button
                onClick={reset}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl px-4 py-2.5 transition-colors"
              >
                <Filter className="w-4 h-4" />
                إعادة تعيين
              </button>
            </div>
          </div>

          {/* Results Count */}
          {!coursesLoading && (
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-bold text-foreground">{filtered.length}</span> كورس
            </p>
          )}

          {/* Grid */}
          {coursesLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-muted-foreground text-lg font-medium">مفيش كورسات بالفلاتر دي</p>
              <button
                onClick={reset}
                className="mt-4 text-primary font-bold hover:underline text-sm"
              >
                إزالة الفلاتر
              </button>
            </div>
          )}
        </div>
      </main>
</div>
  );
};

export default Courses;
