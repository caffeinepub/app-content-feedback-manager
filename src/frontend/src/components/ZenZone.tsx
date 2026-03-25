import { useEffect, useRef, useState } from "react";

// ── Fluid Canvas Game ─────────────────────────────────────────────────────────

function FluidGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, down: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const N = 60;
    const dt = 0.016;
    const visc = 0.0002;
    const diff = 0.00008;

    // Simple velocity field
    let vx = new Float32Array((N + 2) * (N + 2));
    let vy = new Float32Array((N + 2) * (N + 2));
    let vx0 = new Float32Array((N + 2) * (N + 2));
    let vy0 = new Float32Array((N + 2) * (N + 2));
    let dens = new Float32Array((N + 2) * (N + 2));
    let dens0 = new Float32Array((N + 2) * (N + 2));

    const idx = (i: number, j: number) => i + (N + 2) * j;

    function setBnd(b: number, x: Float32Array) {
      for (let i = 1; i <= N; i++) {
        x[idx(0, i)] = b === 1 ? -x[idx(1, i)] : x[idx(1, i)];
        x[idx(N + 1, i)] = b === 1 ? -x[idx(N, i)] : x[idx(N, i)];
        x[idx(i, 0)] = b === 2 ? -x[idx(i, 1)] : x[idx(i, 1)];
        x[idx(i, N + 1)] = b === 2 ? -x[idx(i, N)] : x[idx(i, N)];
      }
      x[idx(0, 0)] = 0.5 * (x[idx(1, 0)] + x[idx(0, 1)]);
      x[idx(0, N + 1)] = 0.5 * (x[idx(1, N + 1)] + x[idx(0, N)]);
      x[idx(N + 1, 0)] = 0.5 * (x[idx(N, 0)] + x[idx(N + 1, 1)]);
      x[idx(N + 1, N + 1)] = 0.5 * (x[idx(N, N + 1)] + x[idx(N + 1, N)]);
    }

    function linSolve(
      b: number,
      x: Float32Array,
      x0: Float32Array,
      a: number,
      c: number,
    ) {
      for (let k = 0; k < 10; k++) {
        for (let j = 1; j <= N; j++) {
          for (let i = 1; i <= N; i++) {
            x[idx(i, j)] =
              (x0[idx(i, j)] +
                a *
                  (x[idx(i - 1, j)] +
                    x[idx(i + 1, j)] +
                    x[idx(i, j - 1)] +
                    x[idx(i, j + 1)])) /
              c;
          }
        }
        setBnd(b, x);
      }
    }

    function diffuseFn(
      b: number,
      x: Float32Array,
      x0: Float32Array,
      diffRate: number,
    ) {
      const a = dt * diffRate * N * N;
      linSolve(b, x, x0, a, 1 + 4 * a);
    }

    function advect(
      b: number,
      d: Float32Array,
      d0: Float32Array,
      u: Float32Array,
      v: Float32Array,
    ) {
      const dt0 = dt * N;
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          let x = i - dt0 * u[idx(i, j)];
          let y = j - dt0 * v[idx(i, j)];
          if (x < 0.5) x = 0.5;
          if (x > N + 0.5) x = N + 0.5;
          const i0 = Math.floor(x);
          const i1 = i0 + 1;
          if (y < 0.5) y = 0.5;
          if (y > N + 0.5) y = N + 0.5;
          const j0 = Math.floor(y);
          const j1 = j0 + 1;
          const s1 = x - i0;
          const s0 = 1 - s1;
          const t1 = y - j0;
          const t0 = 1 - t1;
          d[idx(i, j)] =
            s0 * (t0 * d0[idx(i0, j0)] + t1 * d0[idx(i0, j1)]) +
            s1 * (t0 * d0[idx(i1, j0)] + t1 * d0[idx(i1, j1)]);
        }
      }
      setBnd(b, d);
    }

    function project(
      u: Float32Array,
      v: Float32Array,
      p: Float32Array,
      div: Float32Array,
    ) {
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          div[idx(i, j)] =
            (-0.5 *
              (u[idx(i + 1, j)] -
                u[idx(i - 1, j)] +
                v[idx(i, j + 1)] -
                v[idx(i, j - 1)])) /
            N;
          p[idx(i, j)] = 0;
        }
      }
      setBnd(0, div);
      setBnd(0, p);
      linSolve(0, p, div, 1, 4);
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          u[idx(i, j)] -= 0.5 * N * (p[idx(i + 1, j)] - p[idx(i - 1, j)]);
          v[idx(i, j)] -= 0.5 * N * (p[idx(i, j + 1)] - p[idx(i, j - 1)]);
        }
      }
      setBnd(1, u);
      setBnd(2, v);
    }

    function velStep() {
      const a = dt * visc * N * N;
      linSolve(1, vx, vx0, a, 1 + 4 * a);
      linSolve(2, vy, vy0, a, 1 + 4 * a);
      const tmp1 = vx0;
      vx0 = vx;
      vx = tmp1;
      const tmp2 = vy0;
      vy0 = vy;
      vy = tmp2;
      advect(1, vx, vx0, vx0, vy0);
      advect(2, vy, vy0, vx0, vy0);
      project(vx, vy, vx0, vy0);
    }

    function densStep() {
      diffuseFn(0, dens0, dens, diff);
      const tmp = dens0;
      dens0 = dens;
      dens = tmp;
      advect(0, dens, dens0, vx, vy);
    }

    // Colors: navy/cyan/purple palette
    const COLORS = [
      [0, 255, 255],
      [120, 80, 255],
      [0, 180, 255],
      [200, 100, 255],
    ];
    let colorIdx = 0;

    function addDensity(xi: number, yi: number, amount: number) {
      const i = Math.floor((xi / W) * N) + 1;
      const j = Math.floor((yi / H) * N) + 1;
      if (i >= 1 && i <= N && j >= 1 && j <= N) {
        dens0[idx(i, j)] += amount;
      }
    }

    function addVelocity(xi: number, yi: number, dx: number, dy: number) {
      const i = Math.floor((xi / W) * N) + 1;
      const j = Math.floor((yi / H) * N) + 1;
      if (i >= 1 && i <= N && j >= 1 && j <= N) {
        vx0[idx(i, j)] += dx * 5;
        vy0[idx(i, j)] += dy * 5;
      }
    }

    function draw() {
      if (!ctx) return;
      const imgData = ctx.createImageData(W, H);
      const cellW = W / N;
      const cellH = H / N;
      const col = COLORS[colorIdx % COLORS.length];

      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          const d = Math.min(dens[idx(i, j)] * 255 * 3, 255);
          const px = Math.floor((i - 1) * cellW);
          const py = Math.floor((j - 1) * cellH);
          for (let dy2 = 0; dy2 < Math.ceil(cellH); dy2++) {
            for (let dx2 = 0; dx2 < Math.ceil(cellW); dx2++) {
              const px2 = px + dx2;
              const py2 = py + dy2;
              if (px2 < W && py2 < H) {
                const pidx = (py2 * W + px2) * 4;
                imgData.data[pidx] = col[0];
                imgData.data[pidx + 1] = col[1];
                imgData.data[pidx + 2] = col[2];
                imgData.data[pidx + 3] = Math.floor(d);
              }
            }
          }
        }
      }
      ctx.fillStyle = "#010b1a";
      ctx.fillRect(0, 0, W, H);
      ctx.putImageData(imgData, 0, 0);
    }

    let lastColor = 0;

    function loop() {
      const m = mouseRef.current;
      if (m.down) {
        const dx = m.x - m.prevX;
        const dy = m.y - m.prevY;
        addDensity(m.x, m.y, 80);
        addVelocity(m.x, m.y, dx, dy);
        if (Date.now() - lastColor > 300) {
          colorIdx++;
          lastColor = Date.now();
        }
      } else {
        // gentle ambient
        addDensity(W / 2, H / 2, 0.5);
        addVelocity(
          W / 2,
          H / 2,
          Math.sin(Date.now() / 1000) * 0.5,
          Math.cos(Date.now() / 800) * 0.5,
        );
      }
      m.prevX = m.x;
      m.prevY = m.y;

      velStep();
      densStep();
      draw();
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const src = "touches" in e ? e.touches[0] : e;
      return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      const pos = getPos(e);
      mouseRef.current = {
        ...mouseRef.current,
        x: pos.x,
        y: pos.y,
        prevX: pos.x,
        prevY: pos.y,
        down: true,
      };
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!mouseRef.current.down) return;
      const pos = getPos(e);
      mouseRef.current = { ...mouseRef.current, x: pos.x, y: pos.y };
    };
    const onUp = () => {
      mouseRef.current.down = false;
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: true });
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("touchend", onUp);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onUp);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <p
        style={{
          color: "oklch(0.70 0.20 185)",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: "0.85rem",
        }}
      >
        Click &amp; drag to swirl neon smoke 🌊
      </p>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        style={{
          borderRadius: "1rem",
          border: "1px solid oklch(0.70 0.20 185 / 0.3)",
          boxShadow: "0 0 24px oklch(0.70 0.20 185 / 0.2)",
          cursor: "crosshair",
          width: "100%",
          maxWidth: 400,
          touchAction: "none",
        }}
      />
    </div>
  );
}

// ── Mindful Match Game ────────────────────────────────────────────────────────

const COLORS_MATCH = [
  "oklch(0.70 0.20 185)", // cyan
  "oklch(0.72 0.20 300)", // purple
  "oklch(0.80 0.22 70)", // gold
  "oklch(0.65 0.22 25)", // red
  "oklch(0.72 0.20 145)", // green
];

function generatePattern(): boolean[] {
  return Array.from({ length: 9 }, () => Math.random() > 0.5);
}

function MindfulMatch() {
  const [target, setTarget] = useState<boolean[]>(generatePattern);
  const [current, setCurrent] = useState<boolean[]>(Array(9).fill(false));
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState(false);
  const [colorA, setColorA] = useState(0);
  const [colorB, setColorB] = useState(2);

  const toggle = (i: number) => {
    setCurrent((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  useEffect(() => {
    const matched = current.every((v, i) => v === target[i]);
    if (matched) {
      setFlash(true);
      setScore((s) => s + 1);
      setColorA((c) => (c + 1) % COLORS_MATCH.length);
      setColorB((c) => (c + 2) % COLORS_MATCH.length);
      setTimeout(() => {
        setTarget(generatePattern());
        setCurrent(Array(9).fill(false));
        setFlash(false);
      }, 800);
    }
  }, [current, target]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 300,
        }}
      >
        <span
          style={{
            color: "oklch(0.70 0.20 185)",
            fontWeight: 700,
            fontStyle: "italic",
            fontSize: "0.85rem",
          }}
        >
          MATCHES: {score}
        </span>
        <span
          style={{
            color: "oklch(0.60 0.04 260)",
            fontStyle: "italic",
            fontSize: "0.75rem",
          }}
        >
          MATCH THE PATTERN
        </span>
      </div>

      {/* Target pattern */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            color: "oklch(0.55 0.04 260)",
            fontStyle: "italic",
            fontSize: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          TARGET
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "6px",
            width: 130,
          }}
        >
          {target.map((on, i) => (
            <div
              key={`t-r${Math.floor(i / 3)}-c${i % 3}`}
              style={{
                width: 38,
                height: 38,
                borderRadius: "0.5rem",
                background: on ? COLORS_MATCH[colorA] : "oklch(0.15 0.03 260)",
                border: `1px solid ${on ? COLORS_MATCH[colorA] : "oklch(0.25 0.04 260)"}`,
                boxShadow: on ? `0 0 10px ${COLORS_MATCH[colorA]}` : "none",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Player grid */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            color: "oklch(0.55 0.04 260)",
            fontStyle: "italic",
            fontSize: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          YOUR GRID
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            width: 150,
            padding: "0.75rem",
            background: flash ? "oklch(0.70 0.20 145 / 0.1)" : "transparent",
            borderRadius: "0.75rem",
            border: flash
              ? "1px solid oklch(0.70 0.20 145 / 0.5)"
              : "1px solid transparent",
            transition: "all 0.3s ease",
          }}
        >
          {current.map((on, i) => (
            <button
              type="button"
              key={`p-r${Math.floor(i / 3)}-c${i % 3}`}
              onClick={() => toggle(i)}
              style={{
                width: 38,
                height: 38,
                borderRadius: "0.5rem",
                background: on ? COLORS_MATCH[colorB] : "oklch(0.12 0.03 260)",
                border: `1px solid ${on ? COLORS_MATCH[colorB] : "oklch(0.25 0.04 260)"}`,
                boxShadow: on ? `0 0 12px ${COLORS_MATCH[colorB]}` : "none",
                cursor: "pointer",
                transition: "all 0.25s ease",
                transform: on ? "scale(1.05)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Breathe Game ──────────────────────────────────────────────────────────────

type Phase = "inhale" | "hold" | "exhale";
const PHASES: { phase: Phase; duration: number; label: string }[] = [
  { phase: "inhale", duration: 4000, label: "INHALE" },
  { phase: "hold", duration: 2000, label: "HOLD" },
  { phase: "exhale", duration: 4000, label: "EXHALE" },
];

function BreatheGame() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    const phase = PHASES[phaseIdx];
    const start = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / phase.duration, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        const next = (phaseIdx + 1) % PHASES.length;
        setPhaseIdx(next);
        if (next === 0) setCycles((c) => c + 1);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phaseIdx]);

  const phase = PHASES[phaseIdx];
  // Scale: inhale grows from 0.4 to 1, hold stays at 1, exhale shrinks from 1 to 0.4
  let scale: number;
  if (phase.phase === "inhale") scale = 0.4 + 0.6 * progress;
  else if (phase.phase === "hold") scale = 1;
  else scale = 1 - 0.6 * progress;

  const glowInt = 0.3 + 0.7 * scale;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 280,
        }}
      >
        <span
          style={{
            color: "oklch(0.70 0.20 185)",
            fontWeight: 700,
            fontStyle: "italic",
            fontSize: "0.85rem",
          }}
        >
          CYCLES: {cycles}
        </span>
        <span
          style={{
            color: "oklch(0.60 0.04 260)",
            fontStyle: "italic",
            fontSize: "0.75rem",
          }}
        >
          BREATHE WITH THE CIRCLE
        </span>
      </div>

      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, oklch(0.15 0.15 185 / ${glowInt}) 0%, oklch(0.08 0.05 220 / 0.6) 100%)`,
          border: `2px solid oklch(0.70 0.22 185 / ${0.4 + 0.6 * glowInt})`,
          boxShadow: `0 0 ${30 + 60 * glowInt}px oklch(0.70 0.22 185 / ${0.3 + 0.4 * glowInt}), inset 0 0 ${20 + 40 * glowInt}px oklch(0.70 0.22 185 / ${0.1 + 0.2 * glowInt})`,
          transform: `scale(${scale})`,
          transition: "box-shadow 0.1s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "oklch(0.88 0.20 185)",
            fontSize: "1.1rem",
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "0.1em",
            textShadow: "0 0 12px oklch(0.70 0.22 185)",
          }}
        >
          {phase.label}
        </span>
      </div>

      {/* Progress bar for current phase */}
      <div
        style={{
          width: "100%",
          maxWidth: 220,
          height: 4,
          background: "oklch(0.15 0.04 260)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: "oklch(0.70 0.22 185)",
            boxShadow: "0 0 8px oklch(0.70 0.22 185)",
            transition: "width 0.1s linear",
            borderRadius: 4,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        {PHASES.map((p, i) => (
          <div
            key={p.phase}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              fontSize: "0.7rem",
              fontWeight: 700,
              fontStyle: "italic",
              background:
                phaseIdx === i
                  ? "oklch(0.70 0.22 185 / 0.2)"
                  : "oklch(0.12 0.03 260)",
              border: `1px solid ${phaseIdx === i ? "oklch(0.70 0.22 185 / 0.6)" : "oklch(0.22 0.04 260)"}`,
              color:
                phaseIdx === i
                  ? "oklch(0.88 0.20 185)"
                  : "oklch(0.45 0.04 260)",
              transition: "all 0.3s ease",
            }}
          >
            {p.label} {p.duration / 1000}s
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ZenZone Container ─────────────────────────────────────────────────────────

type ZenTab = "fluid" | "match" | "breathe";

export default function ZenZone() {
  const [tab, setTab] = useState<ZenTab>("fluid");

  const tabs: { id: ZenTab; label: string; color: string; glow: string }[] = [
    {
      id: "fluid",
      label: "🌊 FLUID",
      color: "oklch(0.70 0.20 185)",
      glow: "oklch(0.70 0.20 185 / 0.4)",
    },
    {
      id: "match",
      label: "✨ MINDFUL MATCH",
      color: "oklch(0.72 0.20 300)",
      glow: "oklch(0.72 0.20 300 / 0.4)",
    },
    {
      id: "breathe",
      label: "🌬️ BREATHE",
      color: "oklch(0.75 0.18 155)",
      glow: "oklch(0.75 0.18 155 / 0.4)",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        width: "100%",
      }}
    >
      {/* Sub-tab nav */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {tabs.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "999px",
              fontSize: "0.72rem",
              fontWeight: 900,
              fontStyle: "italic",
              letterSpacing: "0.05em",
              background:
                tab === t.id
                  ? `${t.color.replace(")", " / 0.18)")}`
                  : "oklch(0.10 0.03 260)",
              border: `1px solid ${tab === t.id ? t.color : "oklch(0.22 0.04 260)"}`,
              color: tab === t.id ? t.color : "oklch(0.50 0.04 260)",
              boxShadow: tab === t.id ? `0 0 12px ${t.glow}` : "none",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Game panel */}
      <div
        style={{
          background: "rgba(2,5,20,0.85)",
          border: "1px solid oklch(0.70 0.20 185 / 0.15)",
          borderRadius: "1.25rem",
          padding: "1.5rem",
          backdropFilter: "blur(20px)",
          minHeight: 480,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {tab === "fluid" && <FluidGame />}
        {tab === "match" && <MindfulMatch />}
        {tab === "breathe" && <BreatheGame />}
      </div>
    </div>
  );
}
