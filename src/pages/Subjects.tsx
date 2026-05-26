import { useState, useMemo } from "react";
import { Search, Loader2, Layers } from "lucide-react";
import Header from "@/components/layout/Header";
import SubjectCard from "@/components/features/SubjectCard";
import { useSubjects, useCourses } from "@/hooks/useData";
import { useAuth } from "@/lib/auth";

const trackOptions = [
  { id: "all", label: "كل الشعب", color: "bg-gray-500" },
  { id: "science-bio", label: "علمي علوم", color: "bg-emerald-500" },
  { id: "science-math", label: "علمي رياضة", color: "bg-blue-500" },
  { id: "literary", label: "أدبي", color: "bg-amber-500" },
];

const Subjects = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState(user?.track || "all");
  const { data: subjects = [], isLoading } = useSubjects();
  const { data: courses = [] } = useCourses(false);

  const courseCountMap: Record<string, number> = {};
  courses.forEach((c) => {
    if (c.subject_id) {
      courseCountMap[c.subject_id] = (courseCountMap[c.subject_id] || 0) + 1;
    }
  });

  const filtered = useMemo(() => {
    return subjects.filter((s: any) => {
      const matchSearch = s.name.includes(search) || (s.description || "").includes(search);
      const matchTrack = trackFilter === "all" || !s.tracks || s.tracks.includes(trackFilter);
      return matchSearch && matchTrack;
    });
  }, [subjects, search, trackFilter]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="lg:mr-[260px] pt-16 pb-24 lg:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="gradient-hero py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-black text-white mb-3">المواد الدراسية</h1>
            <p className="text-white/75 text-lg">اختر مادتك واكتشف الكورسات المتاحة</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          {/* Track Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {trackOptions.map((track) => (
              <button
                key={track.id}
                onClick={() => setTrackFilter(track.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  trackFilter === track.id
                    ? "bg-white text-gray-800 shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${track.color}`} />
                {track.label}
              </button>
            ))}
          </div>

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
              <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground text-lg font-medium">
                {search ? `مفيش نتائج لـ "${search}"` : "مفيش مواد للشعبة دي لسه"}
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
