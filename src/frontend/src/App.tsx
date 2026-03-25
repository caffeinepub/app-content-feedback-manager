import { Toaster } from "@/components/ui/sonner";
import { Music2, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import FluidSimulation from "./components/FluidSimulation";
import HeroCube from "./components/HeroCube";
import NeonJewelBlast from "./components/NeonJewelBlast";
import SpotifyPlayer from "./components/SpotifyPlayer";
import StealthModeToggle from "./components/StealthModeToggle";
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
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
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
  lobby: "#00AAFF",
  game: "#FFD700",
  tools: "#00C853",
  admin: "#FF3333",
};

const SECTOR_GLOWS = {
  lobby: "rgba(0,170,255,0.5)",
  game: "rgba(255,215,0,0.5)",
  tools: "rgba(0,200,83,0.5)",
  admin: "rgba(255,51,51,0.5)",
};

// ── Game Sector sub-tab component ──────────────────────────────────────────
function GameSector() {
  const [gameSubTab, setGameSubTab] = useState<"arcade" | "zen">("arcade");
  const ARCADE_COLOR = "oklch(0.82 0.20 70)";
  const ZEN_COLOR = "oklch(0.72 0.20 300)";

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
      {/* Sub-tab buttons */}
      <div
        style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}
      >
        <button
          type="button"
          data-ocid="game.arcade.tab"
          onClick={() => setGameSubTab("arcade")}
          style={{
            padding: "0.45rem 1.4rem",
            borderRadius: "999px",
            fontSize: "0.78rem",
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "0.06em",
            background:
              gameSubTab === "arcade"
                ? "oklch(0.82 0.20 70 / 0.18)"
                : "oklch(0.10 0.03 260)",
            border: `1px solid ${gameSubTab === "arcade" ? ARCADE_COLOR : "oklch(0.22 0.04 260)"}`,
            color:
              gameSubTab === "arcade" ? ARCADE_COLOR : "oklch(0.50 0.04 260)",
            boxShadow:
              gameSubTab === "arcade"
                ? "0 0 14px oklch(0.82 0.20 70 / 0.35)"
                : "none",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
        >
          🕹️ ARCADE
        </button>
        <button
          type="button"
          data-ocid="game.zen.tab"
          onClick={() => setGameSubTab("zen")}
          style={{
            padding: "0.45rem 1.4rem",
            borderRadius: "999px",
            fontSize: "0.78rem",
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "0.06em",
            background:
              gameSubTab === "zen"
                ? "oklch(0.72 0.20 300 / 0.18)"
                : "oklch(0.10 0.03 260)",
            border: `1px solid ${gameSubTab === "zen" ? ZEN_COLOR : "oklch(0.22 0.04 260)"}`,
            color: gameSubTab === "zen" ? ZEN_COLOR : "oklch(0.50 0.04 260)",
            boxShadow:
              gameSubTab === "zen"
                ? "0 0 14px oklch(0.72 0.20 300 / 0.35)"
                : "none",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
        >
          🧘 ZEN ZONE
        </button>
      </div>

      {/* Sub-tab content */}
      <div
        style={{
          background: "rgba(5,10,30,0.85)",
          border: `1px solid ${gameSubTab === "arcade" ? "oklch(0.82 0.20 70 / 0.2)" : "oklch(0.72 0.20 300 / 0.2)"}`,
          borderRadius: "1.25rem",
          padding: "1.5rem",
          backdropFilter: "blur(20px)",
          width: "100%",
          boxShadow:
            gameSubTab === "arcade"
              ? "0 0 40px oklch(0.82 0.20 70 / 0.08)"
              : "0 0 40px oklch(0.72 0.20 300 / 0.08)",
          transition: "all 0.3s ease",
        }}
      >
        {gameSubTab === "arcade" ? <NeonJewelBlast /> : <ZenZone />}
      </div>
    </div>
  );
}

export default function App() {
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

  const timeLeft = useCountdown();
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
      // Attempt immediate autoplay
      audioRef.current
        .play()
        .then(() => {
          setMusicPlaying(true);
          firstInteractionDone.current = true;
        })
        .catch(() => {
          // Browser blocked autoplay — will play on first interaction (existing listener handles this)
        });
    }
  }, [musicUrl]);

  // First-interaction autoplay — respects browser autoplay policy
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (firstInteractionDone.current) return;
      firstInteractionDone.current = true;
      if (audioRef.current && musicUrl) {
        audioRef.current
          .play()
          .then(() => {
            setMusicPlaying(true);
          })
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
        // Backend says wrong — also try local fallback
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
      // Backend unavailable — fall back to local code check
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

  const appId =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.hostname)
      : "unknown-app";

  const activeSectorColor = SECTOR_COLORS[activeSector];
  const activeSectorGlow = SECTOR_GLOWS[activeSector];

  return (
    <div
      className={`min-h-screen${stealthMode ? " stealth-active" : ""}`}
      style={{
        background: "#02040F",
        color: "#e0e0e0",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <FluidSimulation stealthMode={stealthMode} />
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
          background: "rgba(2,4,15,0.92)",
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
            <div className="rw-avatar">RW</div>
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
                fontSize: "0.58rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: `${activeSectorColor}aa`,
                fontStyle: "italic",
              }}
            >
              Time Until Midnight
            </span>
            <span
              style={{
                fontSize: "1.3rem",
                fontWeight: 900,
                fontFamily: "'Geist Mono', monospace",
                color: activeSectorColor,
                letterSpacing: "0.1em",
                textShadow: `0 0 12px ${activeSectorGlow}`,
              }}
            >
              {timeLeft}
            </span>
            <span
              style={{
                fontSize: "0.52rem",
                color: "rgba(224,224,224,0.5)",
                fontStyle: "italic",
              }}
            >
              Make the most of today! ✨
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
                background: "rgba(0,255,255,0.08)",
                border: `1px solid ${activeSectorColor}55`,
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
                    ? "rgba(0,255,255,0.1)"
                    : "rgba(10,22,40,0.7)",
                  border: `1px solid ${spotifyVisible ? "#00FFFF" : "rgba(0,255,255,0.2)"}`,
                  color: spotifyVisible ? "#00FFFF" : "rgba(224,224,224,0.7)",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: spotifyVisible
                    ? "0 0 14px rgba(0,255,255,0.55)"
                    : "none",
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

      {/* Hero Lobby */}
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
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 6vw, 3.2rem)",
              fontWeight: 900,
              fontStyle: "italic",
              background: "linear-gradient(135deg, #00AAFF, #BF00FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Review Empire
          </h1>
          <p
            style={{
              color: "rgba(0,170,255,0.5)",
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              marginTop: "0.3rem",
              textTransform: "uppercase",
              fontStyle: "italic",
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
            placeholder="Enter Access Code"
            className={inputShake ? "shake" : ""}
            data-ocid="admin.access.input"
            autoComplete="off"
            style={{
              background: "rgba(5,10,30,0.9)",
              border: "1.5px solid rgba(0,255,255,0.25)",
              borderRadius: "0.5rem",
              color: "#00ffff",
              fontFamily: "'Geist Mono', monospace",
              fontSize: "0.9rem",
              padding: "0.5rem 1rem",
              letterSpacing: "0.1em",
              outline: "none",
              width: 180,
            }}
          />
          <button
            type="button"
            onClick={attemptOverride}
            disabled={adminLoading || !adminInputValue.trim()}
            data-ocid="admin.access.button"
            style={{
              background: "transparent",
              border: "2px solid #FF3333",
              color: "#FF3333",
              padding: "0.5rem 1.2rem",
              borderRadius: "0.5rem",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: "0.82rem",
              letterSpacing: "0.06em",
              cursor: "pointer",
              boxShadow: "0 0 10px rgba(255,51,51,0.25)",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
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
                border: "1px solid rgba(252,165,165,0.4)",
                color: "#fca5a5",
                borderRadius: "0.4rem",
                padding: "0.45rem 0.75rem",
                fontSize: "0.75rem",
                cursor: "pointer",
                letterSpacing: "0.05em",
                fontStyle: "italic",
              }}
            >
              ✕ EXIT ADMIN
            </button>
          )}
        </div>

        {/* 3D Cube */}
        <div
          style={{
            position: "relative",
            width: "min(300px, 70vw)",
            height: "min(300px, 70vw)",
            margin: "0 auto",
          }}
        >
          <HeroCube glitching={cubeGlitching} />
        </div>

        {/* Countdown Card */}
        <div
          style={{
            background: "#fffbeb",
            border: "2px solid rgba(180,140,60,0.4)",
            borderRadius: "1rem",
            padding: "1.25rem 2.5rem",
            textAlign: "center",
            boxShadow: "0 4px 32px rgba(255,215,0,0.15)",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#7c5c2e",
              fontWeight: 700,
              fontStyle: "italic",
              marginBottom: "0.4rem",
            }}
          >
            ⏱ TIME UNTIL MIDNIGHT
          </div>
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: "clamp(2rem,8vw,3.5rem)",
              fontWeight: 900,
              color: "#3d2b1f",
              letterSpacing: "0.08em",
              lineHeight: 1,
            }}
          >
            {timeLeft || "00:00:00"}
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "#8b6a3e",
              fontStyle: "italic",
              marginTop: "0.4rem",
            }}
          >
            Make the most of today! ✨
          </div>
        </div>
      </div>

      {/* 4-Sector Navigation */}
      <nav
        style={{
          position: "sticky",
          top: 60,
          zIndex: 40,
          background: "rgba(2,4,15,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,255,255,0.08)",
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
          padding: "0.75rem 1rem",
          flexWrap: "wrap",
        }}
        data-ocid="nav.panel"
        aria-label="Sector navigation"
      >
        {(["tools", "game", "lobby"] as Sector[]).map((sector) => {
          const isActive = activeSector === sector;
          const col = SECTOR_COLORS[sector];
          const glow = SECTOR_GLOWS[sector];
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
                letterSpacing: "0.1em",
                padding: "0.5rem 1.5rem",
                borderRadius: "50px",
                border: `2px solid ${isActive ? col : `${col}55`}`,
                background: isActive ? `${col}18` : "transparent",
                color: isActive ? col : `${col}88`,
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                textTransform: "uppercase",
                fontSize: "0.82rem",
                boxShadow: isActive ? `0 0 18px ${glow}` : "none",
                transform: isActive ? "scale(1.05)" : "scale(1)",
              }}
            >
              {sector === "lobby"
                ? "🔵 LOBBY"
                : sector === "game"
                  ? "🟡 GAME"
                  : "🟢 TOOLS"}
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
              letterSpacing: "0.1em",
              padding: "0.5rem 1.5rem",
              borderRadius: "50px",
              border: `2px solid ${activeSector === "admin" ? "#FF3333" : "#FF333355"}`,
              background:
                activeSector === "admin"
                  ? "rgba(255,51,51,0.18)"
                  : "transparent",
              color: activeSector === "admin" ? "#FF3333" : "#FF333388",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              textTransform: "uppercase",
              fontSize: "0.82rem",
              boxShadow:
                activeSector === "admin"
                  ? "0 0 18px rgba(255,51,51,0.5)"
                  : "none",
              transform: activeSector === "admin" ? "scale(1.05)" : "scale(1)",
              animation: "livePulse 2s ease-in-out infinite",
            }}
          >
            🔴 ADMIN
          </button>
        )}
      </nav>

      {/* Main Content */}
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
                  fontSize: "clamp(1.2rem,3vw,1.8rem)",
                  color: SECTOR_COLORS.lobby,
                  textShadow: `0 0 20px ${SECTOR_GLOWS.lobby}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  textAlign: "center",
                }}
              >
                🔵 LOBBY — COMMAND CENTER
              </h2>

              {spotifyUrl && (
                <div
                  style={{
                    background: "rgba(5,10,30,0.85)",
                    border: `1px solid ${SECTOR_COLORS.lobby}33`,
                    borderRadius: "1rem",
                    padding: "1.5rem",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div
                    style={{
                      fontStyle: "italic",
                      fontWeight: 900,
                      color: SECTOR_COLORS.lobby,
                      marginBottom: "1rem",
                      fontSize: "0.85rem",
                      letterSpacing: "0.08em",
                    }}
                  >
                    🎵 SONIC PLAYER
                  </div>
                  <div
                    style={{
                      border: `2px solid ${SECTOR_COLORS.lobby}55`,
                      borderRadius: "0.75rem",
                      overflow: "hidden",
                      boxShadow: `0 0 20px ${SECTOR_GLOWS.lobby}`,
                      transition: "transform 0.3s, box-shadow 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform =
                        "scale(1.01)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform =
                        "scale(1)";
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
                  background: "rgba(5,10,30,0.85)",
                  border: `1px solid ${SECTOR_COLORS.lobby}33`,
                  borderRadius: "1rem",
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
                    color: SECTOR_COLORS.lobby,
                    fontSize: "1.1rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  WELCOME TO REVIEW EMPIRE
                </h3>
                <p
                  style={{
                    color: "rgba(224,224,224,0.7)",
                    lineHeight: 1.7,
                    fontSize: "0.9rem",
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
                  fontSize: "clamp(1.2rem,3vw,1.8rem)",
                  color: SECTOR_COLORS.game,
                  textShadow: `0 0 20px ${SECTOR_GLOWS.game}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
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
                  fontSize: "clamp(1.2rem,3vw,1.8rem)",
                  color: SECTOR_COLORS.tools,
                  textShadow: `0 0 20px ${SECTOR_GLOWS.tools}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
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
                          padding: "0.4rem 1.2rem",
                          borderRadius: "50px",
                          border: `1.5px solid ${isActive ? col : `${col}44`}`,
                          background: isActive ? `${col}18` : "transparent",
                          color: isActive ? col : `${col}77`,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textTransform: "uppercase",
                          fontSize: "0.78rem",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {tab === "generators"
                          ? "GENERATORS"
                          : tab === "upload"
                            ? "UPLOAD"
                            : "CHECKER"}
                      </button>
                    );
                  },
                )}
              </div>

              <div
                style={{
                  background: "rgba(5,10,30,0.85)",
                  border: `1px solid ${SECTOR_COLORS.tools}22`,
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  backdropFilter: "blur(20px)",
                  boxShadow: `0 0 30px ${SECTOR_GLOWS.tools}11`,
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
                  fontSize: "clamp(1.2rem,3vw,1.8rem)",
                  color: SECTOR_COLORS.admin,
                  textShadow: `0 0 20px ${SECTOR_GLOWS.admin}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
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

      {/* Footer */}
      <footer
        style={{
          marginTop: 40,
          padding: "40px 20px",
          borderTop: "1px solid rgba(0,255,255,0.12)",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          background:
            "linear-gradient(0deg, rgba(2,4,15,0.98) 0%, transparent 100%)",
        }}
      >
        <h3
          className="holographic-text"
          style={{
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "1.1rem",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          *** GAME MASTER: NISHANT CHAUDHARY ***
        </h3>
        <p
          style={{
            color: "rgba(224,224,224,0.6)",
            maxWidth: 600,
            margin: "0 auto 20px auto",
            lineHeight: 1.6,
            fontSize: "0.85rem",
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
              borderRadius: 50,
              fontWeight: "bold",
              fontStyle: "italic",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.9rem",
              boxShadow: "0 0 20px rgba(37,211,102,0.3)",
            }}
          >
            <span>Join WhatsApp Community</span>
            <small>({waNumber})</small>
          </div>
        </a>
        <p
          style={{
            color: "rgba(100,100,120,0.7)",
            marginTop: "1.5rem",
            fontSize: "0.75rem",
          }}
        >
          © {new Date().getFullYear()} Review Empire · Built with{" "}
          <span style={{ color: "#e53e3e" }}>♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#4fd1c5" }}
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
