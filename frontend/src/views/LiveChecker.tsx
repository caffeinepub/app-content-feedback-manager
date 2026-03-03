import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, DollarSign, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useAppsEvents, usePriceList, useCalculateAllEarnings } from '../hooks/useQueries';

const KNOWN_APPS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Snapchat', 'Twitter'];

export default function LiveChecker() {
  const { data: appEvents = [] } = useAppsEvents();
  const { data: priceList = [] } = usePriceList();
  const earnings = useCalculateAllEarnings();

  // Single username checker
  const [singleUsername, setSingleUsername] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>([...KNOWN_APPS]);
  const [singleResults, setSingleResults] = useState<Record<string, { found: boolean; position?: number; price?: number }>>({});
  const [isChecking, setIsChecking] = useState(false);

  // Bulk checker
  const [bulkUsernames, setBulkUsernames] = useState('');
  const [bulkResults, setBulkResults] = useState<Array<{ username: string; apps: string[] }>>([]);
  const [isBulkChecking, setIsBulkChecking] = useState(false);

  // Live list collapsible
  const [showLiveList, setShowLiveList] = useState(false);

  const priceMap = new Map(priceList.map((p) => [p.appName.toLowerCase(), p.pricePerEntry]));

  const toggleApp = (app: string) => {
    setSelectedApps((prev) =>
      prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
    );
  };

  const handleSingleCheck = () => {
    if (!singleUsername.trim()) return;
    setIsChecking(true);
    const username = singleUsername.trim().toLowerCase().replace(/^@/, '');
    const results: Record<string, { found: boolean; position?: number; price?: number }> = {};

    for (const app of selectedApps) {
      const event = appEvents.find((e) => e.name.toLowerCase() === app.toLowerCase());
      if (!event) {
        results[app] = { found: false };
        continue;
      }
      const idx = event.usernames.findIndex(
        (u) => u.toLowerCase().replace(/^@/, '') === username
      );
      if (idx >= 0) {
        const price = priceMap.get(app.toLowerCase());
        results[app] = { found: true, position: idx + 1, price };
      } else {
        results[app] = { found: false };
      }
    }

    setSingleResults(results);
    setIsChecking(false);
  };

  const handleBulkCheck = () => {
    if (!bulkUsernames.trim()) return;
    setIsBulkChecking(true);
    const usernames = bulkUsernames
      .split('\n')
      .map((u) => u.trim().toLowerCase().replace(/^@/, ''))
      .filter(Boolean);

    const results = usernames.map((username) => {
      const foundApps: string[] = [];
      for (const event of appEvents) {
        const found = event.usernames.some(
          (u) => u.toLowerCase().replace(/^@/, '') === username
        );
        if (found) foundApps.push(event.name);
      }
      return { username, apps: foundApps };
    });

    setBulkResults(results);
    setIsBulkChecking(false);
  };

  const totalEarningsFromSingle = Object.entries(singleResults)
    .filter(([, r]) => r.found && r.price)
    .reduce((sum, [, r]) => sum + (r.price ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Single Username Checker */}
      <div className="space-card p-5 space-y-4">
        <h2 className="font-semibold">Username Checker</h2>

        {/* App pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Select apps to check:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedApps([...KNOWN_APPS])}
                className="text-xs text-primary hover:underline"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedApps([])}
                className="text-xs text-muted-foreground hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {KNOWN_APPS.map((app) => (
              <button
                key={app}
                onClick={() => toggleApp(app)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedApps.includes(app)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {app}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={singleUsername}
            onChange={(e) => setSingleUsername(e.target.value)}
            placeholder="@username"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => e.key === 'Enter' && handleSingleCheck()}
          />
          <button
            onClick={handleSingleCheck}
            disabled={!singleUsername.trim() || isChecking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Check
          </button>
        </div>

        {/* Single results */}
        {Object.keys(singleResults).length > 0 && (
          <div className="space-y-2">
            {selectedApps.map((app) => {
              const result = singleResults[app];
              if (!result) return null;
              return (
                <div
                  key={app}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    result.found ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/30 border border-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.found ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{app}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.found ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Found #{result.position}
                        {result.price ? ` · ₹${result.price}` : ''}
                      </span>
                    ) : (
                      'Not found'
                    )}
                  </div>
                </div>
              );
            })}

            {totalEarningsFromSingle > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-sm font-semibold">
                <DollarSign className="w-4 h-4 text-primary" />
                Estimated earnings: ₹{totalEarningsFromSingle.toFixed(2)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Checker */}
      <div className="space-card p-5 space-y-4">
        <h2 className="font-semibold">Bulk Username Checker</h2>
        <textarea
          value={bulkUsernames}
          onChange={(e) => setBulkUsernames(e.target.value)}
          placeholder={"@user1\n@user2\n@user3"}
          rows={5}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
        />
        <button
          onClick={handleBulkCheck}
          disabled={!bulkUsernames.trim() || isBulkChecking}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isBulkChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Check All
        </button>

        {bulkResults.length > 0 && (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {bulkResults.map(({ username, apps }) => (
              <div
                key={username}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                  apps.length > 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/30 border border-border'
                }`}
              >
                <span className="font-mono font-medium">@{username}</span>
                <span className={apps.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                  {apps.length > 0 ? apps.join(', ') : 'Not found'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earnings Summary */}
      {earnings.totalEarnings > 0 && (
        <div className="space-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Earnings Summary</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-lg font-bold">{earnings.totalAppsWithPrices}</p>
              <p className="text-xs text-muted-foreground">Active Apps</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-lg font-bold">{earnings.totalValidEntries}</p>
              <p className="text-xs text-muted-foreground">Entries</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-lg font-bold text-primary">₹{earnings.totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      )}

      {/* Live List for All Users */}
      <div className="space-card overflow-hidden">
        <button
          onClick={() => setShowLiveList((v) => !v)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
        >
          <span className="font-semibold text-sm">Live List for All Users</span>
          {showLiveList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showLiveList && (
          <div className="border-t border-border p-4 space-y-3">
            {appEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No app events available.</p>
            ) : (
              appEvents.map((event) => (
                <div key={event.name} className="space-y-1">
                  <p className="text-sm font-semibold">{event.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {event.usernames.map((u, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono">
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
