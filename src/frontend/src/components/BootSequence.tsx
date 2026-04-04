import { useEffect, useRef, useState } from "react";

interface Props {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: Props) {
  const [phase, setPhase] = useState<"r" | "e" | "bar" | "fadeout" | "done">(
    "r",
  );
  const [barWidth, setBarWidth] = useState(0);
  const [opacity, setOpacity] = useState(1);
  // hasStarted ensures the effect body runs at most once even in StrictMode
  const hasStarted = useRef(false);
  // Keep a stable ref to onComplete so the empty-dep effect can call it
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    // Guard: if this effect somehow fires twice (StrictMode), bail immediately
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Already booted this session — skip straight to app
    if (sessionStorage.getItem("re_boot_played")) {
      onCompleteRef.current();
      return;
    }

    // R stamp in
    const t1 = setTimeout(() => setPhase("e"), 350);
    // E stamp in
    const t2 = setTimeout(() => setPhase("bar"), 700);
    // Progress bar fill
    const t3 = setTimeout(() => {
      let w = 0;
      const interval = setInterval(() => {
        w += 2;
        setBarWidth(w);
        if (w >= 100) {
          clearInterval(interval);
          setPhase("fadeout");
        }
      }, 16);
    }, 750);
    // Start fade-out
    const t4 = setTimeout(() => {
      setOpacity(0);
    }, 2400);
    // Hard cap at 3 000 ms — can never get stuck
    const t5 = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("re_boot_played", "1");
      onCompleteRef.current();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty dep array — runs once only

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        opacity,
        transition: "opacity 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.1em",
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 900,
          fontSize: "clamp(4rem, 15vw, 8rem)",
          color: "#C0C0C0",
          letterSpacing: "0.05em",
          textShadow: "0 0 40px rgba(192,192,192,0.6)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            animation:
              phase === "r" ||
              phase === "e" ||
              phase === "bar" ||
              phase === "fadeout"
                ? "bootStamp 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both"
                : "none",
          }}
        >
          R
        </span>
        <span
          style={{
            display: "inline-block",
            opacity:
              phase === "e" || phase === "bar" || phase === "fadeout" ? 1 : 0,
            animation:
              phase === "e" || phase === "bar" || phase === "fadeout"
                ? "bootStamp 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both"
                : "none",
          }}
        >
          E
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "min(300px, 60vw)",
          height: 2,
          background: "rgba(192,192,192,0.15)",
          borderRadius: 2,
          overflow: "hidden",
          opacity: phase === "bar" || phase === "fadeout" ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${barWidth}%`,
            background: "linear-gradient(90deg, #888, #C0C0C0, #fff)",
            boxShadow: "0 0 8px rgba(255,255,255,0.8)",
            transition: "width 0.016s linear",
          }}
        />
      </div>

      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          color: "rgba(192,192,192,0.4)",
          fontSize: "0.7rem",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          opacity: phase === "bar" || phase === "fadeout" ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      >
        SYSTEM INITIALIZING...
      </div>

      <style>{`
        @keyframes bootStamp {
          0% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
