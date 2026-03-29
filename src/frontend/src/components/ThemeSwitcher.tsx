import { useEffect, useState } from "react";

const THEMES = [
  {
    name: "Silver",
    primary: "#C0C0C0",
    glow: "rgba(192,192,192,0.3)",
    border: "rgba(192,192,192,0.2)",
  },
  {
    name: "Gold",
    primary: "#F5C842",
    glow: "rgba(245,200,66,0.3)",
    border: "rgba(245,200,66,0.2)",
  },
  {
    name: "Cyan",
    primary: "#00F5FF",
    glow: "rgba(0,245,255,0.3)",
    border: "rgba(0,245,255,0.2)",
  },
  {
    name: "Blood Rose",
    primary: "#FF1744",
    glow: "rgba(255,23,68,0.3)",
    border: "rgba(255,23,68,0.2)",
  },
  {
    name: "Toxic Lime",
    primary: "#76FF03",
    glow: "rgba(118,255,3,0.3)",
    border: "rgba(118,255,3,0.2)",
  },
  {
    name: "Deep Violet",
    primary: "#A87FFF",
    glow: "rgba(168,127,255,0.3)",
    border: "rgba(168,127,255,0.2)",
  },
];

function applyTheme(primary: string, glow: string, border: string) {
  const r = document.documentElement;
  r.style.setProperty("--theme-primary", primary);
  r.style.setProperty("--theme-glow", glow);
  r.style.setProperty("--theme-border", border);
}

export default function ThemeSwitcher() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("themeIndex");
    if (saved !== null) {
      const idx = Number(saved);
      const t = THEMES[idx];
      if (t) {
        setActive(idx);
        applyTheme(t.primary, t.glow, t.border);
      }
    } else {
      const t = THEMES[0];
      applyTheme(t.primary, t.glow, t.border);
    }
  }, []);

  const select = (idx: number) => {
    const t = THEMES[idx];
    setActive(idx);
    applyTheme(t.primary, t.glow, t.border);
    localStorage.setItem("themeIndex", String(idx));
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "0.6rem",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {THEMES.map((t, i) => (
        <button
          key={t.name}
          type="button"
          title={t.name}
          data-ocid={`theme.${t.name.toLowerCase().replace(" ", "_")}.button`}
          onClick={() => select(i)}
          style={{
            width: 22,
            height: 22,
            background: t.primary,
            border: i === active ? "2px solid #fff" : "2px solid transparent",
            transform: i === active ? "scale(1.25)" : "scale(1)",
            borderRadius: 2,
            rotate: "45deg",
            cursor: "pointer",
            transition: "transform 0.2s, border 0.2s",
            boxShadow: i === active ? `0 0 10px ${t.glow}` : "none",
            flexShrink: 0,
          }}
        />
      ))}
      <span
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.6rem",
          color: "rgba(192,192,192,0.5)",
          letterSpacing: "0.1em",
          marginLeft: 4,
        }}
      >
        THEME
      </span>
    </div>
  );
}
