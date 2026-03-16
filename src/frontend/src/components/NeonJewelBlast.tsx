import { useCallback, useEffect, useRef, useState } from "react";

const GRID = 10;
const GEM_COLORS = [
  {
    id: 0,
    name: "cyan",
    bg: "#00e5ff",
    glow: "rgba(0,229,255,0.7)",
    border: "#00b8d4",
  },
  {
    id: 1,
    name: "magenta",
    bg: "#e040fb",
    glow: "rgba(224,64,251,0.7)",
    border: "#ab47bc",
  },
  {
    id: 2,
    name: "gold",
    bg: "#ffd600",
    glow: "rgba(255,214,0,0.7)",
    border: "#f9a825",
  },
  {
    id: 3,
    name: "red",
    bg: "#ff1744",
    glow: "rgba(255,23,68,0.7)",
    border: "#c62828",
  },
  {
    id: 4,
    name: "green",
    bg: "#00e676",
    glow: "rgba(0,230,118,0.7)",
    border: "#00c853",
  },
  {
    id: 5,
    name: "purple",
    bg: "#7c4dff",
    glow: "rgba(124,77,255,0.7)",
    border: "#651fff",
  },
];

type Cell = {
  color: number;
  id: number;
  blasting?: boolean;
  shaking?: boolean;
};

let cellIdCounter = 0;
function newCell(color?: number): Cell {
  return {
    color:
      color !== undefined
        ? color
        : Math.floor(Math.random() * GEM_COLORS.length),
    id: cellIdCounter++,
  };
}

function makeGrid(): Cell[][] {
  let grid: Cell[][];
  let attempts = 0;
  do {
    grid = Array.from({ length: GRID }, () =>
      Array.from({ length: GRID }, () => newCell()),
    );
    attempts++;
  } while (findMatches(grid).length > 0 && attempts < 20);
  return grid;
}

function findMatches(grid: Cell[][]): [number, number][] {
  const matched = new Set<string>();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID - 2; c++) {
      const col = grid[r][c].color;
      if (col === grid[r][c + 1].color && col === grid[r][c + 2].color) {
        matched.add(`${r},${c}`);
        matched.add(`${r},${c + 1}`);
        matched.add(`${r},${c + 2}`);
      }
    }
  }
  for (let c = 0; c < GRID; c++) {
    for (let r = 0; r < GRID - 2; r++) {
      const col = grid[r][c].color;
      if (col === grid[r + 1][c].color && col === grid[r + 2][c].color) {
        matched.add(`${r},${c}`);
        matched.add(`${r + 1},${c}`);
        matched.add(`${r + 2},${c}`);
      }
    }
  }
  return [...matched].map((s) => s.split(",").map(Number) as [number, number]);
}

function isAdjacent(r1: number, c1: number, r2: number, c2: number) {
  return (
    (Math.abs(r1 - r2) === 1 && c1 === c2) ||
    (r1 === r2 && Math.abs(c1 - c2) === 1)
  );
}

export default function NeonJewelBlast() {
  const [grid, setGrid] = useState<Cell[][]>(makeGrid);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(() =>
    Number.parseInt(localStorage.getItem("jewelScore") || "0"),
  );
  const [combo, setCombo] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [blastingCells, setBlastingCells] = useState<Set<string>>(new Set());
  const [shakingCells, setShakingCells] = useState<Set<string>>(new Set());
  const pendingGrid = useRef<Cell[][]>(grid);

  useEffect(() => {
    localStorage.setItem("jewelScore", score.toString());
  }, [score]);

  const processMatches = useCallback((g: Cell[][], comboCount: number) => {
    const matches = findMatches(g);
    if (matches.length === 0) {
      setAnimating(false);
      setCombo(0);
      return;
    }

    const blastSet = new Set(matches.map(([r, c]) => `${r},${c}`));
    setBlastingCells(blastSet);

    const pts = matches.length * 10 * Math.max(1, comboCount);
    setScore((prev) => {
      const next = prev + pts;
      localStorage.setItem("jewelScore", next.toString());
      return next;
    });
    setCombo(comboCount + 1);

    setTimeout(() => {
      setBlastingCells(new Set());
      const newGrid = g.map((row) => row.map((cell) => ({ ...cell })));
      const matchSet = new Set(matches.map(([r, c]) => `${r},${c}`));

      for (let c = 0; c < GRID; c++) {
        let writeRow = GRID - 1;
        for (let r = GRID - 1; r >= 0; r--) {
          if (!matchSet.has(`${r},${c}`)) {
            newGrid[writeRow][c] = newGrid[r][c];
            if (writeRow !== r) newGrid[r][c] = newCell();
            writeRow--;
          }
        }
        while (writeRow >= 0) {
          newGrid[writeRow][c] = newCell();
          writeRow--;
        }
      }

      pendingGrid.current = newGrid;
      setGrid(newGrid);
      setTimeout(() => processMatches(newGrid, comboCount + 1), 300);
    }, 400);
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (animating) return;

    if (!selected) {
      setSelected([r, c]);
      return;
    }

    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);
      return;
    }

    if (!isAdjacent(sr, sc, r, c)) {
      const shakeSet = new Set([`${sr},${sc}`, `${r},${c}`]);
      setShakingCells(shakeSet);
      setTimeout(() => setShakingCells(new Set()), 400);
      setSelected(null);
      return;
    }

    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const tmp = newGrid[sr][sc];
    newGrid[sr][sc] = newGrid[r][c];
    newGrid[r][c] = tmp;

    if (findMatches(newGrid).length === 0) {
      const shakeSet = new Set([`${sr},${sc}`, `${r},${c}`]);
      setShakingCells(shakeSet);
      setTimeout(() => setShakingCells(new Set()), 400);
      setSelected(null);
      return;
    }

    setSelected(null);
    setAnimating(true);
    pendingGrid.current = newGrid;
    setGrid(newGrid);
    setTimeout(() => processMatches(newGrid, 1), 50);
  };

  const resetGame = () => {
    setGrid(makeGrid());
    setScore(0);
    setCombo(0);
    setAnimating(false);
    setBlastingCells(new Set());
    setShakingCells(new Set());
    setSelected(null);
    localStorage.setItem("jewelScore", "0");
  };

  const gemSize = "clamp(28px, 8vw, 44px)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
            background: "linear-gradient(135deg, #FFD700, #FF6B00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          NEON JEWEL BLAST
        </h2>
        {combo > 1 && (
          <div
            style={{
              fontStyle: "italic",
              fontWeight: 900,
              color: "#FFD700",
              fontSize: "0.9rem",
              textShadow: "0 0 12px #FFD700",
              animation: "fadeInUp 0.3s ease-out",
            }}
          >
            COMBO x{combo}!
          </div>
        )}
      </div>

      <div
        data-ocid="jewel.score.panel"
        style={{
          display: "flex",
          gap: "1.5rem",
          background: "rgba(2,4,15,0.8)",
          border: "1px solid rgba(255,214,0,0.3)",
          borderRadius: "0.75rem",
          padding: "0.6rem 1.5rem",
          fontFamily: "'Geist Mono', monospace",
          boxShadow: "0 0 20px rgba(255,214,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "0.6rem",
              color: "rgba(255,214,0,0.6)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontStyle: "italic",
            }}
          >
            SCORE
          </div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 900,
              color: "#FFD700",
              textShadow: "0 0 10px rgba(255,214,0,0.7)",
            }}
          >
            {score.toString().padStart(6, "0")}
          </div>
        </div>
        <div style={{ width: 1, background: "rgba(255,214,0,0.2)" }} />
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "0.6rem",
              color: "rgba(255,214,0,0.6)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontStyle: "italic",
            }}
          >
            BEST
          </div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 900,
              color: "rgba(255,214,0,0.7)",
            }}
          >
            {score.toString().padStart(6, "0")}
          </div>
        </div>
      </div>

      <div
        data-ocid="jewel.grid.canvas_target"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID}, ${gemSize})`,
          gap: "3px",
          padding: "12px",
          background: "rgba(2,4,15,0.8)",
          borderRadius: "1rem",
          border: "1px solid rgba(255,214,0,0.2)",
          boxShadow:
            "0 0 40px rgba(255,214,0,0.08), inset 0 0 40px rgba(0,0,0,0.5)",
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isBlasting = blastingCells.has(key);
            const isShaking = shakingCells.has(key);
            const gem = GEM_COLORS[cell.color];

            return (
              <button
                key={cell.id}
                type="button"
                onClick={() => handleCellClick(r, c)}
                style={{
                  width: gemSize,
                  height: gemSize,
                  borderRadius: "6px",
                  background: `radial-gradient(circle at 35% 35%, ${gem.bg}cc, ${gem.border})`,
                  border: isSelected
                    ? "2px solid #fff"
                    : `1.5px solid ${gem.border}`,
                  boxShadow: isSelected
                    ? `0 0 20px ${gem.glow}, 0 0 40px ${gem.glow}, inset 0 0 10px rgba(255,255,255,0.3)`
                    : `0 0 8px ${gem.glow}88, inset 0 1px 3px rgba(255,255,255,0.4)`,
                  cursor: animating ? "default" : "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  transform: isBlasting
                    ? "scale(0)"
                    : isShaking
                      ? "translateX(4px)"
                      : isSelected
                        ? "scale(1.12)"
                        : "scale(1)",
                  opacity: isBlasting ? 0 : 1,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    left: 3,
                    width: "35%",
                    height: "35%",
                    background: "rgba(255,255,255,0.5)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                  }}
                />
              </button>
            );
          }),
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={resetGame}
          style={{
            background: "transparent",
            border: "2px solid rgba(255,214,0,0.5)",
            color: "#FFD700",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.5rem",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "0.85rem",
            letterSpacing: "0.05em",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background =
              "rgba(255,214,0,0.15)";
            (e.target as HTMLButtonElement).style.boxShadow =
              "0 0 16px rgba(255,214,0,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = "transparent";
            (e.target as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          NEW GAME
        </button>
        <div
          style={{
            fontSize: "0.75rem",
            color: "rgba(255,214,0,0.5)",
            fontStyle: "italic",
          }}
        >
          Click gem → click adjacent to swap
        </div>
      </div>
    </div>
  );
}
