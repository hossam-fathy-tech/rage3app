import { useState, useMemo, useEffect, useRef } from "react";
import heroImage from "@/assets/hero-banner.jpg";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Play, Users, BookOpen, Award, CheckCircle, 
  Loader2, Sparkles, Zap, Shield, Clock, 
  GraduationCap, Video, ChevronDown, LogOut,
  BookMarked, TrendingUp, Star, Target, Layers,
  FlaskConical, Calculator, ChevronLeft, ExternalLink, Wallet
} from "lucide-react";
import Header from "@/components/layout/Header";
import SubjectCard from "@/components/features/SubjectCard";
import CourseCard from "@/components/features/CourseCard";
import { useSubjects, useCourses, useActivities, useHomeBlocks } from "@/hooks/useData";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  { 
    title: "محتوى منظم", 
    desc: "هيكل واضح من المادة للدرس بدون تشتت", 
    icon: BookMarked, 
    color: "from-emerald-500 to-teal-600"
  },
  { 
    title: "متابعة التقدم", 
    desc: "شوف نسبة إنجازك في كل كورس بوضوح", 
    icon: TrendingUp, 
    color: "from-blue-500 to-indigo-600"
  },
  { 
    title: "فيديوهات عالية الجودة", 
    desc: "شرح من أفضل المعلمين في مصر", 
    icon: Video, 
    color: "from-purple-500 to-pink-600"
  },
  { 
    title: "بحث سريع", 
    desc: "ابحث عن أي محاضرة في ثواني", 
    icon: Zap, 
    color: "from-amber-500 to-orange-600"
  },
  { 
    title: "متاح 24/7", 
    desc: "ذاكر في أي وقت ومن أي مكان", 
    icon: Clock, 
    color: "from-cyan-500 to-blue-600"
  },
  { 
    title: "مجاني بالكامل", 
    desc: "ابدأ مجانًا بدون بطاقة ائتمان", 
    icon: Shield, 
    color: "from-rose-500 to-red-600"
  },
];

const testimonials = [
  { name: "أحمد محمد", grade: "ثانية ثانوي", text: "المنصة ساعدتني أفهم الرياضيات بشكل أفضل. الشرح واضح ومنظم.", rating: 5 },
  { name: "سارة أحمد", grade: "ثالثة ثانوي", text: "محتوى رائع ومجاني، أنقذني في الامتحانات. أنصح كل الطلاب بالتسجيل.", rating: 5 },
  { name: "محمد علي", grade: "أولى ثانوي", text: "أفضل منصة ذاكرت فيها. الكورسات منظمة والفيديوهات واضحة.", rating: 5 },
];

const faqs = [
  { q: "هل المنصة مجانية؟", a: "نعم، المنصة مجانية بالكامل ولا تحتاج أي بطاقة ائتمان أو اشتراك." },
  { q: "كيف أبدأ؟", a: "سجل دخولك بحساب جوجل أو إيميلك وابدأ بتصفح المواد والكورسات مباشرة." },
  { q: "هل هناك محتوى للثانوية العامة؟", a: "نعم، المنصة مخصصة لطلاب الثانوية العامة بجميع الصفوف." },
  { q: "هل أستطيع متابعة تقدمي؟", a: "بالطبع! بعد تسجيل الدخول تقدر تتابع نسبة إنجازك في كل كورس." },
];

const Index = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setAuthTimedOut(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: courses = [], isLoading: coursesLoading } = useCourses(true);
  const { data: activities = [], isLoading: activitiesLoading } = useActivities();
  const { data: homeBlocks = [] } = useHomeBlocks(user?.track);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [animatedSubjects, setAnimatedSubjects] = useState(0);
  const [animatedCourses, setAnimatedCourses] = useState(0);
  const [animatedLectures, setAnimatedLectures] = useState(0);
  const hasAnimated = useRef(false);

  const filteredSubjects = useMemo(() => {
    if (!user?.track) return subjects;
    return subjects.filter((s: any) => !s.tracks || s.tracks.includes(user.track!));
  }, [subjects, user?.track]);

  const filteredCourses = useMemo(() => {
    if (!user?.track) return courses;
    return courses.filter((c: any) => {
      const subject = subjects.find((s: any) => s.id === c.subject_id);
      return !subject?.tracks || subject.tracks.includes(user.track!);
    });
  }, [courses, subjects, user?.track]);

  const latestCourses = filteredCourses.slice(0, 4);

  const totalLectures = useMemo(() => {
    return filteredCourses.reduce((sum, course) => sum + (course.lectures_count || 0), 0);
  }, [filteredCourses]);

  const uniqueTeachers = useMemo(() => {
    const teachers = new Set(filteredCourses.map(c => c.teacher_id || c.teacher_name));
    return teachers.size;
  }, [filteredCourses]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const trackInfo: Record<string, { name: string; color: string; icon: any }> = {
    "science-bio": { name: "علمي علوم", color: "from-emerald-500 to-teal-500", icon: BookOpen },
    "science-math": { name: "علمي رياضة", color: "from-blue-500 to-indigo-500", icon: Target },
    "literary": { name: "أدبي", color: "from-amber-500 to-orange-500", icon: Layers },
  };

  const quickActions = [
    { label: "المواد", icon: BookOpen, to: "/subjects", color: "from-emerald-500 to-teal-500", desc: "تصفح موادك" },
    { label: "الكورسات", icon: Video, to: "/courses", color: "from-blue-500 to-indigo-500", desc: "كل الكورسات" },
    { label: "التحديات", icon: Target, to: "/challenges", color: "from-purple-500 to-pink-500", desc: "اختبر نفسك" },
    { label: "المحفظة", icon: Wallet, to: "/wallet", color: "from-amber-500 to-orange-500", desc: "رصيدك" },
  ];

  useEffect(() => {
    if (user && user.role === 'teacher') {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setAuthTimedOut(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!user || hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 1500;
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedSubjects(Math.round(filteredSubjects.length * eased));
      setAnimatedCourses(Math.round(filteredCourses.length * eased));
      setAnimatedLectures(Math.round(totalLectures * eased));
      if (step >= steps) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [user, filteredSubjects.length, filteredCourses.length, totalLectures]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("activities_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        () => {
          qc.invalidateQueries({ queryKey: ["activities"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Student Dashboard for logged-in users
  if (user && !loading) {
    const track = user.track ? trackInfo[user.track] : null;
    const TrackIcon = track?.icon || GraduationCap;

    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Header />

        <main className="lg:mr-[260px] px-4 sm:px-6 lg:px-8 py-8 pt-20">
          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 mb-8"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${track?.color || "from-emerald-500 to-teal-500"} flex items-center justify-center shadow-lg`}
                >
                  <TrackIcon className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">أهلاً بيك، {user.username}</h1>
                  {track && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm font-medium`}>
                        {track.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10"
                >
                  <p className="text-2xl font-black text-white">{animatedSubjects}</p>
                  <p className="text-white/50 text-sm">موادك</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10"
                >
                  <p className="text-2xl font-black text-white">{animatedCourses}</p>
                  <p className="text-white/50 text-sm">كورسات</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10"
                >
                  <p className="text-2xl font-black text-white">{animatedLectures}</p>
                  <p className="text-white/50 text-sm">محاضرة</p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Home Page Blocks */}
          {homeBlocks.length > 0 && (
            <div className="space-y-6 mb-8">
              {homeBlocks.map((block: any, i: number) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <HomeBlockRenderer block={block} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <section className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action, i) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Link
                    to={action.to}
                    className="group bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 block"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-bold text-gray-800 text-sm">{action.label}</p>
                    <p className="text-xs text-gray-400">{action.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Activity Feed & Latest Courses */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Activity Feed */}
            <section className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">آخر النشاطات</h2>
                    <p className="text-xs text-slate-400">محتوى جديد اتضاف</p>
                  </div>
                </div>

                {activitiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice(0, 8).map((activity: any, i: number) => {
                      const iconMap: Record<string, any> = {
                        course: BookOpen,
                        lecture: Video,
                        teacher: GraduationCap,
                        subject: Layers,
                      };
                      const Icon = iconMap[activity.type] || Sparkles;
                      const colorMap: Record<string, string> = {
                        course: "from-blue-500 to-cyan-500",
                        lecture: "from-emerald-500 to-teal-500",
                        teacher: "from-purple-500 to-pink-500",
                        subject: "from-amber-500 to-orange-500",
                      };
                      const timeAgo = (date: string) => {
                        const now = new Date();
                        const then = new Date(date);
                        const diff = now.getTime() - then.getTime();
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        if (hours < 1) return "الآن";
                        if (hours < 24) return `منذ ${hours} ساعة`;
                        const days = Math.floor(hours / 24);
                        return `منذ ${days} يوم`;
                      };

                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorMap[activity.type] || "from-gray-500 to-gray-600"} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 font-medium">{activity.title || activity.description}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(activity.created_at)}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400 text-sm">مفيش نشاطات لسه</p>
                  </div>
                )}
              </div>
            </section>

            {/* Latest Courses */}
            <section className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">أحدث الكورسات</h2>
                  <p className="text-slate-500 mt-1">ابدأ بأي كورس دلوقتي</p>
                </div>
                <Link to="/courses" className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline text-sm">
                  عرض الكل
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>

              {coursesLoading ? (
                <div className="flex justify-center py-16 bg-white rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : latestCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {latestCourses.map((course: any, i: number) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <CourseCard course={course} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">مفيش كورسات مضافة لسه</p>
                </div>
              )}
            </section>
          </div>

          {/* Subjects Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">موادك الدراسية</h2>
                <p className="text-slate-500 mt-1">اختر مادة وابدأ المذاكرة</p>
              </div>
              <Link to="/subjects" className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline text-sm">
                عرض الكل
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            {subjectsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : filteredSubjects.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredSubjects.map((subject: any, i: number) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <SubjectCard subject={subject} index={i} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">مفيش مواد مضافة لشعبتك لسه</p>
                <p className="text-gray-400 text-sm mt-1">هنتواصل معاك أول ما يضاف محتوى جديد</p>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // Loading state (with timeout fallback)
  if (loading && !authTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Landing Page for visitors (or if auth timed out)
  if (!user || authTimedOut) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <Header />

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="absolute inset-0">
            <img src={heroImage} alt="منصة راجع التعليمية" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950" />
          </div>
          
          {/* Animated orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ x: [0, 80, 0], y: [0, -40, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-40 left-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px]"
            />
            <motion.div 
              animate={{ x: [0, -60, 0], y: [0, 60, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-40 right-10 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px]"
            />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px]"
            />
          </div>

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-right">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 mb-8"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-white/80 text-sm font-medium">المنصة التعليمية الأولى للثانوية</span>
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1]"
                >
                  ذاكر بذكاء
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                    مش بجهد أكتر
                  </span>
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg sm:text-xl text-white/60 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0"
                >
                  منصة راجع بتنظم لك المذاكرة من أول المادة لآخر درس. كورسات منظمة، فيديوهات واضحة، ومتابعة لتقدمك.
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <Link
                    to="/login"
                    className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    ابدأ مجانًا
                  </Link>
                  <Link
                    to="/login"
                    className="group inline-flex items-center justify-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-300"
                  >
                    تسجيل الدخول
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-10 text-white/40 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    مجاني 100%
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    بدون بطاقة ائتمان
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    محتوى محدث
                  </span>
                </motion.div>
              </div>

              {/* Stats Cards */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="hidden lg:grid grid-cols-2 gap-4"
              >
                <div className="space-y-4">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-4xl font-black text-white">{subjects.length}</p>
                    <p className="text-sm text-white/50 mt-1">مادة دراسية</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center mb-4">
                      <Video className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-4xl font-black text-white">{totalLectures}</p>
                    <p className="text-sm text-white/50 mt-1">محاضرة</p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center mb-4">
                      <Layers className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-4xl font-black text-white">{courses.length}</p>
                    <p className="text-sm text-white/50 mt-1">كورس متاح</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center mb-4">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-4xl font-black text-white">{uniqueTeachers}</p>
                    <p className="text-sm text-white/50 mt-1">معلم متخصص</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Mobile Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="lg:hidden mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                { label: "مادة", value: subjects.length, icon: BookOpen, color: "text-emerald-400" },
                { label: "كورس", value: courses.length, icon: Layers, color: "text-purple-400" },
                { label: "محاضرة", value: totalLectures, icon: Video, color: "text-blue-400" },
                { label: "معلم", value: uniqueTeachers, icon: Award, color: "text-amber-400" },
              ].map((stat, i) => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center">
                  <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-8 h-8 text-white/30" />
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full mb-4">
                ليه راجع؟
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">كل اللي محتاجه في مكان واحد</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                مصممة خصيصًا لطالب الثانوية عشان يذاكر بطريقة أذكى وأسرع
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full mb-4">
                المواد الدراسية
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">موادك كلها متاحة</h2>
              <p className="text-slate-500 text-lg">اختر مادتك وابدأ المذاكرة على طول</p>
            </motion.div>

            {subjectsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : subjects.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {subjects.slice(0, 8).map((subject, i) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="relative">
                      <SubjectCard subject={subject} index={i} />
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <Link to="/login" className="bg-emerald-500 text-white font-bold px-6 py-2 rounded-xl hover:bg-emerald-600 transition-colors">
                          سجل دخولك للمشاهدة
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : null}

            <motion.div {...fadeInUp} className="text-center mt-12">
              <Link to="/login" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline text-lg">
                سجل دخولك لعرض كل المواد
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-sm font-semibold rounded-full mb-4">
                آراء الطلاب
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white">طلابنا بيقولوا إيه؟</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, idx) => (
                      <Star key={idx} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/80 text-lg mb-6 leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white">{testimonial.name}</p>
                      <p className="text-white/40 text-sm">{testimonial.grade}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              {...fadeInUp}
              className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-[2rem] p-12 sm:p-16 text-center overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <Target className="w-16 h-16 text-white/80 mx-auto mb-6" />
                <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">جاهز تبدأ؟</h2>
                <p className="text-white/80 text-xl mb-8 max-w-lg mx-auto">
                  سجل دلوقتي وابدأ رحلتك التعليمية مع آلاف الطلاب
                </p>
                
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-3 bg-white text-slate-800 font-black text-lg px-12 py-5 rounded-2xl hover:bg-slate-50 transition-all shadow-2xl hover:-translate-y-1"
                >
                  <Sparkles className="w-6 h-6 text-emerald-500" />
                  سجل مجانًا
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>

                <div className="flex flex-wrap justify-center gap-4 mt-8 text-white/70 text-sm">
                  {["مجاني بالكامل", "بدون تسجيل مسبق", "محتوى محدث"].map((item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-amber-50 text-amber-700 text-sm font-semibold rounded-full mb-4">
                أسئلة شائعة
              </span>
              <h2 className="text-4xl font-black text-slate-900">أسئلتك عندنا</h2>
            </motion.div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-right"
                  >
                    <span className="font-bold text-slate-900 text-lg">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-slate-500 leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Dashboard for logged-in users
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      {/* Welcome Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">
                أهلاً، {user?.username || user?.email?.split("@")[0]} 👋
              </h1>
              <p className="text-white/60 mt-2">يلا نبدأ المذاكرة!</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "مادة", value: subjects.length, icon: BookOpen, color: "text-emerald-400" },
              { label: "كورس", value: courses.length, icon: Layers, color: "text-purple-400" },
              { label: "محاضرة", value: totalLectures, icon: Video, color: "text-blue-400" },
              { label: "معلم", value: uniqueTeachers, icon: Award, color: "text-amber-400" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center mb-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-sm text-white/60">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-teal-100 text-teal-700 text-sm font-semibold rounded-full mb-4">
            المواد الدراسية
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-3">اختر مادتك</h2>
          <p className="text-slate-600 text-lg">ابدأ المذاكرة على طول مع أفضل المحاضرين</p>
        </motion.div>

        {subjectsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {subjects.map((subject, i) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <SubjectCard subject={subject} index={i} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-medium">لم تُضَف مواد بعد</p>
          </div>
        )}
      </section>

      {/* Latest Courses */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="flex items-center justify-between mb-12">
            <div>
              <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full mb-3">
                الكورسات الجديدة
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-800">أحدث الكورسات</h2>
              <p className="text-slate-600 mt-2">ابدأ بأي كورس دلوقتي</p>
            </div>
            <Link to="/courses" className="hidden sm:inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
              عرض الكل
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </motion.div>

          {coursesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : latestCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">لم تُضَف كورسات بعد</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 mx-4 sm:mx-8 lg:mx-16 mb-16 rounded-3xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 rounded-3xl" />
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative py-16 px-8 sm:px-16 text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">جاهز تبدأ المذاكرة؟</h2>
            <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
              تصفح المواد والكورسات المتاحة وابدأ رحلتك التعليمية
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/subjects"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-0.5"
              >
                <BookOpen className="w-5 h-5" />
                تصفح المواد
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 font-bold px-8 py-4 rounded-2xl transition-all"
              >
                <Video className="w-5 h-5" />
                الكورسات
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;

// ─── HOME BLOCK RENDERER ───────────────────────────────────────────────────────
const blockStyles: Record<string, { bg: string; border: string; badge: string }> = {
  hero: { bg: "bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900", border: "border-slate-700", badge: "bg-emerald-500" },
  post: { bg: "bg-white", border: "border-gray-100", badge: "bg-blue-500" },
  offer: { bg: "bg-gradient-to-r from-amber-50 to-orange-50", border: "border-amber-200", badge: "bg-amber-500" },
  featured: { bg: "bg-gradient-to-r from-purple-50 to-pink-50", border: "border-purple-200", badge: "bg-purple-500" },
  announcement: { bg: "bg-gradient-to-r from-red-50 to-rose-50", border: "border-red-200", badge: "bg-red-500" },
};

const highlightColors: Record<string, string> = {
  important: "bg-blue-500",
  review: "bg-orange-500",
  exam: "bg-red-500",
};

function HomeBlockRenderer({ block }: { block: any }) {
  const style = blockStyles[block.type] || blockStyles.post;
  const isDark = block.type === "hero";

  return (
    <Link
      to={block.link_url || "#"}
      className={`block rounded-2xl border ${style.border} ${style.bg} overflow-hidden transition-all hover:shadow-lg ${!block.link_url ? "cursor-default" : ""}`}
    >
      {block.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img src={block.image_url} alt={block.title} className="w-full h-full object-cover" />
          {(block.highlight || block.type) && (
            <div className="absolute top-3 right-3 flex gap-2">
              {block.highlight && (
                <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${highlightColors[block.highlight] || "bg-gray-500"}`}>
                  {block.highlight === "important" ? "⭐ مهم" : block.highlight === "review" ? "🔥 مراجعة" : "⏰ امتحان"}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      <div className={`p-5 ${!block.image_url && (block.highlight || block.type) ? "pt-3" : ""}`}>
        {!block.image_url && (block.highlight || block.type) && (
          <div className="flex gap-2 mb-3">
            {block.highlight && (
              <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${highlightColors[block.highlight] || "bg-gray-500"}`}>
                {block.highlight === "important" ? "⭐ مهم" : block.highlight === "review" ? "🔥 مراجعة" : "⏰ امتحان"}
              </span>
            )}
          </div>
        )}
        <h3 className={`text-lg font-black mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>{block.title}</h3>
        {block.content && (
          <p className={`text-sm leading-relaxed ${isDark ? "text-white/70" : "text-gray-600"}`}>{block.content}</p>
        )}
        {block.link_url && (
          <p className={`text-sm font-bold mt-3 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
            اكتشف المزيد ←
          </p>
        )}
      </div>
    </Link>
  );
}
