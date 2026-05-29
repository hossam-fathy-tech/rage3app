import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell, User, LogOut, Settings, Search, X,
  Menu, GraduationCap, ChevronDown, BookOpen, Video, Wallet,
  Video as VideoIcon, BookMarked, FileText, HelpCircle, Megaphone, AlertTriangle, Gift, Wrench, Star, Pin
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import { useQuery } from "@tanstack/react-query";
import { useUserNotifications, useUnreadCount, useMarkAsRead } from "@/hooks/useData";
import type { NotificationType } from "@/types/db";

const DEFAULT_SITE_NAME = "راجع";

const notifIcons: Record<NotificationType, React.ElementType> = {
  video: VideoIcon,
  lecture: BookMarked,
  course: GraduationCap,
  file: FileText,
  questions: HelpCircle,
  teacher_content: Star,
  admin_announcement: Megaphone,
  offer: Gift,
  platform_update: Wrench,
  maintenance: AlertTriangle,
};

const notifColors: Record<NotificationType, string> = {
  video: "bg-blue-50 text-blue-600",
  lecture: "bg-purple-50 text-purple-600",
  course: "bg-green-50 text-green-600",
  file: "bg-amber-50 text-amber-600",
  questions: "bg-red-50 text-red-600",
  teacher_content: "bg-teal-50 text-teal-600",
  admin_announcement: "bg-orange-50 text-orange-600",
  offer: "bg-pink-50 text-pink-600",
  platform_update: "bg-indigo-50 text-indigo-600",
  maintenance: "bg-gray-100 text-gray-600",
};

const Header = () => {
  const [siteName] = useState(DEFAULT_SITE_NAME);
  const [walletBalance, setWalletBalance] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useUserNotifications(user?.id);
  const { data: unreadCount = 0 } = useUnreadCount(user?.id);
  const markAsRead = useMarkAsRead();

  const { data: courses = [] } = useQuery({
    queryKey: ["search-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*, subject:subjects(name)");
      return data || [];
    },
    enabled: searchOpen,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["search-subjects"],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("*");
      return data || [];
    },
    enabled: searchOpen,
  });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { courses: [], subjects: [] };
    const q = searchQuery.trim().toLowerCase();
    return {
      courses: courses.filter((c: any) => c.title?.toLowerCase().includes(q) || c.subject?.name?.toLowerCase().includes(q)),
      subjects: subjects.filter((s: any) => s.name?.toLowerCase().includes(q)),
    };
  }, [searchQuery, courses, subjects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (user?.id) {
      supabase.from("user_wallets").select("balance").eq("user_id", user.id).maybeSingle().then(({ data }) => setWalletBalance(data?.balance || 0));
    }
  }, [user?.id]);

  const handleMarkAsRead = async (userNotifId: string) => {
    await markAsRead.mutateAsync(userNotifId);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    // Mark all visible ones
    for (const n of notifications) {
      if (!n.is_read) {
        await markAsRead.mutateAsync(n.id);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج");
    navigate("/");
    setUserMenuOpen(false);
  };

  return (
    <>
      {user && <Sidebar siteName={siteName} mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />}

      <header className={`fixed top-0 right-0 left-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border/60 transition-all duration-300 ${user ? 'lg:right-[260px]' : ''}`}>
        <div className="flex items-center justify-between h-14 px-4 lg:px-5">
          {/* Right */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-foreground tracking-tight">{siteName}</span>
            </Link>
          </div>

          {/* Left */}
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                  <Search className="w-[18px] h-[18px]" />
                </button>

                <button
                  onClick={() => navigate("/wallet")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">{walletBalance}</span>
                </button>

                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <Bell className="w-[18px] h-[18px]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-[10px] text-white font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-border overflow-hidden z-50">
                      <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold text-foreground text-sm">الإشعارات</h3>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline font-medium">
                            تحديد الكل كمقروء
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => {
                            const Icon = notifIcons[n.notification?.type || "admin_announcement"];
                            const colorClass = notifColors[n.notification?.type || "admin_announcement"];
                            return (
                              <div
                                key={n.id}
                                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                                className={`p-4 border-b border-border/50 transition-colors cursor-pointer hover:bg-muted/30 ${!n.is_read ? "bg-primary/[0.02]" : ""}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className={`text-sm ${!n.is_read ? "font-bold text-foreground" : "text-foreground/70"}`}>
                                        {n.notification?.title}
                                      </p>
                                      {n.notification?.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.notification?.message}</p>
                                    <p className="text-[10px] text-muted-foreground/50 mt-1">{new Date(n.created_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                  </div>
                                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center text-muted-foreground">
                            <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">مفيش إشعارات</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform hidden sm:block ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-border overflow-hidden z-50">
                      <div className="p-3 border-b border-border">
                        <p className="font-bold text-foreground text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={() => { navigate("/profile"); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <User className="w-4 h-4" />
                          حسابي
                        </button>
                        {user.role === "admin" && (
                          <button
                            onClick={() => { navigate("/admin"); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            لوحة التحكم
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          تسجيل الخروج
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                <User className="w-4 h-4" />
                دخول
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-border">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن كورس أو مادة..."
                className="flex-1 text-base outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {!searchQuery.trim() ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">اكتب للبحث عن كورس أو مادة</p>
                  <p className="text-xs mt-1 opacity-50">Ctrl+K لفتح البحث</p>
                </div>
              ) : (
                <>
                  {searchResults.subjects.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-bold text-muted-foreground px-3 py-2">المواد</p>
                      {searchResults.subjects.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => { navigate("/subjects"); setSearchOpen(false); setSearchQuery(""); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-right"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.courses.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground px-3 py-2">الكورسات</p>
                      {searchResults.courses.map((c: any) => (
                        <button
                          key={c.id}
                          onClick={() => { navigate(`/course/${c.id}`); setSearchOpen(false); setSearchQuery(""); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-right"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Video className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                            <p className="text-xs text-muted-foreground">{c.subject?.name || ""}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.subjects.length === 0 && searchResults.courses.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-sm">مفيش نتائج لـ "{searchQuery}"</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
