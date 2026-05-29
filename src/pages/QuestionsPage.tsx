import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Search, Filter, ChevronLeft, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useCourses, useSubjects } from "@/hooks/useData";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function QuestionsPage() {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const { data: subjects = [] } = useSubjects();
  const { data: courses = [] } = useCourses(true);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["global-questions", selectedSubject],
    queryFn: async () => {
      let query = supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (selectedSubject !== "all") {
        const lectureIds = courses
          .filter(c => c.subject_id === selectedSubject)
          .map(c => c.id);
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

  const { data: userAnswers = [] } = useQuery({
    queryKey: ["user-answers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from("user_answers").select("*").eq("user_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const submitAnswer = useMutation({
    mutationFn: async (payload: { user_id: string; question_id: string; selected_answer: string; is_correct: boolean }) => {
      const { data, error } = await supabase.from("user_answers").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      const qc = useQueryClient();
      qc.invalidateQueries({ queryKey: ["user-answers", user?.id] });
    },
  });

  const filtered = useMemo(() => {
    if (!search) return questions;
    return questions.filter((q: any) => q.question_text.includes(search));
  }, [questions, search]);

  const getAnswer = (qId: string) => userAnswers.find((a: any) => a.question_id === qId);

  const handleSelect = (qId: string, option: string) => {
    if (getAnswer(qId)) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = async (q: any) => {
    const selected = selectedAnswers[q.id];
    if (!selected || !user) return;
    const isCorrect = selected === q.correct_answer;
    await submitAnswer.mutateAsync({ user_id: user.id, question_id: q.id, selected_answer: selected, is_correct });
    setSelectedAnswers((prev) => { const n = { ...prev }; delete n[q.id]; return n; });
  };

  const correctCount = userAnswers.filter((a: any) => a.is_correct).length;
  const totalCount = userAnswers.length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      <Header />
      <BottomNav />

      <main className="lg:mr-[260px] max-w-4xl mx-auto px-4 pt-16 pb-24 lg:pb-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">بنك الأسئلة</h1>
              <p className="text-white/70 text-sm">اختبر نفسك في كل المواد</p>
            </div>
          </div>
          {totalCount > 0 && (
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex justify-between text-sm mb-1">
                <span>نتيجتك الإجمالية</span>
                <span className="font-black text-lg">{score}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${score}%` }} />
              </div>
              <p className="text-xs text-white/70 mt-1">{correctCount} صحيح من {totalCount}</p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في الأسئلة..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">كل المواد</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Questions */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((q: any, i: number) => {
              const answered = getAnswer(q.id);
              const selected = selectedAnswers[q.id];
              const difficultyColors: Record<string, string> = {
                easy: "bg-green-100 text-green-700",
                medium: "bg-amber-100 text-amber-700",
                hard: "bg-red-100 text-red-700",
              };

              return (
                <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">س{i + 1}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${difficultyColors[q.difficulty] || ""}`}>
                      {q.difficulty === "easy" ? "سهل" : q.difficulty === "medium" ? "متوسط" : "صعب"}
                    </span>
                  </div>
                  <p className="text-base font-bold text-gray-800 mb-4 leading-relaxed">{q.question_text}</p>

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
                                : "border-gray-100 hover:border-purple-200"
                            }`}
                          >
                            <span className="font-bold ml-2 text-base">{opt.key.toUpperCase()})</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {selected && user && (
                        <button
                          onClick={() => handleSubmit(q)}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold py-3 rounded-xl shadow-lg shadow-purple-200"
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
                              isCorrect ? "border-primary bg-primary/5 text-primary font-semibold" :
                              isSelected ? "border-red-500 bg-red-50 text-red-700 font-semibold" :
                              "border-gray-100 text-gray-400"
                            }`}
                          >
                            <span className="font-bold ml-2 text-base">{opt.key.toUpperCase()})</span>
                            {opt.label}
                            {isCorrect && <span className="mr-2 text-primary">✓</span>}
                            {isSelected && !isCorrect && <span className="mr-2 text-red-600">✗</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(answered || !user) && q.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-700 mb-1">💡 الشرح:</p>
                      <p className="text-sm text-blue-600">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">مفيش أسئلة لسه</p>
            <Link to="/courses" className="text-primary font-bold mt-2 inline-block hover:underline">
              تصفح الكورسات
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
