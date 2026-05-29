import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer, X, Coffee, Zap } from "lucide-react";

interface FocusTimerProps {
  onClose: () => void;
}

const PRESETS = [
  { label: "25 دقيقة", minutes: 25, type: "focus" as const },
  { label: "45 دقيقة", minutes: 45, type: "focus" as const },
  { label: "60 دقيقة", minutes: 60, type: "focus" as const },
  { label: "5 دقائق استراحة", minutes: 5, type: "break" as const },
  { label: "10 دقائق استراحة", minutes: 10, type: "break" as const },
];

type TimerState = "idle" | "running" | "paused";
type TimerType = "focus" | "break";

const FocusTimer = ({ onClose }: FocusTimerProps) => {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [state, setState] = useState<TimerState>("idle");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const startTimer = useCallback(() => {
    setState("running");
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setState("idle");
          setSessionsCompleted((s) => s + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    setState("paused");
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    setState("idle");
    if (intervalRef.current) clearInterval(intervalRef.current);
    const preset = PRESETS[selectedPreset];
    setTimeLeft(preset.minutes * 60);
    setTotalTime(preset.minutes * 60);
  }, [selectedPreset]);

  const selectPreset = useCallback((index: number) => {
    setState("idle");
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSelectedPreset(index);
    const preset = PRESETS[index];
    setTimeLeft(preset.minutes * 60);
    setTotalTime(preset.minutes * 60);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 lg:bottom-4 lg:left-auto lg:right-4 lg:w-80">
      <div className="bg-white rounded-2xl shadow-2xl border border-border/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">وضع المذاكرة</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timer Circle */}
        <div className="flex items-center justify-center py-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="4" className="text-border/50" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke="currentColor" strokeWidth="4"
                strokeLinecap="round"
                className="text-primary"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground font-mono tracking-wider">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {PRESETS[selectedPreset].type === "focus" ? "تركيز" : "استراحة"}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 px-4 pb-4">
          <button onClick={resetTimer} className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={state === "running" ? pauseTimer : startTimer}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            {state === "running" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {state === "running" ? "إيقاف مؤقت" : state === "paused" ? "استئناف" : "ابدأ"}
          </button>
        </div>

        {/* Presets */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => selectPreset(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPreset === i
                    ? "bg-primary/10 text-primary font-bold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {preset.type === "break" && <Coffee className="w-3 h-3 inline ml-1" />}
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions */}
        {sessionsCompleted > 0 && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 text-primary text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />
              أكملت {sessionsCompleted} جلسة مذاكرة اليوم
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusTimer;
