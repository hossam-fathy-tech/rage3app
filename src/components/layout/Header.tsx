import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, BookOpen, Settings, GraduationCap, LogIn, LogOut, User, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const DEFAULT_SITE_NAME = "راجع";

const formatTimeRemaining = (expiresAt: string): string => {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;
  
  if (diff <= 0) return "منتهي";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} يوم ${hours} ساعة`;
  if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
  return `${minutes} دقيقة`;
};

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [timeLeft, setTimeLeft] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem("site_name");
    if (stored) setSiteName(stored);
  }, []);

  useEffect(() => {
    console.log("Header user:", user);
    console.log("Header codeExpiresAt:", user?.codeExpiresAt);
    
    if (!user?.codeExpiresAt) {
      setTimeLeft("");
      return;
    }
    
    const update = () => setTimeLeft(formatTimeRemaining(user.codeExpiresAt!));
    update();
    
    const interval = setInterval(update, 60000); // update every minute
    return () => clearInterval(interval);
  }, [user?.codeExpiresAt, user]);

  const updateSiteName = (newName: string) => {
    localStorage.setItem("site_name", newName);
    setSiteName(newName);
  };

  const navLinks = [
    { label: "الرئيسية", to: "/" },
    { label: "المواد", to: "/subjects" },
    { label: "الكورسات", to: "/courses" },
    { label: "التحديات", to: "/challenges" },
  ];

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج");
    navigate("/");
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 gradient-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">{siteName}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-semibold transition-all duration-200 pb-1 ${
                  isActive(link.to)
                    ? "text-white border-b-2 border-white/80"
                    : "text-white/75 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 text-white/80 text-sm hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-medium">{user.username}</span>
                    {timeLeft && (
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeLeft}
                      </span>
                    )}
                  </div>
                </button>
                {user.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    لوحة التحكم
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-200 shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  ابدأ التعلم
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-900/95 backdrop-blur-sm border-t border-white/10">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive(link.to)
                    ? "bg-white/20 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-white/80 text-sm hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>{user.username}</span>
                  </Link>
                  {timeLeft && (
                    <div className="flex items-center gap-2 px-4 py-1 text-white/60 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>متبقي: {timeLeft}</span>
                    </div>
                  )}
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      لوحة التحكم
                    </Link>
                  )}
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white transition-colors text-right w-full"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold bg-white text-blue-700 text-center"
                  >
                    ابدأ التعلم
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
