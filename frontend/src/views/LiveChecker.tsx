import { useState } from 'react';
import { useGetAppEvents, usePriceList } from '../hooks/useQueries';
import { Search, CheckCircle, XCircle, Users, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { EarningsChecker } from './EarningsChecker';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type AppResult = {
  appName: string;
  found: boolean;
  position?: number;
  price?: number;
};

export default function LiveChecker() {
  const { data: appsEvents = [] } = useGetAppEvents();
  const { data: priceList = [] } = usePriceList();

  // Single username checker
  const [username, setUsername] = useState('');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<AppResult[]>([]);
  const [checked, setChecked] = useState(false);

  // Bulk checker
  const [bulkUsernames, setBulkUsernames] = useState('');
  const [bulkResults, setBulkResults] = useState<{ username: string; apps: AppResult[] }[]>([]);
  const [bulkChecked, setBulkChecked] = useState(false);

  // Live list collapsible
  const [showLiveList, setShowLiveList] = useState(false);

  const appNames = appsEvents.map((a) => a.name);

  const getPriceForApp = (appName: string): number | undefined => {
    const entry = priceList.find((p) => p.appName === appName && p.isActive);
    return entry ? entry.pricePerEntry : undefined;
  };

  const toggleApp = (appName: string) => {
    setSelectedApps((prev) => {
      const next = new Set(prev);
      if (next.has(appName)) next.delete(appName);
      else next.add(appName);
      return next;
    });
  };

  const selectAll = () => setSelectedApps(new Set(appNames));
  const clearAll = () => setSelectedApps(new Set());

  const checkUsername = () => {
    if (!username.trim()) return;
    const appsToCheck = selectedApps.size > 0 ? [...selectedApps] : appNames;
    const res: AppResult[] = appsToCheck.map((appName) => {
      const app = appsEvents.find((a) => a.name === appName);
      if (!app) return { appName, found: false };
      const idx = app.usernames.findIndex(
        (u) => u.toLowerCase() === username.trim().toLowerCase()
      );
      return {
        appName,
        found: idx !== -1,
        position: idx !== -1 ? idx + 1 : undefined,
        price: getPriceForApp(appName),
      };
    });
    setResults(res);
    setChecked(true);
  };

  const checkBulk = () => {
    const names = bulkUsernames
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
    if (!names.length) return;
    const appsToCheck = selectedApps.size > 0 ? [...selectedApps] : appNames;
    const res = names.map((uname) => ({
      username: uname,
      apps: appsToCheck.map((appName) => {
        const app = appsEvents.find((a) => a.name === appName);
        if (!app) return { appName, found: false };
        const idx = app.usernames.findIndex(
          (u) => u.toLowerCase() === uname.toLowerCase()
        );
        return {
          appName,
          found: idx !== -1,
          position: idx !== -1 ? idx + 1 : undefined,
          price: getPriceForApp(appName),
        };
      }),
    }));
    setBulkResults(res);
    setBulkChecked(true);
  };

  const foundResults = results.filter((r) => r.found);
  const totalEarnings = foundResults.reduce((sum, r) => sum + (r.price || 0), 0);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="checker" className="w-full">
        <TabsList className="w-full bg-card/40 border border-border/30 rounded-2xl p-1 mb-4 h-auto">
          <TabsTrigger
            value="checker"
            className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Username Checker
          </TabsTrigger>
          <TabsTrigger
            value="earnings"
            className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Earnings
          </TabsTrigger>
        </TabsList>

        {/* ── Username Checker Tab ── */}
        <TabsContent value="checker" className="space-y-4 mt-0">
          {/* Single Username Checker */}
          <div className="space-card rounded-2xl p-4">
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Check Username
            </h2>

            {/* App selector pills */}
            {appNames.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">Select Apps:</span>
                  <button
                    onClick={selectAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-muted-foreground text-xs">·</span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {appNames.map((appName) => (
                    <button
                      key={appName}
                      onClick={() => toggleApp(appName)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        selectedApps.has(appName)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card/60 text-muted-foreground border-border/40 hover:border-primary/50'
                      }`}
                    >
                      {appName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkUsername()}
                placeholder="Enter username..."
                className="flex-1 bg-background/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
              />
              <button
                onClick={checkUsername}
                disabled={!username.trim()}
                className="gradient-button px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              >
                Check
              </button>
            </div>

            {checked && results.length > 0 && (
              <div className="mt-3 space-y-2">
                {results.map((r) => (
                  <div
                    key={r.appName}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm ${
                      r.found
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {r.found ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span className="font-medium">{r.appName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {r.found ? (
                        <>
                          <span>#{r.position}</span>
                          {r.price !== undefined && (
                            <span className="text-primary font-semibold">₹{r.price}</span>
                          )}
                        </>
                      ) : (
                        <span>Not Found</span>
                      )}
                    </div>
                  </div>
                ))}

                {foundResults.length > 0 && totalEarnings > 0 && (
                  <div className="mt-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-sm flex items-center justify-between">
                    <span className="text-primary font-medium">Estimated Earnings</span>
                    <span className="text-primary font-bold">₹{totalEarnings.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bulk Username Checker */}
          <div className="space-card rounded-2xl p-4">
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Bulk Username Checker
            </h2>
            <textarea
              value={bulkUsernames}
              onChange={(e) => setBulkUsernames(e.target.value)}
              placeholder="Enter usernames (one per line)..."
              rows={4}
              className="w-full bg-background/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none"
            />
            <button
              onClick={checkBulk}
              disabled={!bulkUsernames.trim()}
              className="mt-2 gradient-button px-4 py-2 rounded-xl text-sm font-medium text-white w-full disabled:opacity-50"
            >
              Check All Usernames
            </button>

            {bulkChecked && bulkResults.length > 0 && (
              <div className="mt-3 space-y-3">
                {bulkResults.map(({ username: uname, apps }) => {
                  const foundApps = apps.filter((a) => a.found);
                  return (
                    <div
                      key={uname}
                      className="bg-card/40 border border-border/30 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-foreground">@{uname}</span>
                        <span className="text-xs text-muted-foreground">
                          {foundApps.length}/{apps.length} found
                        </span>
                      </div>
                      <div className="space-y-1">
                        {apps.map((r) => (
                          <div
                            key={r.appName}
                            className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs ${
                              r.found ? 'text-green-400' : 'text-muted-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {r.found ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              <span>{r.appName}</span>
                            </div>
                            {r.found && r.position && <span>#{r.position}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live List for All Users */}
          <div className="space-card rounded-2xl p-4">
            <button
              onClick={() => setShowLiveList((v) => !v)}
              className="w-full flex items-center justify-between text-base font-semibold text-foreground"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Live List for All Users
              </div>
              {showLiveList ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showLiveList && (
              <div className="mt-3 space-y-3">
                {appsEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No live lists available.
                  </p>
                ) : (
                  appsEvents.map((app) => (
                    <div
                      key={app.name}
                      className="bg-card/40 border border-border/30 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-foreground">{app.name}</span>
                        <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">
                          {app.usernames.length} users
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {app.usernames.slice(0, 20).map((u, i) => (
                          <span
                            key={i}
                            className="text-xs bg-background/60 border border-border/30 px-2 py-0.5 rounded-full text-muted-foreground"
                          >
                            {u}
                          </span>
                        ))}
                        {app.usernames.length > 20 && (
                          <span className="text-xs text-muted-foreground px-2 py-0.5">
                            +{app.usernames.length - 20} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Earnings Tab ── */}
        <TabsContent value="earnings" className="mt-0">
          <EarningsChecker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
