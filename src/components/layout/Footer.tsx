import { Link } from "react-router-dom";
import { GraduationCap, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-black text-2xl">راجع</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              منصة تعليمية حديثة لطلاب الثانوية العامة في مصر. ذاكر بذكاء وحقق التفوق.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">الرئيسية</Link></li>
              <li><Link to="/subjects" className="hover:text-white transition-colors">المواد الدراسية</Link></li>
              <li><Link to="/courses" className="hover:text-white transition-colors">الكورسات</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">لوحة التحكم</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">تواصل معنا</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📧 info@raga3.app</li>
              <li>📱 01000000000</li>
              <li>🌐 raga3.onspace.app</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            © 2024 منصة راجع. جميع الحقوق محفوظة.
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            صُنع بـ <Heart className="w-4 h-4 text-red-400 fill-red-400" /> من أجل طلاب مصر
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
