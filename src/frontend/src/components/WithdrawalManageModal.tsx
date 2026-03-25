import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ShieldAlert,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { WithdrawalRequest } from "../backend";
import { WithdrawalStatus } from "../backend";
import {
  useGetAllAppEvents,
  useUpdateWithdrawalStatus,
} from "../hooks/useQueries";

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}

interface Props {
  request: WithdrawalRequest | null;
  open: boolean;
  onClose: () => void;
}

export default function WithdrawalManageModal({
  request,
  open,
  onClose,
}: Props) {
  const [override, setOverride] = useState(false);
  const updateStatus = useUpdateWithdrawalStatus();
  const { data: appEvents = [] } = useGetAllAppEvents();

  if (!request) return null;

  // Find apps where this user appears in the usernames list
  const userApps = appEvents.filter((ev) =>
    ev.usernames.some(
      (u) => u.toLowerCase() === request.username.toLowerCase(),
    ),
  );
  const hasLinks = userApps.length > 0;
  const canApprove = hasLinks || override;

  const key = `${request.username}-${request.timestamp.toString()}`;

  const handleApprove = () => {
    updateStatus.mutate({ key, status: WithdrawalStatus.completed });
    onClose();
  };

  const handleReject = () => {
    updateStatus.mutate({ key, status: WithdrawalStatus.rejected });
    onClose();
  };

  const isPending = request.status === WithdrawalStatus.pending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        data-ocid="admin.withdrawals.manage.dialog"
        style={{
          background: "oklch(0.08 0.04 260)",
          border: "1px solid oklch(0.70 0.20 185 / 0.3)",
          boxShadow: "0 0 40px oklch(0.70 0.20 185 / 0.15)",
          borderRadius: "1.25rem",
          maxWidth: "min(92vw, 780px)",
          padding: "0",
          overflow: "hidden",
        }}
      >
        <DialogHeader
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid oklch(0.70 0.20 185 / 0.15)",
          }}
        >
          <DialogTitle
            style={{
              color: "oklch(0.88 0.20 185)",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: "1rem",
              letterSpacing: "0.08em",
              textShadow: "0 0 12px oklch(0.70 0.20 185 / 0.5)",
            }}
          >
            ⚡ MANAGE WITHDRAWAL REQUEST
          </DialogTitle>
        </DialogHeader>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1px",
            background: "oklch(0.70 0.20 185 / 0.10)",
          }}
          className="md-split"
        >
          {/* Left: Request details */}
          <div
            style={{
              background: "oklch(0.07 0.04 260)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h3
              style={{
                color: "oklch(0.65 0.04 260)",
                fontSize: "0.7rem",
                fontWeight: 900,
                fontStyle: "italic",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "0.25rem",
              }}
            >
              REQUEST DETAILS
            </h3>

            {/* Username */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <User
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "oklch(0.70 0.20 185)" }}
              />
              <div>
                <p
                  style={{
                    color: "oklch(0.50 0.04 260)",
                    fontSize: "0.65rem",
                    fontStyle: "italic",
                  }}
                >
                  ACTOR NAME
                </p>
                <p
                  style={{
                    color: "oklch(0.90 0.05 80)",
                    fontWeight: 900,
                    fontStyle: "italic",
                    fontSize: "0.95rem",
                  }}
                >
                  {request.username}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <DollarSign
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "oklch(0.82 0.20 70)" }}
              />
              <div>
                <p
                  style={{
                    color: "oklch(0.50 0.04 260)",
                    fontSize: "0.65rem",
                    fontStyle: "italic",
                  }}
                >
                  AMOUNT
                </p>
                <p
                  style={{
                    color: "oklch(0.82 0.22 70)",
                    fontWeight: 900,
                    fontStyle: "italic",
                    fontSize: "1.5rem",
                    textShadow: "0 0 10px oklch(0.82 0.22 70 / 0.5)",
                  }}
                >
                  ₹{request.amount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Wallet */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <Wallet
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "oklch(0.70 0.20 185)" }}
              />
              <div>
                <p
                  style={{
                    color: "oklch(0.50 0.04 260)",
                    fontSize: "0.65rem",
                    fontStyle: "italic",
                  }}
                >
                  WALLET / UPI
                </p>
                <p
                  style={{
                    color: "oklch(0.75 0.15 185)",
                    fontWeight: 700,
                    fontStyle: "italic",
                    fontSize: "0.85rem",
                    wordBreak: "break-all",
                  }}
                >
                  {request.walletNumber || "—"}
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <Clock
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "oklch(0.45 0.04 260)" }}
              />
              <div>
                <p
                  style={{
                    color: "oklch(0.50 0.04 260)",
                    fontSize: "0.65rem",
                    fontStyle: "italic",
                  }}
                >
                  SUBMITTED
                </p>
                <p
                  style={{
                    color: "oklch(0.60 0.04 260)",
                    fontStyle: "italic",
                    fontSize: "0.8rem",
                  }}
                >
                  {formatTimestamp(request.timestamp)}
                </p>
              </div>
            </div>

            {/* Status */}
            <div
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                alignSelf: "flex-start",
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: "0.72rem",
                ...(request.status === WithdrawalStatus.pending
                  ? {
                      background: "oklch(0.82 0.20 70 / 0.12)",
                      border: "1px solid oklch(0.82 0.20 70 / 0.4)",
                      color: "oklch(0.82 0.20 70)",
                    }
                  : request.status === WithdrawalStatus.completed
                    ? {
                        background: "oklch(0.72 0.20 145 / 0.12)",
                        border: "1px solid oklch(0.72 0.20 145 / 0.4)",
                        color: "oklch(0.72 0.20 145)",
                      }
                    : {
                        background: "oklch(0.65 0.22 25 / 0.12)",
                        border: "1px solid oklch(0.65 0.22 25 / 0.4)",
                        color: "oklch(0.65 0.22 25)",
                      }),
              }}
            >
              {request.status === WithdrawalStatus.pending
                ? "● PENDING"
                : request.status === WithdrawalStatus.completed
                  ? "● APPROVED"
                  : "● REJECTED"}
            </div>
          </div>

          {/* Right: Live list verification */}
          <div
            style={{
              background: "oklch(0.06 0.04 260)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h3
              style={{
                color: "oklch(0.65 0.04 260)",
                fontSize: "0.7rem",
                fontWeight: 900,
                fontStyle: "italic",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "0.25rem",
              }}
            >
              USER&apos;S LIVE ENTRIES
            </h3>

            {hasLinks ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <p
                  style={{
                    color: "oklch(0.72 0.20 145)",
                    fontSize: "0.75rem",
                    fontStyle: "italic",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {userApps.length} active app{userApps.length !== 1 ? "s" : ""}{" "}
                  found
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  {userApps.map((ev, i) => (
                    <div
                      key={ev.name}
                      data-ocid={`admin.withdrawals.manage.item.${i + 1}`}
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.6rem",
                        background: "oklch(0.72 0.20 145 / 0.08)",
                        border: "1px solid oklch(0.72 0.20 145 / 0.2)",
                        color: "oklch(0.80 0.15 145)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        fontStyle: "italic",
                      }}
                    >
                      {ev.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                data-ocid="admin.withdrawals.manage.error_state"
                style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "oklch(0.55 0.22 25 / 0.08)",
                  border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.6rem",
                }}
              >
                <AlertTriangle
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: "oklch(0.65 0.22 25)" }}
                />
                <div>
                  <p
                    style={{
                      color: "oklch(0.65 0.22 25)",
                      fontWeight: 900,
                      fontStyle: "italic",
                      fontSize: "0.82rem",
                    }}
                  >
                    ⚠️ NO ACTIVE LINKS FOUND
                  </p>
                  <p
                    style={{
                      color: "oklch(0.50 0.04 260)",
                      fontSize: "0.72rem",
                      fontStyle: "italic",
                      marginTop: "0.25rem",
                    }}
                  >
                    No live list entries match this username. Use Override to
                    approve manually.
                  </p>
                </div>
              </div>
            )}

            {/* Override toggle — always visible when no links */}
            {!hasLinks && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  background: override
                    ? "oklch(0.75 0.18 65 / 0.08)"
                    : "oklch(0.12 0.03 260)",
                  border: `1px solid ${override ? "oklch(0.75 0.18 65 / 0.4)" : "oklch(0.22 0.04 260)"}`,
                  transition: "all 0.25s ease",
                }}
              >
                <ShieldAlert
                  className="w-4 h-4 flex-shrink-0"
                  style={{
                    color: override
                      ? "oklch(0.82 0.18 70)"
                      : "oklch(0.45 0.04 260)",
                  }}
                />
                <Label
                  htmlFor="override-switch"
                  style={{
                    color: override
                      ? "oklch(0.82 0.18 70)"
                      : "oklch(0.55 0.04 260)",
                    fontWeight: 700,
                    fontStyle: "italic",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  Override Block
                </Label>
                <Switch
                  id="override-switch"
                  data-ocid="admin.withdrawals.manage.toggle"
                  checked={override}
                  onCheckedChange={setOverride}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action footer */}
        {isPending && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid oklch(0.70 0.20 185 / 0.15)",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            {!canApprove && !override && (
              <span
                style={{
                  color: "oklch(0.50 0.04 260)",
                  fontSize: "0.72rem",
                  fontStyle: "italic",
                  marginRight: "auto",
                }}
              >
                No active links found — toggle Override to approve manually
              </span>
            )}

            <button
              type="button"
              data-ocid="admin.withdrawals.manage.cancel_button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.6rem",
                background: "oklch(0.12 0.03 260)",
                border: "1px solid oklch(0.25 0.04 260)",
                color: "oklch(0.55 0.04 260)",
                fontWeight: 700,
                fontStyle: "italic",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              CANCEL
            </button>

            <button
              type="button"
              data-ocid="admin.withdrawals.manage.reject_button"
              onClick={handleReject}
              disabled={updateStatus.isPending}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.6rem",
                background: "oklch(0.55 0.22 25 / 0.15)",
                border: "1px solid oklch(0.55 0.22 25 / 0.5)",
                color: "oklch(0.65 0.22 25)",
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: "0.82rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 0 10px oklch(0.55 0.22 25 / 0.2)",
                transition: "all 0.2s ease",
              }}
            >
              <XCircle className="w-3.5 h-3.5" />
              REJECT
            </button>

            <button
              type="button"
              data-ocid="admin.withdrawals.manage.approve_button"
              onClick={handleApprove}
              disabled={!canApprove || updateStatus.isPending}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.6rem",
                background: canApprove
                  ? override && !hasLinks
                    ? "oklch(0.75 0.18 65 / 0.18)"
                    : "oklch(0.65 0.18 145 / 0.18)"
                  : "oklch(0.12 0.03 260)",
                border: `1px solid ${
                  canApprove
                    ? override && !hasLinks
                      ? "oklch(0.75 0.18 65 / 0.5)"
                      : "oklch(0.65 0.18 145 / 0.5)"
                    : "oklch(0.22 0.04 260)"
                }`,
                color: canApprove
                  ? override && !hasLinks
                    ? "oklch(0.82 0.18 70)"
                    : "oklch(0.72 0.20 145)"
                  : "oklch(0.35 0.04 260)",
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: "0.82rem",
                cursor: canApprove ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: canApprove
                  ? override && !hasLinks
                    ? "0 0 12px oklch(0.75 0.18 65 / 0.3)"
                    : "0 0 12px oklch(0.65 0.18 145 / 0.3)"
                  : "none",
                transition: "all 0.2s ease",
                opacity: canApprove ? 1 : 0.5,
              }}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {override && !hasLinks ? "APPROVE (OVERRIDE)" : "APPROVE"}
            </button>
          </div>
        )}

        {!isPending && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid oklch(0.70 0.20 185 / 0.15)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              data-ocid="admin.withdrawals.manage.close_button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1.5rem",
                borderRadius: "0.6rem",
                background: "oklch(0.70 0.20 185 / 0.12)",
                border: "1px solid oklch(0.70 0.20 185 / 0.35)",
                color: "oklch(0.78 0.20 185)",
                fontWeight: 700,
                fontStyle: "italic",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              CLOSE
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
