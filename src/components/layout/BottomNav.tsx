import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, GraduationCap, HelpCircle, FileText, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkSidebar = () => {
      setSidebarOpen(localStorage.getItem("sidebar_mobile_open") === "true");
    };
    checkSidebar();
    const interval = setInterval(checkSidebar, 300);
    return () => clearInterval(interval);
  }, []);

  if (!user || sidebarOpen || location.pathname === "/admin") return null;

  const navItems = [
    { icon: Home, label: "الرئيسية", to: "/" },
    { icon: BookOpen, label: "المواد", to: "/subjects" },
    { icon: GraduationCap, label: "الكورسات", to: "/courses" },
    { icon: HelpCircle, label: "بنك الأسئلة", to: "/questions" },
    { icon: FileText, label: "الملخصات", to: "/summaries" },
    { icon: User, label: "حسابي", to: "/profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="mx-3 mb-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border border-gray-100/80">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 min-w-[48px]
                  ${active ? "text-emerald-600" : "text-gray-400"}
                `}
              >
                {active && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-500 rounded-full" />
                )}
                <Icon className={`w-5 h-5 mb-0.5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className={`text-[10px] font-medium ${active ? "font-bold" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
