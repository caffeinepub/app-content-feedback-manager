import { ChevronDown, ChevronUp, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { useAppsEvents } from "../hooks/useQueries";

export default function LiveListView() {
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const { data: appsEvents = [], isLoading } = useAppsEvents();

  const toggleApp = (name: string) => {
    setExpandedApps((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalUsers = appsEvents.reduce((sum, a) => sum + a.usernames.length, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center pt-2">
        <h2
          className="text-3xl font-bold"
          style={{
            color: "#FF003C",
            textShadow: "0 0 20px rgba(255,0,60,0.4)",
            fontStyle: "italic",
          }}
        >
          LIVE
        </h2>
        <p className="text-sm mt-1" style={{ color: "#9fb3c8" }}>
          Real-time live user lists across all app events
        </p>
      </div>

      {/* Summary */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{
          background: "rgba(255,0,60,0.06)",
          border: "1px solid rgba(255,0,60,0.2)",
        }}
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" style={{ color: "#FF003C" }} />
          <span className="font-bold text-sm" style={{ color: "#fff" }}>
            Total Users
          </span>
        </div>
        <span
          className="font-bold text-lg"
          style={{
            color: "#FF003C",
            textShadow: "0 0 10px rgba(255,0,60,0.5)",
          }}
        >
          {totalUsers}
        </span>
      </div>

      {isLoading ? (
        <div
          className="flex items-center justify-center py-12 gap-2"
          style={{ color: "#555" }}
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading live data...</span>
        </div>
      ) : appsEvents.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          data-ocid="live.empty_state"
          style={{
            background: "rgba(15,15,20,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-sm" style={{ color: "#666" }}>
            No live events found. Admin needs to upload data.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appsEvents.map((app, idx) => {
            const expanded = expandedApps.has(app.name);
            return (
              <div
                key={app.name}
                data-ocid={`live.item.${idx + 1}`}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: "rgba(10,10,20,0.8)",
                  border: "1px solid rgba(255,0,60,0.12)",
                  boxShadow: expanded ? "0 0 20px rgba(255,0,60,0.08)" : "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleApp(app.name)}
                  data-ocid={`live.panel.${idx + 1}`}
                  className="w-full px-5 py-4 flex items-center justify-between transition-all duration-200"
                  style={{
                    background: expanded
                      ? "rgba(255,0,60,0.06)"
                      : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: "#FF003C",
                        boxShadow: "0 0 6px rgba(255,0,60,0.8)",
                        animation: "livePulse 2s infinite",
                      }}
                    />
                    <span
                      className="font-bold text-sm"
                      style={{ color: "#fff" }}
                    >
                      {app.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(255,0,60,0.12)",
                        border: "1px solid rgba(255,0,60,0.25)",
                        color: "#FF6680",
                      }}
                    >
                      {app.usernames.length} users
                    </span>
                  </div>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" style={{ color: "#666" }} />
                  ) : (
                    <ChevronDown
                      className="w-4 h-4"
                      style={{ color: "#666" }}
                    />
                  )}
                </button>

                {expanded && (
                  <div className="px-5 pb-5">
                    <div
                      className="h-px mb-4"
                      style={{ background: "rgba(255,0,60,0.1)" }}
                    />
                    {app.usernames.length === 0 ? (
                      <p
                        className="text-sm text-center py-4"
                        style={{ color: "#555" }}
                      >
                        No users in this list
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {app.usernames.map((username, i) => (
                          <div
                            key={username}
                            className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                            style={{
                              background: "rgba(255,0,60,0.06)",
                              border: "1px solid rgba(255,0,60,0.12)",
                              color: "#ccc",
                            }}
                          >
                            <span style={{ color: "#FF003C", opacity: 0.7 }}>
                              {i + 1}.
                            </span>
                            <span className="truncate">{username}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
