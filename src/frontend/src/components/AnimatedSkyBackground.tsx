import { useEffect, useRef } from "react";

interface Cloud {
  x: number;
  y: number;
  rx: number;
  ry: number;
  speed: number;
  alpha: number;
}

interface Particle {
  x: number;
  y: number;
  vy: number;
  alpha: number;
}

interface AuroraWave {
  phase: number;
  speed: number;
  amplitude: number;
  yBase: number;
  color: string;
}

export default function AnimatedSkyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    // Clouds
    const clouds: Cloud[] = Array.from({ length: 7 }, (_, i) => ({
      x: Math.random() * w,
      y: 40 + i * (h / 8) + Math.random() * 40,
      rx: 80 + Math.random() * 120,
      ry: 18 + Math.random() * 22,
      speed: 0.15 + Math.random() * 0.25,
      alpha: 0.04 + Math.random() * 0.07,
    }));

    // Particles drifting upward
    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vy: -(0.1 + Math.random() * 0.35),
      alpha: 0.2 + Math.random() * 0.5,
    }));

    // Aurora sine waves
    const auroras: AuroraWave[] = [
      {
        phase: 0,
        speed: 0.003,
        amplitude: 60,
        yBase: h * 0.3,
        color: "rgba(0,120,255,0.06)",
      },
      {
        phase: Math.PI,
        speed: 0.002,
        amplitude: 80,
        yBase: h * 0.55,
        color: "rgba(0,232,122,0.05)",
      },
      {
        phase: Math.PI * 0.7,
        speed: 0.0025,
        amplitude: 50,
        yBase: h * 0.75,
        color: "rgba(0,207,255,0.045)",
      },
    ];

    let rafId: number;

    function draw() {
      if (!ctx) return;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Base gradient
      const grad = ctx.createLinearGradient(0, h, w * 0.3, 0);
      grad.addColorStop(0, "#0a1628");
      grad.addColorStop(0.4, "#0f2040");
      grad.addColorStop(1, "#081a10");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Aurora waves
      for (const a of auroras) {
        a.phase += a.speed;
        ctx.beginPath();
        ctx.moveTo(0, a.yBase);
        for (let x = 0; x <= w; x += 4) {
          const y =
            a.yBase +
            Math.sin(x * 0.008 + a.phase) * a.amplitude +
            Math.sin(x * 0.003 - a.phase * 0.7) * (a.amplitude * 0.4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = a.color;
        ctx.fill();
      }

      // Clouds
      for (const c of clouds) {
        c.x += c.speed;
        if (c.x - c.rx > w) c.x = -c.rx;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150,210,255,${c.alpha})`;
        ctx.fill();
      }

      // Particles
      for (const p of particles) {
        p.y += p.vy;
        if (p.y < -2) {
          p.y = h + 2;
          p.x = Math.random() * w;
        }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = "#7dd3fc";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      for (const a of auroras) {
        a.yBase = a.yBase * (h / window.innerHeight || 1);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
