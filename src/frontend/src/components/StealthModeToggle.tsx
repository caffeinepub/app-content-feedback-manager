import { Moon, Sun } from "lucide-react";

interface Props {
  stealthMode: boolean;
  onToggle: () => void;
}

export default function StealthModeToggle({ stealthMode, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-ocid="stealth.toggle.button"
      title={stealthMode ? "Exit Stealth Mode" : "Enter Stealth Mode"}
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 100,
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: stealthMode
          ? "rgba(10, 20, 40, 0.95)"
          : "rgba(2, 4, 15, 0.85)",
        border: stealthMode
          ? "1.5px solid rgba(100,120,160,0.5)"
          : "1.5px solid rgba(0,255,255,0.4)",
        color: stealthMode ? "rgba(150,170,200,0.8)" : "#00ffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.3s",
        boxShadow: stealthMode
          ? "0 0 8px rgba(80,100,140,0.3)"
          : "0 0 14px rgba(0,255,255,0.4), 0 0 28px rgba(0,255,255,0.15)",
        backdropFilter: "blur(10px)",
      }}
    >
      {stealthMode ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
