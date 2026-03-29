import { useEffect, useRef } from "react";

interface Props {
  stealthMode?: boolean;
}

const RUNES = ["◆", "▲", "⬡", "◇", "△", "▽", "◈", "⬟", "◉", "▷", "◁", "⬠"];

export default function RuneBackground({ stealthMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const runes: HTMLSpanElement[] = [];

    const spawnRune = () => {
      const el = document.createElement("span");
      el.textContent = RUNES[Math.floor(Math.random() * RUNES.length)];
      const x = Math.random() * 100;
      const size = 10 + Math.random() * 18;
      const duration = 8 + Math.random() * 12;
      const delay = Math.random() * 2;
      const opacity = stealthMode ? 0.05 : 0.12 + Math.random() * 0.1;

      el.style.cssText = `
        position: absolute;
        left: ${x}%;
        bottom: -40px;
        font-size: ${size}px;
        color: rgba(192,192,192,${opacity});
        pointer-events: none;
        user-select: none;
        animation: runeFloat ${duration}s ${delay}s linear forwards;
        will-change: transform;
      `;
      container.appendChild(el);
      runes.push(el);

      setTimeout(
        () => {
          el.remove();
          const idx = runes.indexOf(el);
          if (idx !== -1) runes.splice(idx, 1);
        },
        (duration + delay) * 1000,
      );
    };

    for (let i = 0; i < 15; i++) {
      setTimeout(() => spawnRune(), i * 400);
    }

    const interval = setInterval(() => spawnRune(), 1200);

    return () => {
      clearInterval(interval);
      for (const r of runes) r.remove();
    };
  }, [stealthMode]);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
          background: stealthMode ? "#000" : "var(--bg-void, #050508)",
        }}
      />

      {/* Drifting silver grid overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(192,192,192,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(192,192,192,0.035) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          animation: "gridDrift 20s linear infinite",
        }}
      />

      {/* Mouse follow glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(192,192,192,0.04) 0%, transparent 60%)",
        }}
      />

      <style>{`
        @keyframes runeFloat {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 0; }
          5%   { opacity: 1; }
          90%  { opacity: 0.8; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes gridDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
      `}</style>
    </>
  );
}
