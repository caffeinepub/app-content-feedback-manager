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
          ? "rgba(8, 12, 26, 0.95)"
          : "rgba(8, 12, 26, 0.85)",
        border: stealthMode
          ? "1.5px solid rgba(120,130,160,0.4)"
          : "1.5px solid rgba(245,200,66,0.5)",
        color: stealthMode ? "rgba(150,170,200,0.7)" : "#F5C842",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.3s",
        boxShadow: stealthMode
          ? "0 0 8px rgba(80,90,120,0.2)"
          : "0 0 14px rgba(245,200,66,0.4), 0 0 28px rgba(245,200,66,0.15)",
        backdropFilter: "blur(10px)",
      }}
    >
      {stealthMode ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
