import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import WithdrawalModal from "../components/WithdrawalModal";
import {
  useAppsEvents,
  useCalculateAllEarnings,
  usePriceList,
} from "../hooks/useQueries";

type CheckMode = "single" | "bulk";

interface SingleCheckResult {
  appName: string;
  found: boolean;
  position?: number;
  price?: number;
}

interface EarningsResult {
  username: string;
  totalEarnings: number;
}

export default function UsernameCheckerView() {
  const [mode, setMode] = useState<CheckMode>("single");
  const [singleUsername, setSingleUsername] = useState("");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [singleResults, setSingleResults] = useState<
    SingleCheckResult[] | null
  >(null);
  const [bulkUsernames, setBulkUsernames] = useState("");
  const [bulkResults, setBulkResults] = useState<
    { username: string; apps: SingleCheckResult[] }[] | null
  >(null);
  const [appFilterExpanded, setAppFilterExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [withdrawalModal, setWithdrawalModal] = useState<EarningsResult | null>(
    null,
  );

  const { data: appsEvents = [], isLoading: appsLoading } = useAppsEvents();
  const { data: priceList = [] } = usePriceList();
  const { data: allEarnings } = useCalculateAllEarnings();
  void allEarnings;

  const getPriceForApp = useCallback(
    (appName: string) => {
      const entry = priceList.find((p) => p.appName === appName && p.isActive);
      return entry?.pricePerEntry ?? null;
    },
    [priceList],
  );

  const checkSingleUsername = () => {
    if (!singleUsername.trim()) return;
    setIsChecking(true);
    const appsToCheck =
      selectedApps.length > 0 ? selectedApps : appsEvents.map((a) => a.name);
    const results: SingleCheckResult[] = appsToCheck.map((appName) => {
      const app = appsEvents.find((a) => a.name === appName);
      if (!app) return { appName, found: false };
      const idx = app.usernames.findIndex(
        (u) => u.toLowerCase() === singleUsername.trim().toLowerCase(),
      );
      const price = getPriceForApp(appName);
      return {
        appName,
        found: idx !== -1,
        position: idx !== -1 ? idx + 1 : undefined,
        price: price ?? undefined,
      };
    });
    setSingleResults(results);
    setIsChecking(false);

    const foundInAny = results.some((r) => r.found);
    if (foundInAny) {
      let totalEarnings = 0;
      for (const r of results) {
        if (r.found && r.price) totalEarnings += r.price;
      }
      if (totalEarnings > 0) {
        setWithdrawalModal({ username: singleUsername.trim(), totalEarnings });
      }
    }
  };

  const checkBulkUsernames = () => {
    const usernames = bulkUsernames
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (usernames.length === 0) return;
    setIsChecking(true);
    const appsToCheck =
      selectedApps.length > 0 ? selectedApps : appsEvents.map((a) => a.name);
    const results = usernames.map((username) => ({
      username,
      apps: appsToCheck.map((appName) => {
        const app = appsEvents.find((a) => a.name === appName);
        if (!app) return { appName, found: false };
        const idx = app.usernames.findIndex(
          (u) => u.toLowerCase() === username.toLowerCase(),
        );
        const price = getPriceForApp(appName);
        return {
          appName,
          found: idx !== -1,
          position: idx !== -1 ? idx + 1 : undefined,
          price: price ?? undefined,
        };
      }),
    }));
    setBulkResults(results);
    setIsChecking(false);
  };

  const foundCount = singleResults?.filter((r) => r.found).length ?? 0;
  const totalEarningsForUser = singleResults
    ? singleResults
        .filter((r) => r.found && r.price)
        .reduce((s, r) => s + (r.price ?? 0), 0)
    : 0;

  const toggleSelectAll = () => {
    if (selectedApps.length === appsEvents.length) setSelectedApps([]);
    else setSelectedApps(appsEvents.map((a) => a.name));
  };

  const toggleApp = (name: string) => {
    setSelectedApps((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  };

  const checkerBg = "rgba(10,10,20,0.8)";
  const checkerBorder = "1px solid rgba(123,47,190,0.2)";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center pt-2">
        <h2
          className="text-3xl font-bold"
          style={{
            color: "#A855F7",
            textShadow: "0 0 20px rgba(168,85,247,0.4)",
            fontStyle: "italic",
          }}
        >
          CHECKER
        </h2>
        <p className="text-sm mt-1" style={{ color: "#9fb3c8" }}>
          Check usernames against live app lists
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="flex gap-2 p-1 rounded-xl"
        style={{
          background: "rgba(15,15,25,0.8)",
          border: "1px solid rgba(123,47,190,0.15)",
        }}
      >
        {(["single", "bulk"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            data-ocid={`checker.${m}.tab`}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
            style={{
              background: mode === m ? "rgba(123,47,190,0.25)" : "transparent",
              color: mode === m ? "#C084FC" : "#666",
              border:
                mode === m
                  ? "1px solid rgba(168,85,247,0.35)"
                  : "1px solid transparent",
              boxShadow: mode === m ? "0 0 12px rgba(168,85,247,0.2)" : "none",
              fontStyle: "italic",
            }}
          >
            {m === "single" ? "Single Check" : "Bulk Check"}
          </button>
        ))}
      </div>

      {/* App filter */}
      {appsEvents.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: checkerBg, border: checkerBorder }}
        >
          <button
            type="button"
            onClick={() => setAppFilterExpanded((p) => !p)}
            data-ocid="checker.toggle"
            className="w-full px-5 py-3.5 flex items-center justify-between transition-all"
          >
            <span
              className="text-sm font-bold"
              style={{ color: "#A855F7", fontStyle: "italic" }}
            >
              App Filter
            </span>
            <div className="flex items-center gap-2">
              {selectedApps.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(168,85,247,0.15)",
                    color: "#C084FC",
                    border: "1px solid rgba(168,85,247,0.3)",
                  }}
                >
                  {selectedApps.length} selected
                </span>
              )}
              {appFilterExpanded ? (
                <ChevronUp className="w-4 h-4" style={{ color: "#666" }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: "#666" }} />
              )}
            </div>
          </button>
          {appFilterExpanded && (
            <div className="px-5 pb-4">
              <div
                className="h-px mb-3"
                style={{ background: "rgba(123,47,190,0.15)" }}
              />
              <button
                type="button"
                onClick={toggleSelectAll}
                data-ocid="checker.secondary_button"
                className="text-xs mb-3 px-3 py-1.5 rounded-lg font-bold transition-all"
                style={{
                  background: "rgba(168,85,247,0.1)",
                  color: "#C084FC",
                  border: "1px solid rgba(168,85,247,0.25)",
                }}
              >
                {selectedApps.length === appsEvents.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <div className="flex flex-wrap gap-2">
                {appsEvents.map((app) => {
                  const isSelected = selectedApps.includes(app.name);
                  return (
                    <button
                      key={app.name}
                      type="button"
                      onClick={() => toggleApp(app.name)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: isSelected
                          ? "rgba(168,85,247,0.2)"
                          : "rgba(20,20,35,0.8)",
                        border: isSelected
                          ? "1px solid rgba(168,85,247,0.5)"
                          : "1px solid rgba(60,60,90,0.4)",
                        color: isSelected ? "#C084FC" : "#666",
                      }}
                    >
                      {app.name} ({app.usernames.length})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single check */}
      {mode === "single" && (
        <div
          className="rounded-2xl p-5"
          style={{ background: checkerBg, border: checkerBorder }}
        >
          <h3
            className="font-bold text-sm mb-4 flex items-center gap-2"
            style={{ color: "#A855F7", fontStyle: "italic" }}
          >
            <Search className="w-4 h-4" />
            Username Checker
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={singleUsername}
              onChange={(e) => setSingleUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkSingleUsername()}
              placeholder="Enter username to check..."
              data-ocid="checker.search_input"
              className="flex-1 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(15,15,25,0.9)",
                border: "1px solid rgba(123,47,190,0.3)",
                color: "#fff",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={checkSingleUsername}
              disabled={!singleUsername.trim() || isChecking || appsLoading}
              data-ocid="checker.primary_button"
              className="px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #7B2FBE, #A855F7)",
                color: "#fff",
                border: "none",
                opacity:
                  !singleUsername.trim() || isChecking || appsLoading ? 0.5 : 1,
                cursor:
                  !singleUsername.trim() || isChecking || appsLoading
                    ? "not-allowed"
                    : "pointer",
                boxShadow: "0 0 14px rgba(168,85,247,0.3)",
                fontStyle: "italic",
              }}
            >
              {isChecking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Check
            </button>
          </div>

          {singleResults && (
            <div className="mt-4 space-y-3">
              <div
                className="rounded-xl p-3 flex items-center justify-between"
                style={{
                  background:
                    foundCount > 0
                      ? "rgba(80,200,120,0.08)"
                      : "rgba(255,60,60,0.08)",
                  border: `1px solid ${foundCount > 0 ? "rgba(80,200,120,0.3)" : "rgba(255,60,60,0.3)"}`,
                }}
              >
                <div className="flex items-center gap-2">
                  {foundCount > 0 ? (
                    <CheckCircle
                      className="w-5 h-5"
                      style={{ color: "#50C878" }}
                    />
                  ) : (
                    <XCircle className="w-5 h-5" style={{ color: "#ff4444" }} />
                  )}
                  <span
                    className="font-bold text-sm"
                    style={{ color: foundCount > 0 ? "#50C878" : "#ff6666" }}
                  >
                    {foundCount > 0
                      ? `Found in ${foundCount} app${foundCount > 1 ? "s" : ""}`
                      : "Not found in any app"}
                  </span>
                </div>
                {totalEarningsForUser > 0 && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp
                      className="w-4 h-4"
                      style={{ color: "#FFD700" }}
                    />
                    <span
                      className="font-bold text-sm"
                      style={{ color: "#FFD700" }}
                    >
                      ₹{totalEarningsForUser.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {singleResults.map((result) => (
                  <div
                    key={result.appName}
                    className="rounded-xl px-4 py-3 flex items-center justify-between transition-all"
                    style={{
                      background: result.found
                        ? "rgba(80,200,120,0.06)"
                        : "rgba(20,20,35,0.5)",
                      border: `1px solid ${result.found ? "rgba(80,200,120,0.2)" : "rgba(60,60,90,0.3)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {result.found ? (
                        <CheckCircle
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "#50C878" }}
                        />
                      ) : (
                        <XCircle
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "#555" }}
                        />
                      )}
                      <span
                        className="text-sm"
                        style={{ color: result.found ? "#e0e0e0" : "#666" }}
                      >
                        {result.appName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {result.found && result.position && (
                        <span className="text-xs" style={{ color: "#666" }}>
                          #{result.position}
                        </span>
                      )}
                      {result.found && result.price && (
                        <span
                          className="text-xs font-bold"
                          style={{ color: "#FFD700" }}
                        >
                          ₹{result.price}
                        </span>
                      )}
                      {result.found && (
                        <button
                          type="button"
                          onClick={() =>
                            setWithdrawalModal({
                              username: singleUsername.trim(),
                              totalEarnings: totalEarningsForUser,
                            })
                          }
                          data-ocid="checker.secondary_button"
                          className="text-xs px-2.5 py-1 rounded-lg transition-all hover:scale-105"
                          style={{
                            background: "rgba(255,215,0,0.12)",
                            border: "1px solid rgba(255,215,0,0.3)",
                            color: "#FFD700",
                            cursor: "pointer",
                          }}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk check */}
      {mode === "bulk" && (
        <div
          className="rounded-2xl p-5"
          style={{ background: checkerBg, border: checkerBorder }}
        >
          <h3
            className="font-bold text-sm mb-4 flex items-center gap-2"
            style={{ color: "#A855F7", fontStyle: "italic" }}
          >
            <Users className="w-4 h-4" />
            Bulk Username Checker
          </h3>
          <textarea
            value={bulkUsernames}
            onChange={(e) => setBulkUsernames(e.target.value)}
            placeholder="Enter usernames (one per line)..."
            rows={6}
            data-ocid="checker.textarea"
            className="w-full px-4 py-3 rounded-xl text-sm resize-none mb-3"
            style={{
              background: "rgba(15,15,25,0.9)",
              border: "1px solid rgba(123,47,190,0.3)",
              color: "#fff",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={checkBulkUsernames}
            disabled={!bulkUsernames.trim() || isChecking || appsLoading}
            data-ocid="checker.primary_button"
            className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #7B2FBE, #A855F7)",
              color: "#fff",
              border: "none",
              opacity:
                !bulkUsernames.trim() || isChecking || appsLoading ? 0.5 : 1,
              cursor:
                !bulkUsernames.trim() || isChecking || appsLoading
                  ? "not-allowed"
                  : "pointer",
              boxShadow: "0 0 14px rgba(168,85,247,0.3)",
              fontStyle: "italic",
            }}
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Check All Usernames
          </button>

          {bulkResults && (
            <div className="mt-4 space-y-2">
              {bulkResults.map(({ username, apps }) => {
                const found = apps.filter((a) => a.found);
                const userEarnings = found.reduce(
                  (sum, a) => sum + (a.price ?? 0),
                  0,
                );
                return (
                  <div
                    key={username}
                    className="rounded-xl p-3"
                    style={{
                      background:
                        found.length > 0
                          ? "rgba(80,200,120,0.06)"
                          : "rgba(20,20,35,0.5)",
                      border: `1px solid ${found.length > 0 ? "rgba(80,200,120,0.2)" : "rgba(60,60,90,0.3)"}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="font-bold text-xs"
                        style={{ color: found.length > 0 ? "#e0e0e0" : "#666" }}
                      >
                        {username}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs"
                          style={{
                            color: found.length > 0 ? "#50C878" : "#555",
                          }}
                        >
                          {found.length > 0
                            ? `✓ ${found.length} app${
                                found.length > 1 ? "s" : ""
                              }`
                            : "✗ Not found"}
                        </span>
                        {userEarnings > 0 && (
                          <span
                            className="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              color: "#FFD700",
                              background: "rgba(255,215,0,0.1)",
                              border: "1px solid rgba(255,215,0,0.25)",
                            }}
                          >
                            <TrendingUp className="w-3 h-3" />₹
                            {userEarnings.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    {found.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {found.map((a) => (
                          <span
                            key={a.appName}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(168,85,247,0.12)",
                              border: "1px solid rgba(168,85,247,0.25)",
                              color: "#C084FC",
                            }}
                          >
                            {a.appName}
                            {a.price ? (
                              <span
                                className="ml-1 font-bold"
                                style={{ color: "#FFD700" }}
                              >
                                ₹{a.price}
                              </span>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Grand total summary */}
              {(() => {
                const grandTotal = bulkResults.reduce((sum, { apps }) => {
                  return (
                    sum +
                    apps
                      .filter((a) => a.found)
                      .reduce((s, a) => s + (a.price ?? 0), 0)
                  );
                }, 0);
                const usersFound = bulkResults.filter(({ apps }) =>
                  apps.some((a) => a.found),
                ).length;
                if (grandTotal <= 0) return null;
                return (
                  <div
                    className="rounded-xl p-4 mt-2"
                    style={{
                      background: "rgba(168,85,247,0.08)",
                      border: "1px solid rgba(168,85,247,0.3)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp
                        className="w-4 h-4"
                        style={{ color: "#FFD700" }}
                      />
                      <span
                        className="font-bold text-sm"
                        style={{ color: "#C084FC", fontStyle: "italic" }}
                      >
                        Bulk Check Summary
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        className="rounded-lg p-2 text-center"
                        style={{ background: "rgba(15,15,25,0.6)" }}
                      >
                        <p
                          className="text-xs"
                          style={{ color: "#666", fontStyle: "italic" }}
                        >
                          Total Checked
                        </p>
                        <p
                          className="font-bold text-sm mt-0.5"
                          style={{ color: "#e0e0e0" }}
                        >
                          {bulkResults.length}
                        </p>
                      </div>
                      <div
                        className="rounded-lg p-2 text-center"
                        style={{ background: "rgba(15,15,25,0.6)" }}
                      >
                        <p
                          className="text-xs"
                          style={{ color: "#666", fontStyle: "italic" }}
                        >
                          Users Found
                        </p>
                        <p
                          className="font-bold text-sm mt-0.5"
                          style={{ color: "#50C878" }}
                        >
                          {usersFound}
                        </p>
                      </div>
                      <div
                        className="rounded-lg p-2 text-center"
                        style={{
                          background: "rgba(255,215,0,0.08)",
                          border: "1px solid rgba(255,215,0,0.2)",
                        }}
                      >
                        <p
                          className="text-xs"
                          style={{ color: "#999", fontStyle: "italic" }}
                        >
                          Grand Total
                        </p>
                        <p
                          className="font-bold text-sm mt-0.5"
                          style={{ color: "#FFD700" }}
                        >
                          ₹{grandTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {withdrawalModal && (
        <WithdrawalModal
          username={withdrawalModal.username}
          totalEarnings={withdrawalModal.totalEarnings}
          onClose={() => setWithdrawalModal(null)}
        />
      )}
    </div>
  );
}
