import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import {
  BookOpen, Users, Video, BookMarked, LayoutDashboard,
  Eye, EyeOff, Trash2, Plus, Edit3, ChevronLeft, GraduationCap,
  Loader2, X, Save, Youtube, ListVideo, Link2, CalendarCheck, Flame,
  BookMarked as ChaptersIcon, Clock, ToggleLeft, ToggleRight, Upload, ImageIcon,
  Key, Wallet, Percent, Settings, Sparkles, FileText, HelpCircle, LayoutGrid, TrendingUp, DollarSign, Search, Bell, Pin,
} from "lucide-react";
import { toast } from "sonner";
import {
  useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject,
  useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher,
  useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse,
  useAllLectures, useCreateLecture, useDeleteLecture,
  useCreateLesson, useDeleteLesson,
  useImportPlaylist,
  useChallenges,
  useCreateChallenge,
  useUpdateChallenge,
  useDeleteChallenge,
  useChallengeTasks,
  useUpsertChallengeTask,
  useDeleteChallengeTask,
  useAllVideoChapters,
  useUpsertVideoChapters,
  useAllVideoLinks,
  useUpsertVideoLinks,
  useFetchVideoMetadata,
  useUpdateLesson,
  // User management
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUserSessions,
  // Home blocks
  useAllHomeBlocks, useCreateHomeBlock, useUpdateHomeBlock, useDeleteHomeBlock,
  // Questions & Summaries
  useQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion,
  useSummaries, useCreateSummary, useDeleteSummary,
  // Notifications
  useAdminNotifications, useCreateNotification, useDeleteNotification as useDeleteNotif, useTogglePinNotification,
} from "@/hooks/useData";
import type { Subject, Teacher, Course, Lecture, Challenge, ChallengeTask, VideoChapter, VideoLink, AppUser } from "@/types/db";

type TabKey = "overview" | "subjects" | "teachers" | "courses" | "lectures" | "challenges" | "codes" | "recharge" | "discounts" | "questions" | "summaries" | "homepage" | "activities" | "settings" | "students" | "sales" | "notifications";

// ─── MODALS ────────────────────────────────────────────────────────────────────

function SubjectModal({ onClose, initial }: { onClose: () => void; initial?: Subject }) {
  const create = useCreateSubject();
  const update = useUpdateSubject();
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    icon: initial?.icon || "📚",
    color: initial?.color || "#1E3A8A",
    order_index: initial?.order_index ?? 0,
    tracks: (initial as any)?.tracks || ["science-bio", "science-math", "literary"] as string[],
  });

  const toggleTrack = (trackId: string) => {
    const exists = form.tracks.includes(trackId);
    setForm({
      ...form,
      tracks: exists ? form.tracks.filter((t) => t !== trackId) : [...form.tracks, trackId],
    });
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("اسم المادة مطلوب"); return; }
    if (form.tracks.length === 0) { toast.error("يجب اختيار شعبة واحدة على الأقل"); return; }
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...form });
      toast.success("تم تحديث المادة");
    } else {
      await create.mutateAsync(form);
      toast.success("تمت إضافة المادة");
    }
    onClose();
  };

  return (
    <ModalShell title={initial ? "تعديل مادة" : "إضافة مادة جديدة"} onClose={onClose}>
      <Field label="اسم المادة *">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
      </Field>
      <Field label="الوصف">
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
      </Field>
      <Field label="الشعب المستهدفة *">
        <div className="space-y-2">
          {[
            { id: "science-bio", label: "علمي علوم", color: "bg-emerald-500" },
            { id: "science-math", label: "علمي رياضة", color: "bg-blue-500" },
            { id: "literary", label: "أدبي", color: "bg-amber-500" },
          ].map((track) => (
            <label
              key={track.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                form.tracks.includes(track.id)
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={form.tracks.includes(track.id)}
                onChange={() => toggleTrack(track.id)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                form.tracks.includes(track.id) ? `${track.color} border-transparent` : "border-gray-300"
              }`}>
                {form.tracks.includes(track.id) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="font-medium text-gray-700">{track.label}</span>
            </label>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="الأيقونة (emoji)">
          <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input-field" />
        </Field>
        <Field label="اللون">
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="input-field h-10" />
        </Field>
      </div>
      <Field label="الترتيب">
        <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: +e.target.value })} className="input-field" />
      </Field>
      <SaveBtn isPending={create.isPending || update.isPending} onSave={save} />
    </ModalShell>
  );
}

function TeacherModal({ onClose, initial }: { onClose: () => void; initial?: Teacher }) {
  const create = useCreateTeacher();
  const update = useUpdateTeacher();
  const [form, setForm] = useState({
    name: initial?.name || "",
    bio: initial?.bio || "",
    avatar: initial?.avatar || "",
    specialty: initial?.specialty || "",
    order_index: initial?.order_index ?? 0,
  });

  const save = async () => {
    if (!form.name.trim()) { toast.error("اسم المعلم مطلوب"); return; }
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...form });
      toast.success("تم تحديث المعلم");
    } else {
      await create.mutateAsync(form);
      toast.success("تمت إضافة المعلم");
    }
    onClose();
  };

  return (
    <ModalShell title={initial ? "تعديل معلم" : "إضافة معلم جديد"} onClose={onClose}>
      <Field label="الاسم *">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
      </Field>
      <Field label="التخصص">
        <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="input-field" />
      </Field>
      <Field label="نبذة مختصرة">
        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input-field" rows={2} />
      </Field>
      <Field label="رابط الصورة (Avatar URL)">
        <input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} className="input-field" placeholder="https://..." />
      </Field>
      <Field label="الترتيب">
        <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: +e.target.value })} className="input-field" />
      </Field>
      <SaveBtn isPending={create.isPending || update.isPending} onSave={save} />
    </ModalShell>
  );
}

function CourseModal({ onClose, initial }: { onClose: () => void; initial?: Course }) {
  const create = useCreateCourse();
  const update = useUpdateCourse();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();

  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    subject_id: initial?.subject_id || "",
    thumbnail: initial?.thumbnail || "",
    level: initial?.level || "",
    duration: initial?.duration || "",
    order_index: initial?.order_index ?? 0,
    is_published: initial?.is_published ?? false,
    is_paid: initial?.is_paid ?? false,
    price: initial?.price?.toString() || "0",
    highlight: (initial as any)?.highlight || "" as string,
    teacherIds: initial?.teachers?.map((t) => t.id) || [] as string[],
  });

  const [uploading, setUploading] = useState(false);

  const handleThumbnailUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `course-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("course-thumbnails")
      .upload(fileName, file, { upsert: true });
    if (error) { toast.error("فشل رفع الصورة"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage
      .from("course-thumbnails")
      .getPublicUrl(data.path);
    setForm((f) => ({ ...f, thumbnail: publicUrl }));
    toast.success("تم رفع الصورة بنجاح");
    setUploading(false);
  };

  const toggleTeacher = (id: string) => {
    setForm((f) => ({
      ...f,
      teacherIds: f.teacherIds.includes(id) ? f.teacherIds.filter((x) => x !== id) : [...f.teacherIds, id],
    }));
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("عنوان الكورس مطلوب"); return; }
    if (!form.subject_id) { toast.error("اختر المادة الدراسية"); return; }
    const { teacherIds, is_paid, price, ...rest } = form;
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...rest, is_paid, price: parseFloat(price) || 0, teacherIds });
      toast.success("تم تحديث الكورس");
    } else {
      await create.mutateAsync({ ...rest, is_paid, price: parseFloat(price) || 0, teacherIds });
      toast.success("تمت إضافة الكورس");
    }
    onClose();
  };

  return (
    <ModalShell title={initial ? "تعديل كورس" : "إضافة كورس جديد"} onClose={onClose}>
      <Field label="عنوان الكورس *">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
      </Field>
      <Field label="الوصف">
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="المادة *">
          <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="input-field">
            <option value="">اختر المادة</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="المستوى">
          <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="input-field" placeholder="الصف الأول..." />
        </Field>
      </div>
      <Field label="المدة">
        <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="input-field" placeholder="مثال: 20 ساعة" />
      </Field>
      <Field label="تمييز المحتوى (Badge)">
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "", label: "بدون", color: "border-gray-300 bg-gray-50" },
            { value: "important", label: "⭐ مهم", color: "border-blue-500 bg-blue-50" },
            { value: "review", label: "🔥 مراجعة نهائية", color: "border-orange-500 bg-orange-50" },
            { value: "exam", label: "⏰ ليلة الامتحان", color: "border-red-500 bg-red-50" },
          ].map((h) => (
            <button
              key={h.value}
              type="button"
              onClick={() => setForm({ ...form, highlight: h.value })}
              className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${
                form.highlight === h.value ? h.color : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="صورة الكورس المصغرة">
        <div className="flex flex-col gap-2">
          {form.thumbnail && (
            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border bg-muted">
              <img src={form.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setForm({ ...form, thumbnail: "" })}
                className="absolute top-2 left-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            uploading ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
          }`}>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
              disabled={uploading}
            />
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-sm font-medium text-primary">جارٍ الرفع...</span></>
            ) : (
              <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium text-muted-foreground">اضغط لرفع صورة من الجهاز</span></>
            )}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">أو أدخل رابط</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="relative">
            <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} className="input-field pr-10" placeholder="https://..." dir="ltr" />
          </div>
        </div>
      </Field>
      <Field label="المعلمون">
        <div className="flex flex-wrap gap-2 mt-1">
          {teachers.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTeacher(t.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                form.teacherIds.includes(t.id)
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">منشور</label>
        <button
          type="button"
          onClick={() => setForm({ ...form, is_published: !form.is_published })}
          className={`relative w-10 h-5 rounded-full transition-colors ${form.is_published ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_published ? "right-0.5" : "left-0.5"}`} />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">كورس مدفوع</label>
        <button
          type="button"
          onClick={() => setForm({ ...form, is_paid: !form.is_paid })}
          className={`relative w-10 h-5 rounded-full transition-colors ${form.is_paid ? "bg-amber-500" : "bg-muted-foreground/30"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_paid ? "right-0.5" : "left-0.5"}`} />
        </button>
      </div>
      {form.is_paid && (
        <Field label="السعر (جنيه)">
          <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" min="0" placeholder="0" />
        </Field>
      )}
      <SaveBtn isPending={create.isPending || update.isPending} onSave={save} />
    </ModalShell>
  );
}

function LectureModal({ onClose }: { onClose: () => void }) {
  const create = useCreateLecture();
  const { data: courses = [] } = useCourses(false);
  const [form, setForm] = useState({
    course_id: "",
    title: "",
    description: "",
    duration: "",
    order_index: 0,
    is_preview: false,
  });

  const save = async () => {
    if (!form.title.trim()) { toast.error("عنوان المحاضرة مطلوب"); return; }
    if (!form.course_id) { toast.error("اختر الكورس"); return; }
    await create.mutateAsync(form);
    toast.success("تمت إضافة المحاضرة");
    onClose();
  };

  return (
    <ModalShell title="إضافة محاضرة جديدة" onClose={onClose}>
      <Field label="الكورس *">
        <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="input-field">
          <option value="">اختر الكورس</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </Field>
      <Field label="عنوان المحاضرة *">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
      </Field>
      <Field label="الوصف">
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="المدة">
          <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="input-field" placeholder="مثال: 45 دقيقة" />
        </Field>
        <Field label="الترتيب">
          <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: +e.target.value })} className="input-field" />
        </Field>
      </div>
      <SaveBtn isPending={create.isPending} onSave={save} />
    </ModalShell>
  );
}

function LessonModal({ onClose }: { onClose: () => void }) {
  const createLesson = useCreateLesson();
  const { data: lectures = [] } = useAllLectures();
  const [form, setForm] = useState({
    lecture_id: "",
    title: "",
    description: "",
    video_url: "",
    youtube_video_id: "",
    duration: "",
    order_index: 0,
    is_preview: false,
    is_completed: false,
  });

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] ?? "";
  };

  const handleVideoUrlChange = (url: string) => {
    const ytId = extractYoutubeId(url);
    setForm({ ...form, video_url: url, youtube_video_id: ytId });
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("عنوان الدرس مطلوب"); return; }
    if (!form.lecture_id) { toast.error("اختر المحاضرة"); return; }
    if (!form.video_url.trim()) { toast.error("رابط الفيديو مطلوب"); return; }
    await createLesson.mutateAsync(form);
    toast.success("تمت إضافة الدرس");
    onClose();
  };

  return (
    <ModalShell title="إضافة درس جديد" onClose={onClose}>
      <Field label="المحاضرة *">
        <select value={form.lecture_id} onChange={(e) => setForm({ ...form, lecture_id: e.target.value })} className="input-field">
          <option value="">اختر المحاضرة</option>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {lectures.map((l: any) => (
            <option key={l.id} value={l.id}>
              {l.course?.title ? `${l.course.title} — ` : ""}{l.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="عنوان الدرس *">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="مثال: مقدمة في الجبر" />
      </Field>
      <Field label="الوصف">
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
      </Field>
      <Field label="رابط الفيديو (YouTube أو URL مباشر) *">
        <div className="relative">
          <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={form.video_url}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            className="input-field pr-10"
            placeholder="https://youtube.com/watch?v=..."
            dir="ltr"
          />
        </div>
        {form.youtube_video_id && (
          <p className="text-xs text-accent font-medium mt-1">✓ تم اكتشاف YouTube ID: {form.youtube_video_id}</p>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="المدة">
          <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="input-field" placeholder="مثال: 12 دقيقة" />
        </Field>
        <Field label="الترتيب">
          <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: +e.target.value })} className="input-field" />
        </Field>
      </div>
      <SaveBtn isPending={createLesson.isPending} onSave={save} />
    </ModalShell>
  );
}

function PlaylistModal({ onClose }: { onClose: () => void }) {
  const importPlaylist = useImportPlaylist();
  const { data: courses = [] } = useCourses(false);
  const { data: lectures = [] } = useAllLectures();
  const [form, setForm] = useState({ playlist_id: "", course_id: "", lecture_id: "" });
  const [result, setResult] = useState<{ playlist_title?: string; imported_count?: number } | null>(null);

  const extractPlaylistId = (input: string) => {
    const match = input.match(/[?&]list=([^&]+)/);
    return match ? match[1] : input.trim();
  };

  const handleImport = async () => {
    if (!form.playlist_id.trim()) { toast.error("أدخل Playlist ID أو الرابط"); return; }
    if (!form.course_id) { toast.error("اختر الكورس"); return; }
    const playlistId = extractPlaylistId(form.playlist_id);
    const data = await importPlaylist.mutateAsync({
      playlist_id: playlistId,
      course_id: form.course_id,
      lecture_id: form.lecture_id || undefined,
    });
    setResult(data);
    toast.success(`تم استيراد ${data.imported_count} فيديو بنجاح!`);
  };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const filteredLectures = lectures.filter((l: any) => !form.course_id || l.course_id === form.course_id);

  return (
    <ModalShell title="استيراد Playlist من YouTube" onClose={onClose}>
      {result ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Youtube className="w-8 h-8 text-accent" />
          </div>
          <p className="text-2xl font-black text-foreground mb-1">{result.imported_count} فيديو</p>
          <p className="text-muted-foreground text-sm mb-2">تم الاستيراد بنجاح</p>
          <p className="font-semibold text-foreground">{result.playlist_title}</p>
          <button onClick={onClose} className="mt-6 btn-primary">إغلاق</button>
        </div>
      ) : (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
            <strong>ملاحظة:</strong> الـ Playlist يجب أن يكون عاماً (Public) على YouTube.
          </div>
          <Field label="رابط أو ID الـ Playlist *">
            <div className="relative">
              <Youtube className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              <input
                value={form.playlist_id}
                onChange={(e) => setForm({ ...form, playlist_id: e.target.value })}
                className="input-field pr-10"
                placeholder="https://youtube.com/playlist?list=PL... أو PLxxxxxx"
                dir="ltr"
              />
            </div>
          </Field>
          <Field label="الكورس *">
            <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value, lecture_id: "" })} className="input-field">
              <option value="">اختر الكورس</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Field>
          <Field label="المحاضرة (اختياري — سيتم إنشاء محاضرة جديدة إذا تُركت فارغة)">
            <select value={form.lecture_id} onChange={(e) => setForm({ ...form, lecture_id: e.target.value })} className="input-field" disabled={!form.course_id}>
              <option value="">إنشاء محاضرة جديدة تلقائياً</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filteredLectures.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </Field>
          <button
            onClick={handleImport}
            disabled={importPlaylist.isPending}
            className="btn-primary flex items-center justify-center gap-2 mt-2"
          >
            {importPlaylist.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جارٍ الاستيراد...
              </>
            ) : (
              <>
                <Youtube className="w-4 h-4" />
                استيراد الفيديوهات
              </>
            )}
          </button>
        </>
      )}
    </ModalShell>
  );
}

// ─── SHARED UI ─────────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-black text-xl text-foreground">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

function SaveBtn({ isPending, onSave }: { isPending: boolean; onSave: () => void }) {
  return (
    <button
      onClick={onSave}
      disabled={isPending}
      className="btn-primary flex items-center justify-center gap-2 mt-2"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {isPending ? "جارٍ الحفظ..." : "حفظ"}
    </button>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

const Admin = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [modal, setModal] = useState<string | null>(null);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [editTarget, setEditTarget] = useState<any>(null);

  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: courses = [], isLoading: coursesLoading } = useCourses(false);
  const { data: lectures = [], isLoading: lecturesLoading } = useAllLectures();

  const deleteSubject = useDeleteSubject();
  const deleteTeacher = useDeleteTeacher();
  const deleteCourse = useDeleteCourse();
  const deleteLecture = useDeleteLecture();
  const deleteLesson = useDeleteLesson();
  const updateCourse = useUpdateCourse();

  const togglePublish = async (course: Course) => {
    await updateCourse.mutateAsync({ id: course.id, is_published: !course.is_published });
    toast.success(course.is_published ? "تم إخفاء الكورس" : "تم نشر الكورس");
  };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const openEdit = (type: string, item: any) => {
    setEditTarget(item);
    setModal(`edit-${type}`);
  };

  const closeModal = () => { setModal(null); setEditTarget(null); };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "نظرة عامة", icon: LayoutDashboard },
    { key: "subjects", label: "المواد", icon: BookOpen },
    { key: "teachers", label: "المعلمين", icon: Users },
    { key: "courses", label: "الكورسات", icon: GraduationCap },
    { key: "lectures", label: "المحاضرات", icon: BookMarked },
    { key: "challenges", label: "التحديات", icon: CalendarCheck },
    { key: "codes", label: "أكواد الدخول", icon: Key },
    { key: "recharge", label: "أكواد الشحن", icon: Wallet },
    { key: "discounts", label: "أكواد الخصم", icon: Percent },
    { key: "questions", label: "بنك الأسئلة", icon: HelpCircle },
    { key: "summaries", label: "الملخصات", icon: FileText },
    { key: "homepage", label: "الصفحة الرئيسية", icon: LayoutGrid },
    { key: "activities", label: "النشاطات", icon: Sparkles },
    { key: "settings", label: "الإعدادات", icon: Settings },
    { key: "students", label: "الطلاب", icon: Users },
    { key: "sales", label: "المبيعات", icon: TrendingUp },
    { key: "notifications", label: "الإشعارات", icon: Bell },
  ];

  const stats = [
    { label: "مواد دراسية", value: subjects.length, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
    { label: "معلمين", value: teachers.length, icon: Users, color: "bg-teal-50 text-teal-600" },
    { label: "كورسات", value: courses.length, icon: GraduationCap, color: "bg-purple-50 text-purple-600" },
    { label: "محاضرات", value: lectures.length, icon: BookMarked, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Modals */}
      {modal === "subject" && <SubjectModal onClose={closeModal} />}
      {modal === "edit-subject" && <SubjectModal onClose={closeModal} initial={editTarget} />}
      {modal === "teacher" && <TeacherModal onClose={closeModal} />}
      {modal === "edit-teacher" && <TeacherModal onClose={closeModal} initial={editTarget} />}
      {modal === "course" && <CourseModal onClose={closeModal} />}
      {modal === "edit-course" && <CourseModal onClose={closeModal} initial={editTarget} />}
      {modal === "lecture" && <LectureModal onClose={closeModal} />}
      {modal === "lesson" && <LessonModal onClose={closeModal} />}
      {modal === "playlist" && <PlaylistModal onClose={closeModal} />}
      {modal === "chapters" && editTarget && <VideoChaptersModal lesson={editTarget} onClose={closeModal} />}
      {modal === "edit-lesson" && editTarget && <LessonEditModal lesson={editTarget} onClose={closeModal} />}

      {/* Admin Header */}
      <header className="gradient-primary shadow-md fixed top-0 right-0 left-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">لوحة التحكم</p>
              <p className="text-white/60 text-xs">منصة راجع – Admin</p>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            الموقع
          </Link>
        </div>
      </header>

      <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-8 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            <h2 className="text-2xl font-black text-foreground mb-6">نظرة عامة على المنصة</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                  <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-4`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-black text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm mb-6">
              <h3 className="font-bold text-foreground mb-4">إجراءات سريعة</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "إضافة مادة", icon: BookOpen, action: () => setModal("subject") },
                  { label: "إضافة معلم", icon: Users, action: () => setModal("teacher") },
                  { label: "إضافة كورس", icon: GraduationCap, action: () => setModal("course") },
                  { label: "إضافة محاضرة", icon: BookMarked, action: () => setModal("lecture") },
                  { label: "إضافة درس", icon: Video, action: () => setModal("lesson") },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/30 transition-all group"
                  >
                    <item.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors text-center">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* YouTube Import Card */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">استيراد من YouTube</h3>
                  <p className="text-sm text-muted-foreground">استورد Playlist كاملاً وأضفه لكورس بضغطة واحدة</p>
                </div>
              </div>
              <button
                onClick={() => setModal("playlist")}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                <ListVideo className="w-4 h-4" />
                استيراد Playlist
              </button>
            </div>

            {/* إعدادات الموقع */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">إعدادات الموقع</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">اسم الموقع</label>
                  <input
                    type="text"
                    id="siteNameInput"
                    defaultValue={typeof window !== 'undefined' ? localStorage.getItem('site_name') || 'راجع' : 'راجع'}
                    className="input-field"
                    placeholder="اسم الموقع"
                  />
                </div>
                <button
                  onClick={() => {
                    const input = document.getElementById('siteNameInput') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      localStorage.setItem('site_name', input.value.trim());
                      toast.success('تم تحديث اسم الموقع بنجاح');
                    }
                  }}
                  className="mt-6 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                  حفظ
                </button>
              </div>

              {/* صيانة الموقع */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-foreground">صيانة الموقع</h4>
                    <p className="text-sm text-muted-foreground">إغلاق الموقع نهائياً وإظهار رسالة الصيانة</p>
                  </div>
                  <button
                    onClick={() => {
                      const isMaintenance = localStorage.getItem('site_under_maintenance') === 'true';
                      if (isMaintenance) {
                        localStorage.removeItem('site_under_maintenance');
                        toast.success('تم إلغاء وضع الصيانة');
                      } else {
                        localStorage.setItem('site_under_maintenance', 'true');
                        toast.warning('تم تفعيل وضع الصيانة');
                      }
                    }}
                    className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-colors ${
                      localStorage.getItem('site_under_maintenance') === 'true' 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                    }`}
                  >
                    {localStorage.getItem('site_under_maintenance') === 'true' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        الموقع مغلق
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        تفعيل الصيانة
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subjects */}
        {activeTab === "subjects" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">إدارة المواد</h2>
              <button onClick={() => setModal("subject")} className="flex items-center gap-2 btn-primary text-sm">
                <Plus className="w-4 h-4" /> إضافة مادة
              </button>
            </div>
            {subjectsLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> : (
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground">المادة</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground">الوصف</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subjects.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{s.icon || "📚"}</span>
                            <span className="font-bold text-foreground">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{s.description}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit("subject", s)} className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => { await deleteSubject.mutateAsync(s.id); toast.success("تم حذف المادة"); }}
                              className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {subjects.length === 0 && (
                      <tr><td colSpan={3} className="px-6 py-10 text-center text-muted-foreground">لا توجد مواد بعد</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Teachers */}
        {activeTab === "teachers" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">إدارة المعلمين</h2>
              <button onClick={() => setModal("teacher")} className="flex items-center gap-2 btn-primary text-sm">
                <Plus className="w-4 h-4" /> إضافة معلم
              </button>
            </div>
            {teachersLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl border border-border shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-lg">
                          {t.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.specialty}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">{t.bio}</p>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit("teacher", t)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" /> تعديل
                      </button>
                      <button
                        onClick={async () => { await deleteTeacher.mutateAsync(t.id); toast.success("تم حذف المعلم"); }}
                        className="flex items-center justify-center p-2 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {teachers.length === 0 && (
                  <p className="col-span-3 text-center py-10 text-muted-foreground">لا يوجد معلمون بعد</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Courses */}
        {activeTab === "courses" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">إدارة الكورسات</h2>
              <div className="flex gap-2">
                <button onClick={() => setModal("playlist")} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
                  <Youtube className="w-4 h-4" /> استيراد YT
                </button>
                <button onClick={() => setModal("course")} className="flex items-center gap-2 btn-primary text-sm">
                  <Plus className="w-4 h-4" /> إضافة كورس
                </button>
              </div>
            </div>
            {coursesLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> : (
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right min-w-[640px]">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        <th className="px-5 py-4 text-xs font-bold text-muted-foreground">الكورس</th>
                        <th className="px-5 py-4 text-xs font-bold text-muted-foreground">المادة</th>
                        <th className="px-5 py-4 text-xs font-bold text-muted-foreground">المعلم</th>
                        <th className="px-5 py-4 text-xs font-bold text-muted-foreground">الحالة</th>
                        <th className="px-5 py-4 text-xs font-bold text-muted-foreground">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {course.thumbnail && (
                                <img src={course.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                              )}
                              <p className="font-medium text-sm text-foreground line-clamp-1">{course.title}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">{course.subject?.name}</td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">{course.teachers?.[0]?.name || "—"}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${course.is_published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {course.is_published ? "منشور" : "مخفي"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => togglePublish(course)} className={`p-2 rounded-lg transition-colors ${course.is_published ? "text-teal-600 hover:bg-teal-50" : "text-muted-foreground hover:bg-muted"}`}>
                                {course.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button onClick={() => openEdit("course", course)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <Link to={`/course/${course.id}`} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Video className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={async () => { await deleteCourse.mutateAsync(course.id); toast.success("تم حذف الكورس"); }}
                                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {courses.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">لا توجد كورسات بعد</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lectures & Lessons */}
        {activeTab === "lectures" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">إدارة المحاضرات والدروس</h2>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setModal("playlist")} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
                  <Youtube className="w-4 h-4" /> استيراد Playlist
                </button>
                <button onClick={() => setModal("lesson")} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
                  <Plus className="w-4 h-4" /> إضافة درس
                </button>
                <button onClick={() => setModal("lecture")} className="flex items-center gap-2 btn-primary text-sm">
                  <Plus className="w-4 h-4" /> إضافة محاضرة
                </button>
              </div>
            </div>
            {lecturesLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> : (
              <div className="grid grid-cols-1 gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {lectures.map((lecture: any) => (
                  <div key={lecture.id} className="bg-white rounded-2xl border border-border shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                            ترتيب {lecture.order_index}
                          </span>
                          <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                            {lecture.course?.title}
                          </span>
                        </div>
                        <h3 className="font-bold text-foreground mb-1">{lecture.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          {(lecture.lessons ?? []).length} درس
                          {lecture.duration ? ` • ${lecture.duration}` : ""}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(lecture.lessons ?? []).map((ls: any) => (
                            <div key={ls.id} className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-lg group">
                              <Video className="w-3 h-3" />
                              <span className="max-w-[120px] truncate">{ls.title}</span>
                              <button
                                onClick={() => { setEditTarget(ls); setModal("edit-lesson"); }}
                                className="opacity-0 group-hover:opacity-100 hover:text-blue-500 transition-all"
                                title="تعديل الدرس والأقسام والروابط"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => { setEditTarget(ls); setModal("chapters"); }}
                                className="opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
                                title="إدارة الأقسام"
                              >
                                <ChaptersIcon className="w-3 h-3" />
                              </button>
                              <button
                                onClick={async () => { await deleteLesson.mutateAsync(ls.id); toast.success("تم حذف الدرس"); }}
                                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={async () => { await deleteLecture.mutateAsync(lecture.id); toast.success("تم حذف المحاضرة"); }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {lectures.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-5xl mb-3">📭</p>
                    <p className="font-medium">لا توجد محاضرات بعد</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

         {/* Challenges */}
{activeTab === "challenges" && (
            <ChallengesTab />
          )}
          {/* Codes Management */}
          {activeTab === "codes" && (
            <CodesTab />
          )}
          {/* Recharge Codes */}
          {activeTab === "recharge" && (
            <RechargeCodesTab />
          )}
          {/* Discount Codes */}
          {activeTab === "discounts" && (
            <DiscountCodesTab />
          )}
          {/* Question Bank */}
          {activeTab === "questions" && (
            <QuestionsTab />
          )}
          {/* Summaries */}
          {activeTab === "summaries" && (
            <SummariesTab />
          )}
          {/* Home Page Manager */}
          {activeTab === "homepage" && (
            <HomePageTab />
          )}
          {/* Activities */}
          {activeTab === "activities" && (
            <ActivitiesTab />
          )}
          {/* Settings */}
          {activeTab === "settings" && (
            <SettingsTab />
          )}
          {/* Students */}
          {activeTab === "students" && (
            <AdminStudentsTab />
          )}
          {/* Sales */}
          {activeTab === "sales" && (
            <AdminSalesTab />
          )}
          {/* Notifications */}
          {activeTab === "notifications" && (
            <NotificationsTab />
          )}
       </div>
     </div>
   );
};
  
// ─── CODES TAB ──────────────────────────────────────────────────────────────
function CodesTab() {
  const [modal, setModal] = useState<string | null>(null);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [editingCode, setEditingCode] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    user_name: "",
    user_email: "",
    temp_password: "",
    duration_value: "30",
    duration_unit: "minutes",
    user_type: "student" as "student" | "teacher"
  });
  const [form, setForm] = useState({
    code: "",
    user_name: "",
    user_email: "",
    duration_value: "30",
    duration_unit: "minutes", // minutes, hours, days, weeks, months
    temp_password: "",
    password_mode: "auto" as "auto" | "custom",
    user_type: "student" as "student" | "teacher",
    teacher_id: "",
    subject_id: ""
  });

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [teachers, setTeachers] = useState<any[]>([]);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    loadCodes();
    loadTeachers();
    loadSubjects();
  }, []);

  const loadTeachers = async () => {
    const { data } = await supabase.from("teachers").select("*").order("name");
    if (data) setTeachers(data);
  };

  const loadSubjects = async () => {
    const { data } = await supabase.from("subjects").select("*").order("name");
    if (data) setSubjects(data);
  };

  const loadCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_codes")
      .select(`
        *,
        teacher:teachers(name),
        subject:subjects(name)
      `)
      .order("created_at", { ascending: false });
    
    setLoading(false);
    if (error) {
      console.error("Error loading codes:", error);
      toast.error("فشل في تحميل الأكواد: " + error.message);
    } else {
      setCodes(data ?? []);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreate = async () => {
    if (!form.code || !form.user_email) {
      toast.error("الكود والبريد الإلكتروني مطلوبان");
      return;
    }

    // Generate or use custom temp password
    const tempPassword = form.password_mode === "custom" 
      ? form.temp_password 
      : Math.random().toString(36).slice(-8);
    
    // Calculate expiration based on unit
    const value = parseInt(form.duration_value) || 0;
    let expiresAt: string;
    const now = Date.now();
    
    switch (form.duration_unit) {
      case "minutes":
        expiresAt = new Date(now + value * 60 * 1000).toISOString();
        break;
      case "hours":
        expiresAt = new Date(now + value * 60 * 60 * 1000).toISOString();
        break;
      case "days":
        expiresAt = new Date(now + value * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "weeks":
        expiresAt = new Date(now + value * 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "months":
        expiresAt = new Date(now + value * 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        expiresAt = new Date(now + value * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error } = await supabase.from("user_codes").insert({
      code: form.code.toUpperCase(),
      user_email: form.user_email,
      user_name: form.user_name,
      temp_password: tempPassword,
      expires_at: form.user_type === "teacher" ? null : expiresAt,
      user_type: form.user_type,
      teacher_id: form.user_type === "teacher" ? form.teacher_id || null : null,
      subject_id: form.user_type === "teacher" ? form.subject_id || null : null,
      is_unlimited: form.user_type === "teacher"
    });

    if (error) {
      toast.error("فشل في إنشاء الكود: " + error.message);
    } else {
      toast.success("تم إنشاء الكود بنجاح");
      setModal(null);
      setForm({ code: "", user_name: "", user_email: "", duration_value: "30", duration_unit: "minutes", temp_password: "", password_mode: "auto", user_type: "student", teacher_id: "", subject_id: "" });
      loadCodes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكود؟")) return;
    await supabase.from("user_codes").delete().eq("id", id);
    loadCodes();
    toast.success("تم الحذف");
  };

  const handleEdit = (code: any) => {
    setEditingCode(code);
    // Calculate duration from expires_at
    let durationValue = "30";
    let durationUnit = "days";
    if (code.expires_at) {
      const now = Date.now();
      const expires = new Date(code.expires_at).getTime();
      const diffMs = expires - now;
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
      const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30));
      
      if (diffMonths > 0 && diffMs % (1000 * 60 * 60 * 24 * 30) === 0) {
        durationValue = String(diffMonths);
        durationUnit = "months";
      } else if (diffWeeks > 0 && diffMs % (1000 * 60 * 60 * 24 * 7) === 0) {
        durationValue = String(diffWeeks);
        durationUnit = "weeks";
      } else if (diffDays > 0 && diffMs % (1000 * 60 * 60 * 24) === 0) {
        durationValue = String(diffDays);
        durationUnit = "days";
      } else if (diffHours > 0 && diffMs % (1000 * 60 * 60) === 0) {
        durationValue = String(diffHours);
        durationUnit = "hours";
      } else {
        durationValue = String(Math.max(1, diffMinutes));
        durationUnit = "minutes";
      }
    }
    setEditForm({
      user_name: code.user_name || "",
      user_email: code.user_email || "",
      temp_password: code.temp_password || "",
      duration_value: durationValue,
      duration_unit: durationUnit,
      user_type: code.user_type || "student"
    });
    setModal("edit");
  };

  const handleSaveEdit = async () => {
    if (!editingCode || !editForm.user_email) {
      toast.error("البريد الإلكتروني مطلوب");
      return;
    }

    const value = parseInt(editForm.duration_value) || 0;
    let expiresAt: string;
    const now = Date.now();
    
    switch (editForm.duration_unit) {
      case "minutes":
        expiresAt = new Date(now + value * 60 * 1000).toISOString();
        break;
      case "hours":
        expiresAt = new Date(now + value * 60 * 60 * 1000).toISOString();
        break;
      case "days":
        expiresAt = new Date(now + value * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "weeks":
        expiresAt = new Date(now + value * 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "months":
        expiresAt = new Date(now + value * 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        expiresAt = new Date(now + value * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error } = await supabase.from("user_codes").update({
      user_name: editForm.user_name,
      user_email: editForm.user_email,
      temp_password: editForm.temp_password,
      expires_at: expiresAt,
      user_type: editForm.user_type
    }).eq("id", editingCode.id);

    if (error) {
      toast.error("فشل في تحديث الكود: " + error.message);
    } else {
      toast.success("تم تحديث الكود بنجاح");
      setModal(null);
      setEditingCode(null);
      loadCodes();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-foreground">أكواد الدخول</h2>
        <button
          onClick={() => { setForm({ ...form, code: generateCode(), duration_unit: "minutes", temp_password: Math.random().toString(36).slice(-8), password_mode: "auto", user_type: "student" }); setModal("create"); }}
          className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          إنشاء كود جديد
        </button>
      </div>

      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      ) : codes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-3">🔑</p>
          <p className="font-medium">لا توجد أكواد بعد</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {codes.map((c) => (
            <div key={c.id} className="bg-white border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">{c.code}</p>
                  <p className="text-sm text-muted-foreground">{c.user_name || c.user_email}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-blue-600 font-mono">كلمه المرور: {c.temp_password}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.user_type === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.user_type === 'teacher' ? 'معلم' : 'طالب'}
                    </span>
                    {c.user_type === 'teacher' && c.teacher && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        {c.teacher.name}
                      </span>
                    )}
                    {c.user_type === 'teacher' && c.subject && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {c.subject.name_ar}
                      </span>
                    )}
                    {c.is_unlimited && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        شغال للأبد
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.user_type === 'teacher' ? (
                      <span className="text-emerald-600">كود معلم - شغال للأبد</span>
                    ) : c.is_used ? (
                      <span className="text-green-600">تم الاستخدام</span>
                    ) : c.expires_at && new Date(c.expires_at) < new Date() ? (
                      <span className="text-red-500">منتهي الصلاحية</span>
                    ) : (
                      <span>صالح حتى {new Date(c.expires_at).toLocaleDateString("ar")}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {modal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-foreground">إنشاء كود جديد</h3>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكود</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="input-field flex-1"
                    placeholder="XXXXXXXX"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, code: generateCode() })}
                    className="px-3 py-2 bg-muted rounded-lg hover:bg-muted/80"
                  >
                    توليد
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  value={form.user_name}
                  onChange={(e) => setForm({ ...form, user_name: e.target.value })}
                  className="input-field w-full"
                  placeholder="الاسم"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={form.user_email}
                  onChange={(e) => setForm({ ...form, user_email: e.target.value })}
                  className="input-field w-full"
                  placeholder="user@example.com"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الحساب</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, user_type: "student" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.user_type === "student" ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"}`}
                  >
                    طالب
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, user_type: "teacher" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.user_type === "teacher" ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"}`}
                  >
                    معلم
                  </button>
                </div>
              </div>

              {form.user_type === "teacher" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المعلم</label>
                    <select
                      value={form.teacher_id}
                      onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">اختر المعلم</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المادة</label>
                    <select
                      value={form.subject_id}
                      onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">اختر المادة</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور المؤقتة</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, password_mode: "auto", temp_password: Math.random().toString(36).slice(-8) })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.password_mode === "auto" ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"}`}
                  >
                    توليد تلقائي
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, password_mode: "custom" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.password_mode === "custom" ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"}`}
                  >
                    مخصص
                  </button>
                </div>
                <input
                  type="text"
                  value={form.temp_password}
                  onChange={(e) => setForm({ ...form, temp_password: e.target.value })}
                  className="input-field w-full"
                  placeholder="كلمة المرور"
                  dir="ltr"
                  readOnly={form.password_mode === "auto"}
                />
              </div>
              {form.user_type === "student" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">مدة الصلاحية</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={form.duration_value}
                      onChange={(e) => setForm({ ...form, duration_value: e.target.value })}
                      className="input-field"
                      min="1"
                      placeholder="المدة"
                    />
                    <select
                      value={form.duration_unit}
                      onChange={(e) => setForm({ ...form, duration_unit: e.target.value })}
                      className="input-field"
                    >
                      <option value="minutes">دقائق</option>
                      <option value="hours">ساعات</option>
                      <option value="days">أيام</option>
                      <option value="weeks">أسابيع</option>
                      <option value="months">شهور</option>
                    </select>
                  </div>
                </div>
              )}
              <button
                onClick={handleCreate}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors"
              >
                إنشاء الكود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal === "edit" && editingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => { setModal(null); setEditingCode(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-foreground">تعديل الكود</h3>
              <button onClick={() => { setModal(null); setEditingCode(null); }} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكود</label>
                <input
                  type="text"
                  value={editingCode.code}
                  className="input-field w-full bg-muted"
                  dir="ltr"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  value={editForm.user_name}
                  onChange={(e) => setEditForm({ ...editForm, user_name: e.target.value })}
                  className="input-field w-full"
                  placeholder="الاسم"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={editForm.user_email}
                  onChange={(e) => setEditForm({ ...editForm, user_email: e.target.value })}
                  className="input-field w-full"
                  placeholder="user@example.com"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الحساب</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, user_type: "student" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${editForm.user_type === "student" ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"}`}
                  >
                    طالب
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, user_type: "teacher" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${editForm.user_type === "teacher" ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"}`}
                  >
                    معلم
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور المؤقتة</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editForm.temp_password}
                    onChange={(e) => setEditForm({ ...editForm, temp_password: e.target.value })}
                    className="input-field flex-1"
                    placeholder="كلمة المرور"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, temp_password: Math.random().toString(36).slice(-8) })}
                    className="px-3 py-2 bg-muted rounded-lg hover:bg-muted/80"
                  >
                    توليد
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مدة الصلاحية (من الآن)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={editForm.duration_value}
                    onChange={(e) => setEditForm({ ...editForm, duration_value: e.target.value })}
                    className="input-field"
                    min="1"
                    placeholder="المدة"
                  />
                  <select
                    value={editForm.duration_unit}
                    onChange={(e) => setEditForm({ ...editForm, duration_unit: e.target.value })}
                    className="input-field"
                  >
                    <option value="minutes">دقائق</option>
                    <option value="hours">ساعات</option>
                    <option value="days">أيام</option>
                    <option value="weeks">أسابيع</option>
                    <option value="months">شهور</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleSaveEdit}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CHALLENGES TAB ──────────────────────────────────────────────────────────────────────────────

function ChallengeModal({ onClose, initial }: { onClose: () => void; initial?: Challenge }) {
  const create = useCreateChallenge();
  const update = useUpdateChallenge();
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    duration_days: initial?.duration_days ?? 30,
    hours: initial?.hours ?? 0,
    is_active: initial?.is_active ?? false,
    order_index: initial?.order_index ?? 0,
  });

  const save = async () => {
    if (!form.title.trim()) { toast.error("عنوان التحدي مطلوب"); return; }
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...form });
      toast.success("تم تحديث التحدي");
    } else {
      await create.mutateAsync(form);
      toast.success("تمت إضافة التحدي");
    }
    onClose();
  };

  return (
    <ModalShell title={initial ? "تعديل تحدي" : "إضافة تحدي جديد"} onClose={onClose}>
      <Field label="عنوان التحدي *">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="تحدي 30 يوم للثانوية" />
      </Field>
      <Field label="الوصف">
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} placeholder="وصف التحدي..." />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="عدد الأيام">
          <input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: +e.target.value })} className="input-field" min={1} />
        </Field>
        <Field label="عدد الساعات">
          <input type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: +e.target.value })} className="input-field" min={0} />
        </Field>
        <Field label="الترتيب">
          <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: +e.target.value })} className="input-field" />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">تحدي نشط (ظاهر للطلاب)</label>
        <button
          type="button"
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
          className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? "bg-accent" : "bg-muted-foreground/30"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_active ? "right-0.5" : "left-0.5"}`} />
        </button>
      </div>
      <SaveBtn isPending={create.isPending || update.isPending} onSave={save} />
    </ModalShell>
  );
}

function ChallengeTaskModal({ challenge, task, onClose }: { challenge: Challenge; task?: ChallengeTask; onClose: () => void }) {
  const upsert = useUpsertChallengeTask();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();
  const { data: courses = [] } = useCourses(false);
  const { data: lectures = [] } = useAllLectures();

  const [form, setForm] = useState({
    challenge_id: challenge.id,
    day_number: task?.day_number ?? 1,
    task_order: task?.task_order ?? 0,
    title: task?.title || "",
    notes: task?.notes || "",
    subject_id: task?.subject_id || "",
    teacher_id: task?.teacher_id || "",
    course_id: task?.course_id || "",
    lecture_id: task?.lecture_id || "",
    lesson_id: task?.lesson_id || "",
    custom_video_url: task?.custom_video_url || "",
    custom_file_url: task?.custom_file_url || "",
    estimated_minutes: task?.estimated_minutes ?? 30,
    is_visible: task?.is_visible ?? true,
  });

  // Multiple lessons/videos
  const [taskLessons, setTaskLessons] = useState<{ lesson_id: string; custom_video_url: string; custom_video_title: string }[]>(
    task?.task_lessons?.map((tl) => ({
      lesson_id: tl.lesson_id || "",
      custom_video_url: tl.custom_video_url || "",
      custom_video_title: tl.custom_video_title || "",
    })) ?? []
  );

  // Multiple files
  const [taskFiles, setTaskFiles] = useState<{ file_url: string; file_name: string }[]>(
    task?.task_files?.map((tf) => ({ file_url: tf.file_url, file_name: tf.file_name || "" })) ?? []
  );

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const filteredLectures = (lectures as any[]).filter((l) => !form.course_id || l.course_id === form.course_id);
  const filteredLessons = filteredLectures
    .filter((l) => !form.lecture_id || l.id === form.lecture_id)
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    .flatMap((l: any) => l.lessons ?? []);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const allLessons = (lectures as any[]).flatMap((l: any) => l.lessons ?? []);

  const addLesson = () => setTaskLessons([...taskLessons, { lesson_id: "", custom_video_url: "", custom_video_title: "" }]);
  const removeLesson = (i: number) => setTaskLessons(taskLessons.filter((_, idx) => idx !== i));
  const updateLesson = (i: number, field: string, val: string) =>
    setTaskLessons(taskLessons.map((tl, idx) => idx === i ? { ...tl, [field]: val } : tl));

  const addFile = () => setTaskFiles([...taskFiles, { file_url: "", file_name: "" }]);
  const removeFile = (i: number) => setTaskFiles(taskFiles.filter((_, idx) => idx !== i));
  const updateFile = (i: number, field: string, val: string) =>
    setTaskFiles(taskFiles.map((tf, idx) => idx === i ? { ...tf, [field]: val } : tf));

  const save = async () => {
    if (!form.title.trim()) { toast.error("عنوان المهمة مطلوب"); return; }
    if (form.day_number < 1) { toast.error("رقم اليوم يجب أن يكون أكبر من 0"); return; }
    const validFiles = taskFiles.filter((f) => f.file_url.trim());
    await upsert.mutateAsync({
      ...form,
      id: task?.id,
      subject_id: form.subject_id || null,
      teacher_id: form.teacher_id || null,
      course_id: form.course_id || null,
      lecture_id: form.lecture_id || null,
      lesson_id: form.lesson_id || null,
      taskLessons: taskLessons.filter((tl) => tl.lesson_id || tl.custom_video_url),
      taskFiles: validFiles,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } as any);
    toast.success("تم حفظ المهمة");
    onClose();
  };

  return (
    <ModalShell title={task ? `تعديل مهمة – اليوم ${task.day_number}` : "إضافة مهمة جديدة"} onClose={onClose}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="رقم اليوم *">
          <input type="number" value={form.day_number} onChange={(e) => setForm({ ...form, day_number: +e.target.value })} className="input-field" min={1} max={challenge.duration_days} />
        </Field>
        <Field label="ترتيب المهمة في اليوم">
          <input type="number" value={form.task_order} onChange={(e) => setForm({ ...form, task_order: +e.target.value })} className="input-field" min={0} />
        </Field>
        <Field label="الوقت (دقيقة)">
          <input type="number" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: +e.target.value })} className="input-field" min={1} />
        </Field>
      </div>
      <Field label="عنوان المهمة *">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="مثال: مشاهدة درس الاتزان الكيميائي" />
      </Field>
      <Field label="ملاحظات">
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} placeholder="تعليمات خاصة باليوم..." />
      </Field>

      {/* Linked content */}
      <div className="border-t border-border pt-4">
        <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">ربط بالمحتوى الموجود</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="المادة">
            <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="input-field">
              <option value="">بدون تحديد</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="المعلم">
            <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className="input-field">
              <option value="">بدون تحديد</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="الكورس">
            <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value, lecture_id: "", lesson_id: "" })} className="input-field">
              <option value="">بدون تحديد</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Field>
          <Field label="المحاضرة">
            <select value={form.lecture_id} onChange={(e) => setForm({ ...form, lecture_id: e.target.value, lesson_id: "" })} className="input-field" disabled={!form.course_id}>
              <option value="">بدون تحديد</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filteredLectures.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3">
          <Field label="الدرس الرئيسي">
            <select value={form.lesson_id} onChange={(e) => setForm({ ...form, lesson_id: e.target.value })} className="input-field" disabled={filteredLessons.length === 0 && !form.lesson_id}>
              <option value="">بدون تحديد</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filteredLessons.map((ls: any) => <option key={ls.id} value={ls.id}>{ls.title}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Multiple lessons/videos */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">فيديوهات / دروس إضافية</p>
          <button type="button" onClick={addLesson} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
            <Plus className="w-3 h-3" /> إضافة فيديو
          </button>
        </div>
        {taskLessons.length === 0 && (
          <p className="text-xs text-muted-foreground">لا توجد فيديوهات إضافية — اضغط "إضافة فيديو"</p>
        )}
        {taskLessons.map((tl, i) => (
          <div key={i} className="bg-muted/40 rounded-xl p-3 mb-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">فيديو {i + 1}</span>
              <button type="button" onClick={() => removeLesson(i)} className="text-destructive hover:bg-destructive/10 rounded p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <Field label="درس من المنصة">
              <select value={tl.lesson_id} onChange={(e) => updateLesson(i, "lesson_id", e.target.value)} className="input-field">
                <option value="">اختر درساً (اختياري)</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {allLessons.map((ls: any) => <option key={ls.id} value={ls.id}>{ls.title}</option>)}
              </select>
            </Field>
            <Field label="أو رابط YouTube مخصص">
              <input value={tl.custom_video_url} onChange={(e) => updateLesson(i, "custom_video_url", e.target.value)} className="input-field" placeholder="https://youtube.com/watch?v=..." dir="ltr" />
            </Field>
            <Field label="عنوان الفيديو">
              <input value={tl.custom_video_title} onChange={(e) => updateLesson(i, "custom_video_title", e.target.value)} className="input-field" placeholder="عنوان الفيديو..." />
            </Field>
          </div>
        ))}
      </div>

      {/* Multiple files */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">ملفات مرفقة (PDF / ملخصات)</p>
          <button type="button" onClick={addFile} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
            <Plus className="w-3 h-3" /> إضافة ملف
          </button>
        </div>
        {taskFiles.length === 0 && (
          <p className="text-xs text-muted-foreground">لا توجد ملفات — اضغط "إضافة ملف"</p>
        )}
        {taskFiles.map((tf, i) => (
          <div key={i} className="bg-muted/40 rounded-xl p-3 mb-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">ملف {i + 1}</span>
              <button type="button" onClick={() => removeFile(i)} className="text-destructive hover:bg-destructive/10 rounded p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <Field label="رابط الملف *">
              <input value={tf.file_url} onChange={(e) => updateFile(i, "file_url", e.target.value)} className="input-field" placeholder="https://..." dir="ltr" />
            </Field>
            <Field label="اسم الملف">
              <input value={tf.file_name} onChange={(e) => updateFile(i, "file_name", e.target.value)} className="input-field" placeholder="مثال: ورقة تدريب – كيمياء" />
            </Field>
          </div>
        ))}
      </div>

      {/* Legacy single file */}
      <div className="border-t border-border pt-4">
        <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">رابط فيديو إضافي (قديم)</p>
        <Field label="رابط فيديو مخصص (YouTube)">
          <input value={form.custom_video_url} onChange={(e) => setForm({ ...form, custom_video_url: e.target.value })} className="input-field" placeholder="https://youtube.com/watch?v=..." dir="ltr" />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">ظاهر للطلاب</label>
        <button
          type="button"
          onClick={() => setForm({ ...form, is_visible: !form.is_visible })}
          className={`relative w-10 h-5 rounded-full transition-colors ${form.is_visible ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_visible ? "right-0.5" : "left-0.5"}`} />
        </button>
      </div>
      <SaveBtn isPending={upsert.isPending} onSave={save} />
    </ModalShell>
  );
}

function ChallengesTab() {
  const { data: challenges = [], isLoading } = useChallenges();
  const deleteChallenge = useDeleteChallenge();
  const updateChallenge = useUpdateChallenge();
  const deleteTask = useDeleteChallengeTask();
  const [modal, setModal] = useState<string | null>(null);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [editTarget, setEditTarget] = useState<any>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const { data: tasks = [], isLoading: tasksLoading } = useChallengeTasks(selectedChallenge?.id);

  const closeModal = () => { setModal(null); setEditTarget(null); };

  return (
    <div>
      {modal === "challenge" && <ChallengeModal onClose={closeModal} />}
      {modal === "edit-challenge" && <ChallengeModal onClose={closeModal} initial={editTarget} />}
      {modal === "task" && selectedChallenge && <ChallengeTaskModal challenge={selectedChallenge} onClose={closeModal} />}
      {modal === "edit-task" && selectedChallenge && <ChallengeTaskModal challenge={selectedChallenge} task={editTarget} onClose={closeModal} />}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-foreground">إدارة التحديات</h2>
        <button onClick={() => { setSelectedChallenge(null); setModal("challenge"); }} className="flex items-center gap-2 btn-primary text-sm">
          <Plus className="w-4 h-4" /> إضافة تحدي
        </button>
      </div>

      {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Challenges List */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            {challenges.map((ch) => (
              <div
                key={ch.id}
                onClick={() => setSelectedChallenge(ch)}
                className={`bg-white rounded-2xl border p-4 cursor-pointer shadow-sm transition-all ${
                  selectedChallenge?.id === ch.id ? "border-primary shadow-md" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {ch.is_active && (
                        <span className="text-xs bg-accent text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Flame className="w-3 h-3" /> نشط
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{ch.duration_days} يوم{ch.hours ? ` و ${ch.hours} ساعة` : ''}</span>
                    </div>
                    <p className="font-bold text-foreground text-sm line-clamp-2">{ch.title}</p>
                    {ch.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ch.description}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateChallenge.mutateAsync({ id: ch.id, is_active: !ch.is_active }); toast.success(ch.is_active ? "تم إيقاف التحدي" : "تم تفعيل التحدي"); }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        ch.is_active ? "text-accent hover:bg-accent/10" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {ch.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditTarget(ch); setModal("edit-challenge"); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async (e) => { e.stopPropagation(); await deleteChallenge.mutateAsync(ch.id); toast.success("تم حذف التحدي"); if (selectedChallenge?.id === ch.id) setSelectedChallenge(null); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {challenges.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">لا توجد تحديات بعد</p>
              </div>
            )}
          </div>

          {/* Tasks Panel */}
          <div className="lg:col-span-2">
            {selectedChallenge ? (
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-foreground">{selectedChallenge.title}</h3>
                    <p className="text-sm text-muted-foreground">{tasks.length} مهمة مضافة من أصل {selectedChallenge.duration_days}</p>
                  </div>
                  <button onClick={() => setModal("task")} className="flex items-center gap-2 btn-primary text-xs px-3 py-2">
                    <Plus className="w-3.5 h-3.5" /> إضافة مهمة
                  </button>
                </div>

                {tasksLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          task.is_visible ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          {task.day_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">{task.title}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {task.subject && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{task.subject.icon} {task.subject.name}</span>}
                            {task.teacher && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">👨‍🏫 {task.teacher.name}</span>}
                            {task.lesson && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">▶️ {task.lesson.title.slice(0, 25)}</span>}
                            {task.estimated_minutes && <span className="text-xs text-muted-foreground">⏱ {task.estimated_minutes} دقيقة</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => { setEditTarget(task); setModal("edit-task"); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => { await deleteTask.mutateAsync({ id: task.id, challengeId: selectedChallenge.id }); toast.success("تم حذف المهمة"); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-4xl mb-2">📋</p>
                        <p className="text-sm">لا توجد مهام بعد — اضغط "إضافة مهمة"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">اختر تحدياً من القائمة لعرض مهامه</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LESSON EDIT MODAL (Full Management) ─────────────────────────────────────────────────────────────

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function LessonEditModal({ lesson, onClose }: { lesson: any; onClose: () => void }) {
  const updateLesson = useUpdateLesson();
  const fetchMeta = useFetchVideoMetadata();
  const upsertLinks = useUpsertVideoLinks();
  const upsertChapters = useUpsertVideoChapters();

  const { data: existingLinks = [], isLoading: linksLoading } = useAllVideoLinks(lesson.id);
  const { data: existingChapters = [], isLoading: chaptersLoading } = useAllVideoChapters(lesson.id);

  const [activeSection, setActiveSection] = useState<"info" | "links" | "chapters">("info");
  const [form, setForm] = useState({
    title: lesson.title || "",
    description: lesson.description || "",
    video_url: lesson.video_url || "",
    youtube_video_id: lesson.youtube_video_id || "",
    duration: lesson.duration || "",
  });
  const [videoInput, setVideoInput] = useState(lesson.video_url || lesson.youtube_video_id || "");

  // Links state
  const [links, setLinks] = useState<{ url: string; title: string; is_visible: boolean }[]>([]);
  const [linksReady, setLinksReady] = useState(false);
  if (!linksReady && !linksLoading && existingLinks.length >= 0) {
    setLinksReady(true);
    setLinks(existingLinks.map((l) => ({ url: l.url, title: l.title, is_visible: l.is_visible })));
  }

  // Chapters state
  const [rawChaptersText, setRawChaptersText] = useState("");
  const [chaptersReady, setChaptersReady] = useState(false);
  if (!chaptersReady && !chaptersLoading) {
    setChaptersReady(true);
    if (existingChapters.length > 0) {
      const text = existingChapters
        .map((ch) => `${formatSeconds(ch.start_time_seconds)} ${ch.title}`)
        .join("\n");
      setRawChaptersText(text);
    }
  }

  const handleFetchMeta = async () => {
    if (!videoInput.trim()) { toast.error("أدخل رابط أو ID الفيديو"); return; }
    const result = await fetchMeta.mutateAsync(videoInput.trim());
    setForm((f) => ({
      ...f,
      title: result.title || f.title,
      description: result.description || f.description,
      duration: result.duration || f.duration,
      youtube_video_id: result.youtube_video_id,
      video_url: videoInput.trim(),
    }));
    // Merge extracted links (add new ones)
    const existingUrls = new Set(links.map((l) => l.url));
    const newLinks = result.links
      .filter((l) => !existingUrls.has(l.url))
      .map((l) => ({ url: l.url, title: l.title, is_visible: true }));
    setLinks((prev) => [...prev, ...newLinks]);
    toast.success(`تم جلب البيانات${newLinks.length > 0 ? ` + ${newLinks.length} رابط جديد` : ""}`);
  };

  const saveInfo = async () => {
    if (!form.title.trim()) { toast.error("عنوان الدرس مطلوب"); return; }
    await updateLesson.mutateAsync({ id: lesson.id, ...form });
    toast.success("تم تحديث بيانات الدرس");
  };

  const saveLinks = async () => {
    const validLinks = links.filter((l) => l.url.trim());
    await upsertLinks.mutateAsync({
      lessonId: lesson.id,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      links: validLinks.map((l, i) => ({ ...l, order_index: i })) as any,
    });
    toast.success(`تم حفظ ${validLinks.length} رابط`);
  };

  const saveChapters = async () => {
    const parsed = parseChaptersText(rawChaptersText);
    if (parsed.length === 0) { toast.error("لا توجد أقسام صحيحة للحفظ"); return; }
    await upsertChapters.mutateAsync({ lessonId: lesson.id, chapters: parsed });
    toast.success(`تم حفظ ${parsed.length} قسم`);
  };

  const addLink = () => setLinks([...links, { url: "", title: "رابط إضافي", is_visible: true }]);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const updateLink = (i: number, field: string, val: any) =>
    setLinks(links.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const parsedChapters = parseChaptersText(rawChaptersText);

  const sections = [
    { key: "info" as const, label: "بيانات الدرس" },
    { key: "links" as const, label: `الروابط (${links.length})` },
    { key: "chapters" as const, label: `الأقسام (${parsedChapters.length})` },
  ];

  return (
    <ModalShell title={`تعديل: ${lesson.title?.slice(0, 40)}...`} onClose={onClose}>
      {/* Section tabs */}
      <div className="flex gap-1.5 bg-muted/50 rounded-xl p-1">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeSection === s.key ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Info Section ── */}
      {activeSection === "info" && (
        <>
          {/* YouTube fetch */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5" /> جلب البيانات من YouTube تلقائياً
            </p>
            <div className="flex gap-2">
              <input
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                className="input-field flex-1 text-sm"
                placeholder="رابط YouTube أو Video ID"
                dir="ltr"
              />
              <button
                onClick={handleFetchMeta}
                disabled={fetchMeta.isPending}
                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
              >
                {fetchMeta.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Youtube className="w-3.5 h-3.5" />}
                جلب
              </button>
            </div>
            {form.youtube_video_id && (
              <p className="text-xs text-red-700 mt-1.5 font-mono">✓ ID: {form.youtube_video_id}</p>
            )}
          </div>

          <Field label="عنوان الدرس *">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
          </Field>
          <Field label="الوصف">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المدة">
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="input-field" placeholder="12:30" />
            </Field>
            <Field label="YouTube Video ID">
              <input value={form.youtube_video_id} onChange={(e) => setForm({ ...form, youtube_video_id: e.target.value })} className="input-field font-mono text-sm" dir="ltr" />
            </Field>
          </div>
          <button
            onClick={saveInfo}
            disabled={updateLesson.isPending}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {updateLesson.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ البيانات
          </button>
        </>
      )}

      {/* ── Links Section ── */}
      {activeSection === "links" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">الروابط الظاهرة للطلاب تحت الفيديو</p>
            <button onClick={addLink} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" /> إضافة رابط
            </button>
          </div>
          {links.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              لا توجد روابط — اضغط "جلب" في تبويب البيانات لاستخراجها تلقائياً
            </div>
          )}
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {links.map((link, i) => (
              <div key={i} className="bg-muted/40 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">رابط {i + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateLink(i, "is_visible", !link.is_visible)}
                      className={`text-xs p-1 rounded transition-colors ${link.is_visible ? "text-teal-600 hover:bg-teal-50" : "text-muted-foreground hover:bg-muted"}`}
                      title={link.is_visible ? "إخفاء" : "إظهار"}
                    >
                      {link.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => removeLink(i)} className="text-destructive hover:bg-destructive/10 rounded p-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  value={link.title}
                  onChange={(e) => updateLink(i, "title", e.target.value)}
                  className="input-field text-sm"
                  placeholder="اسم الرابط (مثال: تحميل الملف)"
                />
                <input
                  value={link.url}
                  onChange={(e) => updateLink(i, "url", e.target.value)}
                  className="input-field text-sm font-mono"
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveLinks}
            disabled={upsertLinks.isPending}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {upsertLinks.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ {links.filter((l) => l.url.trim()).length} رابط
          </button>
        </>
      )}

      {/* ── Chapters Section ── */}
      {activeSection === "chapters" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
            <strong>صيغة الإدخال (كل سطر = قسم):</strong>
            <pre className="mt-1 font-mono text-blue-700">{`00:00:00 مقدمة وخطة المراجعة
00:01:48 شرح Vocabulary
01:04:00 الكلمات المتشابهة`}</pre>
          </div>
          <Field label="نص الأقسام (Paste)">
            <textarea
              value={rawChaptersText}
              onChange={(e) => setRawChaptersText(e.target.value)}
              className="input-field font-mono text-sm"
              rows={8}
              placeholder={`00:00:00 مقدمة\n00:05:30 الدرس الأول\n01:10:00 خلاصة`}
              dir="ltr"
            />
          </Field>
          {parsedChapters.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-xs font-bold text-green-800 mb-2">✓ {parsedChapters.length} أقسام جاهزة للحفظ:</p>
              <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                {parsedChapters.map((ch, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-green-700 w-16 flex-shrink-0">{formatSeconds(ch.start_time_seconds)}</span>
                    <span className="text-green-800 truncate">{ch.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={saveChapters}
            disabled={upsertChapters.isPending || parsedChapters.length === 0}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {upsertChapters.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ {parsedChapters.length} قسم
          </button>
        </>
      )}
    </ModalShell>
  );
}

// ─── VIDEO CHAPTERS MODAL ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

function parseChaptersText(text: string): Omit<VideoChapter, "id" | "created_at" | "lesson_id">[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const chapters: Omit<VideoChapter, "id" | "created_at" | "lesson_id">[] = [];

  for (const line of lines) {
    // Match patterns: HH:MM:SS or MM:SS at start, then title
    const match = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/);
    if (!match) continue;
    const timeParts = match[1].split(":").map(Number);
    let seconds = 0;
    if (timeParts.length === 3) {
      seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
    } else {
      seconds = timeParts[0] * 60 + timeParts[1];
    }
    chapters.push({
      title: match[2].trim(),
      start_time_seconds: seconds,
      order_index: chapters.length,
      is_visible: true,
    });
  }
  return chapters;
}

function formatSeconds(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoChaptersModal({ lesson, onClose }: { lesson: { id: string; title: string }; onClose: () => void }) {
  const { data: existingChapters = [], isLoading } = useAllVideoChapters(lesson.id);
  const upsert = useUpsertVideoChapters();

  const [rawText, setRawText] = useState("");
  const [chapters, setChapters] = useState<Omit<VideoChapter, "id" | "created_at" | "lesson_id">[]>([]);
  const [mode, setMode] = useState<"text" | "list">("text");
  const [initialized, setInitialized] = useState(false);

  // Initialize from existing chapters
  if (!initialized && !isLoading && existingChapters.length > 0) {
    setInitialized(true);
    setChapters(existingChapters.map((ch) => ({
      title: ch.title,
      start_time_seconds: ch.start_time_seconds,
      order_index: ch.order_index,
      is_visible: ch.is_visible,
    })));
    const text = existingChapters
      .map((ch) => `${formatSeconds(ch.start_time_seconds)} ${ch.title}`)
      .join("\n");
    setRawText(text);
  }

  const parsed = parseChaptersText(rawText);

  const save = async () => {
    const toSave = mode === "text" ? parsed : chapters;
    await upsert.mutateAsync({ lessonId: lesson.id, chapters: toSave });
    toast.success(`تم حفظ ${toSave.length} قسم بنجاح`);
    onClose();
  };

  const toggleVisible = (i: number) =>
    setChapters(chapters.map((ch, idx) => idx === i ? { ...ch, is_visible: !ch.is_visible } : ch));

  const deleteChapter = (i: number) => setChapters(chapters.filter((_, idx) => idx !== i));

  return (
    <ModalShell title={`أقسام الفيديو: ${lesson.title}`} onClose={onClose}>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("text")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                mode === "text" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              لصق النص
            </button>
            <button
              onClick={() => { setChapters(parsed); setMode("list"); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                mode === "list" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              تعديل يدوي
            </button>
          </div>

          {mode === "text" ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                <strong>صيغة الإدخال (كل سطر = قسم):</strong>
                <pre className="mt-1 font-mono text-blue-700">{`00:00:00 مقدمة وخطة المراجعة
00:01:48 شرح Vocabulary
01:04:00 الكلمات المتشابهة`}</pre>
              </div>
              <Field label="نص الأقسام (Paste)">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="input-field font-mono text-sm"
                  rows={8}
                  placeholder={`00:00:00 مقدمة\n00:05:30 الدرس الأول\n01:10:00 خلاصة`}
                  dir="ltr"
                />
              </Field>
              {parsed.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-800 mb-2">✓ تم اكتشاف {parsed.length} أقسام:</p>
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                    {parsed.map((ch, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-green-700">{formatSeconds(ch.start_time_seconds)}</span>
                        <span className="text-green-800 truncate">{ch.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {chapters.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">لا توجد أقسام — اكتب في خانة النص ثم اضغط "تعديل يدوي"</p>
              )}
              {chapters.map((ch, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
                  <span className="font-mono text-xs text-muted-foreground w-16 flex-shrink-0">{formatSeconds(ch.start_time_seconds)}</span>
                  <input
                    value={ch.title}
                    onChange={(e) => setChapters(chapters.map((c, idx) => idx === i ? { ...c, title: e.target.value } : c))}
                    className="flex-1 text-sm bg-transparent border-b border-border focus:outline-none focus:border-primary py-0.5"
                  />
                  <button onClick={() => toggleVisible(i)} className="text-muted-foreground hover:text-primary transition-colors">
                    {ch.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteChapter(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-colors">إلغاء</button>
            <button
              onClick={save}
              disabled={upsert.isPending || (mode === "text" ? parsed.length === 0 : chapters.length === 0)}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {upsert.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ {mode === "text" ? parsed.length : chapters.length} أقسام
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ─── RECHARGE CODES TAB ──────────────────────────────────────────────────────
function RechargeCodesTab() {
  const [modal, setModal] = useState<string | null>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    amount: "50",
    uses_limit: "1",
  });

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    const { data } = await supabase.from("recharge_codes").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (data) setCodes(data);
  };

  const handleCreate = async () => {
    if (!form.code || !form.amount) {
      toast.error("الكود والمبلغ مطلوبان");
      return;
    }
    const { error } = await supabase.from("recharge_codes").insert({
      code: form.code.toUpperCase(),
      amount: parseFloat(form.amount),
      uses_limit: parseInt(form.uses_limit) || 1,
    });
    if (error) {
      toast.error("فشل: " + error.message);
    } else {
      toast.success("تم إنشاء كود الشحن");
      setModal(null);
      setForm({ code: "", amount: "50", uses_limit: "1" });
      loadCodes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف الكود؟")) return;
    await supabase.from("recharge_codes").delete().eq("id", id);
    loadCodes();
    toast.success("تم الحذف");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-foreground">أكواد شحن الرصيد</h2>
        <button onClick={() => { setForm({ code: "", amount: "50", uses_limit: "1" }); setModal("create"); }} className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium px-4 py-2 rounded-xl">
          <Plus className="w-4 h-4" /> كود جديد
        </button>
      </div>
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : codes.length === 0 ? (
        <div className="text-center py-12"><p className="text-5xl mb-3">💳</p><p className="font-medium">لا توجد أكواد شحن</p></div>
      ) : (
        <div className="grid gap-4">
          {codes.map((c) => (
            <div key={c.id} className="bg-white border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><Wallet className="w-6 h-6 text-emerald-600" /></div>
                <div>
                  <p className="font-bold text-lg">{c.code}</p>
                  <p className="text-sm text-muted-foreground">{c.amount} جنيه</p>
                  <p className="text-xs text-muted-foreground">
                    {c.uses_limit === 0 ? "استخدام غير محدود" : `متبقي ${c.uses_limit - c.uses_count} استخدام`}
                  </p>
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {modal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">كود شحن جديد</h3>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكود</label>
                <div className="flex gap-2">
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-field flex-1" placeholder="XXXXXX" dir="ltr" />
                  <button type="button" onClick={() => setForm({ ...form, code: Math.random().toString(36).substring(2, 8).toUpperCase() })} className="px-3 py-2 bg-muted rounded-lg hover:bg-muted/80">توليد</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ (جنيه)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field w-full" min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد مرات الاستخدام</label>
                <select value={form.uses_limit} onChange={(e) => setForm({ ...form, uses_limit: e.target.value })} className="input-field w-full">
                  <option value="1">مرة واحدة</option>
                  <option value="5">5 مرات</option>
                  <option value="10">10 مرات</option>
                  <option value="0">غير محدود</option>
                </select>
              </div>
              <button onClick={handleCreate} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl">إنشاء الكود</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DISCOUNT CODES TAB ──────────────────────────────────────────────────────
function DiscountCodesTab() {
  const [modal, setModal] = useState<string | null>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "10",
    scope: "all" as "all" | "subject" | "course",
    scope_id: "",
    uses_limit: "1",
    expires_at: "",
  });

  useEffect(() => {
    loadCodes();
    loadSubjects();
    loadCourses();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    const { data } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (data) setCodes(data);
  };

  const loadSubjects = async () => {
    const { data } = await supabase.from("subjects").select("*").order("name");
    if (data) setSubjects(data);
  };

  const loadCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("title");
    if (data) setCourses(data);
  };

  const handleCreate = async () => {
    if (!form.code || !form.discount_value) {
      toast.error("الكود وقيمة الخصم مطلوبان");
      return;
    }
    const { error } = await supabase.from("discount_codes").insert({
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      scope: form.scope,
      scope_id: form.scope === "all" ? null : form.scope_id || null,
      uses_limit: parseInt(form.uses_limit) || 1,
      expires_at: form.expires_at || null,
    });
    if (error) {
      toast.error("فشل: " + error.message);
    } else {
      toast.success("تم إنشاء كود الخصم");
      setModal(null);
      setForm({ code: "", discount_type: "percentage", discount_value: "10", scope: "all", scope_id: "", uses_limit: "1", expires_at: "" });
      loadCodes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف الكود؟")) return;
    await supabase.from("discount_codes").delete().eq("id", id);
    loadCodes();
    toast.success("تم الحذف");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-foreground">أكواد الخصم</h2>
        <button onClick={() => { setForm({ code: "", discount_type: "percentage", discount_value: "10", scope: "all", scope_id: "", uses_limit: "1", expires_at: "" }); setModal("create"); }} className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium px-4 py-2 rounded-xl">
          <Plus className="w-4 h-4" /> كود جديد
        </button>
      </div>
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : codes.length === 0 ? (
        <div className="text-center py-12"><p className="text-5xl mb-3">🏷️</p><p className="font-medium">لا توجد أكواد خصم</p></div>
      ) : (
        <div className="grid gap-4">
          {codes.map((c) => (
            <div key={c.id} className="bg-white border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><Percent className="w-6 h-6 text-purple-600" /></div>
                <div>
                  <p className="font-bold text-lg">{c.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.discount_value} جنيه`} خصم
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.scope === "all" ? "جميع الكورسات" : c.scope === "subject" ? "مادة معينة" : "كورس معين"}
                    {c.scope_id && (
                      <span className="mx-1">• {c.scope === "subject" ? subjects.find(s => s.id === c.scope_id)?.name : courses.find(co => co.id === c.scope_id)?.title}</span>
                    )}
                  </p>
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {modal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">كود خصم جديد</h3>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكود</label>
                <div className="flex gap-2">
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-field flex-1" placeholder="XXXXXX" dir="ltr" />
                  <button type="button" onClick={() => setForm({ ...form, code: Math.random().toString(36).substring(2, 8).toUpperCase() })} className="px-3 py-2 bg-muted rounded-lg hover:bg-muted/80">توليد</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الخصم</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({ ...form, discount_type: "percentage" })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.discount_type === "percentage" ? "bg-primary text-white" : "bg-muted"}`}>نسبة مئوية</button>
                  <button type="button" onClick={() => setForm({ ...form, discount_type: "fixed" })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.discount_type === "fixed" ? "bg-primary text-white" : "bg-muted"}`}>مبلغ ثابت</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">قيمة الخصم {form.discount_type === "percentage" ? "(%)" : "(جنيه)"}</label>
                <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="input-field w-full" min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نطاق الخصم</label>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setForm({ ...form, scope: "all" })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.scope === "all" ? "bg-primary text-white" : "bg-muted"}`}>الكل</button>
                  <button type="button" onClick={() => setForm({ ...form, scope: "subject" })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.scope === "subject" ? "bg-primary text-white" : "bg-muted"}`}>مادة</button>
                  <button type="button" onClick={() => setForm({ ...form, scope: "course" })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.scope === "course" ? "bg-primary text-white" : "bg-muted"}`}>كورس</button>
                </div>
                {form.scope === "subject" && (
                  <select value={form.scope_id} onChange={(e) => setForm({ ...form, scope_id: e.target.value })} className="input-field w-full">
                    <option value="">اختر المادة</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
                {form.scope === "course" && (
                  <select value={form.scope_id} onChange={(e) => setForm({ ...form, scope_id: e.target.value })} className="input-field w-full">
                    <option value="">اختر الكورس</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد مرات الاستخدام</label>
                <select value={form.uses_limit} onChange={(e) => setForm({ ...form, uses_limit: e.target.value })} className="input-field w-full">
                  <option value="1">مرة واحدة</option>
                  <option value="5">5 مرات</option>
                  <option value="10">10 مرات</option>
                  <option value="0">غير محدود</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الانتهاء (اختياري)</label>
                <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="input-field w-full" />
              </div>
              <button onClick={handleCreate} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl">إنشاء الكود</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ACTIVITIES TAB ──────────────────────────────────────────────────────────────
function ActivitiesTab() {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setActivities(data || []);
    setLoading(false);
  };

  const deleteActivity = async (id: string) => {
    if (!confirm("حذف النشاط؟")) return;
    await supabase.from("activities").delete().eq("id", id);
    toast.success("تم حذف النشاط");
    loadActivities();
  };

  const iconMap: Record<string, { icon: string; color: string }> = {
    course: { icon: "📚", color: "bg-blue-100 text-blue-600" },
    lecture: { icon: "🎬", color: "bg-emerald-100 text-emerald-600" },
    teacher: { icon: "👨‍🏫", color: "bg-purple-100 text-purple-600" },
    subject: { icon: "📖", color: "bg-amber-100 text-amber-600" },
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">سجل النشاطات</h2>
          <p className="text-sm text-muted-foreground mt-1">كل المحتوى اللي اتضاف أو اتحدث</p>
        </div>
        <button
          onClick={loadActivities}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          تحديث
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : activities.length > 0 ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {activities.map((activity) => {
              const info = iconMap[activity.type] || { icon: "✨", color: "bg-gray-100 text-gray-600" };
              return (
                <div key={activity.id} className="p-4 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${info.color} flex items-center justify-center text-lg flex-shrink-0`}>
                    {info.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{activity.title || activity.description}</p>
                    {activity.description && activity.title && (
                      <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(activity.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                      {activity.type}
                    </span>
                    <button
                      onClick={() => deleteActivity(activity.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground text-lg font-medium">مفيش نشاطات لسه</p>
          <p className="text-sm text-muted-foreground mt-1">هتظهر هنا أول ما تضيف محتوى جديد</p>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS TAB ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState({ platform_name: "راجع", maintenance_mode: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("platform_settings").select("*").maybeSingle();
    if (data) {
      setSettings(data);
    } else {
      const { data: inserted } = await supabase.from("platform_settings").insert({ platform_name: "راجع", maintenance_mode: false }).select().single();
      if (inserted) setSettings(inserted);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload: any = { platform_name: settings.platform_name, maintenance_mode: settings.maintenance_mode };
    if (settings.id) payload.id = settings.id;
    
    const { error } = await supabase
      .from("platform_settings")
      .upsert(payload, { onConflict: "id" });
    
    setSaving(false);
    if (error) {
      toast.error("فشل في الحفظ: " + error.message);
    } else {
      toast.success("تم حفظ الإعدادات بنجاح");
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-black text-foreground mb-6">إعدادات المنصة</h2>
      
      <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
        {/* Platform Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">اسم المنصة</label>
          <input
            type="text"
            value={settings.platform_name}
            onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
            className="input-field w-full"
            placeholder="راجع"
          />
          <p className="text-xs text-muted-foreground mt-1">سيظهر هذا الاسم في الهيدر والفوتر وجميع الصفحات فوراً</p>
        </div>

        {/* Maintenance Mode */}
        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div>
            <h3 className="font-bold text-amber-800">وضع الصيانة</h3>
            <p className="text-sm text-amber-600">عند التفعيل، سيظهر للطلاب شاشة صيانة ولن يتمكنوا من استخدام المنصة</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
            className={`relative w-14 h-7 rounded-full transition-colors ${settings.maintenance_mode ? "bg-amber-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.maintenance_mode ? "right-1" : "left-1"}`} />
          </button>
        </div>

        {/* Maintenance Access Codes */}
        {settings.maintenance_mode && (
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
            <h3 className="font-bold text-primary mb-2">أكواد الدخول أثناء الصيانة</h3>
            <p className="text-sm text-muted-foreground mb-3">شارك هذه الأكواد مع المدرسين أو المشرفين للدخول أثناء الصيانة</p>
            <div className="space-y-2">
              {["ADMIN2024", "RA7A3", "DEV001", "MAINTENANCE_BYPASS"].map((code) => (
                <div key={code} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-border">
                  <code className="text-sm font-mono font-bold text-foreground">{code}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(code); toast.success("تم النسخ"); }}
                    className="text-xs text-primary hover:underline"
                  >
                    نسخ
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">• المشرفون يدخلون تلقائيًا بدون كود</p>
            <p className="text-xs text-muted-foreground">• الكود يحفظ في المتصفح ولا يُطلب مرة أخرى</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}

// ─── QUESTIONS TAB ──────────────────────────────────────────────────────────────
function QuestionsTab() {
  const { data: courses = [] } = useCourses(true);
  const [selectedLecture, setSelectedLecture] = useState("");
  const [modal, setModal] = useState<string | null>(null);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [editTarget, setEditTarget] = useState<any>(null);

  const { data: lectures = [] } = useAllLectures();
  const { data: questions = [] } = useQuestions(selectedLecture);
  const create = useCreateQuestion();
  const deleteQ = useDeleteQuestion();

  const handleDelete = async (id: string) => {
    if (!confirm("حذف السؤال؟")) return;
    await deleteQ.mutateAsync({ id, lectureId: selectedLecture });
    toast.success("تم حذف السؤال");
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">بنك الأسئلة</h2>
        <p className="text-sm text-muted-foreground mt-1">أضف أسئلة لكل محاضرة مع التصحيح التلقائي</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">اختر المحاضرة</label>
        <select
          value={selectedLecture}
          onChange={(e) => setSelectedLecture(e.target.value)}
          className="input-field w-full"
        >
          <option value="">-- اختر المحاضرة --</option>
          {lectures.map((l: any) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>

      {selectedLecture && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{questions.length} سؤال</p>
            <button
              onClick={() => { setEditTarget(null); setModal("question"); }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              إضافة سؤال
            </button>
          </div>

          {questions.length > 0 ? (
            <div className="space-y-3">
              {questions.map((q: any, i: number) => (
                <div key={q.id} className="bg-white rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">س{i + 1}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {q.difficulty === 'easy' ? 'سهل' : q.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                        </span>
                      </div>
                      <p className="font-medium text-foreground mb-2">{q.question_text}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">أ) {q.option_a}</span>
                        <span className="text-muted-foreground">ب) {q.option_b}</span>
                        <span className="text-muted-foreground">ج) {q.option_c}</span>
                        <span className="text-muted-foreground">د) {q.option_d}</span>
                      </div>
                      <p className="text-xs text-emerald-600 mt-2 font-medium">الإجابة: {q.correct_answer.toUpperCase()}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditTarget(q); setModal("question"); }} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(q.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">مفيش أسئلة للمحاضرة دي</p>
            </div>
          )}
        </>
      )}

      {modal === "question" && (
        <QuestionModal
          lectureId={selectedLecture}
          initial={editTarget}
          onClose={() => { setModal(null); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

function QuestionModal({ lectureId, initial, onClose }: { lectureId: string; initial?: any; onClose: () => void }) {
  const create = useCreateQuestion();
  const update = useUpdateQuestion();
  const [form, setForm] = useState({
    question_text: initial?.question_text || "",
    option_a: initial?.option_a || "",
    option_b: initial?.option_b || "",
    option_c: initial?.option_c || "",
    option_d: initial?.option_d || "",
    correct_answer: initial?.correct_answer || "a",
    explanation: initial?.explanation || "",
    difficulty: initial?.difficulty || "medium",
    order_index: initial?.order_index ?? 0,
  });

  const save = async () => {
    if (!form.question_text.trim()) { toast.error("اكتب السؤال"); return; }
    if (!form.option_a || !form.option_b || !form.option_c || !form.option_d) { toast.error("كل الخيارات مطلوبة"); return; }
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...form, lecture_id: lectureId });
      toast.success("تم تحديث السؤال");
    } else {
      await create.mutateAsync({ ...form, lecture_id: lectureId });
      toast.success("تمت إضافة السؤال");
    }
    onClose();
  };

  return (
    <ModalShell title={initial ? "تعديل سؤال" : "إضافة سؤال جديد"} onClose={onClose}>
      <Field label="نص السؤال *">
        <textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} className="input-field" rows={2} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="الخيار أ *"><input value={form.option_a} onChange={(e) => setForm({ ...form, option_a: e.target.value })} className="input-field" /></Field>
        <Field label="الخيار ب *"><input value={form.option_b} onChange={(e) => setForm({ ...form, option_b: e.target.value })} className="input-field" /></Field>
        <Field label="الخيار ج *"><input value={form.option_c} onChange={(e) => setForm({ ...form, option_c: e.target.value })} className="input-field" /></Field>
        <Field label="الخيار د *"><input value={form.option_d} onChange={(e) => setForm({ ...form, option_d: e.target.value })} className="input-field" /></Field>
      </div>
      <Field label="الإجابة الصحيحة *">
        <select value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} className="input-field">
          <option value="a">أ</option><option value="b">ب</option><option value="c">ج</option><option value="d">د</option>
        </select>
      </Field>
      <Field label="الشرح (بعد الإجابة)">
        <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} className="input-field" rows={2} />
      </Field>
      <Field label="المستوى">
        <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="input-field">
          <option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option>
        </select>
      </Field>
      <SaveBtn isPending={create.isPending || update.isPending} onSave={save} />
    </ModalShell>
  );
}

// ─── SUMMARIES TAB ──────────────────────────────────────────────────────────────
function SummariesTab() {
  const { data: lectures = [] } = useAllLectures();
  const [selectedLecture, setSelectedLecture] = useState("");
  const { data: summaries = [] } = useSummaries(selectedLecture);
  const create = useCreateSummary();
  const deleteS = useDeleteSummary();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [addMode, setAddMode] = useState<"file" | "link">("link");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLecture) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `summary-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("summaries").upload(fileName, file, { upsert: true });
    if (error) { toast.error("فشل رفع الملف"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("summaries").getPublicUrl(data.path);
    await create.mutateAsync({ lecture_id: selectedLecture, title: title || file.name, file_url: publicUrl, file_type: "file", file_size: file.size, order_index: 0 });
    toast.success("تم رفع الملخص");
    setTitle("");
    setUploading(false);
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim() || !selectedLecture) { toast.error("الرابط والمادة مطلوبين"); return; }
    setUploading(true);
    await create.mutateAsync({ lecture_id: selectedLecture, title: title || "ملخص خارجي", file_url: linkUrl, file_type: "link", file_size: 0, order_index: 0 });
    toast.success("تم إضافة الرابط");
    setTitle("");
    setLinkUrl("");
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف الملخص؟")) return;
    await deleteS.mutateAsync({ id, lectureId: selectedLecture });
    toast.success("تم حذف الملخص");
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">الملخصات</h2>
        <p className="text-sm text-muted-foreground mt-1">أضف روابط خارجية أو ارفع ملفات PDF لكل محاضرة</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">اختر المحاضرة</label>
        <select value={selectedLecture} onChange={(e) => setSelectedLecture(e.target.value)} className="input-field w-full">
          <option value="">-- اختر المحاضرة --</option>
          {lectures.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>

      {selectedLecture && (
        <>
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAddMode("link")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${addMode === "link" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                🔗 رابط خارجي
              </button>
              <button
                onClick={() => setAddMode("file")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${addMode === "file" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                📄 رفع ملف
              </button>
            </div>

            <label className="text-sm font-medium text-foreground mb-2 block">اسم الملخص (اختياري)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field w-full mb-3" placeholder="مثال: ملخص الفصل الأول" />

            {addMode === "link" ? (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">الرابط</label>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="input-field w-full mb-3"
                  placeholder="https://drive.google.com/..."
                />
                <button
                  onClick={handleAddLink}
                  disabled={uploading}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {uploading ? "جارٍ الإضافة..." : "إضافة الرابط"}
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all bg-muted/20 hover:bg-muted/40">
                <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                {uploading ? <><Loader2 className="w-5 h-5 animate-spin text-primary" /><span className="text-sm font-medium text-primary">جارٍ الرفع...</span></> : <><FileText className="w-5 h-5 text-muted-foreground" /><span className="text-sm font-medium text-muted-foreground">اضغط لرفع ملف PDF</span></>}
              </label>
            )}
          </div>

          {summaries.length > 0 ? (
            <div className="space-y-3">
              {summaries.map((s: any) => (
                <div key={s.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.file_type === "link" ? "bg-blue-100" : "bg-red-100"}`}>
                      {s.file_type === "link" ? <Link2 className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.file_type === "link" ? "رابط خارجي" : `${(s.file_size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                      <Eye className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleDelete(s.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">مفيش ملخصات للمحاضرة دي</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── HOME PAGE TAB ──────────────────────────────────────────────────────────────
function HomePageTab() {
  const { data: blocks = [] } = useAllHomeBlocks();
  const deleteBlock = useDeleteHomeBlock();
  const [modal, setModal] = useState<string | null>(null);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [editTarget, setEditTarget] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("حذف البلوك؟")) return;
    await deleteBlock.mutateAsync(id);
    toast.success("تم الحذف");
  };

  const toggleVisibility = async (block: any) => {
    const update = useUpdateHomeBlock();
    await update.mutateAsync({ id: block.id, is_visible: !block.is_visible });
  };

  const typeLabels: Record<string, string> = {
    hero: "🎯 Hero Section",
    post: "📝 بوست",
    offer: "🎁 عرض",
    featured: "🔥 محتوى مميز",
    announcement: "📢 تنبيه",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">إدارة الصفحة الرئيسية</h2>
          <p className="text-sm text-muted-foreground mt-1">تحكم في البلوكات اللي تظهر في الرئيسية</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setModal("home-block"); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          إضافة بلوك
        </button>
      </div>

      {blocks.length > 0 ? (
        <div className="space-y-3">
          {blocks.map((block: any, i: number) => (
            <div key={block.id} className={`bg-white rounded-xl border p-4 ${!block.is_visible ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">
                    {typeLabels[block.type]?.split(" ")[0] || "📦"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {typeLabels[block.type] || block.type}
                      </span>
                      {block.highlight && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          block.highlight === 'important' ? 'bg-blue-100 text-blue-700' :
                          block.highlight === 'review' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {block.highlight === 'important' ? '⭐ مهم' : block.highlight === 'review' ? '🔥 مراجعة' : '⏰ امتحان'}
                        </span>
                      )}
                      {!block.is_visible && (
                        <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">مخفي</span>
                      )}
                    </div>
                    <p className="font-medium text-foreground">{block.title}</p>
                    {block.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{block.content}</p>}
                    {block.tracks && block.tracks.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">الشُعب: {block.tracks.join("، ")}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleVisibility(block)} className="p-2 text-muted-foreground hover:text-emerald-500 transition-colors" title={block.is_visible ? "إخفاء" : "إظهار"}>
                    {block.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setEditTarget(block); setModal("home-block"); }} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(block.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">مفيش بلوكات لسه</p>
          <p className="text-sm text-muted-foreground mt-1">ضيف أول بلوك للصفحة الرئيسية</p>
        </div>
      )}

      {modal === "home-block" && (
        <HomeBlockModal initial={editTarget} onClose={() => { setModal(null); setEditTarget(null); }} />
      )}
    </div>
  );
}

function HomeBlockModal({ initial, onClose }: { initial?: any; onClose: () => void }) {
  const create = useCreateHomeBlock();
  const update = useUpdateHomeBlock();
  const [form, setForm] = useState({
    type: initial?.type || "post" as string,
    title: initial?.title || "",
    content: initial?.content || "",
    image_url: initial?.image_url || "",
    link_url: initial?.link_url || "",
    highlight: initial?.highlight || "",
    tracks: initial?.tracks || ["science-bio", "science-math", "literary"] as string[],
    order_index: initial?.order_index ?? 0,
  });

  const toggleTrack = (trackId: string) => {
    setForm({ ...form, tracks: form.tracks.includes(trackId) ? form.tracks.filter(t => t !== trackId) : [...form.tracks, trackId] });
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("العنوان مطلوب"); return; }
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...form });
      toast.success("تم التحديث");
    } else {
      await create.mutateAsync(form);
      toast.success("تمت الإضافة");
    }
    onClose();
  };

  return (
    <ModalShell title={initial ? "تعديل بلوك" : "إضافة بلوك جديد"} onClose={onClose}>
      <Field label="نوع البلوك *">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
          <option value="hero">🎯 Hero Section</option>
          <option value="post">📝 بوست</option>
          <option value="offer">🎁 عرض</option>
          <option value="featured">🔥 محتوى مميز</option>
          <option value="announcement">📢 تنبيه</option>
        </select>
      </Field>
      <Field label="العنوان *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" /></Field>
      <Field label="المحتوى"><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field" rows={3} /></Field>
      <Field label="رابط الصورة"><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field" dir="ltr" /></Field>
      <Field label="رابط الإجراء"><input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="input-field" dir="ltr" placeholder="/courses أو رابط خارجي" /></Field>
      <Field label="الترتيب"><input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: +e.target.value })} className="input-field" /></Field>
      <Field label="تمييز (Badge)">
        <div className="grid grid-cols-4 gap-2">
          {[{ value: "", label: "بدون" }, { value: "important", label: "⭐ مهم" }, { value: "review", label: "🔥 مراجعة" }, { value: "exam", label: "⏰ امتحان" }].map(h => (
            <button key={h.value} type="button" onClick={() => setForm({ ...form, highlight: h.value })} className={`p-2 rounded-xl border-2 text-xs font-medium ${form.highlight === h.value ? 'border-primary bg-primary/10' : 'border-gray-200'}`}>{h.label}</button>
          ))}
        </div>
      </Field>
      <Field label="الشُعب المستهدفة">
        <div className="space-y-2">
          {[{ id: "science-bio", label: "علمي علوم" }, { id: "science-math", label: "علمي رياضة" }, { id: "literary", label: "أدبي" }].map(t => (
            <label key={t.id} className={`flex items-center gap-3 p-2 rounded-lg border-2 cursor-pointer ${form.tracks.includes(t.id) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
              <input type="checkbox" checked={form.tracks.includes(t.id)} onChange={() => toggleTrack(t.id)} className="sr-only" />
              <div className={`w-4 h-4 rounded ${form.tracks.includes(t.id) ? 'bg-emerald-500' : 'border-2 border-gray-300'}`} />
              <span className="text-sm">{t.label}</span>
            </label>
          ))}
        </div>
      </Field>
      <SaveBtn isPending={create.isPending || update.isPending} onSave={save} />
    </ModalShell>
  );
}

// ─── ADMIN STUDENTS TAB ───────────────────────────────────────────────────────
function AdminStudentsTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    const { data: purchases } = await supabase
      .from("course_purchases")
      .select("*, course:courses(title)")
      .order("created_at", { ascending: false });

    const userMap: Record<string, any> = {};
    purchases?.forEach((p: any) => {
      const userId = p.user_id;
      if (!userMap[userId]) {
        userMap[userId] = {
          id: userId,
          email: p.user_email || "غير معروف",
          name: p.user_name || "غير معروف",
          courses: [],
          totalSpent: 0,
          lastPurchase: p.created_at,
        };
      }
      if (p.course?.title && !userMap[userId].courses.includes(p.course.title)) {
        userMap[userId].courses.push(p.course.title);
      }
      userMap[userId].totalSpent += p.amount || 0;
      if (new Date(p.created_at) > new Date(userMap[userId].lastPurchase)) {
        userMap[userId].lastPurchase = p.created_at;
      }
    });

    setStudents(Object.values(userMap));
    setLoading(false);
  };

  const filtered = students.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">الطلاب</h2>
        <span className="text-sm text-muted-foreground">{students.length} طالب</span>
      </div>

      <div className="bg-white rounded-2xl border border-border p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن طالب..." className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((student) => (
            <div key={student.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">{student.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="font-bold text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-emerald-600">{student.totalSpent} جنيه</p>
                  <p className="text-xs text-muted-foreground">{student.courses.length} كورس</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {student.courses.map((course: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">{course}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">مفيش طلاب لسه</p>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN SALES TAB ─────────────────────────────────────────────────────────
function AdminSalesTab() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    const { data: purchases } = await supabase
      .from("course_purchases")
      .select("*, course:courses(title)")
      .order("created_at", { ascending: false });

    setSales(purchases || []);
    setTotalRevenue(purchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">المبيعات</h2>
        <div className="bg-emerald-50 px-4 py-2 rounded-xl">
          <p className="text-sm text-emerald-600 font-bold">إجمالي: {totalRevenue} جنيه</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : sales.length > 0 ? (
        <div className="space-y-3">
          {sales.map((sale: any) => (
            <div key={sale.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{sale.course?.title || "كورس"}</p>
                  <p className="text-xs text-muted-foreground">{sale.user_email || "غير معروف"} • {new Date(sale.created_at).toLocaleDateString("ar-EG")}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="font-bold text-emerald-600">{sale.amount || 0} جنيه</p>
                <p className="text-xs text-muted-foreground">تم الشراء</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">مفيش مبيعات لسه</p>
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATIONS TAB ────────────────────────────────────────────────────────
function NotificationsTab() {
  const { data: notifications = [], isLoading } = useAdminNotifications();
  const createNotif = useCreateNotification();
  const deleteNotif = useDeleteNotif();
  const togglePin = useTogglePinNotification();

  const [showModal, setShowModal] = useState(false);
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();
  const [form, setForm] = useState({
    type: "admin_announcement" as "admin_announcement" | "video" | "lecture" | "course" | "file" | "questions" | "teacher_content" | "offer" | "platform_update" | "maintenance",
    title: "",
    message: "",
    target_type: "all" as "all" | "track" | "subject" | "teacher" | "user",
    target_id: "" as string,
    priority: "normal" as "normal" | "important" | "urgent",
    is_pinned: false,
  });

  const typeOptions = [
    { value: "admin_announcement" as const, label: "📢 إعلان إداري", color: "bg-orange-50 text-orange-600" },
    { value: "video" as const, label: "🎥 فيديو جديد", color: "bg-blue-50 text-blue-600" },
    { value: "lecture" as const, label: "📚 محاضرة جديدة", color: "bg-purple-50 text-purple-600" },
    { value: "course" as const, label: "🎓 كورس جديد", color: "bg-green-50 text-green-600" },
    { value: "file" as const, label: "📄 ملف / ملخص", color: "bg-amber-50 text-amber-600" },
    { value: "questions" as const, label: "❓ أسئلة جديدة", color: "bg-red-50 text-red-600" },
    { value: "teacher_content" as const, label: "⭐ محتوى من معلم", color: "bg-teal-50 text-teal-600" },
    { value: "offer" as const, label: "🎁 عرض / خصم", color: "bg-pink-50 text-pink-600" },
    { value: "platform_update" as const, label: "🔧 تحديث المنصة", color: "bg-indigo-50 text-indigo-600" },
    { value: "maintenance" as const, label: "⚠️ صيانة", color: "bg-gray-100 text-gray-600" },
  ];

  const priorityColors: Record<string, string> = {
    normal: "bg-blue-50 text-blue-600",
    important: "bg-amber-50 text-amber-600",
    urgent: "bg-red-50 text-red-600",
  };

  const handleSend = async () => {
    if (!form.message.trim()) { toast.error("اكتب رسالة الإشعار"); return; }
    if (!form.title.trim()) { toast.error("عنوان الإشعار مطلوب"); return; }

    try {
      const result = await createNotif.mutateAsync({
        type: form.type,
        title: form.title,
        message: form.message,
        target_type: form.target_type,
        target_id: form.target_id || undefined,
        priority: form.priority,
        is_pinned: form.is_pinned,
      });
      toast.success(`تم إرسال الإشعار لـ ${result.userCount} مستخدم`);
      setShowModal(false);
      setForm({ type: "admin_announcement", title: "", message: "", target_type: "all", target_id: "", priority: "normal", is_pinned: false });
    } catch (err: any) {
      toast.error(err?.message || "فشل إرسال الإشعار");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">الإشعارات</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm font-bold"
        >
          <Bell className="w-4 h-4" />
          إرسال إشعار
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const typeInfo = typeOptions.find((t) => t.value === notif.type) || typeOptions[0];
            return (
              <div key={notif.id} className="bg-white rounded-xl border border-border p-4 flex items-start justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-base">{typeInfo.label.split(" ")[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground text-sm">{notif.title}</p>
                      {notif.is_pinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${priorityColors[notif.priority] || priorityColors.normal}`}>
                        {notif.priority === "important" ? "مهم" : notif.priority === "urgent" ? "عاجل" : "عادي"}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        {notif.target_type === "all" ? "الكل" : notif.target_type === "track" ? "شعبة" : notif.target_type === "subject" ? "مادة" : notif.target_type === "teacher" ? "معلم" : "مستخدم"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      {new Date(notif.created_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => togglePin.mutateAsync({ id: notif.id, is_pinned: !notif.is_pinned })}
                    className={`p-1.5 rounded-lg transition-colors ${notif.is_pinned ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                    title={notif.is_pinned ? "إلغاء التثبيت" : "تثبيت"}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm("حذف الإشعار؟")) deleteNotif.mutateAsync(notif.id); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">مفيش إشعارات لسه</p>
        </div>
      )}

      {/* Send Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-6">إرسال إشعار جديد</h2>
            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">نوع الإشعار</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="input-field w-full">
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">العنوان *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field w-full" placeholder="عنوان الإشعار" />
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">الرسالة *</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field w-full" rows={3} placeholder="اكتب رسالة الإشعار..." />
              </div>

              {/* Target */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">المستهدفون</label>
                <select value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value as any, target_id: "" })} className="input-field w-full">
                  <option value="all">كل المستخدمين</option>
                  <option value="track">حسب الشعبة</option>
                  <option value="subject">المشتركين في مادة</option>
                  <option value="teacher">متابعي معلم</option>
                </select>
                {form.target_type === "track" && (
                  <select value={form.target_id} onChange={(e) => setForm({ ...form, target_id: e.target.value })} className="input-field w-full mt-2">
                    <option value="">اختر الشعبة</option>
                    <option value="science-bio">علمي علوم</option>
                    <option value="science-math">علمي رياضة</option>
                    <option value="literary">أدبي</option>
                  </select>
                )}
                {form.target_type === "subject" && (
                  <select value={form.target_id} onChange={(e) => setForm({ ...form, target_id: e.target.value })} className="input-field w-full mt-2">
                    <option value="">اختر المادة</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
                {form.target_type === "teacher" && (
                  <select value={form.target_id} onChange={(e) => setForm({ ...form, target_id: e.target.value })} className="input-field w-full mt-2">
                    <option value="">اختر المعلم</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">الأولوية</label>
                <div className="flex gap-2">
                  {(["normal", "important", "urgent"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                        form.priority === p
                          ? p === "urgent" ? "border-red-500 bg-red-50 text-red-600"
                            : p === "important" ? "border-amber-500 bg-amber-50 text-amber-600"
                            : "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-border text-muted-foreground hover:border-muted-foreground/30"
                      }`}
                    >
                      {p === "urgent" ? "🔥 عاجل" : p === "important" ? "⭐ مهم" : "عادي"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pin */}
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={() => setForm({ ...form, is_pinned: !form.is_pinned })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.is_pinned ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_pinned ? "right-0.5" : "left-0.5"}`} />
                </button>
                <span className="text-sm font-medium text-foreground">تثبيت الإشعار</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-border rounded-xl hover:bg-muted text-sm font-medium transition-colors">إلغاء</button>
              <button
                onClick={handleSend}
                disabled={createNotif.isPending}
                className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {createNotif.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                {createNotif.isPending ? "جارٍ الإرسال..." : "إرسال"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
