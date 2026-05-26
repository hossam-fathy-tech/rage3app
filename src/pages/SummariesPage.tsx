import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FileText, Search, Download, Loader2, ExternalLink, Link2, Eye } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PDFViewer from "@/components/features/PDFViewer";
import { useCourses, useSubjects } from "@/hooks/useData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function SummariesPage() {
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [search, setSearch] = useState("");
  const [viewingPDF, setViewingPDF] = useState<{ url: string; title: string } | null>(null);

  const { data: subjects = [] } = useSubjects();
  const { data: courses = [] } = useCourses(true);

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ["global-summaries", selectedSubject],
    queryFn: async () => {
      let query = supabase.from("summaries").select("*").order("created_at", { ascending: false });
      if (selectedSubject !== "all") {
        const lectureIds = courses
          .filter((c: any) => c.subject_id === selectedSubject)
          .map((c: any) => c.id);
        if (lectureIds.length > 0) {
          query = query.in("lecture_id", lectureIds);
        } else {
          return [];
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!search) return summaries;
    return summaries.filter((s: any) => s.title.includes(search));
  }, [summaries, search]);

  const openPDF = (url: string, title: string) => {
    setViewingPDF({ url, title });
  };

  const downloadFile = (url: string, title: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = title || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      <Header />
      <BottomNav />

      <main className="lg:mr-[260px] max-w-4xl mx-auto px-4 pt-16 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">الملخصات</h1>
              <p className="text-white/70 text-sm">حمّل ملخصات كل المواد</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في الملخصات..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">كل المواد</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summaries */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => s.file_type === "file" ? downloadFile(s.file_url, s.title) : openPDF(s.file_url, s.title)}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${s.file_type === "link" ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-200" : "bg-gradient-to-br from-red-500 to-orange-500 shadow-red-200"}`}>
                  {s.file_type === "link" ? <Link2 className="w-7 h-7 text-white" /> : <FileText className="w-7 h-7 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-800 truncate">{s.title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{s.file_type === "link" ? "رابط خارجي" : `${(s.file_size / 1024 / 1024).toFixed(2)} MB`}</p>
                </div>
                <div className="flex gap-2">
                  {s.file_type === "link" ? (
                    <a
                      href={s.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadFile(s.file_url, s.title); }}
                      className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">مفيش ملخصات لسه</p>
            <Link to="/courses" className="text-emerald-600 font-bold mt-2 inline-block hover:underline">
              تصفح الكورسات
            </Link>
          </div>
        )}
      </main>

      {/* PDF Viewer Modal */}
      {viewingPDF && (
        <PDFViewer
          url={viewingPDF.url}
          title={viewingPDF.title}
          onClose={() => setViewingPDF(null)}
        />
      )}
    </div>
  );
}
