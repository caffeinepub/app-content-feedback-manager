import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Enemy extends Entity {
  id: number;
}

const CANVAS_W = 400;
const CANVAS_H = 400;
const PLAYER_SPEED = 3;
const BULLET_SPEED = 7;
const ENEMY_SPEED = 1.2;
const PLAYER_RADIUS = 14;
const BULLET_RADIUS = 5;
const ENEMY_RADIUS = 16;
const SPAWN_INTERVAL = 1800;

export function TopDownShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    player: {
      x: CANVAS_W / 2,
      y: CANVAS_H / 2,
      vx: 0,
      vy: 0,
      radius: PLAYER_RADIUS,
    },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    score: 0,
    time: 0,
    gameOver: false,
    started: false,
    keys: new Set<string>(),
    nextEnemyId: 0,
    lastSpawn: 0,
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  const spawnEnemy = useCallback(() => {
    const s = stateRef.current;
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (side === 0) {
      x = Math.random() * CANVAS_W;
      y = -ENEMY_RADIUS;
    } else if (side === 1) {
      x = CANVAS_W + ENEMY_RADIUS;
      y = Math.random() * CANVAS_H;
    } else if (side === 2) {
      x = Math.random() * CANVAS_W;
      y = CANVAS_H + ENEMY_RADIUS;
    } else {
      x = -ENEMY_RADIUS;
      y = Math.random() * CANVAS_H;
    }
    s.enemies.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: ENEMY_RADIUS,
      id: s.nextEnemyId++,
    });
  }, []);

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    s.player = {
      x: CANVAS_W / 2,
      y: CANVAS_H / 2,
      vx: 0,
      vy: 0,
      radius: PLAYER_RADIUS,
    };
    s.bullets = [];
    s.enemies = [];
    s.score = 0;
    s.time = 0;
    s.gameOver = false;
    s.started = true;
    s.keys = new Set();
    s.nextEnemyId = 0;
    s.lastSpawn = 0;
    lastTimeRef.current = 0;
    spawnTimerRef.current = 0;
    setDisplayScore(0);
    setDisplayTime(0);
    setGameOver(false);
    setStarted(true);
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const s = stateRef.current;
      if (!s.started || s.gameOver) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const dx = mx - s.player.x;
      const dy = my - s.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      s.bullets.push({
        x: s.player.x,
        y: s.player.y,
        vx: (dx / dist) * BULLET_SPEED,
        vy: (dy / dist) * BULLET_SPEED,
        radius: BULLET_RADIUS,
      });
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "a",
          "s",
          "d",
          "W",
          "A",
          "S",
          "D",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }
      stateRef.current.keys.add(e.key.toLowerCase());
    };
    const offKey = (e: KeyboardEvent) => {
      stateRef.current.keys.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", offKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", offKey);
    };
  }, []);

  useEffect(() => {
    if (!started || gameOver) return;

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 16.67, 3);
      lastTimeRef.current = timestamp;

      const s = stateRef.current;
      if (s.gameOver) return;

      // Update time
      s.time += dt / 60;
      spawnTimerRef.current += dt * 16.67;

      // Spawn enemies
      if (spawnTimerRef.current >= SPAWN_INTERVAL) {
        spawnEnemy();
        spawnTimerRef.current = 0;
      }

      // Player movement
      const keys = s.keys;
      let pvx = 0;
      let pvy = 0;
      if (keys.has("arrowleft") || keys.has("a")) pvx -= PLAYER_SPEED;
      if (keys.has("arrowright") || keys.has("d")) pvx += PLAYER_SPEED;
      if (keys.has("arrowup") || keys.has("w")) pvy -= PLAYER_SPEED;
      if (keys.has("arrowdown") || keys.has("s")) pvy += PLAYER_SPEED;
      if (pvx !== 0 && pvy !== 0) {
        pvx *= Math.SQRT1_2;
        pvy *= Math.SQRT1_2;
      }
      s.player.x = Math.max(
        PLAYER_RADIUS,
        Math.min(CANVAS_W - PLAYER_RADIUS, s.player.x + pvx * dt),
      );
      s.player.y = Math.max(
        PLAYER_RADIUS,
        Math.min(CANVAS_H - PLAYER_RADIUS, s.player.y + pvy * dt),
      );

      // Update bullets
      s.bullets = s.bullets.filter((b) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        return (
          b.x > -20 && b.x < CANVAS_W + 20 && b.y > -20 && b.y < CANVAS_H + 20
        );
      });

      // Update enemies
      for (const e of s.enemies) {
        const dx = s.player.x - e.x;
        const dy = s.player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          e.x += (dx / dist) * ENEMY_SPEED * dt;
          e.y += (dy / dist) * ENEMY_SPEED * dt;
        }
      }

      // Bullet-enemy collisions
      const toRemoveBullets = new Set<number>();
      const toRemoveEnemies = new Set<number>();
      s.bullets.forEach((b, bi) => {
        s.enemies.forEach((e, ei) => {
          const dx = b.x - e.x;
          const dy = b.y - e.y;
          if (Math.sqrt(dx * dx + dy * dy) < b.radius + e.radius) {
            toRemoveBullets.add(bi);
            toRemoveEnemies.add(ei);
            s.score++;
          }
        });
      });
      s.bullets = s.bullets.filter((_, i) => !toRemoveBullets.has(i));
      s.enemies = s.enemies.filter((_, i) => !toRemoveEnemies.has(i));

      // Player-enemy collision
      for (const e of s.enemies) {
        const dx = s.player.x - e.x;
        const dy = s.player.y - e.y;
        if (Math.sqrt(dx * dx + dy * dy) < s.player.radius + e.radius - 4) {
          s.gameOver = true;
          setGameOver(true);
          break;
        }
      }

      // Draw
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#0a1628";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid
      ctx.strokeStyle = "rgba(0,200,180,0.08)";
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

      // Bullets
      for (const b of s.bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#00e5c8";
        ctx.shadowColor = "#00e5c8";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Enemies
      for (const e of s.enemies) {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ff4444";
        ctx.shadowColor = "#ff4444";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        // X mark
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x - 6, e.y - 6);
        ctx.lineTo(e.x + 6, e.y + 6);
        ctx.moveTo(e.x + 6, e.y - 6);
        ctx.lineTo(e.x - 6, e.y + 6);
        ctx.stroke();
      }

      // Player
      ctx.beginPath();
      ctx.arc(s.player.x, s.player.y, s.player.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#00c8ff";
      ctx.shadowColor = "#00c8ff";
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      // Arrow indicator
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.player.x, s.player.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // HUD
      ctx.fillStyle = "rgba(0,200,180,0.9)";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.fillText(`Score: ${s.score}`, 10, 24);
      ctx.fillStyle = "rgba(200,200,255,0.9)";
      ctx.fillText(`Time: ${Math.floor(s.time)}s`, CANVAS_W - 90, 24);

      setDisplayScore(s.score);
      setDisplayTime(Math.floor(s.time));

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [started, gameOver, spawnEnemy]);

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-xl neon-text">
          Top-Down Shooter
        </h3>
        <div className="flex gap-4 text-sm">
          <span className="text-neon-teal font-semibold">
            Score: {displayScore}
          </span>
          <span className="text-muted-foreground">Time: {displayTime}s</span>
        </div>
      </div>

      {!started ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <p className="text-muted-foreground text-sm text-center">
            Use WASD or Arrow keys to move. Click to shoot.
            <br />
            Survive as long as you can!
          </p>
          <Button
            onClick={resetGame}
            className="gradient-btn text-white font-semibold px-8"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Game
          </Button>
        </div>
      ) : (
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                handleCanvasClick(
                  e as unknown as React.MouseEvent<HTMLCanvasElement>,
                );
            }}
            tabIndex={0}
            aria-label="Game canvas"
            className="w-full rounded-xl cursor-crosshair"
            style={{ maxHeight: "400px", objectFit: "contain" }}
          />
          {gameOver && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
              style={{ background: "rgba(10,22,40,0.85)" }}
            >
              <h3 className="text-3xl font-display font-bold text-destructive mb-2">
                Game Over!
              </h3>
              <p className="text-foreground mb-1">
                Score:{" "}
                <span className="neon-text font-bold">{displayScore}</span>
              </p>
              <p className="text-muted-foreground mb-6">
                Survived: {displayTime}s
              </p>
              <Button
                onClick={resetGame}
                className="gradient-btn text-white font-semibold"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
