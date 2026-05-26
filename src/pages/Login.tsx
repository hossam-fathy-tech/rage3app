import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Key, FlaskConical, Calculator, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth, mapUser } from "@/lib/auth";

type LoginMode = "signin" | "register" | "code" | "track-select";

type TrackOption = {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
};

const trackOptions: TrackOption[] = [
  { id: "science_bio", name: "علمي علوم", icon: FlaskConical, description: "فيزياء • كيمياء • أحياء", color: "from-green-500 to-emerald-600" },
  { id: "science_math", name: "علمي رياضة", icon: Calculator, description: "فيزياء • كيمياء • تفاضل", color: "from-blue-500 to-indigo-600" },
  { id: "literary", name: "أدبي", icon: BookOpen, description: "تاريخ • جغرافيا • فلسفة", color: "from-purple-500 to-pink-600" },
];

interface CodeData {
  id: string;
  code: string;
  user_email: string;
  user_name: string | null;
  temp_password: string;
  is_used: boolean;
  expires_at: string | null;
}

const Login = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [mode, setMode] = useState<LoginMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [codePassword, setCodePassword] = useState("");
  const [showCodePass, setShowCodePass] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [pendingAuthData, setPendingAuthData] = useState<any>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      toast.error("حدث خطأ في تسجيل الدخول بجوجل");
      console.error("Google login error:", error);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignin = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("أدخل البريد الإلكتروني");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("البريد الإلكتروني غير صحيح");
      return;
    }
    if (!password) {
      toast.error("أدخل كلمة المرور");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials" || error.status === 400) {
          toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        login(mapUser(data.user));
        toast.success("تم تسجيل الدخول!");
        navigate("/", { replace: true });
      }
    } catch {
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("أدخل البريد الإلكتروني");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("البريد الإلكتروني غير صحيح");
      return;
    }
    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            username: email.split("@")[0],
            full_name: email.split("@")[0],
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        if (
          error.message.includes("already been registered") ||
          error.message.includes("already registered") ||
          error.message.includes("User already registered")
        ) {
          toast.error("هذا البريد الإلكتروني مسجل بالفعل، جرب تسجيل الدخول");
          setMode("signin");
          setEmail(email.trim().toLowerCase());
          setPassword("");
          setConfirmPassword("");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user && data.session) {
        setPendingAuthData(data);
        setMode("track-select");
      } else if (data.user && !data.session) {
        toast.info("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب");
        setMode("signin");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("أدخل الكود");
      return;
    }
    if (!codePassword) {
      toast.error("أدخل كلمة المرور");
      return;
    }

    setLoading(true);
    try {
      const { data: codeData, error: codeError } = await supabase
        .from("user_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .maybeSingle() as { data: CodeData | null; error: unknown };

      if (codeError || !codeData) {
        toast.error("كود غير صحيح");
        setLoading(false);
        return;
      }

      if (codeData.is_used) {
        toast.error("هذا الكود قد تم استخدامه من قبل");
        setLoading(false);
        return;
      }

      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast.error("انتهت صلاحية الكود");
        setLoading(false);
        return;
      }

      // Try to sign in first with the password the user entered
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: codeData.user_email.toLowerCase(),
        password: codePassword,
      });

      if (signInData.user && signInData.session) {
        // Teacher codes work forever, student codes are one-time use
        if (codeData.user_type !== 'teacher') {
          await supabase
            .from("user_codes")
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq("id", codeData.id);
        }
        
        // Store teacher info in session
        const enrichedUser = mapUser(signInData.user);
        if (codeData.user_type === 'teacher') {
          enrichedUser.role = 'teacher';
          enrichedUser.teacherId = codeData.teacher_id;
          enrichedUser.subjectId = codeData.subject_id;
        }
        login(enrichedUser);
        
        toast.success("مرحباً بك!");
        
        navigate("/", { replace: true });
        return;
      }

      // If sign in failed, try creating the account
      if (signInError) {
        const userType = codeData.user_type || 'student';
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: codeData.user_email.toLowerCase(),
          password: codePassword,
          options: {
            data: {
              username: codeData.user_name || codeData.user_email.split("@")[0],
              full_name: codeData.user_name || codeData.user_email.split("@")[0],
              role: userType,
            },
            emailRedirectTo: window.location.origin,
          },
        });

        // If account already exists, the student already registered - tell them to use their password
        if (signUpError && (
          signUpError.message.includes("already") ||
          signUpError.message.includes("registered")
        )) {
          toast.error("هذا الكود تم استخدامه بالفعل. سجل الدخول بالإيميل وكلمة المرور من شاشة تسجيل الدخول");
          setLoading(false);
          return;
        }

        if (signUpError) {
          console.error("SignUp error:", signUpError);
          toast.error(`خطأ: ${signUpError.message}`);
          setLoading(false);
          return;
        }

        if (signUpData.user && signUpData.session) {
          await supabase
            .from("profiles")
            .upsert({ id: signUpData.user.id, role: userType, email: codeData.user_email.toLowerCase() });
          
          if (userType !== 'teacher') {
            await supabase
              .from("user_codes")
              .update({ is_used: true, used_at: new Date().toISOString() })
              .eq("id", codeData.id);
          }
          
          const enrichedUser = mapUser(signUpData.user);
          enrichedUser.role = userType;
          if (userType === 'teacher') {
            enrichedUser.teacherId = codeData.teacher_id;
            enrichedUser.subjectId = codeData.subject_id;
          }
          login(enrichedUser);
          
          toast.success("مرحباً بك!");
          
          navigate("/", { replace: true });
        } else if (signUpData.user && !signUpData.session) {
          await supabase
            .from("profiles")
            .upsert({ id: signUpData.user.id, role: userType, email: codeData.user_email.toLowerCase() });
            
          if (userType !== 'teacher') {
            await supabase
              .from("user_codes")
              .update({ is_used: true, used_at: new Date().toISOString() })
              .eq("id", codeData.id);
          }
          
          toast.success("تم إنشاء الحساب! تحقق من إيميلك لتأكيد الحساب");
          setMode("signin");
          setCode("");
          setCodePassword("");
        }
      }
    } catch {
      console.error("Code login error");
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    if (mode === "register") {
      handleRegister(e);
    } else if (mode === "code") {
      handleCodeLogin(e);
    } else {
      handleSignin(e);
    }
  };

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setCodePassword("");
    setShowPass(false);
    setShowCodePass(false);
    setSelectedTrack("");
    setPendingAuthData(null);
  };

  const handleTrackSelect = async () => {
    if (!selectedTrack) {
      toast.error("اختر شعبتك أولاً");
      return;
    }
    
    setLoading(true);
    try {
      // Save track to profiles table
      await supabase
        .from("profiles")
        .upsert({ 
          id: pendingAuthData.user.id, 
          track: selectedTrack,
          email: pendingAuthData.user.email 
        });

      // Update user metadata
      await supabase.auth.updateUser({
        data: { track: selectedTrack }
      });

      login(mapUser(pendingAuthData.user));
      toast.success("تم تحديد الشعبة بنجاح! 🎓");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Track selection error:", error);
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (mode === "track-select") {
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">اختر شعبتك الدراسية</h3>
            <p className="text-sm text-gray-500 mt-1">هذه الخطوة مهمة لعرض المحتوى المناسب لك</p>
          </div>
          
          <div className="space-y-3">
            {trackOptions.map((track) => {
              const Icon = track.icon;
              const isSelected = selectedTrack === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedTrack(track.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-right ${
                    isSelected
                      ? `border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100`
                      : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${track.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{track.name}</p>
                      <p className="text-xs text-gray-500">{track.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleTrackSelect}
            disabled={!selectedTrack || loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 mt-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                متابعة
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      );
    }

    if (mode === "code") {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الكود</label>
            <div className="relative">
              <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="أدخل الكود"
                className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-800"
                dir="ltr"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showCodePass ? "text" : "password"}
                value={codePassword}
                onChange={(e) => setCodePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-12 pl-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-800"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowCodePass(!showCodePass)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCodePass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-800"
              dir="ltr"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pr-12 pl-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-800"
              dir="ltr"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mode === "register" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تأكيد كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-800"
                dir="ltr"
                autoComplete="new-password"
              />
            </div>
          </div>
        )}
      </>
    );
  };

  const getButtonText = () => {
    switch (mode) {
      case "register":
        return "إنشاء حساب";
      case "code":
        return "دخول بالكود";
      case "track-select":
        return "متابعة";
      default:
        return "تسجيل الدخول";
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
            <GraduationCap className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black mb-4 text-center">مرحباً بك في راجع</h1>
          <p className="text-xl text-white/80 text-center max-w-md">منصة التعلم الذكي التي تساعدك على التفوق في دراستك</p>

          <div className="flex gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold">50+</div>
              <div className="text-white/70 text-sm">مادة</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">100+</div>
              <div className="text-white/70 text-sm">فيديو</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">ألف</div>
              <div className="text-white/70 text-sm">طالب</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-800">راجع</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {mode === "code" ? "دخول بكود" : mode === "register" ? "إنشاء حساب" : mode === "track-select" ? "تحديد الشعبة" : "تسجيل الدخول"}
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              {mode === "code" ? "أدخل الكود وكلمة المرور" : mode === "register" ? "انضم لألف الطلاب المتميزين" : mode === "track-select" ? "اختر شعبتك الدراسية للمتابعة" : "سعدنا بعودتك! أدخل بياناتك"}
            </p>

            {mode === "track-select" ? (
              <div className="space-y-5">
                {renderForm()}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  {renderForm()}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {getButtonText()}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {mode !== "track-select" && (
              <>
                {mode === "signin" && (
                  <>
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-sm text-gray-400">أو</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-4 rounded-2xl transition-all duration-200"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        دخول بـ Google
                      </button>

                      <button
                        type="button"
                        onClick={() => switchMode("code")}
                        className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-4 rounded-2xl transition-all duration-200"
                      >
                        <Key className="w-5 h-5" />
                        دخول بكود
                      </button>
                    </div>
                  </>
                )}

                <div className="mt-8 text-center">
                  {mode === "code" ? (
                    <p className="text-gray-600">
                      <button type="button" onClick={() => switchMode("signin")} className="text-emerald-600 font-semibold hover:text-emerald-700">
                        رجوع لتسجيل الدخول
                      </button>
                    </p>
                  ) : mode === "signin" ? (
                    <p className="text-gray-600">
                      ما عندك حساب؟{" "}
                      <button type="button" onClick={() => switchMode("register")} className="text-emerald-600 font-semibold hover:text-emerald-700">
                        إنشاء حساب
                      </button>
                    </p>
                  ) : (
                    <p className="text-gray-600">
                      عندك حساب؟{" "}
                      <button type="button" onClick={() => switchMode("signin")} className="text-emerald-600 font-semibold hover:text-emerald-700">
                        تسجيل الدخول
                      </button>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            بتسجيل الدخول توافق على{" "}
            <a href="#" className="text-emerald-600 hover:underline">شروط الاستخدام</a>
            {" "}و{" "}
            <a href="#" className="text-emerald-600 hover:underline">سياسة الخصوصية</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
