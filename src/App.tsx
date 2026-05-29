import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/components/features/AuthProvider";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Index from "./pages/Index";
import Subjects from "./pages/Subjects";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import TeacherProfile from "./pages/TeacherProfile";

import WalletPage from "./pages/WalletPage";
import Challenges from "./pages/Challenges";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import QuestionsPage from "./pages/QuestionsPage";
import SummariesPage from "./pages/SummariesPage";
import Teachers from "./pages/Teachers";
import FollowingTeachers from "./pages/FollowingTeachers";
import BottomNav from "./components/layout/BottomNav";
import { Lock, Eye, EyeOff, Wrench, KeyRound, CheckCircle2 } from "lucide-react";

const queryClient = new QueryClient();

const MAINTENANCE_CODES = ["ADMIN2024", "RA7A3", "DEV001", "MAINTENANCE_BYPASS"];

function MaintenanceGuard({ children, maintenanceMode }: { children: React.ReactNode; maintenanceMode: boolean }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  const isAdmin = user?.role === "admin";
  const hasBypassCode = localStorage.getItem("maintenance_bypass") === "true";

  if (maintenanceMode && !isAdmin && !hasBypassCode) {
    return <MaintenanceScreen />;
  }

  // Admin or code holder — redirect away from maintenance page to home
  if (window.location.pathname === "/maintenance") {
    navigate("/", { replace: true });
  }

  return <>{children}</>;
}

function MaintenanceScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const isAlreadyBypassed = localStorage.getItem("maintenance_bypass") === "true";

  useEffect(() => {
    if (isAlreadyBypassed || (user && user.role === "admin")) {
      navigate("/");
    }
  }, [user, isAlreadyBypassed, navigate]);

  const handleCodeSubmit = () => {
    setCodeError("");
    if (!code.trim()) { setCodeError("ادخل الكود"); return; }
    if (MAINTENANCE_CODES.includes(code.trim().toUpperCase())) {
      localStorage.setItem("maintenance_bypass", "true");
      setCodeSuccess(true);
      setTimeout(() => navigate("/"), 1000);
    } else {
      setCodeError("الكود غير صحيح");
    }
  };

  if (codeSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <p className="text-white font-bold text-lg">تم الدخول بنجاح</p>
          <p className="text-white/40 text-sm mt-1">جاري التحويل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center p-8 max-w-md mx-auto w-full">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">المنصة تحت الصيانة</h1>
        <p className="text-white/40 text-sm mb-8">نقوم بتحسينات مهمة. سنعود قريبًا.</p>

        {/* Access Code Input */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white/70">كود الدخول الخاص</span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                placeholder="أدخل كود الصيانة"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                dir="ltr"
              />
              <button
                onClick={() => setShowCode(!showCode)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleCodeSubmit}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              دخول
            </button>
          </div>
          {codeError && <p className="text-red-400 text-xs mt-2">{codeError}</p>}
        </div>

        {/* Contact */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-white/30">
            للاستفسارات: <a href="mailto:rage3app@gmail.com" className="text-primary/70 hover:text-primary">rage3app@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function ProtectedAdmin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(() => sessionStorage.getItem("admin_verified") === "true");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleVerify = () => {
    if (password === ADMIN_PASSWORD) {
      setVerified(true);
      sessionStorage.setItem("admin_verified", "true");
      setError(false);
    } else {
      setError(true);
    }
  };

  if (verified) {
    return <Admin />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم</h2>
          <p className="text-gray-500 mt-2">أدخل كلمة المرور للدخول</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="أدخل كلمة المرور"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${error ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-emerald-100 focus:border-emerald-500"}`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">كلمة المرور غير صحيحة</p>}
          </div>

          <button
            onClick={handleVerify}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            دخول
          </button>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const App = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [platformName, setPlatformName] = useState("راجع");

  useEffect(() => {
    // Fetch initial platform settings
    supabase
      .from("platform_settings")
      .select("maintenance_mode, platform_name")
      .single()
      .then(({ data }) => {
        if (data) {
          setMaintenanceMode(data.maintenance_mode);
          if (data.platform_name) {
            setPlatformName(data.platform_name);
            document.title = `${data.platform_name} - منصة تعليمية للثانوية العامة`;
          }
        }
      });

    // Subscribe to real-time changes
    const channel = supabase
      .channel("platform_settings_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "platform_settings" },
        (payload) => {
          if (payload.new.maintenance_mode !== undefined) {
            setMaintenanceMode(payload.new.maintenance_mode);
          }
          if (payload.new.platform_name) {
            setPlatformName(payload.new.platform_name);
            document.title = `${payload.new.platform_name} - منصة تعليمية للثانوية العامة`;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Show maintenance screen if enabled AND no bypass code
  // Admin check happens inside AuthProvider
  const isOnAdminRoute = window.location.pathname === "/admin";
  const hasBypassCode = localStorage.getItem("maintenance_bypass") === "true";
  
  if (maintenanceMode && !isOnAdminRoute && !hasBypassCode) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <MaintenanceGuard maintenanceMode={maintenanceMode}>
              <TooltipProvider>
                <Toaster />
                <Sonner position="top-center" richColors />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
                  <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                  <Route path="/course/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                  <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
                  <Route path="/teacher/:id" element={<ProtectedRoute><TeacherProfile /></ProtectedRoute>} />
                  <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="/questions" element={<QuestionsPage />} />
                  <Route path="/summaries" element={<SummariesPage />} />
                  <Route path="/teachers" element={<Teachers />} />
                  <Route path="/following-teachers" element={<ProtectedRoute><FollowingTeachers /></ProtectedRoute>} />
                  <Route path="/teacher/:id" element={<ProtectedRoute><TeacherProfile /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedAdmin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <BottomNav />
              </TooltipProvider>
            </MaintenanceGuard>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" richColors />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Index />} />
              <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
              <Route path="/course/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />


              <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
              <Route path="/teacher/:id" element={<ProtectedRoute><TeacherProfile /></ProtectedRoute>} />
              <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/summaries" element={<SummariesPage />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/following-teachers" element={<ProtectedRoute><FollowingTeachers /></ProtectedRoute>} />
              <Route path="/teacher/:id" element={<ProtectedRoute><TeacherProfile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedAdmin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
