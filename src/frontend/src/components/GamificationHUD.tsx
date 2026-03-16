import { useEffect, useRef, useState } from "react";

const RANKS = [
  { label: "Recruit", threshold: 0 },
  { label: "Operative", threshold: 500 },
  { label: "Agent", threshold: 1500 },
  { label: "Elite", threshold: 3000 },
  { label: "Legend", threshold: 6000 },
];

function getRank(score: number): string {
  let rank = RANKS[0].label;
  for (const r of RANKS) {
    if (score >= r.threshold) rank = r.label;
  }
  return rank;
}

const STORAGE_KEY = "neon_score";

export default function GamificationHUD() {
  const [score, setScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(STORAGE_KEY) ?? "0") || 0;
    } catch {
      return 0;
    }
  });
  const [flickering, setFlickering] = useState(false);
  const prevRankRef = useRef(getRank(score));
  // Track which scroll thresholds (0-90 in steps of 10) have been awarded this session
  const scrollAwardedRef = useRef<Set<number>>(new Set());

  // Persist score
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(score));
    } catch {}
  }, [score]);

  // Rank-up flicker
  useEffect(() => {
    const newRank = getRank(score);
    if (newRank !== prevRankRef.current) {
      prevRankRef.current = newRank;
      setFlickering(true);
      const t = setTimeout(() => setFlickering(false), 650);
      return () => clearTimeout(t);
    }
  }, [score]);

  // Scroll XP listener
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop + el.clientHeight;
      const total = el.scrollHeight;
      const pct = Math.floor((scrolled / total) * 100);
      // Award +10 for each 10% threshold crossed
      for (let threshold = 10; threshold <= 90; threshold += 10) {
        if (pct >= threshold && !scrollAwardedRef.current.has(threshold)) {
          scrollAwardedRef.current.add(threshold);
          setScore((s) => s + 10);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Button click XP listener
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isBtn =
        target.tagName === "BUTTON" ||
        target.closest("button") !== null ||
        target.getAttribute("role") === "button";
      if (isBtn) {
        setScore((s) => s + 50);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Music XP listener
  useEffect(() => {
    const handleMusicPlayed = () => {
      setScore((s) => s + 100);
    };
    document.addEventListener("musicplayed", handleMusicPlayed);
    return () => document.removeEventListener("musicplayed", handleMusicPlayed);
  }, []);

  const rank = getRank(score);
  const formattedScore = String(score).padStart(4, "0");

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 16,
        zIndex: 40,
        pointerEvents: "none",
        userSelect: "none",
      }}
      aria-label="Gamification HUD"
    >
      <div
        style={{
          background: "rgba(2, 4, 15, 0.82)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: flickering
            ? "1px solid #BF00FF"
            : "1px solid rgba(0,255,255,0.45)",
          borderRadius: 12,
          padding: "6px 12px",
          minWidth: 100,
          transition: "border-color 0.15s ease",
          boxShadow: flickering
            ? "0 0 18px rgba(191,0,255,0.5), 0 0 36px rgba(0,255,255,0.15)"
            : "0 0 12px rgba(0,255,255,0.25)",
        }}
      >
        <div
          style={{
            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
            fontSize: "clamp(0.65rem, 2.5vw, 0.8rem)",
            fontWeight: 700,
            color: "#00FFFF",
            textShadow: "0 0 8px rgba(0,255,255,0.7)",
            letterSpacing: "0.05em",
            lineHeight: 1.3,
            marginBottom: "2px",
          }}
        >
          ACTOR: GUEST_OPERATOR
        </div>
        <div
          style={{
            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
            fontSize: "clamp(0.65rem, 2.5vw, 0.8rem)",
            fontWeight: 700,
            color: "#00FFFF",
            textShadow: "0 0 8px rgba(0,255,255,0.7)",
            letterSpacing: "0.05em",
            lineHeight: 1.3,
          }}
        >
          SCORE: {formattedScore}
        </div>
        <div
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "clamp(0.55rem, 2vw, 0.68rem)",
            fontWeight: 600,
            color: flickering ? "#00FFFF" : "#BF00FF",
            textShadow: flickering
              ? "0 0 8px rgba(0,255,255,0.7)"
              : "0 0 6px rgba(191,0,255,0.6)",
            letterSpacing: "0.08em",
            transition: "color 0.15s ease",
          }}
        >
          RANK: {rank.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
