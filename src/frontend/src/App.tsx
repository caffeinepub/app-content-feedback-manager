import { Toaster } from "@/components/ui/sonner";
import {
  Layers,
  MessageSquare,
  Moon,
  Music,
  Radio,
  Shield,
  Sun,
  Upload,
  VolumeX,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useGetMusicUrl, useGetPublicSettings } from "./hooks/useQueries";
import BulkGeneratorView from "./views/BulkGeneratorView";
import LiveChecker from "./views/LiveChecker";
import SingleGeneratorView from "./views/SingleGeneratorView";
import { UploadView } from "./views/UploadView";
import UserView from "./views/UserView";
import AdminView from "./views/admin/AdminView";

type Tab = "comment" | "live" | "upload" | "admin" | "single" | "bulk";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "comment", label: "Comment", icon: MessageSquare },
  { id: "single", label: "Single Gen", icon: Zap },
  { id: "bulk", label: "Bulk Gen", icon: Layers },
  { id: "live", label: "Live", icon: Radio },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "admin", label: "Admin", icon: Shield },
];

function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const update = () => {
      const now = new Date();
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setIsActive(false);
        return;
      }
      setIsActive(true);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isActive) return null;

  return (
    <div className="countdown-banner">
      <span className="countdown-label">Resets in</span>
      <span className="countdown-time">{timeLeft}</span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("comment");
  const { theme, setTheme } = useTheme();
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: publicSettings } = useGetPublicSettings();
  const { data: musicUrl } = useGetMusicUrl();

  useEffect(() => {
    if (musicUrl && publicSettings?.bgMusicEnabled) {
      if (!audioRef.current) {
        audioRef.current = new Audio(musicUrl);
        audioRef.current.loop = true;
      } else {
        audioRef.current.src = musicUrl;
      }
    }
  }, [musicUrl, publicSettings?.bgMusicEnabled]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setMusicPlaying(true);
    }
  };

  const appId =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.hostname)
      : "unknown-app";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Floating background shapes */}
      <div className="floating-shapes" aria-hidden="true">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/app-avatar-icon.dim_128x128.png"
              alt="Review Empire"
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-bold text-lg gradient-text hidden sm:block">
              Review Empire
            </span>
          </div>

          {/* Countdown */}
          <CountdownBanner />

          {/* Controls */}
          <div className="flex items-center gap-2">
            {publicSettings?.bgMusicEnabled && musicUrl && (
              <button
                type="button"
                onClick={toggleMusic}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                title={musicPlaying ? "Pause music" : "Play music"}
              >
                {musicPlaying ? (
                  <Music className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <nav className="flex flex-wrap gap-1 p-1 bg-muted/20 rounded-xl border border-border/20 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all flex-1 justify-center sm:flex-none ${
                  activeTab === tab.id
                    ? "bg-accent text-accent-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div>
          {activeTab === "comment" && <UserView />}
          {activeTab === "single" && <SingleGeneratorView />}
          {activeTab === "bulk" && <BulkGeneratorView />}
          {activeTab === "live" && <LiveChecker />}
          {activeTab === "upload" && <UploadView />}
          {activeTab === "admin" && <AdminView />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 mt-12 py-6 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Review Empire · Built with{" "}
          <span className="text-red-500">♥</span> using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster />
    </div>
  );
}
