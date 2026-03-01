import { useState } from 'react';
import { useAppsEvents, usePriceList } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CheckCircle, XCircle, ClipboardList, Users, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import type { PriceEntry } from '../backend';

interface AppCheckResult {
  appName: string;
  found: boolean;
  position: number | null; // sequential position (1-based) if found
  priceEntry?: PriceEntry;
}

export function LiveChecker() {
  const { data: appsEvents, isLoading } = useAppsEvents();
  const { data: priceList } = usePriceList();

  // ── Multi-app checker state ──
  const [multiUsername, setMultiUsername] = useState('');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [multiResults, setMultiResults] = useState<AppCheckResult[]>([]);
  const [hasMultiChecked, setHasMultiChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // ── Legacy single-app checker state ──
  const [selectedApp, setSelectedApp] = useState<string>('__all');
  const [usernamesText, setUsernamesText] = useState('');
  const [results, setResults] = useState<{ username: string; foundIn: string[]; notFoundIn: string[] }[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({});

  const appList = appsEvents ?? [];
  const priceMap = new Map<string, PriceEntry>((priceList ?? []).map((p) => [p.appName, p]));

  // ── Multi-app checker handlers ──
  function toggleApp(appName: string) {
    setSelectedApps((prev) => {
      const next = new Set(prev);
      if (next.has(appName)) {
        next.delete(appName);
      } else {
        next.add(appName);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedApps(new Set(appList.map((a) => a.name)));
  }

  function clearAll() {
    setSelectedApps(new Set());
  }

  function handleMultiCheck() {
    const username = multiUsername.trim();
    if (!username) return;

    setIsChecking(true);
    const appsToCheck = selectedApps.size === 0 ? appList : appList.filter((a) => selectedApps.has(a.name));

    const results: AppCheckResult[] = appsToCheck.map((app) => {
      const lowerUsername = username.toLowerCase();
      // Find sequential position among all usernames in this app
      let position: number | null = null;
      let matchCount = 0;
      for (let i = 0; i < app.usernames.length; i++) {
        if (app.usernames[i].toLowerCase() === lowerUsername) {
          matchCount++;
          position = matchCount;
          break;
        }
        // Count all entries to get sequential position
      }
      // Actually find the exact sequential position (1-based index of the match)
      const idx = app.usernames.findIndex((u) => u.toLowerCase() === lowerUsername);
      if (idx !== -1) {
        position = idx + 1;
      }

      const priceEntry = priceMap.get(app.name);
      return {
        appName: app.name,
        found: idx !== -1,
        position: idx !== -1 ? idx + 1 : null,
        priceEntry: priceEntry?.isActive ? priceEntry : undefined,
      };
    });

    setMultiResults(results);
    setHasMultiChecked(true);
    setIsChecking(false);
  }

  // ── Earnings calculation ──
  const foundResults = multiResults.filter((r) => r.found);
  const totalEarnings = foundResults.reduce((sum, r) => {
    if (r.priceEntry?.isActive) {
      return sum + r.priceEntry.pricePerEntry;
    }
    return sum;
  }, 0);

  // ── Legacy checker handlers ──
  function handleCheck() {
    const usernames = usernamesText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (usernames.length === 0) return;

    const appsToCheck =
      selectedApp === '__all'
        ? appList
        : appList.filter((a) => a.name === selectedApp);

    const newResults = usernames.map((username) => {
      const lowerUsername = username.toLowerCase();
      const foundIn: string[] = [];
      const notFoundIn: string[] = [];

      appsToCheck.forEach((app) => {
        const found = app.usernames.some((u) => u.toLowerCase() === lowerUsername);
        if (found) {
          foundIn.push(app.name);
        } else {
          notFoundIn.push(app.name);
        }
      });

      return { username, foundIn, notFoundIn };
    });

    setResults(newResults);
    setHasChecked(true);
  }

  function toggleAppExpand(appName: string) {
    setExpandedApps((prev) => ({ ...prev, [appName]: !prev[appName] }));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="text-center pt-2">
        <h2 className="text-3xl font-display font-bold gradient-heading">Live List Checker</h2>
        <p className="text-muted-foreground mt-1">Check if usernames exist in app/event lists</p>
      </div>

      {/* ── NEW: Multi-App Username Checker ── */}
      <div className="space-card p-0 overflow-hidden">
        {/* Card Header */}
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid oklch(0.28 0.04 240 / 0.5)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' }}
          >
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">Username Checker</h3>
            <p className="text-xs text-muted-foreground">Check a username across multiple app lists at once</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full bg-secondary" />
              <Skeleton className="h-32 w-full bg-secondary" />
              <Skeleton className="h-12 w-full bg-secondary" />
            </div>
          ) : (
            <>
              {/* Username Input */}
              <input
                type="text"
                value={multiUsername}
                onChange={(e) => setMultiUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMultiCheck()}
                placeholder="Enter username to check..."
                className="w-full rounded-2xl px-5 py-4 text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{
                  background: 'oklch(0.97 0.005 240)',
                  color: 'oklch(0.15 0.02 240)',
                  border: 'none',
                }}
              />

              {/* App Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Check in specific lists (leave empty for all):
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAll}
                      className="text-sm font-semibold"
                      style={{ color: 'oklch(0.72 0.18 175)' }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAll}
                      className="text-sm font-medium underline text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Pill-style app checkboxes */}
                {appList.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No app lists available yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {appList.map((app) => {
                      const isSelected = selectedApps.has(app.name);
                      return (
                        <button
                          key={app.name}
                          onClick={() => toggleApp(app.name)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                          style={{
                            border: isSelected
                              ? '1.5px solid oklch(0.72 0.18 175)'
                              : '1.5px solid oklch(0.35 0.05 240 / 0.8)',
                            background: isSelected
                              ? 'oklch(0.72 0.18 175 / 0.12)'
                              : 'oklch(0.18 0.04 240 / 0.6)',
                            color: isSelected ? 'oklch(0.72 0.18 175)' : 'oklch(0.75 0.03 240)',
                          }}
                        >
                          {/* Checkbox icon */}
                          <span
                            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{
                              border: isSelected
                                ? '1.5px solid oklch(0.72 0.18 175)'
                                : '1.5px solid oklch(0.45 0.05 240)',
                              background: isSelected ? 'oklch(0.72 0.18 175)' : 'transparent',
                            }}
                          >
                            {isSelected && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          {app.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Check Username Button */}
              <button
                onClick={handleMultiCheck}
                disabled={!multiUsername.trim() || appList.length === 0 || isChecking}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.65 0.2 175), oklch(0.55 0.18 200))',
                  color: 'white',
                  boxShadow: '0 4px 20px oklch(0.65 0.2 175 / 0.3)',
                }}
              >
                <Search className="w-5 h-5" />
                {isChecking ? 'Checking...' : 'Check Username'}
              </button>

              {/* Results */}
              {hasMultiChecked && (
                <div className="space-y-3 mt-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Results for{' '}
                    <span style={{ color: 'oklch(0.72 0.18 175)' }}>"{multiUsername}"</span>
                  </h4>

                  {multiResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-3">
                      No apps were checked.
                    </p>
                  ) : (
                    <>
                      {/* Per-app result rows */}
                      <div className="space-y-2">
                        {multiResults.map((result) => (
                          <div
                            key={result.appName}
                            className="flex items-center justify-between px-4 py-3 rounded-xl"
                            style={{
                              background: result.found
                                ? 'oklch(0.75 0.22 155 / 0.08)'
                                : 'oklch(0.22 0.04 240 / 0.6)',
                              border: result.found
                                ? '1px solid oklch(0.75 0.22 155 / 0.3)'
                                : '1px solid oklch(0.3 0.04 240 / 0.5)',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {result.found ? (
                                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.75 0.22 155)' }} />
                              ) : (
                                <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.6 0.22 25)' }} />
                              )}
                              <span className="text-sm font-medium text-foreground">{result.appName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {result.found && result.position !== null && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: 'oklch(0.55 0.18 200 / 0.15)',
                                    color: 'oklch(0.72 0.18 175)',
                                  }}
                                >
                                  #{result.position}
                                </span>
                              )}
                              {result.found && result.priceEntry && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: 'oklch(0.75 0.22 155 / 0.12)',
                                    color: 'oklch(0.75 0.22 155)',
                                  }}
                                >
                                  ₹{result.priceEntry.pricePerEntry.toFixed(2)}
                                </span>
                              )}
                              <span
                                className="text-xs font-semibold"
                                style={{
                                  color: result.found ? 'oklch(0.75 0.22 155)' : 'oklch(0.6 0.22 25)',
                                }}
                              >
                                {result.found ? 'Found' : 'Not Found'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Earnings Summary */}
                      {foundResults.length > 0 && (
                        <div
                          className="rounded-xl p-4 space-y-3 mt-2"
                          style={{
                            background: 'linear-gradient(135deg, oklch(0.55 0.18 200 / 0.1), oklch(0.65 0.2 160 / 0.1))',
                            border: '1px solid oklch(0.55 0.18 200 / 0.3)',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4" style={{ color: 'oklch(0.72 0.18 175)' }} />
                            <span className="text-sm font-semibold text-foreground">Earnings Summary</span>
                          </div>

                          {/* Per-app earnings rows */}
                          <div className="space-y-1.5">
                            {foundResults.map((r) => (
                              <div key={r.appName} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{r.appName}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-muted-foreground">Pos #{r.position}</span>
                                  {r.priceEntry ? (
                                    <span style={{ color: 'oklch(0.75 0.22 155)' }}>
                                      ₹{r.priceEntry.pricePerEntry.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">No price set</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Divider */}
                          <div style={{ borderTop: '1px solid oklch(0.35 0.05 240 / 0.4)' }} className="pt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Total Apps Found In</span>
                              <span className="font-semibold text-foreground">{foundResults.length}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Total Entries Matched</span>
                              <span className="font-semibold text-foreground">{foundResults.length}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold mt-1">
                              <span style={{ color: 'oklch(0.72 0.18 175)' }}>Total Earnings</span>
                              <span style={{ color: 'oklch(0.75 0.22 155)' }}>
                                ₹{totalEarnings.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary badge */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span>
                          Checked {multiResults.length} app{multiResults.length !== 1 ? 's' : ''}
                        </span>
                        <span>
                          Found in{' '}
                          <span style={{ color: 'oklch(0.75 0.22 155)' }} className="font-semibold">
                            {foundResults.length}
                          </span>{' '}
                          / {multiResults.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── EXISTING: Multi-Username Checker (legacy) ── */}
      <div className="space-card p-0 overflow-hidden">
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid oklch(0.28 0.04 240 / 0.5)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' }}
          >
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">Bulk Username Checker</h3>
            <p className="text-xs text-muted-foreground">Check multiple usernames at once across selected app</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full bg-secondary" />
              <Skeleton className="h-28 w-full bg-secondary" />
              <Skeleton className="h-10 w-full bg-secondary" />
            </div>
          ) : (
            <>
              {/* App/Event Selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Select App/Event</label>
                <select
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ background: 'oklch(0.22 0.04 240)' }}
                >
                  <option value="__all">Select All (check all apps/events)</option>
                  {appList.map((app) => (
                    <option key={app.name} value={app.name}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Usernames Textarea */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Usernames to Check (one per line)
                </label>
                <textarea
                  value={usernamesText}
                  onChange={(e) => setUsernamesText(e.target.value)}
                  placeholder="Enter usernames, one per line..."
                  rows={5}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  style={{ background: 'oklch(0.22 0.04 240)' }}
                />
              </div>

              {/* Check Button */}
              <button
                onClick={handleCheck}
                disabled={!usernamesText.trim() || appList.length === 0}
                className="gradient-button w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
              >
                <Search className="w-4 h-4" />
                Check Usernames
              </button>

              {/* Results */}
              {hasChecked && results.length > 0 && (
                <div className="space-y-3 mt-2">
                  <h4 className="text-sm font-semibold text-foreground">Results</h4>
                  {results.map((result) => (
                    <div
                      key={result.username}
                      className="rounded-xl border border-border bg-secondary/40 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-mono font-semibold text-sm text-foreground">
                          {result.username}
                        </span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background:
                              result.foundIn.length > 0
                                ? 'oklch(0.75 0.22 155 / 0.15)'
                                : 'oklch(0.6 0.22 25 / 0.15)',
                            color:
                              result.foundIn.length > 0
                                ? 'oklch(0.75 0.22 155)'
                                : 'oklch(0.7 0.22 25)',
                          }}
                        >
                          Found in {result.foundIn.length} list{result.foundIn.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {result.foundIn.length > 0 && (
                        <div className="flex items-start gap-2">
                          <CheckCircle
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            style={{ color: 'oklch(0.75 0.22 155)' }}
                          />
                          <div>
                            <span className="text-xs font-medium" style={{ color: 'oklch(0.75 0.22 155)' }}>
                              Found in:{' '}
                            </span>
                            <span className="text-xs text-foreground">{result.foundIn.join(', ')}</span>
                          </div>
                        </div>
                      )}

                      {result.notFoundIn.length > 0 && (
                        <div className="flex items-start gap-2">
                          <XCircle
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            style={{ color: 'oklch(0.6 0.22 25)' }}
                          />
                          <div>
                            <span className="text-xs font-medium" style={{ color: 'oklch(0.6 0.22 25)' }}>
                              Not found in:{' '}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {result.notFoundIn.join(', ')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {hasChecked && results.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No usernames to display.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Live List for All Users ── */}
      <div className="space-card p-0 overflow-hidden">
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid oklch(0.28 0.04 240 / 0.5)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' }}
          >
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">Live List for All Users</h3>
            <p className="text-xs text-muted-foreground">All app/event lists with their usernames</p>
          </div>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-secondary" />
              ))}
            </div>
          ) : appList.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              No app/event lists available yet.
            </p>
          ) : (
            <div className="space-y-3">
              {appList.map((app) => {
                const isExpanded = expandedApps[app.name] ?? false;
                return (
                  <div
                    key={app.name}
                    className="rounded-xl border border-border bg-secondary/40 overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/60 transition-colors"
                      onClick={() => toggleAppExpand(app.name)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{app.name}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: 'oklch(0.72 0.18 175 / 0.15)',
                            color: 'oklch(0.72 0.18 175)',
                          }}
                        >
                          {app.usernames.length} user{app.usernames.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1">
                        {app.usernames.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No usernames in this list.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {app.usernames.map((username, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-lg font-mono"
                                style={{
                                  background: 'oklch(0.22 0.04 240)',
                                  border: '1px solid oklch(0.3 0.05 220 / 0.5)',
                                  color: 'oklch(0.85 0.02 240)',
                                }}
                              >
                                {username}
                              </span>
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
      </div>
    </div>
  );
}
