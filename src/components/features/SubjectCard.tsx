import { Link } from "react-router-dom";
import type { Subject } from "@/types/db";

// Color palette for subjects without color
const colorPalette = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-green-500 to-green-700",
  "from-teal-500 to-teal-700",
  "from-orange-500 to-orange-700",
  "from-sky-500 to-sky-700",
  "from-amber-500 to-amber-700",
  "from-stone-500 to-stone-700",
  "from-rose-500 to-rose-700",
  "from-indigo-500 to-indigo-700",
];

function getColor(subject: Subject, index: number): string {
  if (subject.color && subject.color.startsWith("#")) {
    return colorPalette[index % colorPalette.length];
  }
  if (subject.color && subject.color.startsWith("from-")) return subject.color;
  return colorPalette[index % colorPalette.length];
}

interface SubjectCardProps {
  subject: Subject;
  courseCount?: number;
  index?: number;
}

const SubjectCard = ({ subject, courseCount = 0, index = 0 }: SubjectCardProps) => {
  const gradient = getColor(subject, index);

  return (
    <Link
      to={`/courses?subject=${subject.id}`}
      className="subject-hover group block"
    >
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-border overflow-hidden transition-all duration-300">
        {/* Gradient Top Bar */}
        <div className={`h-2 bg-gradient-to-r ${gradient}`} />

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <span className="text-4xl">{subject.icon || "📚"}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white`}>
              {courseCount} كورس
            </span>
          </div>

          <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {subject.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {subject.description || "مادة دراسية"}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default SubjectCard;
