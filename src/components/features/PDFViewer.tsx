import { useState, useEffect } from "react";
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, FileText } from "lucide-react";

interface PDFViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function PDFViewer({ url, title, onClose }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(100);

  // Use Google Docs viewer for better compatibility
  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Viewer Container */}
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm truncate max-w-[200px] sm:max-w-md">{title}</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-white rounded-lg border border-gray-200 px-2 py-1">
              <button
                onClick={() => setScale(Math.max(50, scale - 10))}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ZoomOut className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-xs font-medium text-gray-600 w-10 text-center">{scale}%</span>
              <button
                onClick={() => setScale(Math.min(200, scale + 10))}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ZoomIn className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Download */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تحميل</span>
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 relative bg-gray-100">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
              <p className="text-gray-500 font-medium">جارٍ تحميل الملف...</p>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium mb-4">مشكلة في تحميل الملف</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                تحميل الملف مباشرة
              </a>
            </div>
          ) : (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              style={{ transform: `scale(${scale / 100})`, transformOrigin: "top center" }}
              onLoad={() => setLoading(false)}
              onError={() => { setError(true); setLoading(false); }}
              title={title}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-400">اضغط ESC للإغلاق</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">PDF Viewer</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
