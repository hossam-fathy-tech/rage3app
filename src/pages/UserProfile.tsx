import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Clock, Calendar, User, Mail, CheckCircle, XCircle, Trophy, FlaskConical, Calculator, BookMarked, Wallet, Bell, BellOff } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useNotificationSettings, useUpsertNotificationSettings } from "@/hooks/useData";
import { toast } from "sonner";

const formatTimeRemaining = (expiresAt: string) => {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;
  
  if (diff <= 0) return { text: "منتهي الصلاحية", color: "text-red-500", expired: true };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  let text = "";
  if (days > 0) text += `${days} يوم `;
  if (hours > 0) text += `${hours} ساعة `;
  text += `${minutes} دقيقة`;
  
  const color = days < 3 ? "text-amber-500" : "text-green-500";
  return { text: text.trim(), color, expired: false };
};

const trackInfo: Record<string, { name: string; icon: React.ElementType; color: string; bg: string }> = {
  "science-bio": { name: "علمي علوم", icon: FlaskConical, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
  "science-math": { name: "علمي رياضة", icon: Calculator, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  "literary": { name: "أدبي", icon: BookMarked, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
};

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expiryInfo, setExpiryInfo] = useState<{ text: string; color: string; expired: boolean } | null>(null);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.codeExpiresAt) {
      const update = () => setExpiryInfo(formatTimeRemaining(user.codeExpiresAt!));
      update();
      const interval = setInterval(update, 60000);
      return () => clearInterval(interval);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    
    const loadWallet = async () => {
      const { data } = await supabase
        .from("user_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      setWalletBalance(data?.balance || 0);
    };
    loadWallet();
    
    const loadChallenges = async () => {
      setLoading(true);
      const { data: progress, error: progressError } = await supabase
        .from("user_challenge_progress")
        .select("challenge_id, completed_tasks, is_completed")
        .eq("user_id", user.id);
      
      if (progressError || !progress || progress.length === 0) {
        setLoading(false);
        setChallenges([]);
        return;
      }
      
      const challengeIds = [...new Set(progress.map(p => p.challenge_id))];
      const { data: challengesData, error: challengesError } = await supabase
        .from("challenges")
        .select("id, title, duration_days")
        .in("id", challengeIds);
      
      setLoading(false);
      
      if (challengesError || !challengesData) {
        setChallenges([]);
        return;
      }
      
      const merged = progress.map(p => {
        const challenge = challengesData.find(c => c.id === p.challenge_id);
        return { ...p, challenges: challenge || null };
      });
      
      setChallenges(merged);
    };
    
    loadChallenges();
  }, [user?.id]);

  if (!user) return null;

  const track = user.track ? trackInfo[user.track] : null;
  const TrackIcon = track?.icon || User;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="lg:mr-[260px] pt-16 pb-24 lg:pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{user.username}</h1>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>

            {/* Track Info */}
            {track && (
              <div className={`p-4 rounded-xl border ${track.bg} mb-4`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <TrackIcon className={`w-5 h-5 ${track.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الشعبة الدراسية</p>
                    <p className={`font-bold ${track.color}`}>{track.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Balance */}
            <div className="p-4 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رصيد المحفظة</p>
                  <p className="font-bold text-primary text-lg">{walletBalance} جنيه</p>
                </div>
              </div>
            </div>

            {/* Code Expiry */}
            {user.codeExpiresAt && expiryInfo && (
              <div className={`p-4 rounded-xl border ${expiryInfo.expired ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-center gap-3">
                  {expiryInfo.expired ? (
                    <XCircle className="w-6 h-6 text-red-500" />
                  ) : (
                    <Clock className="w-6 h-6 text-blue-500" />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">صلاحية الكود</p>
                    <p className={`text-lg font-bold ${expiryInfo.color}`}>
                      {expiryInfo.expired ? "منتهي الصلاحية" : `متبقي: ${expiryInfo.text}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ينتهي في {new Date(user.codeExpiresAt).toLocaleDateString("ar", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Challenges Progress */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              التحديات المشتركة
            </h2>

            {loading ? (
              <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
            ) : challenges.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">🎯</p>
                <p className="text-muted-foreground">لم تنضم إلى أي تحدي بعد</p>
                <button
                  onClick={() => navigate("/challenges")}
                  className="mt-4 bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  استكشف التحديات
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {challenges.map((c) => (
                  <div key={c.challenge_id} className="p-4 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{c.challenges?.title || "تحدي"}</p>
                        <p className="text-sm text-muted-foreground">
                          {c.completed_tasks || 0} / {c.challenges?.duration_days || 0} يوم
                        </p>
                      </div>
                      {c.is_completed ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          مكتمل
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                          <Calendar className="w-4 h-4" />
                          قيد التقدم
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification Settings */}
          <NotificationSettingsPanel user={user} />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function NotificationSettingsPanel({ user }: { user: any }) {
  const { data: settings, isLoading } = useNotificationSettings(user?.id);
  const upsert = useUpsertNotificationSettings();
  const [local, setLocal] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (settings) {
      setLocal({
        notify_videos: settings.notify_videos,
        notify_lectures: settings.notify_lectures,
        notify_courses: settings.notify_courses,
        notify_files: settings.notify_files,
        notify_questions: settings.notify_questions,
        notify_teacher_content: settings.notify_teacher_content,
        notify_admin: settings.notify_admin,
        notify_offers: settings.notify_offers,
        notify_maintenance: settings.notify_maintenance,
      });
    } else {
      setLocal({
        notify_videos: true,
        notify_lectures: true,
        notify_courses: true,
        notify_files: true,
        notify_questions: true,
        notify_teacher_content: true,
        notify_admin: true,
        notify_offers: true,
        notify_maintenance: true,
      });
    }
  }, [settings]);

  const toggle = async (key: string) => {
    const newVal = !local[key];
    setLocal((prev) => ({ ...prev, [key]: newVal }));
    await upsert.mutateAsync({ user_id: user.id, [key]: newVal });
    toast.success(newVal ? "تم التفعيل" : "تم الإيقاف");
  };

  const items = [
    { key: "notify_videos", label: "فيديو جديد", icon: "🎥" },
    { key: "notify_lectures", label: "محاضرة جديدة", icon: "📚" },
    { key: "notify_courses", label: "كورس جديد", icon: "🎓" },
    { key: "notify_files", label: "ملف / ملخص", icon: "📄" },
    { key: "notify_questions", label: "أسئلة جديدة", icon: "❓" },
    { key: "notify_teacher_content", label: "محتوى من معلم متابَع", icon: "⭐" },
    { key: "notify_admin", label: "إعلانات إدارية", icon: "📢" },
    { key: "notify_offers", label: "عروض وخصومات", icon: "🎁" },
    { key: "notify_maintenance", label: "تنبيهات الصيانة", icon: "🔧" },
  ];

  if (isLoading) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mt-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        إعدادات الإشعارات
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative w-11 h-6 rounded-full transition-colors ${local[item.key] ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${local[item.key] ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
