import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Subject, Teacher, Course, Lecture, Lesson, Challenge, ChallengeTask, ChallengeTaskLesson, ChallengeTaskFile, VideoChapter, VideoLink, AppUser } from "@/types/db";

// ─── SUBJECTS ─────────────────────────────────────────────────────────────────

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async (): Promise<Subject[]> => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Subject, "id" | "created_at">) => {
      const { data, error } = await supabase.from("subjects").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Subject> & { id: string }) => {
      const { data, error } = await supabase.from("subjects").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

// ─── TEACHERS ─────────────────────────────────────────────────────────────────

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async (): Promise<Teacher[]> => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: ["teacher", id],
    queryFn: async (): Promise<Teacher | null> => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Teacher, "id" | "created_at">) => {
      const { data, error } = await supabase.from("teachers").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Teacher> & { id: string }) => {
      const { data, error } = await supabase.from("teachers").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

// ─── COURSES ──────────────────────────────────────────────────────────────────

export function useCourses(publishedOnly = true) {
  return useQuery({
    queryKey: ["courses", publishedOnly],
    queryFn: async (): Promise<Course[]> => {
      let query = supabase
        .from("courses")
        .select(`*, subject:subjects(*), course_teachers(teacher_id, teachers(*))`)
        .order("order_index", { ascending: true });
      if (publishedOnly) query = query.eq("is_published", true);
      const { data, error } = await query;
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((c: any) => ({
        ...c,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teachers: c.course_teachers?.map((ct: any) => ct.teachers).filter(Boolean) ?? [],
      }));
    },
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: async (): Promise<Course | null> => {
      const { data, error } = await supabase
        .from("courses")
        .select(`*, subject:subjects(*), course_teachers(teacher_id, teachers(*))`)
        .eq("id", id)
        .single();
      if (error) throw error;
      return {
        ...data,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teachers: (data as any).course_teachers?.map((ct: any) => ct.teachers).filter(Boolean) ?? [],
      };
    },
    enabled: !!id,
  });
}

export function useCoursesByTeacher(teacherId: string) {
  return useQuery({
    queryKey: ["courses-by-teacher", teacherId],
    queryFn: async (): Promise<Course[]> => {
      const { data: relations, error: relErr } = await supabase
        .from("course_teachers")
        .select("course_id")
        .eq("teacher_id", teacherId);
      if (relErr) throw relErr;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const courseIds = (relations ?? []).map((r: any) => r.course_id);
      if (!courseIds.length) return [];
      const { data, error } = await supabase
        .from("courses")
        .select(`*, subject:subjects(*), course_teachers(teacher_id, teachers(*))`)
        .in("id", courseIds)
        .eq("is_published", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((c: any) => ({
        ...c,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teachers: c.course_teachers?.map((ct: any) => ct.teachers).filter(Boolean) ?? [],
      }));
    },
    enabled: !!teacherId,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teacherIds,
      ...payload
    }: Omit<Course, "id" | "created_at" | "subject" | "teachers" | "lecture_count"> & { teacherIds: string[] }) => {
      const { data, error } = await supabase.from("courses").insert(payload).select().single();
      if (error) throw error;
      if (teacherIds.length > 0) {
        const relations = teacherIds.map((teacher_id) => ({ course_id: data.id, teacher_id }));
        const { error: relError } = await supabase.from("course_teachers").insert(relations);
        if (relError) throw relError;
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      teacherIds,
      subject,
      teachers,
      lecture_count,
      ...payload
    }: Partial<Course> & { id: string; teacherIds?: string[] }) => {
      const { data, error } = await supabase.from("courses").update(payload).eq("id", id).select().single();
      if (error) throw error;
      if (teacherIds !== undefined) {
        await supabase.from("course_teachers").delete().eq("course_id", id);
        if (teacherIds.length > 0) {
          const relations = teacherIds.map((teacher_id) => ({ course_id: id, teacher_id }));
          const { error: relError } = await supabase.from("course_teachers").insert(relations);
          if (relError) throw relError;
        }
      }
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["course", vars.id] });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

// ─── LECTURES ─────────────────────────────────────────────────────────────────

export function useLectures(courseId: string) {
  return useQuery({
    queryKey: ["lectures", courseId],
    queryFn: async (): Promise<Lecture[]> => {
      const { data, error } = await supabase
        .from("lectures")
        .select(`*, lessons(*)`)
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((l: any) => ({
        ...l,
        lessons: (l.lessons ?? []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index),
      }));
    },
    enabled: !!courseId,
  });
}

export function useAllLectures() {
  return useQuery({
    queryKey: ["lectures-all"],
    queryFn: async (): Promise<(Lecture & { course?: Course })[]> => {
      const { data, error } = await supabase
        .from("lectures")
        .select(`*, lessons(*), course:courses(id, title)`)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateLecture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Lecture, "id" | "created_at" | "lessons">) => {
      const { data, error } = await supabase.from("lectures").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["lectures", vars.course_id] });
      qc.invalidateQueries({ queryKey: ["lectures-all"] });
    },
  });
}

export function useUpdateLecture() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, lessons, course, ...payload }: Partial<Lecture> & { id: string; course?: any }) => {
      const { data, error } = await supabase.from("lectures").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lectures"] });
      qc.invalidateQueries({ queryKey: ["lectures-all"] });
    },
  });
}

export function useDeleteLecture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lectures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lectures"] });
      qc.invalidateQueries({ queryKey: ["lectures-all"] });
    },
  });
}

// ─── LESSONS ──────────────────────────────────────────────────────────────────

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Lesson, "id" | "created_at">) => {
      const { data, error } = await supabase.from("lessons").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lectures"] });
      qc.invalidateQueries({ queryKey: ["lectures-all"] });
    },
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lectures"] });
      qc.invalidateQueries({ queryKey: ["lectures-all"] });
    },
  });
}

// ─── USER PROGRESS ────────────────────────────────────────────────────────────

export function useUserProgress(courseId?: string) {
  return useQuery({
    queryKey: ["user-progress", courseId],
    queryFn: async (): Promise<string[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from("user_progress")
        .select("lesson_id")
        .eq("user_id", session.user.id)
        .eq("is_completed", true);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((r: any) => r.lesson_id);
    },
  });
}

export function useToggleProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("يجب تسجيل الدخول أولاً");
      if (completed) {
        const { error } = await supabase
          .from("user_progress")
          .upsert({ user_id: session.user.id, lesson_id: lessonId, is_completed: true }, { onConflict: "user_id,lesson_id" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_progress")
          .delete()
          .eq("user_id", session.user.id)
          .eq("lesson_id", lessonId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-progress"] }),
  });
}

// ─── PLAYLIST IMPORT ──────────────────────────────────────────────────────────

export function useImportPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      playlist_id,
      course_id,
      lecture_id,
    }: { playlist_id: string; course_id: string; lecture_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("import-youtube-playlist", {
        body: { playlist_id, course_id, lecture_id },
      });
      if (error) {
        const { FunctionsHttpError } = await import("@supabase/supabase-js");
        if (error instanceof FunctionsHttpError) {
          const text = await error.context?.text?.();
          throw new Error(text || error.message);
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lectures"] });
      qc.invalidateQueries({ queryKey: ["lectures-all"] });
    },
  });
}

// ─── CHALLENGES ─────────────────────────────────────────────────────────────

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async (): Promise<Challenge[]> => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActiveChallenge() {
  return useQuery({
    queryKey: ["active-challenge"],
    queryFn: async (): Promise<Challenge | null> => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useChallengeTasks(challengeId?: string) {
  return useQuery({
    queryKey: ["challenge-tasks", challengeId],
    queryFn: async (): Promise<ChallengeTask[]> => {
      if (!challengeId) return [];
      const { data, error } = await supabase
        .from("challenge_tasks")
        .select(`
          *,
          subject:subjects(id,name,icon,color),
          teacher:teachers(id,name,avatar,specialty),
          course:courses(id,title),
          lecture:lectures(id,title),
          lesson:lessons(id,title,video_url,youtube_video_id,duration),
          task_lessons:challenge_task_lessons(*, lesson:lessons(id,title,video_url,youtube_video_id,duration)),
          task_files:challenge_task_files(*)
        `)
        .eq("challenge_id", challengeId)
        .order("day_number", { ascending: true })
        .order("task_order", { ascending: true });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((t: any) => ({
        ...t,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        task_lessons: (t.task_lessons ?? []).sort((a: any, b: any) => a.order_index - b.order_index),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        task_files: (t.task_files ?? []).sort((a: any, b: any) => a.order_index - b.order_index),
      }));
    },
    enabled: !!challengeId,
  });
}

export function useUserChallengeProgress(challengeId?: string) {
  return useQuery({
    queryKey: ["user-challenge-progress", challengeId],
    queryFn: async (): Promise<{ days: number[]; joinedAt: string | null }> => {
      if (!challengeId) return { days: [], joinedAt: null };
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { days: [], joinedAt: null };
      const { data, error } = await supabase
        .from("user_challenge_progress")
        .select("day_number, joined_at")
        .eq("user_id", session.user.id)
        .eq("challenge_id", challengeId)
        .eq("is_completed", true)
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const days = (data ?? []).map((r: any) => r.day_number);
      const joinedAt = data?.[0]?.joined_at ?? null;
      return { days, joinedAt };
    },
    enabled: !!challengeId,
  });
}

export function useToggleChallengeDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      challengeId,
      dayNumber,
      completed,
    }: { challengeId: string; dayNumber: number; completed: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("يجب تسجيل الدخول أولاً");
      if (completed) {
        // Check if user already has a joined_at
        const { data: existing } = await supabase
          .from("user_challenge_progress")
          .select("joined_at")
          .eq("user_id", session.user.id)
          .eq("challenge_id", challengeId)
          .not("joined_at", "is", null)
          .limit(1);
        
        const joinedAt = existing?.[0]?.joined_at ? undefined : new Date().toISOString();
        
        const { error } = await supabase
          .from("user_challenge_progress")
          .upsert(
            { user_id: session.user.id, challenge_id: challengeId, day_number: dayNumber, is_completed: true, joined_at: joinedAt },
            { onConflict: "user_id,challenge_id,day_number" }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_challenge_progress")
          .delete()
          .eq("user_id", session.user.id)
          .eq("challenge_id", challengeId)
          .eq("day_number", dayNumber);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["user-challenge-progress", vars.challengeId] }),
  });
}

export function useChallengeParticipantCount(challengeId?: string) {
  return useQuery({
    queryKey: ["challenge-participants", challengeId],
    queryFn: async (): Promise<number> => {
      if (!challengeId) return 0;
      const { count, error } = await supabase
        .from("user_challenge_progress")
        .select("user_id", { count: 'exact', head: false })
        .eq("challenge_id", challengeId);
      if (error) {
        console.warn("Error counting participants:", error);
        return 0;
      }
      // Get distinct user count
      const { data } = await supabase
        .from("user_challenge_progress")
        .select("user_id")
        .eq("challenge_id", challengeId);
      
      const uniqueUsers = new Set((data ?? []).map(d => d.user_id));
      return uniqueUsers.size;
    },
    enabled: !!challengeId,
  });
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Challenge, "id" | "created_at">) => {
      const { data, error } = await supabase.from("challenges").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
      qc.invalidateQueries({ queryKey: ["active-challenge"] });
    },
  });
}

export function useUpdateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Challenge> & { id: string }) => {
      const { data, error } = await supabase.from("challenges").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
      qc.invalidateQueries({ queryKey: ["active-challenge"] });
    },
  });
}

export function useDeleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("challenges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
      qc.invalidateQueries({ queryKey: ["active-challenge"] });
    },
  });
}

export function useUpsertChallengeTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: { id?: string; taskLessons?: { lesson_id?: string; custom_video_url?: string; custom_video_title?: string }[]; taskFiles?: { file_url: string; file_name?: string }[] } & Omit<ChallengeTask, "id" | "created_at" | "subject" | "teacher" | "course" | "lecture" | "lesson" | "task_lessons" | "task_files">
    ) => {
      const { id, taskLessons, taskFiles, ...fields } = payload;
      let taskId = id;
      if (id) {
        const { error } = await supabase.from("challenge_tasks").update(fields).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("challenge_tasks").insert(fields).select().single();
        if (error) throw error;
        taskId = data.id;
      }
      // Sync task_lessons
      if (taskLessons !== undefined && taskId) {
        await supabase.from("challenge_task_lessons").delete().eq("task_id", taskId);
        if (taskLessons.length > 0) {
          const rows = taskLessons.map((tl, i) => ({
            task_id: taskId,
            lesson_id: tl.lesson_id || null,
            custom_video_url: tl.custom_video_url || "",
            custom_video_title: tl.custom_video_title || "",
            order_index: i,
          }));
          const { error } = await supabase.from("challenge_task_lessons").insert(rows);
          if (error) throw error;
        }
      }
      // Sync task_files
      if (taskFiles !== undefined && taskId) {
        await supabase.from("challenge_task_files").delete().eq("task_id", taskId);
        if (taskFiles.length > 0) {
          const rows = taskFiles.map((tf, i) => ({
            task_id: taskId,
            file_url: tf.file_url,
            file_name: tf.file_name || "",
            order_index: i,
          }));
          const { error } = await supabase.from("challenge_task_files").insert(rows);
          if (error) throw error;
        }
      }
      return taskId;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["challenge-tasks", vars.challenge_id] }),
  });
}

export function useAddChallengeTaskLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<ChallengeTaskLesson, "id" | "created_at" | "lesson">) => {
      const { data, error } = await supabase.from("challenge_task_lessons").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenge-tasks"] }),
  });
}

export function useDeleteChallengeTaskLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("challenge_task_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenge-tasks"] }),
  });
}

export function useAddChallengeTaskFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<ChallengeTaskFile, "id" | "created_at">) => {
      const { data, error } = await supabase.from("challenge_task_files").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenge-tasks"] }),
  });
}

export function useDeleteChallengeTaskFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("challenge_task_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenge-tasks"] }),
  });
}

export function useDeleteChallengeTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, challengeId }: { id: string; challengeId: string }) => {
      const { error } = await supabase.from("challenge_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["challenge-tasks", vars.challengeId] }),
  });
}

// ─── VIDEO CHAPTERS ──────────────────────────────────────────────────────────

export function useVideoChapters(lessonId?: string) {
  return useQuery({
    queryKey: ["video-chapters", lessonId],
    queryFn: async (): Promise<VideoChapter[]> => {
      if (!lessonId) return [];
      const { data, error } = await supabase
        .from("video_chapters")
        .select("*")
        .eq("lesson_id", lessonId)
        .eq("is_visible", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!lessonId,
  });
}

export function useAllVideoChapters(lessonId?: string) {
  return useQuery({
    queryKey: ["video-chapters-all", lessonId],
    queryFn: async (): Promise<VideoChapter[]> => {
      if (!lessonId) return [];
      const { data, error } = await supabase
        .from("video_chapters")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!lessonId,
  });
}

export function useUpsertVideoChapters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, chapters }: { lessonId: string; chapters: Omit<VideoChapter, "id" | "created_at" | "lesson_id">[] }) => {
      // Delete all existing chapters for this lesson
      const { error: delErr } = await supabase
        .from("video_chapters")
        .delete()
        .eq("lesson_id", lessonId);
      if (delErr) throw delErr;
      // Insert new chapters
      if (chapters.length > 0) {
        const rows = chapters.map((ch, i) => ({
          lesson_id: lessonId,
          title: ch.title,
          start_time_seconds: ch.start_time_seconds,
          order_index: i,
          is_visible: ch.is_visible ?? true,
        }));
        const { error } = await supabase.from("video_chapters").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["video-chapters", vars.lessonId] });
      qc.invalidateQueries({ queryKey: ["video-chapters-all", vars.lessonId] });
    },
  });
}

// ─── VIDEO LINKS ─────────────────────────────────────────────────────────────

export function useVideoLinks(lessonId?: string) {
  return useQuery({
    queryKey: ["video-links", lessonId],
    queryFn: async (): Promise<VideoLink[]> => {
      if (!lessonId) return [];
      const { data, error } = await supabase
        .from("video_links")
        .select("*")
        .eq("lesson_id", lessonId)
        .eq("is_visible", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!lessonId,
  });
}

export function useAllVideoLinks(lessonId?: string) {
  return useQuery({
    queryKey: ["video-links-all", lessonId],
    queryFn: async (): Promise<VideoLink[]> => {
      if (!lessonId) return [];
      const { data, error } = await supabase
        .from("video_links")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!lessonId,
  });
}

export function useUpsertVideoLinks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, links }: { lessonId: string; links: Omit<VideoLink, "id" | "created_at" | "lesson_id">[] }) => {
      const { error: delErr } = await supabase
        .from("video_links")
        .delete()
        .eq("lesson_id", lessonId);
      if (delErr) throw delErr;
      if (links.length > 0) {
        const rows = links.map((l, i) => ({
          lesson_id: lessonId,
          title: l.title,
          url: l.url,
          order_index: i,
          is_visible: l.is_visible ?? true,
        }));
        const { error } = await supabase.from("video_links").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["video-links", vars.lessonId] });
      qc.invalidateQueries({ queryKey: ["video-links-all", vars.lessonId] });
    },
  });
}

export function useFetchVideoMetadata() {
  return useMutation({
    mutationFn: async (videoId: string) => {
      const { data, error } = await supabase.functions.invoke("fetch-video-metadata", {
        body: { video_id: videoId },
      });
      if (error) {
        const { FunctionsHttpError } = await import("@supabase/supabase-js");
        if (error instanceof FunctionsHttpError) {
          const text = await error.context?.text?.();
          throw new Error(text || error.message);
        }
        throw error;
      }
      return data as {
        youtube_video_id: string;
        title: string;
        description: string;
        thumbnail: string;
        duration: string;
        channel: string;
        links: { url: string; title: string }[];
      };
    },
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Lesson> & { id: string }) => {
      const { data, error } = await supabase
        .from("lessons")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lectures"] });
      qc.invalidateQueries({ queryKey: ["lectures-all"] });
    },
  });
}

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<AppUser[]> => {
      try {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (usersError) {
          console.warn("Users table not found, returning empty array");
          return [];
        }
        
        const { data: management } = await supabase
          .from("user_management")
          .select("user_id, expires_at");
        
        const expMap = new Map((management ?? []).map(m => [m.user_id, m.expires_at]));
        
        return (users ?? []).map(u => ({
          ...u,
          expires_at: expMap.get(u.id) ?? null,
          is_active: true
        }));
      } catch (err) {
        console.warn("Error fetching users:", err);
        return [];
      }
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<AppUser, "id" | "created_at"> & { password: string }) => {
      const { password, ...userData } = payload;
      
      // Call Edge Function to create user
      const { data, error } = await supabase.functions.invoke("rapid-worker", {
        body: {
          email: userData.email,
          password,
          full_name: userData.full_name || "",
          role: userData.role || "user",
          expires_at: userData.expires_at
        }
      });
      
      // Log for debugging
      console.log("Create user response:", data, error);
      
      if (error) {
        // If edge function fails, throw with details
        throw new Error(error.message || "فشل في إنشاء المستخدم");
      }
      
      if (data?.error) throw new Error(data.error);
      
      return data?.user || data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AppUser> & { id: string; password?: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: any = {};
      
      if (payload.full_name !== undefined) updates.full_name = payload.full_name;
      if (payload.role !== undefined) updates.role = payload.role;
      if (payload.email !== undefined) updates.email = payload.email;
      
      // Update auth user if needed
      if (Object.keys(updates).length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUser(id, {
          ...updates,
        });
        if (authError) throw authError;
      }
      
      // Update expiration if provided
      if (payload.expires_at !== undefined) {
        const { data: existing } = await supabase
          .from("user_management")
          .select("id")
          .eq("user_id", id)
          .single();
        
        if (existing) {
          const { error: expError } = await supabase
            .from("user_management")
            .update({ expires_at: payload.expires_at })
            .eq("id", existing.id);
            
          if (expError) throw expError;
        } else if (payload.expires_at) {
          const { error: expError } = await supabase
            .from("user_management")
            .insert({
              user_id: id,
              expires_at: payload.expires_at,
              created_by: payload.created_by
            });
            
          if (expError) throw expError;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete from user_management first
      await supabase.from("user_management").delete().eq("user_id", id);
      
      // Delete the user from auth
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// auth.sessions is not available via REST API - disabled for now
export function useUserSessions() {
  return useQuery({
    queryKey: ["user-sessions"],
    queryFn: async () => {
      return []; // Return empty array - not available
    },
  });
}