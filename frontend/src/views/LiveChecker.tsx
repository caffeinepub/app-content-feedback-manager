import { useState } from 'react';
import { useAppsEvents } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CheckCircle, XCircle, ClipboardList, Users, ChevronDown, ChevronUp } from 'lucide-react';

interface UsernameResult {
  username: string;
  foundIn: string[];
  notFoundIn: string[];
}

export function LiveChecker() {
  const { data: appsEvents, isLoading } = useAppsEvents();

  const [selectedApp, setSelectedApp] = useState<string>('__all');
  const [usernamesText, setUsernamesText] = useState('');
  const [results, setResults] = useState<UsernameResult[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({});

  const appList = appsEvents ?? [];

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

    const newResults: UsernameResult[] = usernames.map((username) => {
      const lowerUsername = username.toLowerCase();
      const foundIn: string[] = [];
      const notFoundIn: string[] = [];

      appsToCheck.forEach((app) => {
        const found = app.usernames.some(
          (u) => u.toLowerCase() === lowerUsername
        );
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

      {/* Username Checker Card */}
      <div className="space-card p-0 overflow-hidden">
        {/* Card Header */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid oklch(0.28 0.04 240 / 0.5)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' }}>
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">Username Checker</h3>
            <p className="text-xs text-muted-foreground">Select an app/event and enter usernames to check</p>
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
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'oklch(0.75 0.22 155)' }} />
                          <div>
                            <span className="text-xs font-medium" style={{ color: 'oklch(0.75 0.22 155)' }}>
                              Found in:{' '}
                            </span>
                            <span className="text-xs text-foreground">
                              {result.foundIn.join(', ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {result.notFoundIn.length > 0 && (
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'oklch(0.6 0.22 25)' }} />
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

      {/* Live List for All Users */}
      <div className="space-card p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid oklch(0.28 0.04 240 / 0.5)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' }}>
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
                          style={{ background: 'oklch(0.72 0.18 175 / 0.15)', color: 'oklch(0.72 0.18 175)' }}
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
                                style={{ background: 'oklch(0.22 0.04 240)', border: '1px solid oklch(0.3 0.05 220 / 0.5)', color: 'oklch(0.85 0.02 240)' }}
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
