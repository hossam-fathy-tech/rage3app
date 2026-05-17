import { useEffect, useRef, useState } from "react";
import { Trophy, Star, X } from "lucide-react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
  shape: "rect" | "circle" | "star";
}

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#06B6D4", "#84CC16",
];

const MESSAGES_DAY = [
  "🎉 أحسنت! أكملت مهام اليوم!",
  "🔥 رائع! استمر على هذا المستوى!",
  "💪 ممتاز! يوم آخر ناجح في رحلتك!",
  "⭐ عظيم! أنت على الطريق الصحيح!",
];

const MESSAGES_CHALLENGE = [
  "🏆 مبروك! أكملت التحدي بالكامل! أنت بطل!",
  "🌟 إنجاز رائع! أكملت 30 يوم من التحدي!",
  "🎊 تهانينا! أنت من الـ 1% الذين يكملون التحدي!",
];

interface ConfettiCelebrationProps {
  type: "day" | "challenge";
  onClose: () => void;
}

const ConfettiCelebration = ({ type, onClose }: ConfettiCelebrationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const [message] = useState(() => {
    const arr = type === "challenge" ? MESSAGES_CHALLENGE : MESSAGES_DAY;
    return arr[Math.floor(Math.random() * arr.length)];
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create initial burst of particles
    const count = type === "challenge" ? 200 : 120;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.4 - canvas.height * 0.2,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 3 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 8 + 4,
      opacity: 1,
      shape: (["rect", "circle", "star"] as const)[Math.floor(Math.random() * 3)],
    }));

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const innerAngle = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
        ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(angle) * r + x, Math.sin(angle) * r + y);
        ctx.lineTo(Math.cos(innerAngle) * (r * 0.4) + x, Math.sin(innerAngle) * (r * 0.4) + y);
      }
      ctx.closePath();
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => p.opacity > 0.01);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height * 0.7) {
          p.opacity -= 0.015;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.size / 2);
        }

        ctx.restore();
      }

      if (particlesRef.current.length > 0) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Auto-close after 5s for day, 8s for challenge
    const timer = setTimeout(onClose, type === "challenge" ? 8000 : 5000);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      clearTimeout(timer);
    };
  }, [type]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Message Card */}
      <div
        className="relative z-10 pointer-events-auto bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center border-4 border-yellow-300"
        style={{ animation: "celebrationPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          type === "challenge"
            ? "bg-gradient-to-br from-yellow-400 to-orange-500"
            : "bg-gradient-to-br from-primary to-blue-600"
        }`}>
          {type === "challenge" ? (
            <Trophy className="w-10 h-10 text-white" />
          ) : (
            <Star className="w-10 h-10 text-white" />
          )}
        </div>

        <h2 className="text-xl font-black text-foreground mb-2 leading-snug">{message}</h2>

        {type === "challenge" && (
          <div className="flex justify-center gap-1 mt-3 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          {type === "challenge"
            ? "أنت من الأبطال الذين يكملون ما بدأوه. استمر على هذا المستوى!"
            : "كل يوم تكمله يقربك من هدفك. استمر!"}
        </p>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-2xl font-black text-white transition-all ${
            type === "challenge"
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              : "bg-gradient-to-r from-primary to-blue-600 hover:opacity-90"
          }`}
        >
          {type === "challenge" ? "🏆 رائع! شكراً!" : "💪 استمر!"}
        </button>
      </div>

      <style>{`
        @keyframes celebrationPop {
          from { transform: scale(0.5) translateY(40px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ConfettiCelebration;
