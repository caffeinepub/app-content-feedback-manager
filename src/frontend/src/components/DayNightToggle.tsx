interface DayNightToggleProps {
  isDayMode: boolean;
  onToggle: () => void;
}

export default function DayNightToggle({
  isDayMode,
  onToggle,
}: DayNightToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-ocid="daynight.toggle"
      title={isDayMode ? "Switch to Night Mode" : "Switch to Day Mode"}
      style={{
        position: "fixed",
        bottom: 88,
        right: 16,
        zIndex: 200,
        width: 50,
        height: 50,
        borderRadius: "50%",
        background: isDayMode
          ? "rgba(240, 255, 240, 0.88)"
          : "rgba(5, 5, 10, 0.88)",
        border: isDayMode
          ? "2px solid rgba(60, 140, 60, 0.7)"
          : "2px solid rgba(245, 200, 66, 0.6)",
        color: isDayMode ? "#1a4a1a" : "#F5C842",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        cursor: "pointer",
        boxShadow: isDayMode
          ? "0 0 14px rgba(60, 180, 60, 0.35)"
          : "0 0 14px rgba(245, 200, 66, 0.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transition: "all 0.35s ease",
        fontSize: 20,
        lineHeight: 1,
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>
        {isDayMode ? "🌙" : "☀️"}
      </span>
      <span
        style={{
          fontSize: "0.5rem",
          fontFamily: "'Share Tech Mono', monospace",
          letterSpacing: "0.05em",
          fontWeight: 700,
          lineHeight: 1,
          color: isDayMode ? "#1a4a1a" : "rgba(245,200,66,0.8)",
        }}
      >
        {isDayMode ? "NIGHT" : "DAY"}
      </span>
    </button>
  );
}
