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
import BottomNav from "./components/layout/BottomNav";
import { Lock, Eye, EyeOff, Wrench } from "lucide-react";

const queryClient = new QueryClient();

const ADMIN_PASSWORD = "hos01017251025SAM#2462008";

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

  // Show maintenance screen if enabled AND user is not admin (admin can still access /admin)
  // Note: We allow access to /admin even in maintenance mode so admin can disable it
  const isOnAdminRoute = window.location.pathname === "/admin";
  
  if (maintenanceMode && !isOnAdminRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden" dir="rtl">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-amber-400/30 rounded-full animate-bounce"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + i * 0.5}s`
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center p-8 max-w-lg mx-auto">
          {/* Animated Icon Container */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30 animate-pulse">
              <Wrench className="w-16 h-16 text-white" />
            </div>
            {/* Rotating Ring */}
            <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-amber-400/30 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-dashed border-amber-400/20 rounded-full animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
          </div>

          {/* Title with Gradient */}
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 mb-4">
            المنصة تحت الصيانة
          </h1>

          {/* Description */}
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            نقوم ببعض التحسينات والتحديثات المهمة<br />
            <span className="text-amber-400 font-medium">سنعود أقوى مما كنا! 🚀</span>
          </p>

          {/* Loading Bar */}
          <div className="w-full max-w-xs mx-auto mb-8">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>جاري التحديث...</span>
              <span>99%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse" style={{ width: '99%' }} />
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700">
            <p className="text-sm text-slate-400">
              للاستفسارات الطارئة:
              <a href="mailto:rage3app@gmail.com" className="text-amber-400 hover:text-amber-300 underline mr-1">
                rage3app@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
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
