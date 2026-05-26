import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, BookOpen, GraduationCap, HelpCircle, FileText, User,
  X, Settings, Wallet, LogOut, Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SidebarProps {
  siteName: string;
  walletBalance?: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const Sidebar = ({ siteName, walletBalance = 0, mobileOpen, setMobileOpen }: SidebarProps) => {
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
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full z-50 transition-all duration-300 flex flex-col
          ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          w-[260px]
          bg-white border-l border-gray-100 shadow-xl lg:shadow-none
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black text-gray-800">{siteName}</span>
              <p className="text-[10px] text-gray-400 font-medium -mt-0.5">منصة تعليمية متكاملة</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md shadow-emerald-500/20">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate text-sm">{user.username}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
              <Wallet className="w-4 h-4" />
              الرصيد: {walletBalance} جنيه
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "stroke-[2.5]" : ""}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="border-t border-gray-100 my-3" />

          {/* Account Links */}
          {user ? (
            <>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              >
                <User className="w-5 h-5 flex-shrink-0" />
                <span>حسابي</span>
              </Link>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span>لوحة التحكم</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-red-500 hover:bg-red-50 w-full"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>تسجيل الخروج</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
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
