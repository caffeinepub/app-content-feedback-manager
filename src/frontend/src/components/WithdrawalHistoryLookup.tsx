import { Download } from "lucide-react";
import { useRef, useState } from "react";
import { WithdrawalStatus } from "../backend";
import { useGetMyWithdrawalRequests } from "../hooks/useQueries";

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString();
}

function StatusBadge({ status }: { status: WithdrawalStatus }) {
  if (status === WithdrawalStatus.pending) {
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-bold italic"
        style={{
          background: "rgba(255,215,0,0.12)",
          border: "1px solid rgba(255,215,0,0.4)",
          color: "#FFD700",
          boxShadow: "0 0 6px rgba(255,215,0,0.3)",
        }}
      >
        PENDING
      </span>
    );
  }
  if (status === WithdrawalStatus.completed) {
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-bold italic"
        style={{
          background: "rgba(80,200,120,0.12)",
          border: "1px solid rgba(80,200,120,0.4)",
          color: "#50C878",
          boxShadow: "0 0 6px rgba(80,200,120,0.3)",
        }}
      >
        APPROVED
      </span>
    );
  }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-bold italic"
      style={{
        background: "rgba(255,68,68,0.12)",
        border: "1px solid rgba(255,68,68,0.4)",
        color: "#ff4444",
        boxShadow: "0 0 6px rgba(255,68,68,0.3)",
      }}
    >
      REJECTED
    </span>
  );
}

export default function WithdrawalHistoryLookup() {
  const [nameInput, setNameInput] = useState(
    localStorage.getItem("actorName") ?? "",
  );
  const [searchName, setSearchName] = useState(
    localStorage.getItem("actorName") ?? "",
  );
  const receiptRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { data: requests = [], isFetching } =
    useGetMyWithdrawalRequests(searchName);

  const weekStart = getWeekStart();
  const weeklyEarnings = requests
    .filter((r) => {
      if (r.status !== WithdrawalStatus.completed) return false;
      const ms = Number(r.timestamp) / 1_000_000;
      return new Date(ms) >= weekStart;
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const downloadReceipt = async (
    reqKey: string,
    req: {
      username: string;
      timestamp: bigint;
      amount: number;
      walletNumber: string;
    },
  ) => {
    const el = receiptRefs.current.get(reqKey);
    if (!el) return;
    try {
      // Use canvas-based receipt generation (no html2canvas dependency needed)
      const canvas = document.createElement("canvas");
      canvas.width = 700;
      canvas.height = 380;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#010B13";
      ctx.fillRect(0, 0, 700, 380);

      // Border
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, 684, 364);

      // Title
      ctx.fillStyle = "#00FFFF";
      ctx.font = "bold italic 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("REVIEW EMPIRE — WITHDRAWAL RECEIPT", 350, 55);

      // Divider
      ctx.strokeStyle = "rgba(0,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 75);
      ctx.lineTo(660, 75);
      ctx.stroke();

      const fields: [string, string][] = [
        ["Actor Name", req.username],
        ["Date", formatTimestamp(req.timestamp)],
        ["Amount", `\u20B9${req.amount.toFixed(2)}`],
        ["Wallet / UPI", req.walletNumber],
        ["Status", "APPROVED"],
      ];

      ctx.textAlign = "left";
      fields.forEach(([label, value], i) => {
        const y = 115 + i * 50;
        ctx.fillStyle = "#888";
        ctx.font = "italic 14px monospace";
        ctx.fillText(label, 50, y);
        const isLast = i === fields.length - 1;
        ctx.fillStyle = isLast ? "#50C878" : "#ffffff";
        ctx.font = isLast
          ? "bold italic 18px monospace"
          : "italic 16px monospace";
        ctx.textAlign = "right";
        ctx.fillText(value, 650, y);
        ctx.textAlign = "left";
      });

      // Footer
      ctx.fillStyle = "rgba(0,255,255,0.4)";
      ctx.font = "italic 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME MASTER: NISHANT CHAUDHARY", 350, 350);

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${req.username}-${formatTimestamp(req.timestamp)}.png`;
      a.click();
    } catch (err) {
      console.error("Receipt generation failed", err);
    }
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(1,11,19,0.85)",
        border: "1px solid rgba(0,255,255,0.25)",
        boxShadow: "0 0 20px rgba(0,255,255,0.08)",
      }}
    >
      <h3
        className="font-orbitron font-bold italic text-sm uppercase tracking-wider mb-4"
        style={{ color: "#00FFFF", textShadow: "0 0 10px rgba(0,255,255,0.5)" }}
        data-ocid="withdrawal.history.panel"
      >
        🔍 WITHDRAWAL HISTORY
      </h3>

      {/* Search Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && setSearchName(nameInput.trim())
          }
          placeholder="Enter your name / Actor name..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-italic"
          style={{
            background: "rgba(0,255,255,0.05)",
            border: "1px solid rgba(0,255,255,0.2)",
            color: "#e0e0e0",
            outline: "none",
          }}
          data-ocid="withdrawal.history.search_input"
        />
        <button
          type="button"
          onClick={() => setSearchName(nameInput.trim())}
          data-ocid="withdrawal.history.primary_button"
          className="px-4 py-2.5 rounded-xl font-bold italic text-xs uppercase tracking-wider transition-all hover:scale-105"
          style={{
            background: "rgba(0,255,255,0.12)",
            border: "1px solid rgba(0,255,255,0.35)",
            color: "#00FFFF",
            boxShadow: "0 0 10px rgba(0,255,255,0.15)",
          }}
        >
          SEARCH HISTORY
        </button>
      </div>

      {/* Results */}
      {searchName && (
        <div className="space-y-3">
          {isFetching && requests.length === 0 && (
            <div
              className="text-center py-6 text-sm italic"
              style={{ color: "#555" }}
              data-ocid="withdrawal.history.loading_state"
            >
              Searching...
            </div>
          )}

          {!isFetching && requests.length === 0 && (
            <div
              className="text-center py-6 text-sm italic"
              style={{ color: "#555" }}
              data-ocid="withdrawal.history.empty_state"
            >
              No records found for this name.
            </div>
          )}

          {requests.length > 0 && (
            <>
              {/* History Table */}
              <div className="overflow-x-auto rounded-xl">
                <table
                  className="w-full text-xs"
                  data-ocid="withdrawal.history.table"
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(0,255,255,0.15)",
                        color: "#666",
                      }}
                    >
                      <th className="text-left py-2 px-3 font-bold italic uppercase">
                        Date
                      </th>
                      <th className="text-right py-2 px-3 font-bold italic uppercase">
                        Amount
                      </th>
                      <th className="text-right py-2 px-3 font-bold italic uppercase">
                        Wallet
                      </th>
                      <th className="text-right py-2 px-3 font-bold italic uppercase">
                        Status
                      </th>
                      <th className="text-right py-2 px-3 font-bold italic uppercase">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req, idx) => {
                      const reqKey = `${req.username}-${req.timestamp.toString()}`;
                      return (
                        <tr
                          key={reqKey}
                          data-ocid={`withdrawal.history.row.${idx + 1}`}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <td className="py-2.5 px-3" style={{ color: "#bbb" }}>
                            {formatTimestamp(req.timestamp)}
                          </td>
                          <td
                            className="py-2.5 px-3 text-right font-bold"
                            style={{ color: "#FFD700" }}
                          >
                            ₹{req.amount.toFixed(2)}
                          </td>
                          <td
                            className="py-2.5 px-3 text-right"
                            style={{
                              color: "#888",
                              maxWidth: "120px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {req.walletNumber}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {req.status === WithdrawalStatus.completed && (
                              <button
                                type="button"
                                data-ocid={`withdrawal.history.download_button.${idx + 1}`}
                                onClick={() => downloadReceipt(reqKey, req)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold italic transition-all hover:scale-105"
                                style={{
                                  background: "rgba(80,200,120,0.12)",
                                  border: "1px solid rgba(80,200,120,0.35)",
                                  color: "#50C878",
                                }}
                              >
                                <Download className="w-3 h-3" />
                                RECEIPT
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Weekly Earnings Card */}
              <div
                className="mt-4 rounded-xl p-4"
                style={{
                  background: "rgba(80,200,120,0.06)",
                  border: "1px solid rgba(80,200,120,0.2)",
                }}
                data-ocid="withdrawal.history.card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs italic" style={{ color: "#666" }}>
                      This Week's Approved Earnings
                    </p>
                    <p className="text-xs" style={{ color: "#555" }}>
                      (Mon – today)
                    </p>
                  </div>
                  <p
                    className="font-bold text-2xl"
                    style={{ color: weeklyEarnings > 0 ? "#50C878" : "#555" }}
                  >
                    ₹{weeklyEarnings.toFixed(2)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
