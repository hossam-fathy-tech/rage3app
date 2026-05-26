import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell, Wallet, User, LogOut, Settings, Search, X,
  Menu, GraduationCap, ChevronDown, Sparkles, BookOpen, Video
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_SITE_NAME = "راجع";

const Header = () => {
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [walletBalance, setWalletBalance] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch courses and subjects for search
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
    const q = searchQuery.toLowerCase();
    return {
      courses: courses.filter((c: any) => c.title.toLowerCase().includes(q)),
      subjects: subjects.filter((s: any) => s.name.toLowerCase().includes(q)),
    };
  }, [searchQuery, courses, subjects]);

  useEffect(() => {
    supabase.from("platform_settings").select("platform_name").single().then(({ data }) => {
      if (data) setSiteName(data.platform_name);
    });

    const channel = supabase
      .channel("platform_name_changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "platform_settings" }, (payload) => {
        setSiteName(payload.new.platform_name);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadWallet();
      loadNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem("sidebar_mobile_open", mobileMenuOpen ? "true" : "false");
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadWallet = async () => {
    const { data } = await supabase.from("user_wallets").select("balance").eq("user_id", user?.id).maybeSingle();
    setWalletBalance(data?.balance || 0);
  };

  const loadNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user?.id).order("created_at", { ascending: false }).limit(10);
    setNotifications(data || []);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (user?.id && unreadCount > 0) {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
      loadNotifications();
    }
    setNotifOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج");
    navigate("/");
    setUserMenuOpen(false);
  };

  return (
    <>
      {/* Sidebar - Only show when logged in */}
      {user && <Sidebar siteName={siteName} walletBalance={walletBalance} mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />}

      {/* Top Bar */}
      <header className={`fixed top-0 right-0 left-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-sm transition-all duration-300 ${user ? 'lg:right-[260px]' : ''}`}>
        <div className="flex items-center justify-between h-16 px-4 lg:px-5">
          {/* Right side - Logo & Menu */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black text-gray-800 leading-tight">{siteName}</h1>
                <p className="text-[10px] text-gray-400 font-medium -mt-0.5">منصة تعليمية متكاملة</p>
              </div>
            </Link>
          </div>

          {/* Left side - Actions */}
          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                {/* Wallet - Mobile */}
                <button
                  onClick={() => navigate("/wallet")}
                  className="sm:hidden flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold">ج</span>
                  </div>
                  <span className="text-xs font-bold">{walletBalance}</span>
                </button>

                {/* Search */}
                <button onClick={() => setSearchOpen(true)} className="hidden md:flex p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                  <Search className="w-5 h-5" />
                </button>

                {/* Wallet - Desktop */}
                <button
                  onClick={() => navigate("/wallet")}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">ج</span>
                  </div>
                  <span className="text-sm font-bold">{walletBalance}</span>
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">الإشعارات</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-emerald-600 hover:underline font-medium">
                            تحديد الكل كمقروء
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.is_read ? "bg-emerald-50/50" : ""}`}>
                              <p className="text-sm text-gray-700">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString("ar-EG")}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-gray-400">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">مفيش إشعارات</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />

                {/* User Avatar & Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/20">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-100">
                        <p className="font-bold text-gray-800 text-sm">{user.username}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => { navigate("/profile"); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          حسابي
                        </button>
                        {user.role === "admin" && (
                          <button
                            onClick={() => { navigate("/admin"); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            لوحة التحكم
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن كورس أو مادة..."
                className="flex-1 text-lg outline-none text-gray-800 placeholder:text-gray-400"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {!searchQuery.trim() ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">اكتب للبحث عن كورس أو مادة</p>
                  <p className="text-xs mt-1 text-gray-300">Ctrl+K لفتح البحث</p>
                </div>
              ) : (
                <>
                  {/* Subjects */}
                  {searchResults.subjects.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-bold text-gray-400 px-3 py-2">المواد</p>
                      {searchResults.subjects.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => { navigate(`/subjects`); setSearchOpen(false); setSearchQuery(""); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-right"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Courses */}
                  {searchResults.courses.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 px-3 py-2">الكورسات</p>
                      {searchResults.courses.map((c: any) => (
                        <button
                          key={c.id}
                          onClick={() => { navigate(`/course/${c.id}`); setSearchOpen(false); setSearchQuery(""); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-right"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Video className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{c.title}</p>
                            <p className="text-xs text-gray-400">{c.subject?.name || ""}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {searchResults.subjects.length === 0 && searchResults.courses.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
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
