import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, PlayCircle } from "lucide-react";
import type { Lecture, Lesson } from "@/types/db";

interface LectureListProps {
  lectures: Lecture[];
  activeLessonId: string;
  completedLessonIds?: string[];
  onLessonSelect: (lesson: Lesson, lectureId: string) => void;
}

const LectureList = ({ lectures, activeLessonId, completedLessonIds = [], onLessonSelect }: LectureListProps) => {
  const [openLectureId, setOpenLectureId] = useState<string>(lectures[0]?.id || "");

  return (
    <div className="flex flex-col gap-2">
      {lectures.map((lecture) => {
        const lessonCount = lecture.lessons?.length ?? 0;
        const completedInLecture = (lecture.lessons ?? []).filter((ls) => completedLessonIds.includes(ls.id)).length;
        const allDone = lessonCount > 0 && completedInLecture === lessonCount;

        return (
          <div key={lecture.id} className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Lecture Header */}
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-right"
              onClick={() =>
                setOpenLectureId(openLectureId === lecture.id ? "" : lecture.id)
              }
            >
              <div className="flex items-center gap-3">
                {allDone ? (
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{lecture.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completedInLecture}/{lessonCount} درس
                    {lecture.duration ? ` • ${lecture.duration}` : ""}
                  </p>
                </div>
              </div>
              {openLectureId === lecture.id ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </button>

            {/* Lessons List */}
            {openLectureId === lecture.id && (
              <div className="border-t border-border bg-muted/30">
                {(lecture.lessons ?? []).map((lesson) => {
                  const isCompleted = completedLessonIds.includes(lesson.id);
                  const isActive = activeLessonId === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onLessonSelect(lesson, lecture.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-right ${
                        isActive ? "bg-blue-50 border-r-4 border-primary" : ""
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-accent" />
                      ) : (
                        <PlayCircle
                          className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                        />
                      )}
                      <div className="flex-1 text-right min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isActive ? "text-primary" : isCompleted ? "text-accent" : "text-foreground"
                          }`}
                        >
                          {lesson.title}
                        </p>
                      </div>
                      {lesson.duration && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {lesson.duration}
                        </span>
                      )}
                    </button>
                  );
                })}
                {(!lecture.lessons || lecture.lessons.length === 0) && (
                  <p className="px-4 py-3 text-xs text-muted-foreground">لا توجد دروس بعد</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LectureList;
