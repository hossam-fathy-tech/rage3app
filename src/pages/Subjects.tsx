import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SubjectCard from "@/components/features/SubjectCard";
import { useSubjects, useCourses } from "@/hooks/useData";

const Subjects = () => {
  const [search, setSearch] = useState("");
  const { data: subjects = [], isLoading } = useSubjects();
  const { data: courses = [] } = useCourses(false);

  // Count courses per subject
  const courseCountMap: Record<string, number> = {};
  courses.forEach((c) => {
    if (c.subject_id) {
      courseCountMap[c.subject_id] = (courseCountMap[c.subject_id] || 0) + 1;
    }
  });

  const filtered = subjects.filter(
    (s) => s.name.includes(search) || (s.description || "").includes(search)
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="pt-24 pb-16">
        {/* Page Header */}
        <div className="gradient-hero py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-black text-white mb-3">المواد الدراسية</h1>
            <p className="text-white/75 text-lg">اختر مادتك واكتشف الكورسات المتاحة</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          {/* Search */}
          <div className="relative max-w-md mb-10">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن مادة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-12 pl-4 py-3 rounded-xl border border-border bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-right"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((subject, i) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  courseCount={courseCountMap[subject.id] || 0}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">{search ? "🔍" : "📚"}</p>
              <p className="text-muted-foreground text-lg font-medium">
                {search ? `مفيش نتائج لـ "${search}"` : "لم تُضَف مواد بعد"}
              </p>
            </div>
          )}

          {!isLoading && (
            <p className="text-muted-foreground text-sm mt-8 text-center">
              إجمالي {filtered.length} مادة دراسية
            </p>
          )}
        </div>
      </main>
</div>
  );
};

export default Subjects;
