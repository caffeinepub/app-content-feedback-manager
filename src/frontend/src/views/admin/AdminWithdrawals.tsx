import {
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  Settings2,
  Trash2,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { WithdrawalRequest } from "../../backend";
import { WithdrawalStatus } from "../../backend";
import WithdrawalManageModal from "../../components/WithdrawalManageModal";
import {
  useGetAllWithdrawalRequests,
  useUpdateWithdrawalStatus,
  useWipeCompletedWithdrawals,
} from "../../hooks/useQueries";

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}

function StatusBadge({ status }: { status: WithdrawalRequest["status"] }) {
  if (status === WithdrawalStatus.pending)
    return <span className="badge-pending">PENDING</span>;
  if (status === WithdrawalStatus.completed)
    return <span className="badge-approved">APPROVED</span>;
  return <span className="badge-rejected">REJECTED</span>;
}

export default function AdminWithdrawals() {
  const {
    data: requests = [],
    isLoading,
    refetch,
    isFetching,
  } = useGetAllWithdrawalRequests();
  const updateStatus = useUpdateWithdrawalStatus();
  const wipeMutation = useWipeCompletedWithdrawals();
  const [manageReq, setManageReq] = useState<WithdrawalRequest | null>(null);

  const handleApprove = (req: WithdrawalRequest) => {
    const key = `${req.username}-${req.timestamp.toString()}`;
    updateStatus.mutate({ key, status: WithdrawalStatus.completed });
  };

  const handleReject = (req: WithdrawalRequest) => {
    const key = `${req.username}-${req.timestamp.toString()}`;
    updateStatus.mutate({ key, status: WithdrawalStatus.rejected });
  };

  const handleWipe = () => {
    wipeMutation.mutate();
  };

  const pending = requests.filter((r) => r.status === WithdrawalStatus.pending);
  const completed = requests.filter(
    (r) => r.status === WithdrawalStatus.completed,
  );
  const rejected = requests.filter(
    (r) => r.status === WithdrawalStatus.rejected,
  );

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Header */}
      <div className="glass-card-gold p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-orbitron font-bold text-base gradient-heading">
              Withdrawal Requests
            </h2>
            <p
              className="text-xs font-rajdhani mt-0.5"
              style={{ color: "oklch(0.55 0.04 260)" }}
            >
              User earnings withdrawal requests
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="admin.withdrawals.wipe_archive.button"
              onClick={handleWipe}
              disabled={wipeMutation.isPending}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover-lift flex items-center gap-1.5"
              style={{
                background: "oklch(0.65 0.18 65 / 0.15)",
                border: "1px solid oklch(0.65 0.18 65 / 0.4)",
                color: "oklch(0.80 0.18 70)",
                boxShadow: "0 0 8px oklch(0.65 0.18 65 / 0.2)",
                fontStyle: "italic",
              }}
            >
              {wipeMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              WIPE ARCHIVE
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 rounded-xl transition-all duration-300 hover-lift"
              style={{
                background: "oklch(0.70 0.20 185 / 0.15)",
                border: "1px solid oklch(0.70 0.20 185 / 0.3)",
                color: "oklch(0.78 0.22 188)",
              }}
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Pending",
              count: pending.length,
              color: "oklch(0.82 0.20 70)",
              bg: "oklch(0.75 0.18 65 / 0.1)",
              border: "oklch(0.75 0.18 65 / 0.25)",
            },
            {
              label: "Approved",
              count: completed.length,
              color: "oklch(0.72 0.20 145)",
              bg: "oklch(0.65 0.18 145 / 0.1)",
              border: "oklch(0.65 0.18 145 / 0.25)",
            },
            {
              label: "Rejected",
              count: rejected.length,
              color: "oklch(0.65 0.22 25)",
              bg: "oklch(0.55 0.22 25 / 0.1)",
              border: "oklch(0.55 0.22 25 / 0.25)",
            },
          ].map(({ label, count, color, bg, border }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div
                className="font-orbitron font-bold text-xl"
                style={{ color }}
              >
                {count}
              </div>
              <div
                className="text-xs font-rajdhani mt-0.5"
                style={{ color: "oklch(0.55 0.04 260)" }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div
            className="flex items-center justify-center py-12 gap-2"
            style={{ color: "oklch(0.55 0.04 260)" }}
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-rajdhani">Loading requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Wallet
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "oklch(0.35 0.04 260)" }}
            />
            <p
              className="font-rajdhani text-sm"
              style={{ color: "oklch(0.45 0.04 260)" }}
            >
              No withdrawal requests yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full glass-table">
              <thead>
                <tr>
                  <th className="text-left">Username</th>
                  <th className="text-left">Amount</th>
                  <th className="text-left">Wallet No.</th>
                  <th className="text-left">Time</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => (
                  <tr
                    key={`${req.username}-${String(req.timestamp)}`}
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <User
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: "oklch(0.70 0.20 185)" }}
                        />
                        <span
                          className="font-orbitron font-bold text-xs"
                          style={{ color: "oklch(0.85 0.05 80)" }}
                        >
                          {req.username}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <DollarSign
                          className="w-3.5 h-3.5"
                          style={{ color: "oklch(0.82 0.20 70)" }}
                        />
                        <span className="font-orbitron font-bold text-sm gold-text">
                          ₹{req.amount.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="font-orbitron text-xs"
                        style={{
                          color: "oklch(0.70 0.20 185)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {req.walletNumber}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Clock
                          className="w-3.5 h-3.5"
                          style={{ color: "oklch(0.45 0.04 260)" }}
                        />
                        <span
                          className="text-xs font-rajdhani"
                          style={{ color: "oklch(0.55 0.04 260)" }}
                        >
                          {formatTimestamp(req.timestamp)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      <div className="flex gap-1.5 flex-wrap">
                        {/* MANAGE button — always visible */}
                        <button
                          type="button"
                          data-ocid="admin.withdrawals.open_modal_button"
                          onClick={() => setManageReq(req)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          style={{
                            background: "oklch(0.70 0.20 185 / 0.12)",
                            border: "1px solid oklch(0.70 0.20 185 / 0.35)",
                            color: "oklch(0.78 0.20 185)",
                            boxShadow: "0 0 6px oklch(0.70 0.20 185 / 0.15)",
                            fontStyle: "italic",
                          }}
                        >
                          <Settings2 className="w-3 h-3" />
                          MANAGE
                        </button>

                        {req.status === WithdrawalStatus.pending && (
                          <>
                            <button
                              type="button"
                              data-ocid="admin.withdrawals.approve_button"
                              onClick={() => handleApprove(req)}
                              disabled={updateStatus.isPending}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              style={{
                                background: "oklch(0.65 0.18 145 / 0.15)",
                                border: "1px solid oklch(0.65 0.18 145 / 0.4)",
                                color: "oklch(0.72 0.20 145)",
                                boxShadow: "0 0 6px oklch(0.65 0.18 145 / 0.2)",
                              }}
                            >
                              <CheckCircle className="w-3 h-3" />
                              APPROVE
                            </button>
                            <button
                              type="button"
                              data-ocid="admin.withdrawals.reject_button"
                              onClick={() => handleReject(req)}
                              disabled={updateStatus.isPending}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              style={{
                                background: "oklch(0.55 0.22 25 / 0.15)",
                                border: "1px solid oklch(0.55 0.22 25 / 0.4)",
                                color: "oklch(0.65 0.22 25)",
                                boxShadow: "0 0 6px oklch(0.55 0.22 25 / 0.2)",
                              }}
                            >
                              <XCircle className="w-3 h-3" />
                              REJECT
                            </button>
                          </>
                        )}
                        {req.status !== WithdrawalStatus.pending && (
                          <span
                            className="text-xs"
                            style={{
                              color: "oklch(0.40 0.04 260)",
                              fontStyle: "italic",
                            }}
                          >
                            Processed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manage Modal */}
      <WithdrawalManageModal
        request={manageReq}
        open={manageReq !== null}
        onClose={() => setManageReq(null)}
      />
    </div>
  );
}
