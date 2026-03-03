import React from 'react';
import { DollarSign, TrendingUp, Users, BarChart2 } from 'lucide-react';
import { useCalculateAllEarnings, useAppsEvents } from '../../hooks/useQueries';

export default function AdminEarnings() {
  const earnings = useCalculateAllEarnings();
  const { data: appEvents = [] } = useAppsEvents();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <DollarSign className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Earnings</h2>
          <p className="text-sm text-muted-foreground">Auto-calculated from app events and price list</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-card p-4 text-center">
          <p className="text-2xl font-bold">{earnings.totalAppsWithPrices}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Apps</p>
        </div>
        <div className="space-card p-4 text-center">
          <p className="text-2xl font-bold">{earnings.totalValidEntries}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Entries</p>
        </div>
        <div className="space-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">₹{earnings.totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Earnings</p>
        </div>
      </div>

      {/* Per-app breakdown */}
      {earnings.appEarnings.length > 0 && (
        <div className="space-card overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Per-App Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">App</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Entries</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Price</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.appEarnings.map((e) => (
                  <tr key={e.appName} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2 font-medium">{e.appName}</td>
                    <td className="px-4 py-2 text-right">{e.totalUsernamesFound}</td>
                    <td className="px-4 py-2 text-right">₹{e.pricePerEntry.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-semibold">₹{e.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          e.isActive
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {e.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-muted/30 font-semibold">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">{earnings.totalValidEntries}</td>
                  <td className="px-4 py-2 text-right">—</td>
                  <td className="px-4 py-2 text-right text-primary">₹{earnings.totalEarnings.toFixed(2)}</td>
                  <td className="px-4 py-2" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All app events reference */}
      {appEvents.length > 0 && (
        <div className="space-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">All App Events Reference</h3>
          </div>
          <div className="space-y-2">
            {appEvents.map((event) => (
              <div key={event.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm">
                <span className="font-medium">{event.name}</span>
                <span className="text-xs text-muted-foreground">{event.usernames.length} usernames</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {earnings.appEarnings.length === 0 && (
        <div className="space-card p-8 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No earnings data yet. Add app events and price entries to see calculations.</p>
        </div>
      )}
    </div>
  );
}
