import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Clock, Calendar, User, Mail, AlertTriangle, CheckCircle, XCircle, Trophy } from "lucide-react";

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

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expiryInfo, setExpiryInfo] = useState<{ text: string; color: string; expired: boolean } | null>(null);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    
    const loadChallenges = async () => {
      setLoading(true);
      console.log("Loading challenges for user:", user.id);
      
      // First get all challenge_ids the user joined
      const { data: progress, error: progressError } = await supabase
        .from("user_challenge_progress")
        .select("challenge_id, completed_tasks, is_completed")
        .eq("user_id", user.id);
      
      console.log("Progress data:", progress, "Error:", progressError);
      
      if (progressError || !progress || progress.length === 0) {
        setLoading(false);
        setChallenges([]);
        return;
      }
      
      // Get unique challenge IDs
      const challengeIds = [...new Set(progress.map(p => p.challenge_id))];
      console.log("Challenge IDs:", challengeIds);
      
      // Fetch challenge details
      const { data: challenges, error: challengesError } = await supabase
        .from("challenges")
        .select("id, title, duration_days")
        .in("id", challengeIds);
      
      console.log("Challenges data:", challenges, "Error:", challengesError);
      
      setLoading(false);
      
      if (challengesError || !challenges) {
        setChallenges([]);
        return;
      }
      
      // Merge progress with challenge details
      const merged = progress.map(p => {
        const challenge = challenges.find(c => c.id === p.challenge_id);
        return {
          ...p,
          challenges: challenge || null
        };
      });
      
      console.log("Merged challenges:", merged);
      setChallenges(merged);
    };
    
    loadChallenges();
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-muted/30">
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
      </div>
    </div>
  );
}
