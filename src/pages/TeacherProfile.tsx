import { useParams, Link } from "react-router-dom";
import { ArrowRight, BookMarked, Users, Clock, PlayCircle, ChevronLeft, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CourseCard from "@/components/features/CourseCard";
import { useTeacher, useCoursesByTeacher } from "@/hooks/useData";

const TeacherProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { data: teacher, isLoading: teacherLoading } = useTeacher(id!);
  const { data: courses = [], isLoading: coursesLoading } = useCoursesByTeacher(id!);

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
          <Link to="/courses" className="text-primary font-bold hover:underline">الرجوع للكورسات</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="pt-16">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-border px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">الرئيسية</Link>
            <ChevronLeft className="w-4 h-4" />
            <Link to="/courses" className="hover:text-foreground transition-colors">الكورسات</Link>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-foreground font-medium">{teacher.name}</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="gradient-hero py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {teacher.avatar ? (
                  <img
                    src={teacher.avatar}
                    alt={teacher.name}
                    className="w-32 h-32 rounded-3xl object-cover shadow-2xl ring-4 ring-white/30"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl font-black text-white shadow-2xl ring-4 ring-white/30">
                    {teacher.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-center sm:text-right flex-1">
                <p className="text-white/60 text-sm font-medium mb-1 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Users className="w-4 h-4" />
                  معلم
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{teacher.name}</h1>
                {teacher.specialty && (
                  <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                    {teacher.specialty}
                  </span>
                )}
                {teacher.bio && (
                  <p className="text-white/75 leading-relaxed max-w-2xl">{teacher.bio}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 mt-6 justify-center sm:justify-start">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{courses.length}</p>
                    <p className="text-white/60 text-xs mt-0.5">كورس</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">
                      {courses.reduce((sum, c) => sum + (c.lecture_count ?? 0), 0)}
                    </p>
                    <p className="text-white/60 text-xs mt-0.5">محاضرة</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">كورسات {teacher.name}</h2>
              <p className="text-muted-foreground text-sm">{courses.length} كورس متاح</p>
            </div>
          </div>

          {coursesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-lg font-medium">لا توجد كورسات بعد</p>
            </div>
          )}

          <div className="mt-10">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              الرجوع لجميع الكورسات
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherProfile;
