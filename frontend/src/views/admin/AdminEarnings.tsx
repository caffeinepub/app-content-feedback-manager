import React from 'react';
import { TrendingUp, RefreshCw, DollarSign } from 'lucide-react';
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

  const totalApps = earnings?.appEarnings.length ?? 0;
  const totalEntries = Number(earnings?.totalValidEntries ?? 0);
  const totalEarnings = earnings?.totalEarnings ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalApps}</p>
          <p className="text-xs text-muted-foreground mt-1">Apps with Prices</p>
        </div>
        <div className="space-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalEntries}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Entries</p>
        </div>
        <div className="space-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">₹{totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Earnings</p>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="space-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Earnings Breakdown
          </h3>
          <button
            onClick={handleRefresh}
            className="text-muted-foreground hover:text-primary p-1 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" /> Calculating...
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load earnings data</p>
        ) : !earnings || earnings.appEarnings.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No earnings data yet. Add price entries in the App Pricing tab and ensure app events have usernames.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 pr-3">App Name</th>
                  <th className="text-right py-2 pr-3">Usernames</th>
                  <th className="text-right py-2 pr-3">Price/Entry</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {earnings.appEarnings.map(entry => (
                  <tr key={entry.appName} className="border-b border-border/50 hover:bg-muted/10">
                    <td className="py-2 pr-3 font-medium text-foreground">{entry.appName}</td>
                    <td className="py-2 pr-3 text-right text-foreground">{Number(entry.totalUsernamesFound)}</td>
                    <td className="py-2 pr-3 text-right text-foreground">₹{entry.pricePerEntry.toFixed(2)}</td>
                    <td className="py-2 text-right font-semibold text-primary">₹{entry.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-semibold">
                  <td className="py-2 pr-3 text-foreground">Total</td>
                  <td className="py-2 pr-3 text-right text-foreground">{totalEntries}</td>
                  <td className="py-2 pr-3" />
                  <td className="py-2 text-right text-primary">₹{totalEarnings.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* All App Events Reference */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          All App Events
        </h3>
        {appEvents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No app events found.</p>
        ) : (
          <div className="space-y-2">
            {appEvents.map(app => (
              <div key={app.name} className="flex items-center justify-between bg-background/50 border border-border rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-foreground">{app.name}</span>
                <span className="text-xs text-muted-foreground">{app.usernames.length} usernames</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
