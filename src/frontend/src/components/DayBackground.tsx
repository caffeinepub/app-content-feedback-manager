import { useEffect, useRef } from "react";

// ── Day Background Canvas ─────────────────────────────────────────────────────

export default function DayBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const rawCanvas = canvasRef.current;
    if (!rawCanvas) return;
    const rawCtx = rawCanvas.getContext("2d");
    if (!rawCtx) return;

    // Explicit non-null types so TypeScript doesn't widen in nested closures
    const cv = rawCanvas as HTMLCanvasElement;
    const ctx = rawCtx as CanvasRenderingContext2D;

    let animFrame: number;
    let running = true;

    // Dragon mutable state (lives in closure)
    let dragX = -150;
    let dragDir = 1; // 1 = right, -1 = left
    let dragY = 0;

    // Pre-seeded tree data (normalized x 0–1, relative height 0–1)
    const treeData: { rx: number; rh: number }[] = Array.from(
      { length: 220 },
      (_, i) => ({
        rx: (i + (Math.sin(i * 127.1) * 0.5 + 0.5) * 0.7) / 220,
        rh: 0.022 + (Math.sin(i * 7.31) * 0.5 + 0.5) * 0.052,
      }),
    );

    // ── Resize ──────────────────────────────────────────────────────────────
    const resize = () => {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
      dragY = cv.height * 0.22;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Helpers ──────────────────────────────────────────────────────────────

    function drawMountainLayer(
      baseY: number,
      color: string,
      freq1: number,
      freq2: number,
      amp1: number,
      amp2: number,
      phase1: number,
      phase2: number,
    ) {
      const w = cv.width;
      const h = cv.height;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 3) {
        const y =
          baseY -
          amp1 * Math.abs(Math.sin(x * freq1 + phase1)) -
          amp2 * Math.abs(Math.sin(x * freq2 + phase2));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }

    function drawTree(tx: number, baseY: number, treeH: number) {
      const treeW = treeH * 0.52;
      ctx.fillStyle = "#1a3d1a";
      for (let tier = 0; tier < 3; tier++) {
        const tierY = baseY - treeH * (0.25 + tier * 0.27);
        const tierW = treeW * (1 - tier * 0.28);
        const tierH = treeH * 0.48;
        ctx.beginPath();
        ctx.moveTo(tx, tierY - tierH);
        ctx.lineTo(tx - tierW / 2, tierY);
        ctx.lineTo(tx + tierW / 2, tierY);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawDragon(x: number, y: number, dir: number, t: number) {
      const wf = Math.sin(t * 2.8);
      ctx.save();
      ctx.translate(x, y);
      if (dir < 0) ctx.scale(-1, 1);
      ctx.fillStyle = "#2a3820";

      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.beginPath();
      ctx.moveTo(24, -7);
      ctx.quadraticCurveTo(38, -20, 47, -11);
      ctx.quadraticCurveTo(38, -2, 24, 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(51, -11, 13, 8, 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Snout / jaw
      ctx.beginPath();
      ctx.ellipse(58, -6, 8, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Eye (lighter)
      ctx.fillStyle = "#8ab080";
      ctx.beginPath();
      ctx.ellipse(54, -13, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a3820";

      // Tail
      ctx.beginPath();
      ctx.moveTo(-30, 2);
      ctx.quadraticCurveTo(-52, 12, -70, 16);
      ctx.quadraticCurveTo(-52, 7, -30, 6);
      ctx.fill();

      // Top wing
      const wingTopY = -52 - wf * 24;
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.quadraticCurveTo(4, wingTopY + 5, 22, wingTopY);
      ctx.quadraticCurveTo(10, -22, 22, -6);
      ctx.closePath();
      ctx.fill();

      // Wing inner membrane (slightly transparent)
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(4, -6);
      ctx.quadraticCurveTo(14, wingTopY + 18, 26, wingTopY + 20);
      ctx.quadraticCurveTo(18, -14, 26, -4);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Bottom wing
      const wingBotY = 40 + wf * 16;
      ctx.beginPath();
      ctx.moveTo(-6, 8);
      ctx.quadraticCurveTo(4, wingBotY, 18, wingBotY + 6);
      ctx.quadraticCurveTo(8, 26, -6, 12);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // ── Render loop ──────────────────────────────────────────────────────────
    const render = () => {
      if (!running) return;

      const t = performance.now() / 1000;
      const w = cv.width;
      const h = cv.height;

      // Move dragon
      dragX += dragDir * 0.35;
      if (dragX > w + 160) dragDir = -1;
      if (dragX < -160) dragDir = 1;

      // ── Sky ────────────────────────────────────────────────────────────
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#5cb8e8");
      sky.addColorStop(0.45, "#8ed4f5");
      sky.addColorStop(1, "#d0ecf8");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // ── Sun ────────────────────────────────────────────────────────────
      const sunX = w * 0.76;
      const sunY = h * 0.11;

      const sunHalo = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 90);
      sunHalo.addColorStop(0, "rgba(255,255,190,0.55)");
      sunHalo.addColorStop(0.5, "rgba(255,240,140,0.22)");
      sunHalo.addColorStop(1, "rgba(255,240,100,0)");
      ctx.fillStyle = sunHalo;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fffde0";
      ctx.beginPath();
      ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
      ctx.fill();

      // ── Mountain layers (back → front) ────────────────────────────────
      drawMountainLayer(
        h * 0.54,
        "#8fae8a",
        0.007,
        0.014,
        h * 0.13,
        h * 0.065,
        0,
        2.6,
      );
      drawMountainLayer(
        h * 0.6,
        "#5a8a5a",
        0.011,
        0.021,
        h * 0.1,
        h * 0.05,
        1.3,
        3.9,
      );
      drawMountainLayer(
        h * 0.66,
        "#2d5a2d",
        0.017,
        0.033,
        h * 0.07,
        h * 0.038,
        2.2,
        5.4,
      );

      // ── Dragon ────────────────────────────────────────────────────────
      drawDragon(dragX, dragY, dragDir, t);

      // ── Forest ────────────────────────────────────────────────────────
      const forestBase = h * 0.88;
      for (const tree of treeData) {
        drawTree(tree.rx * w, forestBase, tree.rh * h);
      }

      // ── Brown land strip ──────────────────────────────────────────────
      const land = ctx.createLinearGradient(0, h * 0.87, 0, h);
      land.addColorStop(0, "#4a2e0a");
      land.addColorStop(0.4, "#7a5518");
      land.addColorStop(1, "#8b6914");
      ctx.fillStyle = land;
      ctx.fillRect(0, h * 0.876, w, h * 0.124);

      animFrame = requestAnimationFrame(render);
    };

    // ── Page Visibility ──────────────────────────────────────────────────────
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(animFrame);
      } else {
        running = true;
        animFrame = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    animFrame = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ── Animated CSS Butterflies ──────────────────────────────────────────────────

const BUTTERFLIES = [
  {
    id: "pink",
    color1: "#FF6B9D",
    color2: "#ff85b0",
    left: "8%",
    top: "22%",
    flutter: "2.4s",
    drift: "28s",
    delay: "0s",
  },
  {
    id: "gold",
    color1: "#FFD700",
    color2: "#ffe033",
    left: "22%",
    top: "38%",
    flutter: "3.1s",
    drift: "35s",
    delay: "4s",
  },
  {
    id: "teal",
    color1: "#00CED1",
    color2: "#20e3e6",
    left: "42%",
    top: "18%",
    flutter: "2.1s",
    drift: "22s",
    delay: "8s",
  },
  {
    id: "orange",
    color1: "#FF8C00",
    color2: "#ffa020",
    left: "58%",
    top: "33%",
    flutter: "2.8s",
    drift: "30s",
    delay: "2s",
  },
  {
    id: "purple",
    color1: "#9B59B6",
    color2: "#b070cc",
    left: "74%",
    top: "24%",
    flutter: "3.3s",
    drift: "40s",
    delay: "6s",
  },
  {
    id: "green",
    color1: "#2ECC71",
    color2: "#45dd85",
    left: "86%",
    top: "44%",
    flutter: "2.5s",
    drift: "26s",
    delay: "10s",
  },
  {
    id: "red",
    color1: "#E74C3C",
    color2: "#f06050",
    left: "14%",
    top: "55%",
    flutter: "2.7s",
    drift: "32s",
    delay: "3s",
  },
  {
    id: "blue",
    color1: "#3498DB",
    color2: "#55aaee",
    left: "50%",
    top: "50%",
    flutter: "3.0s",
    drift: "38s",
    delay: "7s",
  },
];

export function DayButterflies() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes dayButterflyDrift {
          0%   { transform: translate(0,    0px)  rotate(0deg);  }
          25%  { transform: translate(35px, -18px) rotate(3deg);  }
          50%  { transform: translate(72px,  10px) rotate(-2deg); }
          75%  { transform: translate(42px,  -6px) rotate(2deg);  }
          100% { transform: translate(110px,  5px) rotate(-1deg); }
        }
        @keyframes dayWingL {
          0%   { transform: rotateY(0deg)  scaleY(1.0); }
          100% { transform: rotateY(65deg) scaleY(0.8); }
        }
        @keyframes dayWingR {
          0%   { transform: rotateY(0deg)   scaleY(1.0); }
          100% { transform: rotateY(-65deg) scaleY(0.8); }
        }
      `}</style>

      {BUTTERFLIES.map((b) => (
        <div
          key={b.id}
          style={{
            position: "absolute",
            left: b.left,
            top: b.top,
            animation: `dayButterflyDrift ${b.drift} ease-in-out infinite alternate`,
            animationDelay: b.delay,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Left wing */}
            <div
              style={{
                width: 18,
                height: 13,
                background: b.color1,
                borderRadius: "50% 0 50% 50%",
                opacity: 0.88,
                animation: `dayWingL ${b.flutter} ease-in-out infinite alternate`,
                transformOrigin: "right center",
              }}
            />
            {/* Body */}
            <div
              style={{
                width: 4,
                height: 16,
                background: "#2d1f10",
                borderRadius: 3,
                flexShrink: 0,
              }}
            />
            {/* Right wing */}
            <div
              style={{
                width: 18,
                height: 13,
                background: b.color2,
                borderRadius: "0 50% 50% 50%",
                opacity: 0.88,
                animation: `dayWingR ${b.flutter} ease-in-out infinite alternate`,
                transformOrigin: "left center",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
