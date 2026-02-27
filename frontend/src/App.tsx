import { useState, useRef, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import UserView from "./views/UserView";
import { AdminView } from "./views/admin/AdminView";
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
      const now = new Date();
      const target = new Date();
      target.setHours(24, 0, 0, 0); // midnight tonight
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
    <span className="font-mono text-sm text-muted-foreground tabular-nums">{timeLeft}</span>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
type Tab = "user" | "admin";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("user");

  const { data: settings } = useSettings();

  const musicUrl = settings?.musicFile ? settings.musicFile.getDirectURL() : null;
  const bgEnabled = settings?.bgMusicEnabled ?? false;

  const { isPlaying, toggle: toggleMusic } = useBackgroundMusic(musicUrl, bgEnabled);

  const hasMusicFile = !!musicUrl;

  const tabs: { id: Tab; label: string }[] = [
    { id: "user", label: "User View" },
    { id: "admin", label: "Admin" },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <img
                src="/assets/generated/app-avatar-icon.dim_128x128.png"
                alt="Logo"
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="font-bold text-foreground text-sm hidden sm:block">
                Comment Studio
              </span>
            </div>

            {/* Center: Countdown */}
            <div className="flex-1 flex justify-center">
              <CountdownTimer />
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
                    className="relative"
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
          <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          {activeTab === "user" && <UserView />}
          {activeTab === "admin" && <AdminView />}
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          <p>
            Built with{" "}
            <span className="text-red-500">♥</span>{" "}
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
