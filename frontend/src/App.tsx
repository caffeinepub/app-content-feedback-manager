import { useState, useRef, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Play, Pause, MessageSquare, Upload, Radio, Shield } from "lucide-react";
import UserView from "./views/UserView";
import { AdminView } from "./views/admin/AdminView";
import { UploadView } from "./views/UploadView";
import { LiveChecker } from "./views/LiveChecker";
import { useSettings } from "./hooks/useQueries";

// ── Background Music Hook ─────────────────────────────────────────────────────
function useBackgroundMusic(musicUrl: string | null, enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!musicUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
    } else {
      audioRef.current.src = musicUrl;
    }

    if (enabled) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    return () => {
      audioRef.current?.pause();
    };
  }, [musicUrl, enabled]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return { isPlaying, toggle };
}

// ── Countdown Timer ───────────────────────────────────────────────────────────
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const computeTarget = () => {
      const target = new Date();
      target.setHours(24, 0, 0, 0);
      return target.getTime();
    };

    const targetMs = computeTarget();

    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Time Until Midnight</span>
      <span className="font-mono font-bold text-lg gradient-heading tabular-nums">{timeLeft}</span>
      <span className="text-xs text-muted-foreground mt-0.5">Make the most of today! ✨</span>
    </div>
  );
}

// ── Floating Shapes Decoration ────────────────────────────────────────────────
function FloatingShapes() {
  return (
    <div className="floating-shapes" aria-hidden="true">
      {/* Diamond shapes */}
      <div className="shape-diamond" style={{ width: 50, height: 50, top: '12%', right: '6%', animation: 'float-slow 18s ease-in-out infinite' }} />
      <div className="shape-diamond" style={{ width: 30, height: 30, bottom: '20%', left: '4%', animation: 'float-slow 22s ease-in-out infinite 3s' }} />
      <div className="shape-diamond" style={{ width: 20, height: 20, top: '55%', right: '3%', animation: 'float-slow 15s ease-in-out infinite 6s' }} />
      <div className="shape-diamond" style={{ width: 40, height: 40, bottom: '40%', left: '2%', animation: 'float-slow 25s ease-in-out infinite 1s' }} />
      {/* Square shapes */}
      <div className="shape-square" style={{ width: 35, height: 35, top: '35%', right: '5%', animation: 'float-slow 20s ease-in-out infinite 4s' }} />
      <div className="shape-square" style={{ width: 25, height: 25, bottom: '15%', right: '8%', animation: 'float-slow 17s ease-in-out infinite 8s' }} />
      {/* Triangle shapes */}
      <div className="shape-triangle" style={{ top: '70%', right: '7%', animation: 'float-slow 19s ease-in-out infinite 2s' }} />
      <div className="shape-triangle" style={{ top: '25%', left: '3%', animation: 'float-slow 23s ease-in-out infinite 5s' }} />
      {/* Dot accents */}
      <div style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: 'oklch(0.72 0.18 175 / 0.3)', top: '45%', left: '6%', animation: 'float-slow 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: 'oklch(0.55 0.18 200 / 0.4)', top: '80%', right: '12%', animation: 'float-slow 14s ease-in-out infinite 3s' }} />
      <div style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: 'oklch(0.72 0.18 175 / 0.2)', top: '10%', left: '15%', animation: 'float-slow 16s ease-in-out infinite 7s' }} />
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
type Tab = "user" | "upload" | "live" | "admin";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "user", label: "User View", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "upload", label: "Upload", icon: <Upload className="w-4 h-4" /> },
  { id: "live", label: "Live Checker", icon: <Radio className="w-4 h-4" /> },
  { id: "admin", label: "Admin", icon: <Shield className="w-4 h-4" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("user");

  const { data: settings } = useSettings();

  const musicUrl = settings?.musicFile ? settings.musicFile.getDirectURL() : null;
  const bgEnabled = settings?.bgMusicEnabled ?? false;

  const { isPlaying, toggle: toggleMusic } = useBackgroundMusic(musicUrl, bgEnabled);

  const hasMusicFile = !!musicUrl;

  return (
    <TooltipProvider>
      <div className="app-bg-gradient min-h-screen flex flex-col relative">
        <FloatingShapes />

        {/* ── Header ── */}
        <header className="sticky top-0 z-40" style={{ background: 'oklch(0.12 0.03 240 / 0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid oklch(0.28 0.04 240 / 0.5)' }}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <img
                src="/assets/generated/app-avatar-icon.dim_128x128.png"
                alt="Logo"
                className="w-9 h-9 rounded-xl object-cover"
                style={{ boxShadow: '0 0 12px oklch(0.72 0.18 175 / 0.4)' }}
              />
              <div className="hidden sm:block">
                <div className="font-bold text-sm gradient-heading">App Review</div>
                <div className="text-xs text-muted-foreground">Comment Management</div>
              </div>
            </div>

            {/* Center: Countdown */}
            <div className="flex-1 flex justify-center">
              <div className="space-card px-4 py-2 text-center">
                <CountdownTimer />
              </div>
            </div>

            {/* Right: Music play/pause button */}
            <div className="flex items-center gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMusic}
                    disabled={!hasMusicFile}
                    className="relative text-muted-foreground hover:text-foreground"
                    aria-label={isPlaying ? "Pause music" : "Play music"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {hasMusicFile && (
                      <span
                        className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                          isPlaying ? "bg-green-500" : "bg-muted-foreground"
                        }`}
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {!hasMusicFile
                    ? "No music uploaded"
                    : isPlaying
                    ? "Pause music"
                    : "Play music"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-white shadow-neon"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                style={
                  activeTab === tab.id
                    ? { background: "linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))" }
                    : {}
                }
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 relative z-10">
          {activeTab === "user" && <UserView />}
          {activeTab === "upload" && <UploadView />}
          {activeTab === "live" && <LiveChecker />}
          {activeTab === "admin" && <AdminView />}
        </main>

        {/* ── Footer ── */}
        <footer className="relative z-10 py-4 text-center text-xs text-muted-foreground" style={{ borderTop: '1px solid oklch(0.28 0.04 240 / 0.4)' }}>
          <p>
            Built with{" "}
            <span style={{ color: 'oklch(0.72 0.18 175)' }}>♥</span>{" "}
            using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.hostname : "comment-studio"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>{" "}
            · © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  );
}
