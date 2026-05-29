import { Link } from "react-router-dom";
import { PlayCircle, User, BookMarked, Star, Flame, Clock } from "lucide-react";
import { SaveButton } from "@/components/features/SavedItems";
import type { Course } from "@/types/db";

const highlightConfig: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  important: { label: "مهم", bg: "bg-blue-500", text: "text-blue-600", icon: Star },
  review: { label: "مراجعة نهائية", bg: "bg-orange-500", text: "text-orange-600", icon: Flame },
  exam: { label: "ليلة الامتحان", bg: "bg-red-500", text: "text-red-600", icon: Clock },
};

const colorPalette = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-green-500 to-green-700",
  "from-teal-500 to-teal-700",
  "from-orange-500 to-orange-700",
  "from-sky-500 to-sky-700",
];

interface CourseCardProps {
  course: Course;
  progress?: number;
}

const CourseCard = ({ course, progress }: CourseCardProps) => {
  const teacher = course.teachers?.[0];
  const subject = course.subject;
  const subjectColor = colorPalette[0]; // default; override if needed

  const thumbnail =
    course.thumbnail ||
    `https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80&random=${course.id}`;

  return (
    <Link to={`/course/${course.id}`} className="subject-hover group block">
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-border overflow-hidden transition-all duration-300 h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative overflow-hidden h-44">
          <img
            src={thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <PlayCircle className="w-7 h-7 text-primary" />
            </div>
          </div>
          {/* Subject Badge */}
          {subject && (
            <div className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${subjectColor} text-white shadow`}>
              {subject.name}
            </div>
          )}
          {/* Highlight Badge */}
          {course.highlight && highlightConfig[course.highlight] && (
            <div className={`absolute bottom-3 right-3 text-xs font-bold px-3 py-1.5 rounded-full ${highlightConfig[course.highlight].bg} text-white shadow-lg flex items-center gap-1`}>
              {(() => { const Icon = highlightConfig[course.highlight!].icon; return <Icon className="w-3.5 h-3.5" />; })()}
              {highlightConfig[course.highlight].label}
            </div>
          )}
          {/* Price Badge */}
          {course.is_paid && (
            <div className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-white shadow flex items-center gap-1">
              <span>{course.price} جنيه</span>
            </div>
          )}
          {!course.is_published && (
            <div className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full bg-gray-800/80 text-white">
              غير منشور
            </div>
          )}
          <div className="absolute top-3 left-3">
            <SaveButton type="course" id={course.id} title={course.title} />
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {course.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {course.description}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
            {teacher && (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{teacher.name}</span>
              </div>
            )}
            {course.duration && (
              <div className="flex items-center gap-1">
                <BookMarked className="w-3.5 h-3.5" />
                <span>{course.duration}</span>
              </div>
            )}
            {course.level && (
              <span className="mr-auto bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                {course.level}
              </span>
            )}
          </div>

          {/* Progress */}
          {progress !== undefined && progress > 0 ? (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>تقدمك</span>
                <span className="font-semibold text-primary">{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
              لم تبدأ بعد
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
