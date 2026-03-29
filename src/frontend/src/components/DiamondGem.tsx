interface Props {
  glitching?: boolean;
}

export default function DiamondGem({ glitching }: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        animation: glitching
          ? "glitch 0.8s ease-in-out"
          : "gemFloat 3s ease-in-out infinite",
      }}
    >
      <svg
        role="img"
        aria-label="Diamond gem centerpiece"
        viewBox="-120 -140 240 280"
        width="200"
        height="230"
        style={{
          filter:
            "drop-shadow(0 0 20px var(--theme-primary, #C0C0C0)) drop-shadow(0 0 40px var(--theme-glow, rgba(192,192,192,0.3)))",
          overflow: "visible",
        }}
      >
        <title>Diamond gem</title>
        {/* Diamond facets */}
        <polygon points="0,-130 -80,-20 0,-40" fill="#E0E0E0" opacity="0.9" />
        <polygon points="0,-130 80,-20 0,-40" fill="#C8C8C8" opacity="0.85" />
        <polygon points="0,-130 -80,-20 -100,30" fill="#A8A8A8" opacity="0.8" />
        <polygon points="0,-130 80,-20 100,30" fill="#B8B8B8" opacity="0.75" />
        <polygon points="-80,-20 0,-40 0,130" fill="#C0C0C0" opacity="0.9" />
        <polygon points="80,-20 0,-40 0,130" fill="#D0D0D0" opacity="0.85" />
        <polygon points="-80,-20 -100,30 0,130" fill="#888" opacity="0.7" />
        <polygon points="80,-20 100,30 0,130" fill="#999" opacity="0.75" />
        <polygon points="-100,30 0,-40 0,130" fill="#B0B0B0" opacity="0.6" />
        <polygon points="100,30 0,-40 0,130" fill="#BEBEBE" opacity="0.65" />
        {/* Top girdle highlight */}
        <polygon points="-80,-20 80,-20 0,-40" fill="#F0F0F0" opacity="0.95" />
        {/* Bottom point glow */}
        <polygon points="-50,80 50,80 0,130" fill="#D8D8D8" opacity="0.8" />

        {/* Orbit ring 1 */}
        <g
          style={{
            transform: "rotateX(70deg) rotateZ(20deg)",
            transformOrigin: "center",
            transformBox: "fill-box",
          }}
        >
          <ellipse
            cx="0"
            cy="0"
            rx="115"
            ry="40"
            fill="none"
            stroke="var(--theme-primary, #C0C0C0)"
            strokeWidth="0.8"
            opacity="0.35"
          />
          <circle r="3.5" fill="var(--theme-primary, #C0C0C0)" opacity="0.9">
            <animateMotion
              dur="3.5s"
              repeatCount="indefinite"
              path="M 115,0 A 115,40 0 1 1 -115,0 A 115,40 0 1 1 115,0"
            />
          </circle>
        </g>

        {/* Orbit ring 2 */}
        <g
          style={{
            transform: "rotateX(60deg) rotateZ(-40deg)",
            transformOrigin: "center",
            transformBox: "fill-box",
          }}
        >
          <ellipse
            cx="0"
            cy="0"
            rx="130"
            ry="35"
            fill="none"
            stroke="var(--theme-primary, #C0C0C0)"
            strokeWidth="0.8"
            opacity="0.25"
          />
          <circle r="2.5" fill="var(--theme-primary, #C0C0C0)" opacity="0.8">
            <animateMotion
              dur="5s"
              repeatCount="indefinite"
              path="M -130,0 A 130,35 0 1 0 130,0 A 130,35 0 1 0 -130,0"
            />
          </circle>
        </g>
      </svg>

      <style>{`
        @keyframes gemFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-10px) rotate(1.5deg); }
        }
      `}</style>
    </div>
  );
}
