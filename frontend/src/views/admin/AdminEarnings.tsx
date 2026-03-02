import React from 'react';
import { TrendingUp, RefreshCw, DollarSign, Users, BarChart2 } from 'lucide-react';
import { useCalculateAllEarnings, useGetAppEvents } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminEarnings() {
  const { data: earnings, isLoading, error } = useCalculateAllEarnings();
  const { data: appEvents = [] } = useGetAppEvents();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['earnings'] });
    queryClient.invalidateQueries({ queryKey: ['appEvents'] });
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Earnings Summary</h3>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground text-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm text-center py-8">Calculating earnings...</div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm">
          Failed to load earnings data
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-card p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Apps with Prices</span>
              </div>
              <div className="text-2xl font-bold gradient-heading">
                {Number(earnings?.totalAppsWithPrices ?? 0)}
              </div>
            </div>
            <div className="space-card p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Entries</span>
              </div>
              <div className="text-2xl font-bold gradient-heading">
                {Number(earnings?.totalValidEntries ?? 0)}
              </div>
            </div>
            <div className="space-card p-4 rounded-2xl col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Earnings</span>
              </div>
              <div className="text-3xl font-bold gradient-heading">
                ₹{(earnings?.totalEarnings ?? 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Per-App Breakdown */}
          {earnings && earnings.appEarnings.length > 0 && (
            <div className="space-card p-5 rounded-2xl">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Per-App Breakdown
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left text-xs text-muted-foreground pb-2 font-medium">App</th>
                      <th className="text-right text-xs text-muted-foreground pb-2 font-medium">Entries</th>
                      <th className="text-right text-xs text-muted-foreground pb-2 font-medium">Rate</th>
                      <th className="text-right text-xs text-muted-foreground pb-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {earnings.appEarnings.map(ae => (
                      <tr key={ae.appName}>
                        <td className="py-2 text-foreground font-medium">{ae.appName}</td>
                        <td className="py-2 text-right text-muted-foreground">{Number(ae.totalUsernamesFound)}</td>
                        <td className="py-2 text-right text-muted-foreground">₹{ae.pricePerEntry.toFixed(2)}</td>
                        <td className="py-2 text-right text-primary font-semibold">₹{ae.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border/50">
                      <td className="pt-2 font-semibold text-foreground" colSpan={3}>Total</td>
                      <td className="pt-2 text-right font-bold text-primary">₹{(earnings.totalEarnings).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* All App Events Reference */}
          {appEvents.length > 0 && (
            <div className="space-card p-5 rounded-2xl">
              <h4 className="font-semibold text-foreground mb-3 text-sm">All App Events Reference</h4>
              <div className="space-y-1">
                {appEvents.map(ev => (
                  <div key={ev.name} className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-foreground">{ev.name}</span>
                    <span className="text-muted-foreground">{ev.usernames.length} usernames</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
