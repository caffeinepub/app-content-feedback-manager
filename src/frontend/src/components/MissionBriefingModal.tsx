import React, { useEffect, useState } from "react";

interface MissionBriefingModalProps {
  open: boolean;
  onClose: () => void;
}

const COUNTDOWN_SECONDS = 10;

export default function MissionBriefingModal({
  open,
  onClose,
}: MissionBriefingModalProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!open) return;
    setCountdown(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const isReady = countdown === 0;

  return (
    <div
      data-ocid="mission.modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(1, 5, 20, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(20,0,10,0.97) 0%, rgba(8,0,4,0.99) 100%)",
          border: "2px solid #FF0033",
          borderRadius: "1.25rem",
          boxShadow:
            "0 0 40px rgba(255,0,51,0.5), 0 0 80px rgba(255,0,51,0.2), inset 0 1px 0 rgba(255,80,80,0.15)",
          maxWidth: "520px",
          width: "100%",
          padding: "2rem 1.75rem",
          position: "relative",
        }}
      >
        {/* Corner accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background:
              "linear-gradient(90deg, transparent, #FF0033, #FF6666, #FF0033, transparent)",
            borderRadius: "1.25rem 1.25rem 0 0",
          }}
        />

        {/* Title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "0.75rem",
          }}
        >
          <h2
            style={{
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: "clamp(1.3rem, 5vw, 1.75rem)",
              color: "#FF2244",
              textShadow:
                "0 0 20px rgba(255,34,68,0.8), 0 0 40px rgba(255,0,0,0.4)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            ⚠️ MISSION BRIEFING
          </h2>
          <p
            style={{
              fontWeight: 700,
              fontStyle: "italic",
              color: "#C0C8D8",
              fontSize: "0.85rem",
              marginTop: "0.4rem",
              letterSpacing: "0.04em",
            }}
          >
            Complete these steps to earn your reward
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,0,51,0.6), transparent)",
            marginBottom: "1.25rem",
          }}
        />

        {/* Instructions */}
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 1.5rem 0",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {[
            {
              step: "SEARCH",
              desc: "Search the App Name at the Play Store & Download",
            },
            {
              step: "OPEN",
              desc: "Keep the app open for at least 10 seconds",
            },
            {
              step: "RATE",
              desc: "Click the 5-Star ⭐⭐⭐⭐⭐ rating button",
            },
            {
              step: "POST",
              desc: "Paste your unique comment and wait 1 minute before posting",
            },
            {
              step: "HOLD",
              desc: "Do NOT delete the app for minimum 3 days (Max 7 days)",
            },
          ].map(({ step, desc }, i) => (
            <li
              key={step}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "0.6rem 0.9rem",
                borderRadius: "0.6rem",
                background: "rgba(255,0,51,0.06)",
                border: "1px solid rgba(255,0,51,0.15)",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "50%",
                  background: "rgba(255,0,51,0.2)",
                  border: "1px solid rgba(255,0,51,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  color: "#FF4466",
                  fontStyle: "italic",
                }}
              >
                {i + 1}
              </span>
              <div>
                <span
                  style={{
                    fontWeight: 900,
                    fontStyle: "italic",
                    color: "#FF4466",
                    fontSize: "0.8rem",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {step}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: "#A0B0C0",
                    fontSize: "0.78rem",
                    marginLeft: "0.4rem",
                  }}
                >
                  — {desc}
                </span>
              </div>
            </li>
          ))}
        </ol>

        {/* Button */}
        <button
          type="button"
          onClick={isReady ? onClose : undefined}
          disabled={!isReady}
          data-ocid="mission.confirm_button"
          style={{
            width: "100%",
            padding: "0.85rem 1rem",
            borderRadius: "0.75rem",
            border: isReady ? "2px solid #00FFFF" : "2px solid #444",
            background: isReady ? "rgba(0,255,255,0.08)" : "rgba(60,60,60,0.2)",
            color: isReady ? "#00FFFF" : "#555",
            fontWeight: 900,
            fontStyle: "italic",
            fontSize: "0.9rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: isReady ? "pointer" : "not-allowed",
            transition: "all 0.4s ease",
            boxShadow: isReady
              ? "0 0 20px rgba(0,255,255,0.35), 0 0 40px rgba(0,255,255,0.1)"
              : "none",
            animation: !isReady
              ? "pulse-dim 1.5s ease-in-out infinite"
              : "none",
          }}
        >
          {isReady
            ? "✅ I UNDERSTAND THE MISSION"
            : `READING MISSION... ${countdown}s`}
        </button>

        <style>{`
          @keyframes pulse-dim {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
