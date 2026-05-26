import { useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { AuthContext, mapUser, type AuthUser } from "@/lib/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [expiredModal, setExpiredModal] = useState(false);

  const fetchCodeExpiry = useCallback(async (email: string): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase
        .from("user_codes")
        .select("expires_at")
        .eq("user_email", email)
        .eq("is_used", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return undefined;
      return data?.expires_at;
    } catch {
      return undefined;
    }
  }, []);

  const enrichUser = useCallback(async (supabaseUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  }): Promise<AuthUser> => {
    const base = mapUser(supabaseUser);
    
    // Fetch role from profiles table
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", supabaseUser.id)
        .maybeSingle();
      
      if (profile?.role) {
        base.role = profile.role;
      }
    } catch {
      // Ignore profile fetch errors
    }

    if (base.email) {
      const expiresAt = await fetchCodeExpiry(base.email);
      return { ...base, codeExpiresAt: expiresAt };
    }
    return base;
  }, [fetchCodeExpiry]);

  const login = useCallback((u: AuthUser) => {
    setUser(u);
    setExpiredModal(false);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setExpiredModal(false);
  }, []);

  const checkCodeExpiry = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() <= Date.now();
  };

  const handleSession = useCallback(async (session: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } } | null) => {
    if (session?.user) {
      try {
        const enriched = await enrichUser(session.user);
        setUser(enriched);
        if (checkCodeExpiry(enriched.codeExpiresAt)) {
          setExpiredModal(true);
        }
      } catch {
        setUser(mapUser(session.user));
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [enrichUser]);

  useEffect(() => {
    let mounted = true;

    // First, get the initial session - this handles OAuth code exchange
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        handleSession(session);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        handleSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);

  useEffect(() => {
    if (!user?.codeExpiresAt || expiredModal) return;

    const interval = setInterval(() => {
      if (checkCodeExpiry(user.codeExpiresAt)) {
        setExpiredModal(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.codeExpiresAt, expiredModal]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}

      {expiredModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">انتهت صلاحية الكود</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              مدة الكود انتهت. يرجى التواصل مع الأدمن للحصول على كود جديد.
            </p>
            <button
              onClick={logout}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
