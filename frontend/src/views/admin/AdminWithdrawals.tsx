import { Loader2, RefreshCw, Wallet, User, DollarSign, Clock } from 'lucide-react';
import { useGetAllWithdrawalRequests } from '../../hooks/useQueries';
import type { WithdrawalRequest } from '../../backend';
import { WithdrawalStatus } from '../../backend';

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}

function StatusBadge({ status }: { status: WithdrawalRequest['status'] }) {
  if (status === WithdrawalStatus.pending) return <span className="badge-pending">PENDING</span>;
  if (status === WithdrawalStatus.completed) return <span className="badge-approved">APPROVED</span>;
  return <span className="badge-rejected">REJECTED</span>;
}

export default function AdminWithdrawals() {
  const { data: requests = [], isLoading, refetch, isFetching } = useGetAllWithdrawalRequests();

  const pending = requests.filter(r => r.status === WithdrawalStatus.pending);
  const completed = requests.filter(r => r.status === WithdrawalStatus.completed);
  const rejected = requests.filter(r => r.status === WithdrawalStatus.rejected);

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Header */}
      <div className="glass-card-gold p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-orbitron font-bold text-base gradient-heading">
              Withdrawal Requests
            </h2>
            <p className="text-xs font-rajdhani mt-0.5" style={{ color: 'oklch(0.55 0.04 260)' }}>
              User earnings withdrawal requests
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl transition-all duration-300 hover-lift"
            style={{
              background: 'oklch(0.70 0.20 185 / 0.15)',
              border: '1px solid oklch(0.70 0.20 185 / 0.3)',
              color: 'oklch(0.78 0.22 188)',
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending', count: pending.length, color: 'oklch(0.82 0.20 70)', bg: 'oklch(0.75 0.18 65 / 0.1)', border: 'oklch(0.75 0.18 65 / 0.25)' },
            { label: 'Approved', count: completed.length, color: 'oklch(0.72 0.20 145)', bg: 'oklch(0.65 0.18 145 / 0.1)', border: 'oklch(0.65 0.18 145 / 0.25)' },
            { label: 'Rejected', count: rejected.length, color: 'oklch(0.65 0.22 25)', bg: 'oklch(0.55 0.22 25 / 0.1)', border: 'oklch(0.55 0.22 25 / 0.25)' },
          ].map(({ label, count, color, bg, border }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div className="font-orbitron font-bold text-xl" style={{ color }}>{count}</div>
              <div className="text-xs font-rajdhani mt-0.5" style={{ color: 'oklch(0.55 0.04 260)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2" style={{ color: 'oklch(0.55 0.04 260)' }}>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-rajdhani">Loading requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-10 h-10 mx-auto mb-3" style={{ color: 'oklch(0.35 0.04 260)' }} />
            <p className="font-rajdhani text-sm" style={{ color: 'oklch(0.45 0.04 260)' }}>
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
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => (
                  <tr key={idx} className="animate-fadeInUp" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <td>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'oklch(0.70 0.20 185)' }} />
                        <span className="font-orbitron font-bold text-xs" style={{ color: 'oklch(0.85 0.05 80)' }}>
                          {req.username}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" style={{ color: 'oklch(0.82 0.20 70)' }} />
                        <span className="font-orbitron font-bold text-sm gold-text">
                          ₹{req.amount.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-orbitron text-xs" style={{ color: 'oklch(0.70 0.20 185)', letterSpacing: '0.05em' }}>
                        {req.walletNumber}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" style={{ color: 'oklch(0.45 0.04 260)' }} />
                        <span className="text-xs font-rajdhani" style={{ color: 'oklch(0.55 0.04 260)' }}>
                          {formatTimestamp(req.timestamp)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
