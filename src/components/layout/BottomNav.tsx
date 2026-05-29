import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, GraduationCap, HelpCircle, FileText, User, Users, Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";

const navItems = [
  { icon: Home, label: "الرئيسية", to: "/" },
  { icon: BookOpen, label: "المواد", to: "/subjects" },
  { icon: GraduationCap, label: "الكورسات", to: "/courses" },
  { icon: Users, label: "المعلمين", to: "/teachers" },
  { icon: Heart, label: "المتابَعون", to: "/following-teachers" },
  { icon: HelpCircle, label: "الأسئلة", to: "/questions" },
  { icon: User, label: "حسابي", to: "/profile" },
];

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

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-area-bottom">
      <div className="mx-2 mb-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_-2px_16px_rgba(0,0,0,0.06)] border border-border/60">
        <div className="flex items-center justify-around py-1.5 px-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 min-w-[44px]
                  ${active ? "text-primary" : "text-muted-foreground/60"}
                `}
              >
                {active && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-primary rounded-full" />
                )}
                <Icon className={`w-5 h-5 mb-0.5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}>
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
