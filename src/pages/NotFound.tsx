import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <div className="text-center px-4">
        <p className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 mb-4">
          404
        </p>
        <h1 className="text-2xl font-black text-foreground mb-3">
          الصفحة مش موجودة
        </h1>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
          الصفحة اللي بتدور عليها مش موجودة أو اتنقلت لمكان تاني.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </Link>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 border border-border font-bold px-6 py-3 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            الكورسات
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
