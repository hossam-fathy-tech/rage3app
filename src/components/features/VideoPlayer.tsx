import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
  Maximize2, Minimize2, Loader2, List, Settings, X, ChevronRight,
} from "lucide-react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface VideoChapter {
  id: string;
  title: string;
  start_time_seconds: number;
  order_index: number;
}

interface VideoPlayerProps {
  src: string;
  title?: string;
  chapters?: VideoChapter[];
  onEnded?: () => void;
  onTimeUpdate?: (seconds: number) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// ── Helpers ────────────────────────────────────────────────────────────────
function extractYouTubeId(url: string): string {
  if (!url) return "";
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? "";
}

function formatTime(sec: number) {
  if (!sec || isNaN(sec)) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getCurrentChapterIdx(chapters: VideoChapter[], currentTime: number): number {
  let idx = 0;
  for (let i = 0; i < chapters.length; i++) {
    if (currentTime >= chapters[i].start_time_seconds) idx = i;
    else break;
  }
  return idx;
}

// ── YouTube API Loader ─────────────────────────────────────────────────────
let apiLoaded = false;
let apiLoading = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiLoaded) { resolve(); return; }
    readyCallbacks.push(resolve);
    if (!apiLoading) {
      apiLoading = true;
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        apiLoaded = true;
        readyCallbacks.forEach((cb) => cb());
        readyCallbacks.length = 0;
        if (prevReady) prevReady();
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
}

// ── Shared Controls ────────────────────────────────────────────────────────
interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  speed: number;
  showSettings: boolean;
  showChapters: boolean;
  hasChapters: boolean;
  onTogglePlay: () => void;
  onSeek: (delta: number) => void;
  onSeekClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onToggleMute: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetSpeed: (s: number) => void;
  onToggleSettings: () => void;
  onToggleChapters: () => void;
  onFullscreen: () => void;
}

function PlayerControls({
  isPlaying, currentTime, duration, volume, isMuted, speed,
  showSettings, showChapters, hasChapters,
  onTogglePlay, onSeek, onSeekClick, onToggleMute, onVolumeChange,
  onSetSpeed, onToggleSettings, onToggleChapters, onFullscreen,
}: ControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      <div className="relative z-10">
        {/* Progress */}
        <div className="px-4 mb-1">
          <div className="relative h-1 bg-white/15 rounded-full cursor-pointer group/progress" onClick={onSeekClick}>
            <div className="h-full bg-primary rounded-full relative transition-[width] duration-200" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1 px-3 pb-2.5">
          <button onClick={onTogglePlay} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" fill="currentColor" />}
          </button>
          <button onClick={() => onSeek(-10)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onSeek(10)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 group/vol">
            <button onClick={onToggleMute} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input type="range" min={0} max={100} value={isMuted ? 0 : volume} onChange={onVolumeChange}
              className="w-0 group-hover/vol:w-16 transition-all duration-200 accent-primary cursor-pointer overflow-hidden opacity-0 group-hover/vol:opacity-100" />
          </div>

          <span className="text-white/40 text-[11px] font-mono flex-1 px-2 select-none">
            {formatTime(currentTime)} <span className="text-white/20">/</span> {formatTime(duration)}
          </span>

          {hasChapters && (
            <button onClick={onToggleChapters} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${showChapters ? "text-primary bg-primary/15" : "text-white/50 hover:text-white hover:bg-white/10"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="relative">
            <button onClick={onToggleSettings} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
              <Settings className="w-3.5 h-3.5" />
            </button>
            {showSettings && (
              <div className="absolute bottom-full mb-2 right-0 bg-[#1E293B] rounded-xl overflow-hidden border border-white/10 min-w-[160px] z-50 shadow-2xl">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">السرعة</p>
                  <div className="flex gap-1 flex-wrap">
                    {SPEEDS.map((s) => (
                      <button key={s} onClick={() => onSetSpeed(s)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${speed === s ? "bg-primary text-white" : "text-white/60 hover:bg-white/10"}`}>
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-white/40">السرعة الحالية</span>
                  <span className="text-xs font-bold text-primary">{speed}x</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={onFullscreen} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chapters Panel ─────────────────────────────────────────────────────────
function ChaptersPanel({
  chapters, sortedChapters, activeChapterIdx, currentTime, duration,
  showChapters, chapListRef, onSeekToChapter, onClose,
}: {
  chapters: VideoChapter[];
  sortedChapters: VideoChapter[];
  activeChapterIdx: number;
  currentTime: number;
  duration: number;
  showChapters: boolean;
  chapListRef: React.RefObject<HTMLDivElement>;
  onSeekToChapter: (ch: VideoChapter) => void;
  onClose: () => void;
}) {
  if (chapters.length === 0 || !showChapters) return null;

  return (
    <div className="bg-[#1E293B] border-t border-white/5 max-h-52 overflow-y-auto" dir="rtl" ref={chapListRef}>
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1E293B]/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <List className="w-3.5 h-3.5 text-white/30" />
          <span className="text-white/40 text-xs font-medium">أقسام الفيديو ({sortedChapters.length})</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {sortedChapters.map((ch, i) => {
        const isActive = i === activeChapterIdx;
        const nextCh = sortedChapters[i + 1];
        const chProg = isActive && duration > 0
          ? Math.min(100, ((currentTime - ch.start_time_seconds) /
            ((nextCh?.start_time_seconds ?? duration) - ch.start_time_seconds)) * 100)
          : 0;
        return (
          <button key={ch.id} data-active={isActive} onClick={() => onSeekToChapter(ch)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors border-r-2 ${
              isActive ? "bg-primary/10 border-primary" : "border-transparent hover:bg-white/[0.03]"
            }`}>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isActive ? "bg-primary text-white" : "bg-white/5 text-white/30"}`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${isActive ? "text-white" : "text-white/50"}`}>{ch.title}</p>
              {isActive && duration > 0 && (
                <div className="h-0.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${chProg}%` }} />
                </div>
              )}
            </div>
            <span className="text-white/20 text-[10px] font-mono flex-shrink-0">{formatTime(ch.start_time_seconds)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── YouTube Player ─────────────────────────────────────────────────────────
function YouTubeVideo({ videoId, title, chapters, onEnded, onTimeUpdate }: { videoId: string; title?: string; chapters: VideoChapter[]; onEnded?: () => void; onTimeUpdate?: (s: number) => void }) {
  const containerId = useRef(`yt-${Math.random().toString(36).slice(2)}`).current;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const chapListRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [seekIndicator, setSeekIndicator] = useState<{ side: "left" | "right"; amount: number } | null>(null);

  const sortedChapters = [...chapters].sort((a, b) => a.start_time_seconds - b.start_time_seconds);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  }, [isPlaying]);

  const startTracker = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const t: number = playerRef.current.getCurrentTime?.() ?? 0;
        setCurrentTime(t);
        onTimeUpdate?.(t);
        if (chapters.length > 0) setActiveChapterIdx(getCurrentChapterIdx(chapters, t));
      } catch {}
    }, 500);
  }, [chapters, onTimeUpdate]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let player: any;
    loadYouTubeAPI().then(() => {
      player = new window.YT.Player(containerId, {
        videoId,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, fs: 0, iv_load_policy: 3, showinfo: 0, cc_load_policy: 0, playsinline: 1, origin: window.location.origin },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (e: { target: any }) => { playerRef.current = e.target; setDuration(e.target.getDuration?.() ?? 0); setIsLoading(false); },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            const YT = window.YT.PlayerState;
            if (e.data === YT.PLAYING) { setIsPlaying(true); setIsLoading(false); setDuration(playerRef.current?.getDuration?.() ?? 0); startTracker(); }
            else if (e.data === YT.PAUSED) setIsPlaying(false);
            else if (e.data === YT.ENDED) { setIsPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); onEnded?.(); }
            else if (e.data === YT.BUFFERING) setIsLoading(true);
          },
        },
      });
    });
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); try { player?.destroy(); } catch {} };
  }, [videoId]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [isPlaying, resetHideTimer]);

  const togglePlay = () => { if (!playerRef.current) return; isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo(); resetHideTimer(); };
  const seek = (delta: number) => { if (!playerRef.current) return; playerRef.current.seekTo(Math.max(0, (playerRef.current.getCurrentTime?.() ?? 0) + delta), true); resetHideTimer(); };
  const seekToChapter = (ch: VideoChapter) => { if (!playerRef.current) return; playerRef.current.seekTo(ch.start_time_seconds, true); playerRef.current.playVideo(); };
  const toggleMute = () => { if (!playerRef.current) return; isMuted ? (playerRef.current.unMute(), setIsMuted(false)) : (playerRef.current.mute(), setIsMuted(true)); };
  const setPlaybackSpeed = (s: number) => { playerRef.current?.setPlaybackRate(s); setSpeed(s); setShowSettings(false); };
  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => { if (!playerRef.current || !duration) return; const rect = e.currentTarget.getBoundingClientRect(); const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); playerRef.current.seekTo(ratio * duration, true); setCurrentTime(ratio * duration); };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const v = +e.target.value; setVolume(v); playerRef.current?.setVolume(v); if (v === 0) { playerRef.current?.mute(); setIsMuted(true); } else if (isMuted) { playerRef.current?.unMute(); setIsMuted(false); } };
  const handleFullscreen = () => { if (!wrapRef.current) return; document.fullscreenElement ? document.exitFullscreen() : wrapRef.current.requestFullscreen(); };

  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    if (lastTapRef.current && (now - lastTapRef.current.time) < 300) {
      const isLeft = x < rect.left + rect.width / 3;
      const isRight = x > rect.right - rect.width / 3;
      if (isLeft || isRight) {
        const delta = isLeft ? -10 : 10;
        const t = playerRef.current.getCurrentTime?.() ?? 0;
        playerRef.current.seekTo(Math.max(0, t + delta), true);
        setSeekIndicator({ side: isLeft ? "left" : "right", amount: 10 });
        setTimeout(() => setSeekIndicator(null), 600);
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x };
    }
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative bg-[#0F172A] rounded-xl overflow-hidden select-none" dir="ltr" ref={wrapRef}>
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}
        onMouseMove={resetHideTimer} onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={handleVideoClick} onContextMenu={(e) => e.preventDefault()}>
        <div id={containerId} className="w-full h-full absolute inset-0" style={{ pointerEvents: "none" }} />
        <div className="absolute inset-0 z-10" />

        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0F172A]/60">
            <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
          </div>
        )}

        {seekIndicator && (
          <div className={`absolute top-1/2 -translate-y-1/2 z-25 flex flex-col items-center gap-1 ${seekIndicator.side === "left" ? "left-6" : "right-6"}`}>
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              {seekIndicator.side === "left" ? <RotateCcw className="w-5 h-5 text-white" /> : <RotateCw className="w-5 h-5 text-white" />}
            </div>
            <span className="text-white text-xs font-bold">{seekIndicator.amount}s</span>
          </div>
        )}

        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
              <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        <div className={`absolute inset-0 z-30 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={(e) => e.stopPropagation()}>
          {title && <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-4 pt-3 pb-8 pointer-events-none"><p className="text-white/80 text-xs font-medium truncate">{title}</p></div>}
          <PlayerControls
            isPlaying={isPlaying} currentTime={currentTime} duration={duration} volume={volume} isMuted={isMuted} speed={speed}
            showSettings={showSettings} showChapters={showChapters} hasChapters={chapters.length > 0}
            onTogglePlay={togglePlay} onSeek={seek} onSeekClick={handleSeekClick} onToggleMute={toggleMute}
            onVolumeChange={handleVolumeChange} onSetSpeed={setPlaybackSpeed}
            onToggleSettings={() => { setShowSettings((v) => !v); setShowChapters(false); }}
            onToggleChapters={() => { setShowChapters((v) => !v); setShowSettings(false); }}
            onFullscreen={handleFullscreen}
          />
        </div>
      </div>

      <ChaptersPanel chapters={chapters} sortedChapters={sortedChapters} activeChapterIdx={activeChapterIdx}
        currentTime={currentTime} duration={duration} showChapters={showChapters} chapListRef={chapListRef}
        onSeekToChapter={seekToChapter} onClose={() => setShowChapters(false)} />
    </div>
  );
}

// ── HTML5 Video Player ─────────────────────────────────────────────────────
function HTML5Video({ src, title, chapters, onEnded, onTimeUpdate }: { src: string; title?: string; chapters: VideoChapter[]; onEnded?: () => void; onTimeUpdate?: (s: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const chapListRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [seekIndicator, setSeekIndicator] = useState<{ side: "left" | "right"; amount: number } | null>(null);

  const sortedChapters = [...chapters].sort((a, b) => a.start_time_seconds - b.start_time_seconds);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onPlay = () => { setIsPlaying(true); setIsLoading(false); resetHideTimer(); };
    const onPause = () => setIsPlaying(false);
    const onEnd = () => { setIsPlaying(false); onEnded?.(); };
    const onLoaded = () => { setDuration(vid.duration); setIsLoading(false); };
    const onWaiting = () => setIsLoading(true);
    const onTime = () => { setCurrentTime(vid.currentTime); onTimeUpdate?.(vid.currentTime); if (chapters.length > 0) setActiveChapterIdx(getCurrentChapterIdx(chapters, vid.currentTime)); };
    vid.addEventListener("play", onPlay);
    vid.addEventListener("pause", onPause);
    vid.addEventListener("ended", onEnd);
    vid.addEventListener("loadedmetadata", onLoaded);
    vid.addEventListener("waiting", onWaiting);
    vid.addEventListener("timeupdate", onTime);
    return () => { vid.removeEventListener("play", onPlay); vid.removeEventListener("pause", onPause); vid.removeEventListener("ended", onEnd); vid.removeEventListener("loadedmetadata", onLoaded); vid.removeEventListener("waiting", onWaiting); vid.removeEventListener("timeupdate", onTime); };
  }, [chapters, onEnded, onTimeUpdate]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [isPlaying, resetHideTimer]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);

  const togglePlay = () => { const v = videoRef.current; if (!v) return; v.paused ? v.play() : v.pause(); resetHideTimer(); };
  const seek = (delta: number) => { const v = videoRef.current; if (!v) return; v.currentTime = Math.max(0, v.currentTime + delta); resetHideTimer(); };
  const seekToChapter = (ch: VideoChapter) => { const v = videoRef.current; if (!v) return; v.currentTime = ch.start_time_seconds; v.play(); };
  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setIsMuted(v.muted); };
  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => { const v = videoRef.current; if (!v || !duration) return; const rect = e.currentTarget.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration; };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const v = videoRef.current; if (!v) return; const val = +e.target.value; v.volume = val / 100; setVolume(val); if (val === 0) { v.muted = true; setIsMuted(true); } else if (isMuted) { v.muted = false; setIsMuted(false); } };
  const handleFullscreen = () => { if (!wrapRef.current) return; document.fullscreenElement ? document.exitFullscreen() : wrapRef.current.requestFullscreen(); };

  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    if (lastTapRef.current && (now - lastTapRef.current.time) < 300) {
      const isLeft = x < rect.left + rect.width / 3;
      const isRight = x > rect.right - rect.width / 3;
      if (isLeft || isRight) {
        const delta = isLeft ? -10 : 10;
        v.currentTime = Math.max(0, v.currentTime + delta);
        setSeekIndicator({ side: isLeft ? "left" : "right", amount: 10 });
        setTimeout(() => setSeekIndicator(null), 600);
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x };
    }
  }, [duration]);

  return (
    <div className="relative bg-[#0F172A] rounded-xl overflow-hidden select-none" dir="ltr" ref={wrapRef}>
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}
        onMouseMove={resetHideTimer} onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={handleVideoClick} onContextMenu={(e) => e.preventDefault()}>
        <video ref={videoRef} src={src} className="w-full h-full absolute inset-0 object-contain" playsInline preload="metadata" />

        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0F172A]/60">
            <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
          </div>
        )}

        {seekIndicator && (
          <div className={`absolute top-1/2 -translate-y-1/2 z-25 flex flex-col items-center gap-1 ${seekIndicator.side === "left" ? "left-6" : "right-6"}`}>
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              {seekIndicator.side === "left" ? <RotateCcw className="w-5 h-5 text-white" /> : <RotateCw className="w-5 h-5 text-white" />}
            </div>
            <span className="text-white text-xs font-bold">{seekIndicator.amount}s</span>
          </div>
        )}

        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
              <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        <div className={`absolute inset-0 z-30 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={(e) => e.stopPropagation()}>
          {title && <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-4 pt-3 pb-8 pointer-events-none"><p className="text-white/80 text-xs font-medium truncate">{title}</p></div>}
          <PlayerControls
            isPlaying={isPlaying} currentTime={currentTime} duration={duration} volume={volume} isMuted={isMuted} speed={speed}
            showSettings={showSettings} showChapters={showChapters} hasChapters={chapters.length > 0}
            onTogglePlay={togglePlay} onSeek={seek} onSeekClick={handleSeekClick} onToggleMute={toggleMute}
            onVolumeChange={handleVolumeChange} onSetSpeed={(s) => setSpeed(s)}
            onToggleSettings={() => { setShowSettings((v) => !v); setShowChapters(false); }}
            onToggleChapters={() => { setShowChapters((v) => !v); setShowSettings(false); }}
            onFullscreen={handleFullscreen}
          />
        </div>
      </div>

      <ChaptersPanel chapters={chapters} sortedChapters={sortedChapters} activeChapterIdx={activeChapterIdx}
        currentTime={currentTime} duration={duration} showChapters={showChapters} chapListRef={chapListRef}
        onSeekToChapter={seekToChapter} onClose={() => setShowChapters(false)} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
const VideoPlayer = ({ src, title, chapters = [], onEnded, onTimeUpdate }: VideoPlayerProps) => {
  const youtubeId = extractYouTubeId(src);

  if (youtubeId) {
    return <YouTubeVideo videoId={youtubeId} title={title} chapters={chapters} onEnded={onEnded} onTimeUpdate={onTimeUpdate} />;
  }

  return <HTML5Video src={src} title={title} chapters={chapters} onEnded={onEnded} onTimeUpdate={onTimeUpdate} />;
};

export default VideoPlayer;
