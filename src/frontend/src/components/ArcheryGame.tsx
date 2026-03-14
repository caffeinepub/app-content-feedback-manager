import { useCallback, useEffect, useRef, useState } from "react";

const CANVAS_W = 560;
const CANVAS_H = 380;
const ROUND_DURATION = 60;
const HS_KEY = "archery_highscore";

interface Ring {
  radius: number;
  color: string;
  pts: number;
}

const RINGS: Ring[] = [
  { radius: 14, color: "#ff2a2a", pts: 100 },
  { radius: 30, color: "#ffffff", pts: 70 },
  { radius: 48, color: "#222", pts: 40 },
  { radius: 64, color: "#1a6fcc", pts: 20 },
  { radius: 80, color: "#e63030", pts: 10 },
];

interface ArrowFly {
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
  done: boolean;
}

interface ScorePop {
  x: number;
  y: number;
  pts: number;
  life: number;
}

interface HitFlash {
  x: number;
  y: number;
  ring: number;
  life: number;
}

function getHighScore(): number {
  try {
    return Number(localStorage.getItem(HS_KEY) || "0");
  } catch {
    return 0;
  }
}

function saveHighScore(s: number) {
  try {
    if (s > getHighScore()) localStorage.setItem(HS_KEY, String(s));
  } catch {
    /* ignore */
  }
}

export default function ArcheryGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [roundOver, setRoundOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [highScore, setHighScore] = useState(getHighScore);

  const gameRef = useRef({
    target: { x: CANVAS_W / 2, y: CANVAS_H / 2, vx: 1.4, vy: 0.9 },
    mouse: { x: CANVAS_W / 2, y: CANVAS_H / 2 },
    arrows: [] as ArrowFly[],
    scorePops: [] as ScorePop[],
    hitFlashes: [] as HitFlash[],
    score: 0,
    timeLeft: ROUND_DURATION,
    started: false,
    roundOver: false,
    speed: 1.4,
  });

  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    const g = gameRef.current;
    saveHighScore(g.score);
    setHighScore(getHighScore());
    setScore(g.score);
    setRoundOver(true);
    g.roundOver = true;
    g.started = false;
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.target = { x: CANVAS_W / 2, y: CANVAS_H / 2, vx: 1.4, vy: 0.9 };
    g.arrows = [];
    g.scorePops = [];
    g.hitFlashes = [];
    g.score = 0;
    g.timeLeft = ROUND_DURATION;
    g.started = true;
    g.roundOver = false;
    g.speed = 1.4;
    setScore(0);
    setTimeLeft(ROUND_DURATION);
    setStarted(true);
    setRoundOver(false);
    lastTickRef.current = performance.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      g.timeLeft -= 1;
      setTimeLeft(g.timeLeft);
      // Increase difficulty
      g.speed = 1.4 + (ROUND_DURATION - g.timeLeft) * 0.04;
      if (g.timeLeft <= 0) stopGame();
    }, 1000);
  }, [stopGame]);

  const shoot = useCallback((cx: number, cy: number) => {
    const g = gameRef.current;
    if (!g.started || g.roundOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const mx = (cx - rect.left) * scaleX;
    const my = (cy - rect.top) * scaleY;
    g.arrows.push({
      x: mx,
      y: my + 80,
      tx: mx,
      ty: my,
      progress: 0,
      done: false,
    });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      gameRef.current.mouse.x = (e.clientX - rect.left) * scaleX;
      gameRef.current.mouse.y = (e.clientY - rect.top) * scaleY;
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const t = e.touches[0];
      gameRef.current.mouse.x = (t.clientX - rect.left) * scaleX;
      gameRef.current.mouse.y = (t.clientY - rect.top) * scaleY;
    },
    [],
  );

  // Draw loop
  useEffect(() => {
    if (!started || roundOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function drawBullseye(x: number, y: number) {
      if (!ctx) return;
      for (let i = RINGS.length - 1; i >= 0; i--) {
        const r = RINGS[i];
        ctx.beginPath();
        ctx.arc(x, y, r.radius, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // X cross hairs
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - RINGS[RINGS.length - 1].radius, y);
      ctx.lineTo(x + RINGS[RINGS.length - 1].radius, y);
      ctx.moveTo(x, y - RINGS[RINGS.length - 1].radius);
      ctx.lineTo(x, y + RINGS[RINGS.length - 1].radius);
      ctx.stroke();
    }

    function draw(ts: number) {
      if (!ctx) return;
      const g = gameRef.current;
      if (!g.started) return;

      const dt = Math.min((ts - lastTickRef.current) / 16, 3);
      lastTickRef.current = ts;

      // Move target
      const t = g.target;
      t.x += t.vx * g.speed * dt;
      t.y += t.vy * g.speed * dt;
      const maxR = RINGS[RINGS.length - 1].radius;
      if (t.x - maxR < 0) {
        t.x = maxR;
        t.vx = Math.abs(t.vx);
      }
      if (t.x + maxR > CANVAS_W) {
        t.x = CANVAS_W - maxR;
        t.vx = -Math.abs(t.vx);
      }
      if (t.y - maxR < 40) {
        t.y = 40 + maxR;
        t.vy = Math.abs(t.vy);
      }
      if (t.y + maxR > CANVAS_H - 20) {
        t.y = CANVAS_H - 20 - maxR;
        t.vy = -Math.abs(t.vy);
      }

      // Move arrows and check hits
      for (const a of g.arrows) {
        if (a.done) continue;
        a.progress = Math.min(a.progress + 0.12 * dt, 1);
        a.x = a.x + (a.tx - a.x) * 0.12 * dt;
        a.y = a.y + (a.ty - a.y) * 0.12 * dt;
        if (a.progress >= 0.98) {
          a.done = true;
          // Check distance to target
          const dx = a.tx - t.x;
          const dy = a.ty - t.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let pts = 0;
          let ringIdx = -1;
          for (let i = 0; i < RINGS.length; i++) {
            if (dist <= RINGS[i].radius) {
              pts = RINGS[i].pts;
              ringIdx = i;
              break;
            }
          }
          if (pts > 0) {
            g.score += pts;
            setScore(g.score);
            g.scorePops.push({
              x: t.x + dx * 0.5,
              y: t.y + dy * 0.5 - 10,
              pts,
              life: 1,
            });
            g.hitFlashes.push({ x: t.x, y: t.y, ring: ringIdx, life: 1 });
            document.dispatchEvent(new CustomEvent("buttonclicked"));
          }
        }
      }
      g.arrows = g.arrows.filter((a) => !a.done || a.progress < 1);

      // Background
      const bg = ctx.createLinearGradient(0, CANVAS_H, 0, 0);
      bg.addColorStop(0, "#06111e");
      bg.addColorStop(0.5, "#0d2035");
      bg.addColorStop(1, "#091508");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid lines
      ctx.strokeStyle = "rgba(0,207,255,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_H);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
      }

      // Hit flashes
      for (const f of g.hitFlashes) {
        f.life -= 0.05 * dt;
        if (f.life <= 0) continue;
        const r = RINGS[f.ring];
        ctx.beginPath();
        ctx.arc(f.x, f.y, r.radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,100,${f.life * 0.8})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      g.hitFlashes = g.hitFlashes.filter((f) => f.life > 0);

      // Draw bullseye (target)
      drawBullseye(t.x, t.y);

      // Crosshair at mouse
      const mx = g.mouse.x;
      const my = g.mouse.y;
      ctx.strokeStyle = "rgba(0,232,122,0.75)";
      ctx.lineWidth = 1.5;
      const cs = 12;
      ctx.beginPath();
      ctx.moveTo(mx - cs, my);
      ctx.lineTo(mx + cs, my);
      ctx.moveTo(mx, my - cs);
      ctx.lineTo(mx, my + cs);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,232,122,0.5)";
      ctx.stroke();

      // Draw flying arrows (line)
      for (const a of g.arrows) {
        if (a.done) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.tx, a.ty);
        ctx.strokeStyle = "rgba(0,207,255,0.85)";
        ctx.lineWidth = 2;
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.arc(a.tx, a.ty, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#00cfff";
        ctx.fill();
      }

      // Score pops
      for (const sp of g.scorePops) {
        sp.y -= 0.7 * dt;
        sp.life -= 0.025 * dt;
        if (sp.life <= 0) continue;
        ctx.globalAlpha = sp.life;
        ctx.fillStyle =
          sp.pts >= 100 ? "#ffd700" : sp.pts >= 70 ? "#00e87a" : "#00cfff";
        ctx.font = `bold ${14 + sp.pts / 10}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`+${sp.pts}`, sp.x, sp.y);
        ctx.globalAlpha = 1;
      }
      g.scorePops = g.scorePops.filter((sp) => sp.life > 0);

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, roundOver]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* HUD */}
      {started && !roundOver && (
        <div className="flex items-center justify-between w-full px-1">
          <div
            style={{
              background: "rgba(0,15,30,0.7)",
              border: "1px solid rgba(0,207,255,0.3)",
              borderRadius: 8,
              padding: "4px 12px",
              fontFamily: "monospace",
              fontSize: 13,
              color: "#00cfff",
              fontWeight: 700,
            }}
          >
            ⏱ {timeLeft}s
          </div>
          <div
            style={{
              background: "rgba(0,15,30,0.7)",
              border: "1px solid rgba(0,232,122,0.3)",
              borderRadius: 8,
              padding: "4px 12px",
              fontFamily: "monospace",
              fontSize: 13,
              color: "#00e87a",
              fontWeight: 700,
            }}
          >
            🎯 {score} pts
          </div>
        </div>
      )}

      {/* Canvas */}
      <div style={{ position: "relative", width: "100%" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1px solid rgba(0,207,255,0.2)",
            cursor: started && !roundOver ? "none" : "default",
            display: "block",
          }}
          onClick={(e) => shoot(e.clientX, e.clientY)}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter")
              shoot(
                e.currentTarget.getBoundingClientRect().left + CANVAS_W / 2,
                e.currentTarget.getBoundingClientRect().top + CANVAS_H / 2,
              );
          }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchEnd={(e) => {
            const t = e.changedTouches[0];
            shoot(t.clientX, t.clientY);
          }}
        />

        {/* Overlay when not started or round over */}
        {(!started || roundOver) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              background: "rgba(6,17,30,0.82)",
              borderRadius: 12,
            }}
          >
            {roundOver && (
              <>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#00cfff",
                    textShadow: "0 0 18px rgba(0,207,255,0.7)",
                  }}
                >
                  Round Over! 🎯
                </div>
                <div
                  style={{ fontSize: 16, color: "#00e87a", fontWeight: 700 }}
                >
                  Score: {score} pts
                </div>
                <div style={{ fontSize: 13, color: "#7dd3fc" }}>
                  Best: {highScore} pts
                </div>
              </>
            )}
            {!roundOver && (
              <>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#00cfff",
                    textShadow: "0 0 18px rgba(0,207,255,0.6)",
                  }}
                >
                  Archery Challenge 🎯
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#7dd3fc",
                    textAlign: "center",
                    maxWidth: 260,
                  }}
                >
                  Click or tap the canvas to shoot. Hit the bullseye for max
                  points!
                </div>
                {highScore > 0 && (
                  <div style={{ fontSize: 12, color: "#00e87a" }}>
                    Best: {highScore} pts
                  </div>
                )}
              </>
            )}
            <button
              type="button"
              onClick={startGame}
              style={{
                marginTop: 4,
                padding: "10px 28px",
                background: "linear-gradient(135deg, #00cfff, #00e87a)",
                border: "none",
                borderRadius: 10,
                color: "#06111e",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 0 18px rgba(0,207,255,0.45)",
              }}
            >
              {roundOver ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>

      {/* Score ring legend */}
      <div
        className="flex items-center gap-3 flex-wrap justify-center"
        style={{ fontSize: 11, color: "#7dd3fc" }}
      >
        {RINGS.map((r) => (
          <span key={r.pts} className="flex items-center gap-1">
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: r.color,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            />
            {r.pts} pts
          </span>
        ))}
      </div>
    </div>
  );
}
