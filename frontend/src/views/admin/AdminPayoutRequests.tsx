import React from 'react';
import { CheckCircle, Clock, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { useGetAllPayoutRequests, useApprovePayoutRequest } from '../../hooks/useQueries';
import { Variant_pending_approved } from '../../backend';
import { toast } from 'sonner';

function formatTimestamp(ts: bigint): string {
  // Backend stores nanoseconds (ICP Time.now())
  const ms = Number(ts) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleString();
}

export default function AdminPayoutRequests() {
  const { data: requests = [], isLoading, refetch } = useGetAllPayoutRequests();
  const approve = useApprovePayoutRequest();

  const handleApprove = async (username: string) => {
    try {
      await approve.mutateAsync(username);
      toast.success(`Approved payout for ${username}`);
    } catch {
      toast.error('Failed to approve payout request.');
    }
  };

  const pendingCount = requests.filter(r => r.status === Variant_pending_approved.pending).length;
  const approvedCount = requests.filter(r => r.status === Variant_pending_approved.approved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Payout Requests</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Auto-refreshes every 5 seconds</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground text-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-card p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
        </div>
        <div className="space-card p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Approved</span>
          </div>
          <div className="text-2xl font-bold gradient-heading">{approvedCount}</div>
        </div>
      </div>

      {/* Table */}
      <div className="space-card p-5 rounded-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No payout requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs text-muted-foreground pb-2 font-medium">Username</th>
                  <th className="text-right text-xs text-muted-foreground pb-2 font-medium">Amount</th>
                  <th className="text-right text-xs text-muted-foreground pb-2 font-medium">Phone</th>
                  <th className="text-right text-xs text-muted-foreground pb-2 font-medium">Time</th>
                  <th className="text-right text-xs text-muted-foreground pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {requests.map((req, idx) => {
                  const isPending = req.status === Variant_pending_approved.pending;
                  const isApprovingThis = approve.isPending && approve.variables === req.username;
                  return (
                    <tr key={`${req.username}-${idx}`} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 text-foreground font-medium">{req.username}</td>
                      <td className="py-2.5 text-right text-primary font-semibold">
                        ₹{Number(req.totalAmount).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground font-mono text-xs">
                        {req.walletPhone}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground text-xs">
                        {formatTimestamp(req.timestamp)}
                      </td>
                      <td className="py-2.5 text-right">
                        {isPending ? (
                          <button
                            onClick={() => handleApprove(req.username)}
                            disabled={approve.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {isApprovingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
