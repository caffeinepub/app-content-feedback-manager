import { Toaster } from "@/components/ui/sonner";
import { Moon, Music2, Pause, Play, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import AnimatedSkyBackground from "./components/AnimatedSkyBackground";
import ArcheryGame3D from "./components/ArcheryGame3D";
import SpotifyPlayer from "./components/SpotifyPlayer";
import {
  useGetMusicUrl,
  useGetPublicSettings,
  useGetSpotifyUrl,
  useRegisterGlobalActor,
} from "./hooks/useQueries";
import LiveListView from "./views/LiveListView";
import { UploadView } from "./views/UploadView";
import UserView from "./views/UserView";
import UsernameCheckerView from "./views/UsernameCheckerView";
import AdminView from "./views/admin/AdminView";

type Tab = "user" | "view" | "upload" | "live" | "checker" | "admin";

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
      <span
        className="countdown-label"
        style={{ fontStyle: "italic", fontWeight: 700, color: "#00FFFF" }}
      >
        TIME UNTIL MIDNIGHT
      </span>
      <span className="countdown-time">{timeLeft}</span>
      <span className="countdown-subtitle">Make the most of today! ✨</span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("user");
  const { theme, setTheme } = useTheme();
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [spotifyVisible, setSpotifyVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: publicSettings } = useGetPublicSettings();
  const { data: musicUrl } = useGetMusicUrl();
  const { data: spotifyUrl } = useGetSpotifyUrl();
  useRegisterGlobalActor();

  useEffect(() => {
    if (musicUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(musicUrl);
        audioRef.current.loop = true;
      } else {
        audioRef.current.src = musicUrl;
      }
    }
  }, [musicUrl]);

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

  void publicSettings;

  return (
    <div
      className="min-h-screen section-board-bg text-foreground"
      style={{ position: "relative" }}
    >
      {/* Animated sky background */}
      <AnimatedSkyBackground />

      {/* Header */}
      <header
        className="sticky top-0 z-50 section-board-header"
        style={{ position: "relative", zIndex: 50 }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* RW Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="rw-avatar"
              style={{
                background: "linear-gradient(135deg, #DC143C, #C0C0C0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                border: "1.5px solid rgba(192,192,192,0.4)",
                fontWeight: 900,
                fontSize: "1.1rem",
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 12px rgba(220,20,60,0.3)",
                flexShrink: 0,
              }}
            >
              RW
            </div>
            <span
              className="font-bold text-sm hidden sm:block"
              style={{ color: "#C0C0C0", letterSpacing: "0.05em" }}
            >
              Review Empire
            </span>
          </div>

          {/* Countdown center */}
          <CountdownBanner />

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={toggleMusic}
                data-ocid="music.toggle"
                className={`music-btn ${musicPlaying ? "playing" : ""}`}
                title={musicPlaying ? "Pause music" : "Play music"}
              >
                {musicPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
              <span className="music-dot" aria-hidden="true" />
            </div>

            {spotifyUrl && (
              <button
                type="button"
                onClick={() => setSpotifyVisible((v) => !v)}
                data-ocid="spotify.toggle.button"
                className="neop-btn-icon"
                title={spotifyVisible ? "Hide Spotify player" : "Play Sound"}
                style={
                  spotifyVisible
                    ? {
                        boxShadow: "0 0 14px rgba(0,255,255,0.55)",
                        borderColor: "#00FFFF",
                      }
                    : {}
                }
              >
                <Music2
                  className="w-4 h-4"
                  style={{ color: spotifyVisible ? "#00FFFF" : undefined }}
                />
              </button>
            )}

            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-ocid="theme.toggle"
              className="neop-btn-icon"
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
      <main
        className="max-w-5xl mx-auto px-4 py-6"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* Section Board Navigation */}
        <nav
          className="section-board-nav mb-8"
          data-ocid="nav.panel"
          aria-label="Section navigation"
        >
          {/* User pill */}
          <button
            type="button"
            onClick={() => setActiveTab("user")}
            data-ocid="nav.user.tab"
            className={`nav-pill nav-pill-user ${activeTab === "user" ? "active" : ""}`}
          >
            USER
          </button>

          {/* View pill */}
          <button
            type="button"
            onClick={() => setActiveTab("view")}
            data-ocid="nav.view.tab"
            className={`nav-pill nav-pill-view ${activeTab === "view" ? "active" : ""}`}
          >
            VIEW
          </button>

          {/* Upload pill */}
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            data-ocid="nav.upload.tab"
            className={`nav-pill nav-pill-upload ${activeTab === "upload" ? "active" : ""}`}
          >
            UPLOAD
          </button>

          {/* Live pill */}
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            data-ocid="nav.live.tab"
            className={`nav-pill nav-pill-live ${activeTab === "live" ? "active" : ""}`}
          >
            LIVE
          </button>

          {/* Divider */}
          <div className="nav-divider" aria-hidden="true" />

          {/* Checker label */}
          <button
            type="button"
            onClick={() => setActiveTab("checker")}
            data-ocid="nav.checker.tab"
            className={`nav-admin-checker ${activeTab === "checker" ? "active" : ""}`}
          >
            CHECKER
          </button>

          {/* Admin Panel label */}
          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            data-ocid="nav.admin.tab"
            className={`nav-admin-panel ${activeTab === "admin" ? "active" : ""}`}
          >
            ADMIN PANEL
          </button>
        </nav>

        {/* Tab Content */}
        <div className="animate-fadeInUp">
          {activeTab === "user" && <UserView />}
          {activeTab === "view" && <ArcheryGame3D />}
          {activeTab === "upload" && <UploadView />}
          {activeTab === "live" && <LiveListView />}
          {activeTab === "checker" && <UsernameCheckerView />}
          {activeTab === "admin" && <AdminView />}
        </div>
      </main>

      {/* Game Master Footer */}
      <footer
        style={{
          marginTop: 80,
          padding: 40,
          borderTop: "1px solid #333",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h3
          style={{
            fontStyle: "italic",
            fontWeight: "bold",
            color: "#00FFFF",
            marginBottom: 10,
          }}
        >
          ***GAME MASTER: NISHANT CHAUDHARY***
        </h3>
        <p
          style={{
            color: "#ccc",
            maxWidth: 600,
            margin: "0 auto 20px auto",
            lineHeight: 1.6,
          }}
        >
          Join our elite community for premium review work. We provide
          high-quality engagement at the best market prices with guaranteed
          weekly payouts.
        </p>
        <a
          href="https://chat.whatsapp.com/JZ5w3hyx4gYDtPWx91Xena"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", display: "inline-block" }}
        >
          <div
            style={{
              background: "#25D366",
              color: "white",
              padding: "12px 24px",
              borderRadius: 50,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>Join WhatsApp Community</span>
            <small>(7986131899)</small>
          </div>
        </a>

        {/* Caffeine attribution */}
        <p className="mt-6 text-xs" style={{ color: "#555" }}>
          © {new Date().getFullYear()} Review Empire · Built with{" "}
          <span style={{ color: "#e53e3e" }}>♥</span> using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#4fd1c5" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Sticky Spotify Player */}
      <SpotifyPlayer
        visible={spotifyVisible}
        isPlaying={spotifyVisible}
        onClose={() => setSpotifyVisible(false)}
      />

      <Toaster />
    </div>
  );
}
