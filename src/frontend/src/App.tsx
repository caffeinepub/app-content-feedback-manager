import { Toaster } from "@/components/ui/sonner";
import { Music2, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BootSequence from "./components/BootSequence";
import DiamondGem from "./components/DiamondGem";
import NeonJewelBlast from "./components/NeonJewelBlast";
import RuneBackground from "./components/RuneBackground";
import SpotifyPlayer from "./components/SpotifyPlayer";
import StealthModeToggle from "./components/StealthModeToggle";
import ThemeSwitcher from "./components/ThemeSwitcher";
import ZenZone from "./components/ZenZone";
import {
  useGetMusicUrl,
  useGetPublicSettings,
  useGetSpotifyUrl,
  useRegisterGlobalActor,
  waitForActorPublic,
} from "./hooks/useQueries";
import LiveListView from "./views/LiveListView";
import { UploadView } from "./views/UploadView";
import UserView from "./views/UserView";
import UsernameCheckerView from "./views/UsernameCheckerView";
import AdminView from "./views/admin/AdminView";

type Sector = "lobby" | "game" | "tools" | "admin";
type ToolsTab = "generators" | "upload" | "checker";

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState("");
  const [dayProgress, setDayProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setDayProgress(100);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
      // Progress = minutes elapsed out of 1440
      const elapsed = now.getHours() * 60 + now.getMinutes();
      setDayProgress(Math.round((elapsed / 1440) * 100));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return { timeLeft, dayProgress };
}

function useWhatsAppSettings() {
  const waLink =
    localStorage.getItem("waLink") ??
    "https://chat.whatsapp.com/JZ5w3hyx4gYDtPWx91Xena";
  const waNumber = localStorage.getItem("waNumber") ?? "7986131899";
  const waDesc =
    localStorage.getItem("waDesc") ??
    "Join our elite community for premium review work. We provide high-quality engagement at the best market prices with guaranteed weekly payouts.";
  return { waLink, waNumber, waDesc };
}

const SECTOR_COLORS = {
  lobby: "#2D6FF7",
  game: "#FFD700",
  tools: "#00C853",
  admin: "#FF3333",
};

const SECTOR_GLOWS = {
  lobby: "rgba(45,111,247,0.5)",
  game: "rgba(255,215,0,0.5)",
  tools: "rgba(0,200,83,0.5)",
  admin: "rgba(255,51,51,0.5)",
};

// ── Game Sector sub-tab component ──────────────────────────────────────────
function GameSector() {
  const [gameSubTab, setGameSubTab] = useState<"arcade" | "zen">("arcade");

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 640,
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <div
        style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}
      >
        {(["arcade", "zen"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid={`game.${tab}.tab`}
            onClick={() => setGameSubTab(tab)}
            style={{
              padding: "0.45rem 1.4rem",
              borderRadius: 4,
              fontSize: "0.75rem",
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 900,
              fontStyle: "italic",
              letterSpacing: "0.06em",
              background:
                gameSubTab === tab
                  ? "rgba(255,215,0,0.1)"
                  : "rgba(255,255,255,0.03)",
              border: `1px solid ${gameSubTab === tab ? "#FFD700" : "rgba(255,255,255,0.1)"}`,
              color: gameSubTab === tab ? "#FFD700" : "rgba(212,216,224,0.6)",
              boxShadow:
                gameSubTab === tab ? "0 0 14px rgba(255,215,0,0.3)" : "none",
              cursor: "pointer",
              transition: "all 0.25s ease",
              textTransform: "uppercase",
            }}
          >
            {tab === "arcade" ? "🕹 ARCADE" : "🧘 ZEN ZONE"}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "rgba(5,5,10,0.88)",
          border: `1px solid ${gameSubTab === "arcade" ? "rgba(255,215,0,0.18)" : "rgba(168,127,255,0.18)"}`,
          borderTop: `2px solid ${gameSubTab === "arcade" ? "#FFD700" : "#A87FFF"}`,
          borderRadius: "0.5rem",
          padding: "1.5rem",
          backdropFilter: "blur(20px)",
          width: "100%",
          transition: "all 0.3s ease",
        }}
      >
        {gameSubTab === "arcade" ? <NeonJewelBlast /> : <ZenZone />}
      </div>
    </div>
  );
}

const alreadyBooted =
  typeof window !== "undefined" ? !!sessionStorage.getItem("booted") : true;

export default function App() {
  const [booted, setBooted] = useState(alreadyBooted);
  const [activeSector, setActiveSector] = useState<Sector>("tools");
  const [toolsTab, setToolsTab] = useState<ToolsTab>("generators");
  const [stealthMode, setStealthMode] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [spotifyVisible, setSpotifyVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const firstInteractionDone = useRef(false);

  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminInputValue, setAdminInputValue] = useState("");
  const [inputShake, setInputShake] = useState(false);
  const [cubeGlitching, setCubeGlitching] = useState(false);
  const [heroDissolving, setHeroDissolving] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);

  // Restore theme from localStorage on mount
  useEffect(() => {
    const idx = Number(localStorage.getItem("themeIndex") ?? "0");
    const themes = [
      {
        primary: "#C0C0C0",
        glow: "rgba(192,192,192,0.3)",
        border: "rgba(192,192,192,0.18)",
      },
      {
        primary: "#F5C842",
        glow: "rgba(245,200,66,0.3)",
        border: "rgba(245,200,66,0.18)",
      },
      {
        primary: "#00F5FF",
        glow: "rgba(0,245,255,0.3)",
        border: "rgba(0,245,255,0.18)",
      },
      {
        primary: "#FF1744",
        glow: "rgba(255,23,68,0.3)",
        border: "rgba(255,23,68,0.18)",
      },
      {
        primary: "#76FF03",
        glow: "rgba(118,255,3,0.3)",
        border: "rgba(118,255,3,0.18)",
      },
      {
        primary: "#A87FFF",
        glow: "rgba(168,127,255,0.3)",
        border: "rgba(168,127,255,0.18)",
      },
    ];
    const t = themes[idx] ?? themes[0];
    document.documentElement.style.setProperty("--theme-primary", t.primary);
    document.documentElement.style.setProperty("--theme-glow", t.glow);
    document.documentElement.style.setProperty("--theme-border", t.border);
  }, []);

  // Custom cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const onMove = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };
    const onEnter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button, a, input, textarea, [data-ocid]")) {
        cursor.classList.add("hovering");
      }
    };
    const onLeave = () => cursor.classList.remove("hovering");
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onEnter);
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onEnter);
      document.removeEventListener("mouseout", onLeave);
    };
  }, []);

  const { timeLeft, dayProgress } = useCountdown();
  const { waLink, waNumber, waDesc } = useWhatsAppSettings();

  const { data: publicSettings } = useGetPublicSettings();
  const { data: musicUrl } = useGetMusicUrl();
  const { data: spotifyUrl } = useGetSpotifyUrl();
  useRegisterGlobalActor();

  void publicSettings;

  useEffect(() => {
    if (musicUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(musicUrl);
        audioRef.current.loop = true;
      } else {
        audioRef.current.src = musicUrl;
      }
      audioRef.current
        .play()
        .then(() => {
          setMusicPlaying(true);
          firstInteractionDone.current = true;
        })
        .catch(() => {});
    }
  }, [musicUrl]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (firstInteractionDone.current) return;
      firstInteractionDone.current = true;
      if (audioRef.current && musicUrl) {
        audioRef.current
          .play()
          .then(() => setMusicPlaying(true))
          .catch(() => {});
      }
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("scroll", handleFirstInteraction);
    };
    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("touchstart", handleFirstInteraction);
    document.addEventListener("scroll", handleFirstInteraction);
    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("scroll", handleFirstInteraction);
    };
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

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const attemptOverride = async () => {
    if (!adminInputValue.trim() || adminLoading) return;
    setAdminLoading(true);

    const doReveal = () => {
      setCubeGlitching(true);
      setTimeout(() => {
        setHeroDissolving(true);
        setTimeout(() => {
          setCubeGlitching(false);
          setHeroDissolving(false);
          setAdminUnlocked(true);
          setActiveSector("admin");
        }, 800);
      }, 800);
    };

    const FALLBACK_CODE = "7898";
    const localCode = localStorage.getItem("adminCode") ?? FALLBACK_CODE;

    try {
      const actor = await waitForActorPublic();
      const ok = await actor.verifyAdminCode(adminInputValue.trim());
      if (ok) {
        doReveal();
      } else {
        if (
          adminInputValue.trim() === localCode ||
          adminInputValue.trim() === FALLBACK_CODE
        ) {
          doReveal();
        } else {
          setInputShake(true);
          setTimeout(() => setInputShake(false), 500);
        }
      }
    } catch {
      if (
        adminInputValue.trim() === localCode ||
        adminInputValue.trim() === FALLBACK_CODE
      ) {
        doReveal();
      } else {
        setInputShake(true);
        setTimeout(() => setInputShake(false), 500);
      }
    } finally {
      setAdminLoading(false);
    }
  };

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-up");
          }
        }
      },
      { threshold: 0.1 },
    );
    const els = document.querySelectorAll("[data-reveal]");
    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const appId =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.hostname)
      : "unknown-app";

  const activeSectorColor = SECTOR_COLORS[activeSector];
  const activeSectorGlow = SECTOR_GLOWS[activeSector];

  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />;
  }

  return (
    <div
      className={`min-h-screen${stealthMode ? " stealth-active" : ""}`}
      style={{
        background: "var(--bg-void)",
        color: "#d4d8e0",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <div id="gold-cursor" ref={cursorRef} />
      <RuneBackground stealthMode={stealthMode} />
      <StealthModeToggle
        stealthMode={stealthMode}
        onToggle={() => setStealthMode((v) => !v)}
      />

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(5,5,8,0.95)",
          borderBottom: `1px solid ${activeSectorColor}22`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0.6rem 1rem 0.6rem 3.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            <div className="rw-avatar">RE</div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                fontSize: "0.55rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(192,192,192,0.5)",
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              TIME UNTIL MIDNIGHT
            </span>
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: 900,
                fontFamily: "'Share Tech Mono', 'Geist Mono', monospace",
                color: "var(--theme-primary)",
                letterSpacing: "0.1em",
                textShadow: "0 0 12px var(--theme-glow)",
                animation: "heartbeatPulse 1s ease-in-out infinite",
              }}
            >
              {timeLeft}
            </span>
            <span
              style={{
                fontSize: "0.5rem",
                color: "rgba(212,216,224,0.4)",
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: "0.1em",
              }}
            >
              MAKE THE MOST OF TODAY
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={toggleMusic}
              data-ocid="music.toggle"
              style={{
                background: "rgba(192,192,192,0.06)",
                border: `1px solid ${activeSectorColor}44`,
                color: activeSectorColor,
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: musicPlaying
                  ? `0 0 14px ${activeSectorGlow}`
                  : "none",
                transition: "all 0.2s",
              }}
              title={musicPlaying ? "Pause music" : "Play music"}
            >
              {musicPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            {spotifyUrl && (
              <button
                type="button"
                onClick={() => setSpotifyVisible((v) => !v)}
                data-ocid="spotify.toggle.button"
                style={{
                  background: spotifyVisible
                    ? "rgba(0,245,255,0.08)"
                    : "rgba(10,10,20,0.7)",
                  border: `1px solid ${spotifyVisible ? "var(--theme-primary)" : "var(--theme-border)"}`,
                  color: spotifyVisible
                    ? "var(--theme-primary)"
                    : "rgba(212,216,224,0.6)",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title={spotifyVisible ? "Hide Spotify" : "Play Sound"}
              >
                <Music2 size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Lobby ────────────────────────────────────────────────────── */}
      <div
        className={heroDissolving ? "dissolving" : ""}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          padding: "2.5rem 1rem 1.5rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(1.6rem, 6vw, 3rem)",
              fontWeight: 900,
              fontStyle: "italic",
              fontFamily: "'Orbitron', sans-serif",
              background:
                "linear-gradient(135deg, var(--theme-primary) 0%, #fff 50%, var(--theme-primary) 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "holographicShift 5s ease infinite",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Review Empire
          </h1>
          <p
            style={{
              color: "rgba(192,192,192,0.45)",
              fontSize: "0.58rem",
              letterSpacing: "0.3em",
              marginTop: "0.35rem",
              textTransform: "uppercase",
              fontFamily: "'Share Tech Mono', monospace",
            }}
          >
            NEON COMMAND CENTER
          </p>
        </div>

        {/* Admin Access */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            id="admin-input"
            type="password"
            value={adminInputValue}
            onChange={(e) => setAdminInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") attemptOverride();
            }}
            placeholder="ENTER ACCESS CODE"
            className={`admin-access-input${inputShake ? " shake" : ""}`}
            data-ocid="admin.access.input"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={attemptOverride}
            disabled={adminLoading || !adminInputValue.trim()}
            className="admin-access-btn"
            data-ocid="admin.access.button"
          >
            {adminLoading ? "VERIFYING..." : "⚡ ACCESS ADMIN"}
          </button>
          {adminUnlocked && (
            <button
              type="button"
              onClick={() => {
                setAdminUnlocked(false);
                setAdminInputValue("");
                setActiveSector("lobby");
              }}
              style={{
                background: "transparent",
                border: "1px solid rgba(252,165,165,0.3)",
                color: "#fca5a5",
                borderRadius: 4,
                padding: "0.45rem 0.75rem",
                fontSize: "0.72rem",
                cursor: "pointer",
                letterSpacing: "0.05em",
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              ✕ EXIT ADMIN
            </button>
          )}
        </div>

        {/* Diamond Gem */}
        <div
          style={{
            position: "relative",
            width: "min(260px, 65vw)",
            height: "min(300px, 70vw)",
            margin: "0 auto",
          }}
        >
          <DiamondGem glitching={cubeGlitching} />
        </div>

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Countdown Card */}
        <div
          className="hero-countdown-card"
          style={{ minWidth: "min(260px, 80vw)" }}
        >
          <div className="hero-countdown-label">⏱ TIME UNTIL MIDNIGHT</div>
          <div className="hero-countdown-time">{timeLeft || "00:00:00"}</div>
          <div className="day-progress-track">
            <div
              className="day-progress-fill"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
          <div className="hero-countdown-sub">
            DAY PROGRESS — {dayProgress}% ELAPSED
          </div>
        </div>
      </div>

      {/* ── 4-Sector Navigation ───────────────────────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: 60,
          zIndex: 40,
          background: "rgba(5,5,8,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--theme-border)",
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
          padding: "0.6rem 1rem",
          flexWrap: "wrap",
        }}
        data-ocid="nav.panel"
        aria-label="Sector navigation"
      >
        {(["tools", "game", "lobby"] as Sector[]).map((sector) => {
          const isActive = activeSector === sector;
          const col = SECTOR_COLORS[sector];
          const dots: Record<string, string> = {
            tools: "#00C853",
            game: "#FFD700",
            lobby: "#2D6FF7",
          };
          return (
            <button
              key={sector}
              type="button"
              onClick={() => {
                setActiveSector(sector);
                if (adminUnlocked && sector !== "admin")
                  setAdminUnlocked(false);
              }}
              data-ocid={`nav.${sector}.tab`}
              style={{
                fontStyle: "italic",
                fontWeight: 900,
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: "0.08em",
                padding: sector === "lobby" ? "0.55rem 2rem" : "0.45rem 1.5rem",
                borderRadius: 4,
                border: `1px solid ${isActive ? col : "var(--theme-border)"}`,
                background: isActive ? `${col}12` : "rgba(255,255,255,0.03)",
                backdropFilter: "blur(12px)",
                color: isActive ? col : "rgba(212,216,224,0.55)",
                cursor: "pointer",
                transition: "all 0.25s ease",
                textTransform: "uppercase",
                fontSize: "0.7rem",
                boxShadow: isActive ? `0 0 18px ${col}44` : "none",
                transform: isActive ? "translateY(-2px)" : "translateY(0)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                position: "relative",
              }}
            >
              {/* Status dot */}
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: dots[sector],
                  boxShadow: isActive ? `0 0 6px ${dots[sector]}` : "none",
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {sector === "lobby"
                ? "LOBBY"
                : sector === "game"
                  ? "GAME"
                  : "TOOLS"}

              {/* Underline grows from center */}
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: `translateX(-50%) scaleX(${isActive ? 1 : 0})`,
                  width: "100%",
                  height: 2,
                  background: col,
                  transition: "transform 0.3s ease",
                  transformOrigin: "center",
                }}
              />
            </button>
          );
        })}

        {adminUnlocked && (
          <button
            type="button"
            onClick={() => setActiveSector("admin")}
            data-ocid="nav.admin.tab"
            style={{
              fontStyle: "italic",
              fontWeight: 900,
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: "0.08em",
              padding: "0.45rem 1.5rem",
              borderRadius: 4,
              border: `1px solid ${activeSector === "admin" ? "#FF3333" : "rgba(255,51,51,0.3)"}`,
              background:
                activeSector === "admin"
                  ? "rgba(255,51,51,0.12)"
                  : "rgba(255,255,255,0.03)",
              color:
                activeSector === "admin" ? "#FF3333" : "rgba(255,51,51,0.6)",
              cursor: "pointer",
              transition: "all 0.25s ease",
              textTransform: "uppercase",
              fontSize: "0.7rem",
              boxShadow:
                activeSector === "admin"
                  ? "0 0 18px rgba(255,51,51,0.44)"
                  : "none",
              transform:
                activeSector === "admin" ? "translateY(-2px)" : "translateY(0)",
              animation: "livePulse 2s ease-in-out infinite",
            }}
          >
            🔴 ADMIN
          </button>
        )}
      </nav>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 1rem 2rem",
          position: "relative",
          zIndex: 2,
          minHeight: "60vh",
        }}
      >
        <div
          style={{ paddingTop: 120, paddingBottom: 120 }}
          className="animate-fadeInUp"
        >
          {/* LOBBY */}
          {activeSector === "lobby" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <h2
                style={{
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "clamp(1.1rem,3vw,1.6rem)",
                  color: SECTOR_COLORS.lobby,
                  textShadow: `0 0 20px ${SECTOR_GLOWS.lobby}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  textAlign: "center",
                }}
              >
                🔵 LOBBY — COMMAND CENTER
              </h2>

              {spotifyUrl && (
                <div
                  style={{
                    background: "rgba(5,5,10,0.88)",
                    border: `1px solid ${SECTOR_COLORS.lobby}33`,
                    borderTop: `2px solid ${SECTOR_COLORS.lobby}`,
                    borderRadius: "0.5rem",
                    padding: "1.5rem",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div
                    style={{
                      fontStyle: "italic",
                      fontWeight: 900,
                      fontFamily: "'Orbitron', sans-serif",
                      color: SECTOR_COLORS.lobby,
                      marginBottom: "1rem",
                      fontSize: "0.75rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    🎵 SONIC PLAYER
                  </div>
                  <div
                    style={{
                      border: `1px solid ${SECTOR_COLORS.lobby}44`,
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                      boxShadow: `0 0 20px ${SECTOR_GLOWS.lobby}`,
                    }}
                  >
                    <iframe
                      src={`${spotifyUrl.replace("open.spotify.com/", "open.spotify.com/embed/").replace("/embed/embed/", "/embed/")}?theme=0`}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title="Spotify Player"
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  background: "rgba(5,5,10,0.88)",
                  border: `1px solid ${SECTOR_COLORS.lobby}33`,
                  borderTop: `2px solid ${SECTOR_COLORS.lobby}`,
                  borderRadius: "0.5rem",
                  padding: "2rem",
                  backdropFilter: "blur(20px)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚡</div>
                <h3
                  style={{
                    fontStyle: "italic",
                    fontWeight: 900,
                    fontFamily: "'Orbitron', sans-serif",
                    color: SECTOR_COLORS.lobby,
                    fontSize: "0.9rem",
                    marginBottom: "0.75rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  WELCOME TO REVIEW EMPIRE
                </h3>
                <p
                  style={{
                    color: "rgba(212,216,224,0.65)",
                    lineHeight: 1.7,
                    fontSize: "0.9rem",
                    fontFamily: "'Rajdhani', sans-serif",
                  }}
                >
                  Your premium hub for app review management. Navigate to{" "}
                  <strong style={{ color: SECTOR_COLORS.tools }}>TOOLS</strong>{" "}
                  to generate comments,{" "}
                  <strong style={{ color: SECTOR_COLORS.game }}>GAME</strong>{" "}
                  for Neon Jewel Blast, or enter your admin code above to unlock
                  the control panel.
                </p>
              </div>
            </div>
          )}

          {/* GAME */}
          {activeSector === "game" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2rem",
                alignItems: "center",
                width: "100%",
              }}
            >
              <h2
                style={{
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "clamp(1.1rem,3vw,1.6rem)",
                  color: SECTOR_COLORS.game,
                  textShadow: `0 0 20px ${SECTOR_GLOWS.game}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  textAlign: "center",
                }}
              >
                🟡 GAME SECTOR
              </h2>
              <GameSector />
            </div>
          )}

          {/* TOOLS */}
          {activeSector === "tools" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "clamp(1.1rem,3vw,1.6rem)",
                  color: SECTOR_COLORS.tools,
                  textShadow: `0 0 20px ${SECTOR_GLOWS.tools}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  textAlign: "center",
                }}
              >
                🟢 TOOLS — GENERATORS & CHECKER
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {(["generators", "upload", "checker"] as ToolsTab[]).map(
                  (tab) => {
                    const isActive = toolsTab === tab;
                    const col = SECTOR_COLORS.tools;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setToolsTab(tab)}
                        data-ocid={`tools.${tab}.tab`}
                        style={{
                          fontStyle: "italic",
                          fontWeight: 900,
                          fontFamily: "'Orbitron', sans-serif",
                          padding: "0.4rem 1.2rem",
                          borderRadius: 4,
                          border: `1px solid ${isActive ? col : "var(--theme-border)"}`,
                          background: isActive
                            ? `${col}10`
                            : "rgba(255,255,255,0.03)",
                          color: isActive ? col : "rgba(212,216,224,0.5)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textTransform: "uppercase",
                          fontSize: "0.7rem",
                          letterSpacing: "0.08em",
                          boxShadow: isActive ? `0 0 14px ${col}44` : "none",
                          transform: isActive ? "translateY(-1px)" : "none",
                        }}
                      >
                        {tab === "generators"
                          ? "⚡ GENERATORS"
                          : tab === "upload"
                            ? "📁 UPLOAD"
                            : "🔍 CHECKER"}
                      </button>
                    );
                  },
                )}
              </div>

              <div
                style={{
                  background: "rgba(5,5,10,0.88)",
                  border: `1px solid ${SECTOR_COLORS.tools}22`,
                  borderTop: `2px solid ${SECTOR_COLORS.tools}`,
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  backdropFilter: "blur(20px)",
                }}
              >
                {toolsTab === "generators" && <UserView />}
                {toolsTab === "upload" && <UploadView />}
                {toolsTab === "checker" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2rem",
                    }}
                  >
                    <LiveListView />
                    <UsernameCheckerView />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADMIN */}
          {activeSector === "admin" && adminUnlocked && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "clamp(1.1rem,3vw,1.6rem)",
                  color: SECTOR_COLORS.admin,
                  textShadow: `0 0 20px ${SECTOR_GLOWS.admin}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  textAlign: "center",
                }}
              >
                🔴 ADMIN — CONTROL PANEL
              </h2>
              <div className="admin-panel-reveal">
                <AdminView />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        style={{
          marginTop: 40,
          padding: "40px 20px",
          borderTop: "1px solid var(--theme-border)",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          background:
            "linear-gradient(0deg, rgba(2,2,6,0.98) 0%, transparent 100%)",
        }}
      >
        <h3
          className="holographic-text"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "1rem",
            letterSpacing: "0.1em",
            marginBottom: 10,
          }}
        >
          *** GAME MASTER: NISHANT CHAUDHARY ***
        </h3>
        <p
          style={{
            color: "rgba(212,216,224,0.5)",
            maxWidth: 600,
            margin: "0 auto 20px auto",
            lineHeight: 1.6,
            fontSize: "0.85rem",
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          {waDesc}
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          data-ocid="footer.whatsapp.button"
          style={{ textDecoration: "none", display: "inline-block" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              color: "white",
              padding: "12px 28px",
              borderRadius: 4,
              fontWeight: "bold",
              fontStyle: "italic",
              fontFamily: "'Orbitron', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.78rem",
              boxShadow: "0 0 20px rgba(37,211,102,0.3)",
              letterSpacing: "0.06em",
            }}
          >
            <span>JOIN WHATSAPP COMMUNITY</span>
            <small>({waNumber})</small>
          </div>
        </a>
        <p
          style={{
            color: "rgba(100,100,120,0.6)",
            marginTop: "1.5rem",
            fontSize: "0.72rem",
            fontFamily: "'Share Tech Mono', monospace",
          }}
        >
          © {new Date().getFullYear()} Review Empire · Built with{" "}
          <span style={{ color: "#e53e3e" }}>♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--theme-primary)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <SpotifyPlayer
        visible={spotifyVisible}
        isPlaying={spotifyVisible}
        onClose={() => setSpotifyVisible(false)}
      />
      <Toaster />
    </div>
  );
}
