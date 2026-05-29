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

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  chapters?: VideoChapter[];
  onEnded?: () => void;
  onTimeUpdate?: (seconds: number) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

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

const YouTubePlayer = ({ videoId, title, chapters = [], onEnded, onTimeUpdate }: YouTubePlayerProps) => {
  const containerId = useRef(`yt-${Math.random().toString(36).slice(2)}`).current;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const chapListRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [seekIndicator, setSeekIndicator] = useState<{ side: "left" | "right"; amount: number } | null>(null);

  const sortedChapters = [...chapters].sort((a, b) => a.start_time_seconds - b.start_time_seconds);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  // Tracker
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

  // YouTube API init
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let player: any;
    loadYouTubeAPI().then(() => {
      player = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          showinfo: 0,
          cc_load_policy: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (e: { target: any }) => {
            playerRef.current = e.target;
            setDuration(e.target.getDuration?.() ?? 0);
            setIsReady(true);
            setIsLoading(false);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            const YT = window.YT.PlayerState;
            if (e.data === YT.PLAYING) {
              setIsPlaying(true);
              setIsLoading(false);
              setDuration(playerRef.current?.getDuration?.() ?? 0);
              startTracker();
            } else if (e.data === YT.PAUSED) {
              setIsPlaying(false);
            } else if (e.data === YT.ENDED) {
              setIsPlaying(false);
              if (intervalRef.current) clearInterval(intervalRef.current);
              onEnded?.();
            } else if (e.data === YT.BUFFERING) {
              setIsLoading(true);
            }
          },
        },
      });
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { player?.destroy(); } catch {}
    };
  }, [videoId]);

  // Fullscreen listener
  useEffect(() => {
    const onFSChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) setShowChapters(false);
    };
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  // Scroll active chapter
  useEffect(() => {
    if (showChapters && chapListRef.current) {
      const active = chapListRef.current.querySelector("[data-active='true']");
      active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeChapterIdx, showChapters]);

  // Controls auto-hide
  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [isPlaying, resetHideTimer]);

  // Player actions
  const togglePlay = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
    resetHideTimer();
  };

  const seek = (delta: number) => {
    if (!playerRef.current) return;
    const t = playerRef.current.getCurrentTime?.() ?? 0;
    playerRef.current.seekTo(Math.max(0, t + delta), true);
    resetHideTimer();
  };

  const seekToChapter = (ch: VideoChapter) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(ch.start_time_seconds, true);
    playerRef.current.playVideo();
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) { playerRef.current.unMute(); setIsMuted(false); }
    else { playerRef.current.mute(); setIsMuted(true); }
  };

  const setPlaybackSpeed = (s: number) => {
    playerRef.current?.setPlaybackRate(s);
    setSpeed(s);
    setShowSettingsMenu(false);
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    playerRef.current.seekTo(ratio * duration, true);
    setCurrentTime(ratio * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = +e.target.value;
    setVolume(v);
    playerRef.current?.setVolume(v);
    if (v === 0) { playerRef.current?.mute(); setIsMuted(true); }
    else if (isMuted) { playerRef.current?.unMute(); setIsMuted(false); }
  };

  const handleFullscreen = () => {
    if (!wrapRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current.requestFullscreen();
  };

  // Double-tap seeking (mobile)
  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;

    if (lastTapRef.current && (now - lastTapRef.current.time) < 300) {
      const isLeftTap = x < rect.left + rect.width / 3;
      const isRightTap = x > rect.right - rect.width / 3;
      if (isLeftTap || isRightTap) {
        const delta = isLeftTap ? -10 : 10;
        const t = playerRef.current.getCurrentTime?.() ?? 0;
        playerRef.current.seekTo(Math.max(0, t + delta), true);
        setSeekIndicator({ side: isLeftTap ? "left" : "right", amount: Math.abs(delta) });
        setTimeout(() => setSeekIndicator(null), 600);
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x };
    }
  }, [duration]);

  const qualLabel = (q: string) => {
    const map: Record<string, string> = {
      highres: "4K", hd1080: "1080p", hd720: "720p",
      large: "480p", medium: "360p", small: "240p", tiny: "144p",
    };
    return map[q] ?? q.toUpperCase();
  };

  return (
    <div className="relative bg-[#0F172A] rounded-xl overflow-hidden select-none" dir="ltr" ref={wrapRef}>
      {/* Video wrapper */}
      <div
        className="relative w-full"
        style={{ aspectRatio: "16/9" }}
        onMouseMove={resetHideTimer}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={handleVideoClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* iframe */}
        <div id={containerId} className="w-full h-full absolute inset-0" style={{ pointerEvents: "none" }} />

        {/* Click overlay */}
        <div className="absolute inset-0 z-10" />

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0F172A]/60">
            <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
          </div>
        )}

        {/* Seek indicator (double-tap) */}
        {seekIndicator && (
          <div className={`absolute top-1/2 -translate-y-1/2 z-25 flex flex-col items-center gap-1 ${
            seekIndicator.side === "left" ? "left-6" : "right-6"
          }`}>
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              {seekIndicator.side === "left"
                ? <RotateCcw className="w-5 h-5 text-white" />
                : <RotateCw className="w-5 h-5 text-white" />
              }
            </div>
            <span className="text-white text-xs font-bold">{seekIndicator.amount}s</span>
          </div>
        )}

        {/* Center play button (when paused) */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
              <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div
          className={`absolute inset-x-0 bottom-0 z-30 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10">
            {/* Title */}
            {title && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-white/80 text-xs font-medium truncate">{title}</p>
              </div>
            )}

            {/* Progress bar */}
            <div className="px-4 mb-1">
              <div
                className="relative h-1 bg-white/15 rounded-full cursor-pointer group/progress"
                onClick={handleSeekClick}
              >
                <div
                  className="h-full bg-primary rounded-full relative transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-sm" />
                </div>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-1 px-3 pb-2.5">
              {/* Play */}
              <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" fill="currentColor" />}
              </button>

              {/* Seek -10 */}
              <button onClick={() => seek(-10)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors" title="-10s">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Seek +10 */}
              <button onClick={() => seek(10)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors" title="+10s">
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1 group/vol">
                <button onClick={toggleMute} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range" min={0} max={100} value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/vol:w-16 transition-all duration-200 accent-primary cursor-pointer overflow-hidden opacity-0 group-hover/vol:opacity-100"
                />
              </div>

              {/* Time */}
              <span className="text-white/40 text-[11px] font-mono flex-1 px-2 select-none">
                {formatTime(currentTime)} <span className="text-white/20">/</span> {formatTime(duration)}
              </span>

              {/* Chapters toggle */}
              {sortedChapters.length > 0 && (
                <button
                  onClick={() => { setShowChapters((v) => !v); setShowSettingsMenu(false); }}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                    showChapters ? "text-primary bg-primary/15" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => { setShowSettingsMenu((v) => !v); setShowChapters(false); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                {showSettingsMenu && (
                  <div className="absolute bottom-10 left-0 bg-[#1E293B] rounded-xl overflow-hidden border border-white/10 min-w-[160px] z-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    {/* Speed */}
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">السرعة</p>
                      <div className="flex gap-1 flex-wrap">
                        {SPEEDS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setPlaybackSpeed(s)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              speed === s ? "bg-primary text-white" : "text-white/60 hover:bg-white/10"
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Current speed indicator */}
                    <div className="px-3 py-2 flex items-center justify-between">
                      <span className="text-xs text-white/40">السرعة الحالية</span>
                      <span className="text-xs font-bold text-primary">{speed}x</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button onClick={handleFullscreen} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters panel (non-fullscreen) */}
      {!isFullscreen && showChapters && sortedChapters.length > 0 && (
        <div className="bg-[#1E293B] border-t border-white/5 max-h-52 overflow-y-auto" dir="rtl" ref={chapListRef}>
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1E293B]/95 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2">
              <List className="w-3.5 h-3.5 text-white/30" />
              <span className="text-white/40 text-xs font-medium">أقسام الفيديو ({sortedChapters.length})</span>
            </div>
            <button onClick={() => setShowChapters(false)} className="text-white/30 hover:text-white/60 transition-colors">
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
              <button
                key={ch.id}
                data-active={isActive}
                onClick={() => seekToChapter(ch)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors border-r-2 ${
                  isActive
                    ? "bg-primary/10 border-primary"
                    : "border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  isActive ? "bg-primary text-white" : "bg-white/5 text-white/30"
                }`}>
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
      )}

      {/* Chapters panel (fullscreen) */}
      {isFullscreen && showChapters && sortedChapters.length > 0 && (
        <div dir="rtl" className="absolute top-0 right-0 bottom-0 z-40 flex flex-col transition-transform duration-300 ease-in-out translate-x-0" style={{ width: "clamp(260px, 28%, 340px)" }}>
          <div className="absolute inset-0 bg-[#0F172A]/95 backdrop-blur-xl border-l border-white/5" />
          <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
            <span className="text-white/60 text-xs font-medium">أقسام الفيديو</span>
            <button onClick={() => setShowChapters(false)} className="text-white/40 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative z-10 flex-1 overflow-y-auto" ref={chapListRef}>
            {sortedChapters.map((ch, i) => {
              const isActive = i === activeChapterIdx;
              return (
                <button
                  key={ch.id}
                  data-active={isActive}
                  onClick={() => seekToChapter(ch)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors border-r-2 ${
                    isActive ? "bg-primary/10 border-primary" : "border-transparent hover:bg-white/[0.03]"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isActive ? "bg-primary text-white" : "bg-white/5 text-white/30"
                  }`}>
                    {i + 1}
                  </div>
                  <p className={`text-xs font-medium truncate ${isActive ? "text-white" : "text-white/50"}`}>{ch.title}</p>
                  <span className="text-white/20 text-[10px] font-mono flex-shrink-0 mr-auto">{formatTime(ch.start_time_seconds)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;
