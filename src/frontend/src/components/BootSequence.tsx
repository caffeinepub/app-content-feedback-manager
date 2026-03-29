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
  const doneCalled = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem("booted")) {
      if (!doneCalled.current) {
        doneCalled.current = true;
        onComplete();
      }
      return;
    }

    // R stamp in
    const t1 = setTimeout(() => setPhase("e"), 350);
    // E stamp in
    const t2 = setTimeout(() => setPhase("bar"), 700);
    // Progress bar
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
    // Fadeout
    const t4 = setTimeout(() => {
      setOpacity(0);
    }, 1600);
    // Done
    const t5 = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("booted", "1");
      if (!doneCalled.current) {
        doneCalled.current = true;
        onComplete();
      }
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

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
