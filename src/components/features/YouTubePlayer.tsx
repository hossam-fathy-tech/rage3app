import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
  Maximize2, Minimize2, Gauge, Loader2, List, Settings, X, ChevronRight,
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

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const QUALITY_OPTIONS = [
  { key: "hd1080", label: "1080p HD" },
  { key: "hd720",  label: "720p HD" },
  { key: "large",  label: "480p" },
  { key: "medium", label: "360p" },
  { key: "small",  label: "240p" },
  { key: "tiny",   label: "144p" },
];

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
  const playerRef   = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const chapListRef = useRef<HTMLDivElement>(null);
  const hideTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isReady,          setIsReady]          = useState(false);
  const [isPlaying,        setIsPlaying]        = useState(false);
  const [isMuted,          setIsMuted]          = useState(false);
  const [duration,         setDuration]         = useState(0);
  const [currentTime,      setCurrentTime]      = useState(0);
  const [speed,            setSpeed]            = useState(1);
  const [volume,           setVolume]           = useState(100);
  const [isLoading,        setIsLoading]        = useState(true);
  const [showControls,     setShowControls]     = useState(true);
  const [showSpeedMenu,    setShowSpeedMenu]    = useState(false);
  const [showQualityMenu,  setShowQualityMenu]  = useState(false);
  const [showChapters,     setShowChapters]     = useState(false);
  const [isFullscreen,     setIsFullscreen]     = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [availQualities,   setAvailQualities]   = useState<string[]>([]);
  const [currentQuality,   setCurrentQuality]   = useState<string>("");

  const sortedChapters = [...chapters].sort((a, b) => a.start_time_seconds - b.start_time_seconds);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ── tracker ─────────────────────────────────────────────────────────────────
  const startTracker = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const t: number = playerRef.current.getCurrentTime?.() ?? 0;
        setCurrentTime(t);
        onTimeUpdate?.(t);
        if (chapters.length > 0) setActiveChapterIdx(getCurrentChapterIdx(chapters, t));
      } catch (error: unknown) {
        // Time update failed
      }
    }, 400);
  }, [chapters, onTimeUpdate]);

  // ── YouTube API init ──────────────────────────────────────────────────────
  useEffect(() => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
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
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          onReady: (e: { target: any }) => {
            playerRef.current = e.target;
            setDuration(e.target.getDuration?.() ?? 0);
            setIsReady(true);
            setIsLoading(false);
          },
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          onStateChange: (e: any) => {
            const YT = window.YT.PlayerState;
            if (e.data === YT.PLAYING) {
              setIsPlaying(true);
              setIsLoading(false);
              setDuration(playerRef.current?.getDuration?.() ?? 0);
              // fetch qualities once video starts
              try {
                const qs: string[] = playerRef.current?.getAvailableQualityLevels?.() ?? [];
                const filtered = qs.filter((q) => q !== "auto" && q !== "unknown");
                if (filtered.length) setAvailQualities(filtered);
                const cur: string = playerRef.current?.getPlaybackQuality?.() ?? "";
                if (cur && cur !== "unknown") setCurrentQuality(cur);
              } catch (error: unknown) {
                // Quality levels not available
              }
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
          onPlaybackQualityChange: (e: { data: string }) => {
            if (e.data && e.data !== "unknown") setCurrentQuality(e.data);
          },
        },
      });
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { player?.destroy(); } catch (error: unknown) {
        // Player cleanup error
      }
    };
  }, [videoId]);

  // ── fullscreen listener ──────────────────────────────────────────────────
  useEffect(() => {
    const onFSChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) setShowChapters(false);
    };
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  // ── scroll active chapter into view ──────────────────────────────────────
  useEffect(() => {
    if (showChapters && chapListRef.current) {
      const active = chapListRef.current.querySelector("[data-active='true']");
      active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeChapterIdx, showChapters]);

  // ── controls auto-hide ────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3200);
  }, []);

  // ── player actions ────────────────────────────────────────────────────────
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
    else          { playerRef.current.mute();   setIsMuted(true); }
  };

  const setPlaybackSpeed = (s: number) => {
    playerRef.current?.setPlaybackRate(s);
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const applyQuality = (q: string) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.setPlaybackQuality(q);
      setCurrentQuality(q);
    } catch (error: unknown) {
      // Quality setting not supported
    }
    setShowQualityMenu(false);
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

  const closeAllMenus = () => {
    setShowSpeedMenu(false);
    setShowQualityMenu(false);
  };

  // quality label
  const qualLabel = (q: string) => {
    const map: Record<string, string> = {
      highres: "4K", hd1080: "1080p", hd720: "720p",
      large: "480p", medium: "360p", small: "240p", tiny: "144p",
    };
    return map[q] ?? q.toUpperCase();
  };

  // visible quality options filtered to what's available
  const visibleQualities = QUALITY_OPTIONS.filter((o) =>
    availQualities.includes(o.key)
  );

  return (
    <div className="relative bg-black rounded-xl overflow-hidden select-none" dir="ltr" ref={wrapRef}>
      {/* ── Video wrapper ────────────────────────────────────────────── */}
      <div
        className="relative"
        style={{ aspectRatio: "16/9" }}
        onMouseMove={resetHideTimer}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={togglePlay}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* iframe */}
        <div id={containerId} className="w-full h-full absolute inset-0" style={{ pointerEvents: "none" }} />

        {/* click-overlay (above iframe, below controls) */}
        <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />

        {/* loading */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* ── CONTROLS OVERLAY ─────────────────────────────────────── */}
        <div
          className={`absolute inset-x-0 bottom-0 z-30 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0"}`}
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.92))" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* title */}
          {title && (
            <div className="px-4 pt-4 pb-1">
              <p className="text-white text-sm font-semibold truncate drop-shadow">{title}</p>
            </div>
          )}

          {/* chapter markers on progress */}
          {sortedChapters.length > 0 && duration > 0 && (
            <div className="relative h-2 mx-4 mb-0.5">
              {sortedChapters.map((ch) => (
                <button
                  key={ch.id}
                  className="absolute top-0 w-0.5 h-2 bg-white/40 hover:bg-white transition-colors cursor-pointer rounded-full"
                  style={{ left: `${(ch.start_time_seconds / duration) * 100}%` }}
                  onClick={(e) => { e.stopPropagation(); seekToChapter(ch); }}
                  title={ch.title}
                />
              ))}
            </div>
          )}

          {/* progress bar */}
          <div
            className="mx-4 h-1.5 bg-white/25 rounded-full cursor-pointer group/bar"
            onClick={handleSeekClick}
          >
            <div
              className="h-full bg-primary rounded-full relative transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* buttons row */}
          <div className="flex items-center gap-1 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
            {/* play */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* seek -10 */}
            <button onClick={() => seek(-10)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors" title="-10s">
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* seek +10 */}
            <button onClick={() => seek(10)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors" title="+10s">
              <RotateCw className="w-4 h-4" />
            </button>

            {/* volume */}
            <div className="flex items-center gap-1">
              <button onClick={toggleMute} className="w-8 h-8 flex items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range" min={0} max={100} value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 accent-primary cursor-pointer hidden sm:block"
                style={{ accentColor: "#3B82F6" }}
              />
            </div>

            {/* time */}
            <span className="text-white/70 text-xs font-mono flex-1 text-left px-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* active chapter name */}
            {sortedChapters.length > 0 && isFullscreen && (
              <span className="text-white/60 text-xs hidden lg:block max-w-[150px] truncate">
                {sortedChapters[activeChapterIdx]?.title}
              </span>
            )}

            {/* chapters toggle (only in fullscreen) */}
            {sortedChapters.length > 0 && isFullscreen && (
              <button
                onClick={() => { setShowChapters((v) => !v); closeAllMenus(); }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${
                  showChapters
                    ? "bg-white text-black border-white"
                    : "text-white border-white/30 hover:border-white/60 hover:bg-white/10"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>الأقسام</span>
              </button>
            )}

            {/* chapters toggle (below player, non-fullscreen) */}
            {sortedChapters.length > 0 && !isFullscreen && (
              <button
                onClick={() => { setShowChapters((v) => !v); closeAllMenus(); }}
                className={`flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ${
                  showChapters ? "bg-white/25 text-white" : "text-white/80 hover:bg-white/15"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الأقسام</span>
              </button>
            )}

            {/* quality */}
            {visibleQualities.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => { setShowQualityMenu((v) => !v); setShowSpeedMenu(false); setShowChapters(isFullscreen ? showChapters : false); }}
                  className="flex items-center gap-1 text-white text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-white/15 transition-colors"
                  title="الجودة"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{currentQuality ? qualLabel(currentQuality) : "HD"}</span>
                </button>
                {showQualityMenu && (
                  <div
                    className="absolute bottom-11 left-0 bg-gray-950/98 rounded-xl overflow-hidden border border-white/15 min-w-[110px] z-50 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-1.5 border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      جودة الفيديو
                    </div>
                    {visibleQualities.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => applyQuality(opt.key)}
                        className={`w-full text-sm px-4 py-2.5 text-left flex items-center gap-2 transition-colors ${
                          currentQuality === opt.key
                            ? "bg-primary text-white"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        {currentQuality === opt.key && <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* speed */}
            <div className="relative">
              <button
                onClick={() => { setShowSpeedMenu((v) => !v); setShowQualityMenu(false); }}
                className="flex items-center gap-1 text-white text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-white/15 transition-colors"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{speed}×</span>
              </button>
              {showSpeedMenu && (
                <div
                  className="absolute bottom-11 left-0 bg-gray-950/98 rounded-xl overflow-hidden border border-white/15 min-w-[90px] z-50 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1.5 border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    السرعة
                  </div>
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setPlaybackSpeed(s)}
                      className={`w-full text-sm px-4 py-2.5 text-left flex items-center gap-2 transition-colors ${
                        speed === s ? "bg-primary text-white" : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {speed === s && <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />}
                      {s}×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* fullscreen */}
            <button
              onClick={handleFullscreen}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── FULLSCREEN CHAPTERS PANEL ──────────────────────────────── */}
        {isFullscreen && sortedChapters.length > 0 && (
          <div
            dir="rtl"
            className={`absolute top-0 right-0 bottom-0 z-40 flex flex-col transition-transform duration-300 ease-in-out ${
              showChapters ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ width: "clamp(260px, 28%, 340px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* glass background */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md border-l border-white/10" />

            {/* header */}
            <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-white/60" />
                <span className="text-white font-bold text-sm">أقسام الفيديو</span>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
                  {sortedChapters.length}
                </span>
              </div>
              <button
                onClick={() => setShowChapters(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* chapter list */}
            <div className="relative z-10 flex-1 overflow-y-auto" ref={chapListRef}>
              {sortedChapters.map((ch, i) => {
                const isActive = i === activeChapterIdx;
                const nextCh   = sortedChapters[i + 1];
                const chDone   = duration > 0 && currentTime > ch.start_time_seconds;
                const chProg   = isActive && duration > 0
                  ? Math.min(100, ((currentTime - ch.start_time_seconds) /
                    ((nextCh?.start_time_seconds ?? duration) - ch.start_time_seconds)) * 100)
                  : chDone ? 100 : 0;

                return (
                  <button
                    key={ch.id}
                    data-active={isActive}
                    onClick={() => seekToChapter(ch)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-right transition-all border-r-2 ${
                      isActive
                        ? "bg-primary/20 border-primary"
                        : "border-transparent hover:bg-white/8 hover:border-white/20"
                    }`}
                  >
                    {/* index bubble */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 transition-colors ${
                      isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/10 text-white/50"
                    }`}>
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug transition-colors ${
                        isActive ? "text-white" : "text-white/65 hover:text-white/90"
                      }`}>
                        {ch.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-white/35 text-xs font-mono">{formatTime(ch.start_time_seconds)}</span>
                        {/* mini progress bar */}
                        {(isActive || chDone) && (
                          <div className="flex-1 h-0.5 bg-white/15 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isActive ? "bg-primary" : "bg-white/30"}`}
                              style={{ width: `${chProg}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* toggle tab (visible when panel is closed, to reopen) */}
          </div>
        )}

        {/* Tab to reopen chapters panel when hidden (fullscreen only) */}
        {isFullscreen && sortedChapters.length > 0 && !showChapters && (
          <button
            className="absolute top-1/2 right-0 -translate-y-1/2 z-40 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/90 transition-all px-2 py-4 rounded-l-xl border border-white/10 border-r-0 group"
            onClick={(e) => { e.stopPropagation(); setShowChapters(true); }}
            title="عرض الأقسام"
          >
            <List className="w-4 h-4" />
            <span className="text-xs font-bold hidden group-hover:block writing-mode-vertical" style={{ writingMode: "vertical-rl" }}>
              الأقسام
            </span>
          </button>
        )}
      </div>

      {/* ── CHAPTERS PANEL (non-fullscreen, below player) ─────────────── */}
      {!isFullscreen && showChapters && sortedChapters.length > 0 && (
        <div className="bg-gray-900 border-t border-white/10 max-h-60 overflow-y-auto" dir="rtl" ref={chapListRef}>
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-white/50" />
              <span className="text-white/60 text-xs font-bold">أقسام الفيديو ({sortedChapters.length})</span>
            </div>
            <button
              onClick={() => setShowChapters(false)}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {sortedChapters.map((ch, i) => {
            const isActive = i === activeChapterIdx;
            const nextCh   = sortedChapters[i + 1];
            const chProg   = isActive && duration > 0
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
                    ? "bg-primary/20 border-primary"
                    : "border-transparent hover:bg-white/5"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  isActive ? "bg-primary text-white" : "bg-white/10 text-white/60"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-white/70"}`}>{ch.title}</p>
                  {isActive && duration > 0 && (
                    <div className="h-0.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${chProg}%` }} />
                    </div>
                  )}
                </div>
                <span className="text-white/40 text-xs font-mono flex-shrink-0">{formatTime(ch.start_time_seconds)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;
