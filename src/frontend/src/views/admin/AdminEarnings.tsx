import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import React from "react";
import { useAppsEvents, useCalculateAllEarnings } from "../../hooks/useQueries";

export default function AdminEarnings() {
  const { data: earnings, isLoading, error } = useCalculateAllEarnings();
  const { data: appEvents = [] } = useAppsEvents();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["allEarnings"] });
    queryClient.invalidateQueries({ queryKey: ["appsEvents"] });
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider gradient-heading">
          Earnings Summary
        </h3>
        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-rajdhani font-600 text-xs transition-all duration-300 hover-lift"
          style={{
            background: "oklch(0.70 0.20 185 / 0.12)",
            border: "1px solid oklch(0.70 0.20 185 / 0.25)",
            color: "oklch(0.78 0.22 188)",
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div
          className="text-center py-8 font-rajdhani text-sm"
          style={{ color: "oklch(0.50 0.04 260)" }}
        >
          Calculating earnings...
        </div>
      ) : error ? (
        <div
          className="rounded-xl px-4 py-3 text-sm font-rajdhani"
          style={{
            background: "oklch(0.55 0.22 25 / 0.12)",
            border: "1px solid oklch(0.55 0.22 25 / 0.3)",
            color: "oklch(0.65 0.22 25)",
          }}
        >
          Failed to load earnings data
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2
                  className="w-4 h-4"
                  style={{ color: "oklch(0.70 0.20 185)" }}
                />
                <span
                  className="text-xs font-rajdhani"
                  style={{ color: "oklch(0.55 0.04 260)" }}
                >
                  Apps with Prices
                </span>
              </div>
              <div className="font-orbitron font-bold text-2xl gradient-heading">
                {Number(earnings?.totalAppsWithPrices ?? 0)}
              </div>
            </div>
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Users
                  className="w-4 h-4"
                  style={{ color: "oklch(0.70 0.20 185)" }}
                />
                <span
                  className="text-xs font-rajdhani"
                  style={{ color: "oklch(0.55 0.04 260)" }}
                >
                  Total Entries
                </span>
              </div>
              <div className="font-orbitron font-bold text-2xl gradient-heading">
                {Number(earnings?.totalValidEntries ?? 0)}
              </div>
            </div>
            <div className="glass-card p-4 rounded-2xl col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign
                  className="w-4 h-4"
                  style={{ color: "oklch(0.82 0.20 70)" }}
                />
                <span
                  className="text-xs font-rajdhani"
                  style={{ color: "oklch(0.55 0.04 260)" }}
                >
                  Total Earnings
                </span>
              </div>
              <div className="font-orbitron font-bold text-3xl gold-text">
                ₹{(earnings?.totalEarnings ?? 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Per-App Breakdown */}
          {earnings && earnings.appEarnings.length > 0 && (
            <div className="glass-card p-5 rounded-2xl">
              <h4
                className="font-orbitron font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2"
                style={{ color: "oklch(0.78 0.22 188)" }}
              >
                <TrendingUp className="w-4 h-4" />
                Per-App Breakdown
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full glass-table text-sm">
                  <thead>
                    <tr>
                      <th className="text-left">App</th>
                      <th className="text-right">Entries</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.appEarnings.map((ae) => (
                      <tr key={ae.appName}>
                        <td
                          className="font-rajdhani font-600"
                          style={{ color: "oklch(0.85 0.05 80)" }}
                        >
                          {ae.appName}
                        </td>
                        <td
                          className="text-right font-rajdhani"
                          style={{ color: "oklch(0.60 0.04 260)" }}
                        >
                          {Number(ae.totalUsernamesFound)}
                        </td>
                        <td
                          className="text-right font-rajdhani"
                          style={{ color: "oklch(0.60 0.04 260)" }}
                        >
                          ₹{ae.pricePerEntry.toFixed(2)}
                        </td>
                        <td className="text-right font-orbitron font-bold gold-text">
                          ₹{ae.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        className="pt-2 font-orbitron font-bold text-xs uppercase"
                        style={{
                          color: "oklch(0.85 0.05 80)",
                          borderTop: "1px solid oklch(0.28 0.06 260 / 0.5)",
                        }}
                        colSpan={3}
                      >
                        Total
                      </td>
                      <td
                        className="pt-2 text-right font-orbitron font-bold gold-text"
                        style={{
                          borderTop: "1px solid oklch(0.28 0.06 260 / 0.5)",
                        }}
                      >
                        ₹{earnings.totalEarnings.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* All App Events Reference */}
          {appEvents.length > 0 && (
            <div className="glass-card p-5 rounded-2xl">
              <h4
                className="font-orbitron font-bold text-xs uppercase tracking-wider mb-3"
                style={{ color: "oklch(0.78 0.22 188)" }}
              >
                All App Events Reference
              </h4>
              <div className="space-y-1">
                {appEvents.map((ev) => (
                  <div
                    key={ev.name}
                    className="flex items-center justify-between text-xs py-1.5"
                    style={{
                      borderBottom: "1px solid oklch(0.18 0.04 260 / 0.5)",
                    }}
                  >
                    <span
                      className="font-rajdhani font-600"
                      style={{ color: "oklch(0.75 0.04 260)" }}
                    >
                      {ev.name}
                    </span>
                    <span
                      className="font-rajdhani"
                      style={{ color: "oklch(0.50 0.04 260)" }}
                    >
                      {ev.usernames.length} usernames
                    </span>
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
