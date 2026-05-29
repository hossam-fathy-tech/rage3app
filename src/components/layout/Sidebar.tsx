import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, BookOpen, GraduationCap, HelpCircle, FileText, User,
  X, Settings, LogOut, Target, Users, Heart,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SidebarProps {
  siteName: string;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const Sidebar = ({ siteName, mobileOpen, setMobileOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج");
    navigate("/");
    setMobileOpen(false);
  };

  const mainLinks = [
    { icon: Home, label: "الرئيسية", to: "/" },
    { icon: BookOpen, label: "المواد", to: "/subjects" },
    { icon: GraduationCap, label: "الكورسات", to: "/courses" },
    { icon: HelpCircle, label: "بنك الأسئلة", to: "/questions" },
    { icon: FileText, label: "الملخصات", to: "/summaries" },
    { icon: Target, label: "التحديات", to: "/challenges" },
    { icon: Users, label: "المعلمين", to: "/teachers" },
    { icon: Heart, label: "المتابَعون", to: "/following-teachers" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full z-50 transition-all duration-300 flex flex-col
          ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          w-[260px]
          bg-[#0F172A] border-l border-white/[0.06]
        `}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">{siteName}</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 pb-4 mb-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.05]">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white/90 truncate text-sm">{user.username}</p>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${active
                    ? "bg-primary/15 text-primary"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                  }
                `}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "stroke-[2.5]" : ""}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="border-t border-white/[0.06] my-3" />

          {user ? (
            <>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-white/50 hover:bg-white/[0.06] hover:text-white/80"
              >
                <User className="w-[18px] h-[18px] flex-shrink-0" />
                <span>حسابي</span>
              </Link>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                >
                  <Settings className="w-[18px] h-[18px] flex-shrink-0" />
                  <span>لوحة التحكم</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-red-400 hover:bg-red-500/10 w-full"
              >
                <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                <span>تسجيل الخروج</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all"
            >
              <User className="w-5 h-5" />
              <span>تسجيل الدخول</span>
            </Link>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
