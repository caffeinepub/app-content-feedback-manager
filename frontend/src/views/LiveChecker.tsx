import { useState, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, CheckCircle, XCircle, Users, Loader2, DollarSign, TrendingUp } from 'lucide-react';
import { useAppsEvents, usePriceList, useCalculateAllEarnings } from '../hooks/useQueries';
import WithdrawalModal from '../components/WithdrawalModal';

type CheckMode = 'single' | 'bulk';

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

export default function LiveChecker() {
  const [mode, setMode] = useState<CheckMode>('single');
  const [singleUsername, setSingleUsername] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [singleResults, setSingleResults] = useState<SingleCheckResult[] | null>(null);
  const [bulkUsernames, setBulkUsernames] = useState('');
  const [bulkResults, setBulkResults] = useState<{ username: string; apps: SingleCheckResult[] }[] | null>(null);
  const [liveListExpanded, setLiveListExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Withdrawal modal state
  const [withdrawalModal, setWithdrawalModal] = useState<EarningsResult | null>(null);

  const { data: appsEvents = [], isLoading: appsLoading } = useAppsEvents();
  const { data: priceList = [] } = usePriceList();
  const { data: allEarnings } = useCalculateAllEarnings();

  const getPriceForApp = useCallback((appName: string) => {
    const entry = priceList.find(p => p.appName === appName && p.isActive);
    return entry?.pricePerEntry ?? null;
  }, [priceList]);

  const checkSingleUsername = () => {
    if (!singleUsername.trim()) return;
    setIsChecking(true);
    const appsToCheck = selectedApps.length > 0 ? selectedApps : appsEvents.map(a => a.name);
    const results: SingleCheckResult[] = appsToCheck.map(appName => {
      const app = appsEvents.find(a => a.name === appName);
      if (!app) return { appName, found: false };
      const idx = app.usernames.findIndex(u => u.toLowerCase() === singleUsername.trim().toLowerCase());
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

    // Check if username has earnings and show modal
    const foundInAny = results.some(r => r.found);
    if (foundInAny && allEarnings) {
      // Calculate total earnings for this username across all apps
      let totalEarnings = 0;
      results.forEach(r => {
        if (r.found && r.price) {
          totalEarnings += r.price;
        }
      });
      if (totalEarnings > 0) {
        setWithdrawalModal({ username: singleUsername.trim(), totalEarnings });
      }
    }
  };

  const checkBulkUsernames = () => {
    const usernames = bulkUsernames.split('\n').map(u => u.trim()).filter(Boolean);
    if (usernames.length === 0) return;
    setIsChecking(true);
    const appsToCheck = selectedApps.length > 0 ? selectedApps : appsEvents.map(a => a.name);
    const results = usernames.map(username => ({
      username,
      apps: appsToCheck.map(appName => {
        const app = appsEvents.find(a => a.name === appName);
        if (!app) return { appName, found: false };
        const idx = app.usernames.findIndex(u => u.toLowerCase() === username.toLowerCase());
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

  const toggleApp = (appName: string) => {
    setSelectedApps(prev =>
      prev.includes(appName) ? prev.filter(a => a !== appName) : [...prev, appName]
    );
  };

  const selectAll = () => setSelectedApps(appsEvents.map(a => a.name));
  const clearAll = () => setSelectedApps([]);

  const foundCount = singleResults?.filter(r => r.found).length ?? 0;
  const totalEarningsForUser = singleResults
    ?.filter(r => r.found && r.price)
    .reduce((sum, r) => sum + (r.price ?? 0), 0) ?? 0;

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Withdrawal Modal */}
      {withdrawalModal && (
        <WithdrawalModal
          username={withdrawalModal.username}
          totalEarnings={withdrawalModal.totalEarnings}
          onClose={() => setWithdrawalModal(null)}
        />
      )}

      {/* Mode Toggle */}
      <div className="glass-card p-1.5 rounded-2xl flex gap-1">
        {(['single', 'bulk'] as CheckMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2.5 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300"
            style={{
              background: mode === m
                ? 'linear-gradient(135deg, oklch(0.75 0.18 65 / 0.25), oklch(0.70 0.20 185 / 0.25))'
                : 'transparent',
              color: mode === m ? 'oklch(0.90 0.10 80)' : 'oklch(0.50 0.04 260)',
              border: mode === m ? '1px solid oklch(0.75 0.18 65 / 0.3)' : '1px solid transparent',
            }}
          >
            {m === 'single' ? '🔍 Single Check' : '📋 Bulk Check'}
          </button>
        ))}
      </div>

      {/* App Filter Pills */}
      {appsEvents.length > 0 && (
        <div className="glass-card p-4 rounded-2xl animate-fadeInUp delay-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider" style={{ color: 'oklch(0.70 0.20 185)' }}>
              Filter by App
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs font-rajdhani px-3 py-1 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  background: 'oklch(0.70 0.20 185 / 0.15)',
                  border: '1px solid oklch(0.70 0.20 185 / 0.3)',
                  color: 'oklch(0.78 0.22 188)',
                }}
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="text-xs font-rajdhani px-3 py-1 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  background: 'oklch(0.14 0.03 260 / 0.6)',
                  border: '1px solid oklch(0.28 0.06 260 / 0.4)',
                  color: 'oklch(0.55 0.04 260)',
                }}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {appsEvents.map(app => {
              const isSelected = selectedApps.includes(app.name);
              return (
                <button
                  key={app.name}
                  onClick={() => toggleApp(app.name)}
                  className="px-3 py-1.5 rounded-full text-xs font-rajdhani font-600 transition-all duration-200 hover:scale-105"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, oklch(0.75 0.18 65 / 0.25), oklch(0.70 0.20 185 / 0.25))'
                      : 'oklch(0.14 0.03 260 / 0.6)',
                    border: isSelected
                      ? '1px solid oklch(0.75 0.18 65 / 0.5)'
                      : '1px solid oklch(0.28 0.06 260 / 0.4)',
                    color: isSelected ? 'oklch(0.90 0.10 80)' : 'oklch(0.55 0.04 260)',
                  }}
                >
                  {app.name}
                  <span className="ml-1.5 opacity-60">({app.usernames.length})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Single Check */}
      {mode === 'single' && (
        <div className="glass-card-teal p-5 rounded-2xl animate-fadeInUp delay-200">
          <h2 className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'oklch(0.78 0.22 188)' }}>
            <Search className="w-4 h-4" />
            Username Checker
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={singleUsername}
              onChange={e => setSingleUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkSingleUsername()}
              placeholder="Enter username to check..."
              className="glass-input flex-1 px-4 py-3 text-sm"
            />
            <button
              onClick={checkSingleUsername}
              disabled={!singleUsername.trim() || isChecking || appsLoading}
              className="px-5 py-3 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, oklch(0.70 0.20 185), oklch(0.75 0.18 65))',
                color: 'oklch(0.08 0.02 260)',
                opacity: (!singleUsername.trim() || isChecking || appsLoading) ? 0.5 : 1,
              }}
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check
            </button>
          </div>

          {/* Single Results */}
          {singleResults && (
            <div className="mt-4 space-y-3 animate-fadeInUp">
              {/* Summary */}
              <div
                className="rounded-xl p-3 flex items-center justify-between"
                style={{
                  background: foundCount > 0
                    ? 'oklch(0.65 0.18 145 / 0.1)'
                    : 'oklch(0.55 0.22 25 / 0.1)',
                  border: `1px solid ${foundCount > 0 ? 'oklch(0.65 0.18 145 / 0.3)' : 'oklch(0.55 0.22 25 / 0.3)'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  {foundCount > 0
                    ? <CheckCircle className="w-5 h-5" style={{ color: 'oklch(0.72 0.20 145)' }} />
                    : <XCircle className="w-5 h-5" style={{ color: 'oklch(0.65 0.22 25)' }} />
                  }
                  <span className="font-rajdhani font-600 text-sm" style={{ color: foundCount > 0 ? 'oklch(0.72 0.20 145)' : 'oklch(0.65 0.22 25)' }}>
                    {foundCount > 0
                      ? `Found in ${foundCount} app${foundCount > 1 ? 's' : ''}`
                      : 'Not found in any app'
                    }
                  </span>
                </div>
                {totalEarningsForUser > 0 && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.82 0.20 70)' }} />
                    <span className="font-orbitron font-bold text-sm gold-text">
                      ₹{totalEarningsForUser.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Per-app results */}
              <div className="space-y-2">
                {singleResults.map(result => (
                  <div
                    key={result.appName}
                    className="rounded-xl px-4 py-3 flex items-center justify-between transition-all duration-200"
                    style={{
                      background: result.found
                        ? 'oklch(0.65 0.18 145 / 0.08)'
                        : 'oklch(0.10 0.025 260 / 0.6)',
                      border: `1px solid ${result.found ? 'oklch(0.65 0.18 145 / 0.25)' : 'oklch(0.22 0.05 260 / 0.4)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {result.found
                        ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.72 0.20 145)' }} />
                        : <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.45 0.04 260)' }} />
                      }
                      <span className="font-rajdhani font-600 text-sm" style={{ color: result.found ? 'oklch(0.85 0.05 80)' : 'oklch(0.50 0.04 260)' }}>
                        {result.appName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {result.found && result.position && (
                        <span className="text-xs font-rajdhani" style={{ color: 'oklch(0.60 0.04 260)' }}>
                          #{result.position}
                        </span>
                      )}
                      {result.found && result.price && (
                        <span className="text-xs font-orbitron font-bold" style={{ color: 'oklch(0.82 0.20 70)' }}>
                          ₹{result.price}
                        </span>
                      )}
                      {result.found && (
                        <button
                          onClick={() => setWithdrawalModal({ username: singleUsername.trim(), totalEarnings: totalEarningsForUser })}
                          className="text-xs font-rajdhani px-2.5 py-1 rounded-lg transition-all duration-200 hover:scale-105"
                          style={{
                            background: 'oklch(0.75 0.18 65 / 0.15)',
                            border: '1px solid oklch(0.75 0.18 65 / 0.3)',
                            color: 'oklch(0.82 0.20 70)',
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

      {/* Bulk Check */}
      {mode === 'bulk' && (
        <div className="glass-card p-5 rounded-2xl animate-fadeInUp delay-200">
          <h2 className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'oklch(0.78 0.22 188)' }}>
            <Users className="w-4 h-4" />
            Bulk Username Checker
          </h2>
          <textarea
            value={bulkUsernames}
            onChange={e => setBulkUsernames(e.target.value)}
            placeholder="Enter usernames (one per line)..."
            rows={6}
            className="glass-input w-full px-4 py-3 text-sm resize-none mb-3"
          />
          <button
            onClick={checkBulkUsernames}
            disabled={!bulkUsernames.trim() || isChecking || appsLoading}
            className="w-full py-3 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, oklch(0.70 0.20 185), oklch(0.75 0.18 65))',
              color: 'oklch(0.08 0.02 260)',
              opacity: (!bulkUsernames.trim() || isChecking || appsLoading) ? 0.5 : 1,
            }}
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Check All Usernames
          </button>

          {/* Bulk Results */}
          {bulkResults && (
            <div className="mt-4 space-y-2 animate-fadeInUp">
              {bulkResults.map(({ username, apps }) => {
                const found = apps.filter(a => a.found);
                return (
                  <div
                    key={username}
                    className="rounded-xl p-3"
                    style={{
                      background: found.length > 0 ? 'oklch(0.65 0.18 145 / 0.08)' : 'oklch(0.10 0.025 260 / 0.6)',
                      border: `1px solid ${found.length > 0 ? 'oklch(0.65 0.18 145 / 0.25)' : 'oklch(0.22 0.05 260 / 0.4)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-orbitron font-bold text-xs" style={{ color: found.length > 0 ? 'oklch(0.85 0.05 80)' : 'oklch(0.50 0.04 260)' }}>
                        {username}
                      </span>
                      <span className="text-xs font-rajdhani" style={{ color: found.length > 0 ? 'oklch(0.72 0.20 145)' : 'oklch(0.45 0.04 260)' }}>
                        {found.length > 0 ? `✓ ${found.length} app${found.length > 1 ? 's' : ''}` : '✗ Not found'}
                      </span>
                    </div>
                    {found.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {found.map(a => (
                          <span
                            key={a.appName}
                            className="text-xs px-2 py-0.5 rounded-full font-rajdhani"
                            style={{
                              background: 'oklch(0.70 0.20 185 / 0.15)',
                              border: '1px solid oklch(0.70 0.20 185 / 0.3)',
                              color: 'oklch(0.78 0.22 188)',
                            }}
                          >
                            {a.appName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Live List for All Users */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fadeInUp delay-300">
        <button
          onClick={() => setLiveListExpanded(p => !p)}
          className="w-full px-5 py-4 flex items-center justify-between transition-all duration-200"
          style={{
            background: liveListExpanded
              ? 'oklch(0.14 0.03 260 / 0.6)'
              : 'transparent',
          }}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: 'oklch(0.70 0.20 185)' }} />
            <span className="font-orbitron font-bold text-sm" style={{ color: 'oklch(0.78 0.22 188)' }}>
              Live List — All Users
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-rajdhani"
              style={{
                background: 'oklch(0.70 0.20 185 / 0.15)',
                border: '1px solid oklch(0.70 0.20 185 / 0.3)',
                color: 'oklch(0.78 0.22 188)',
              }}
            >
              {appsEvents.reduce((sum, a) => sum + a.usernames.length, 0)} users
            </span>
          </div>
          {liveListExpanded
            ? <ChevronUp className="w-4 h-4" style={{ color: 'oklch(0.55 0.04 260)' }} />
            : <ChevronDown className="w-4 h-4" style={{ color: 'oklch(0.55 0.04 260)' }} />
          }
        </button>

        {liveListExpanded && (
          <div className="px-5 pb-5 animate-slideDown">
            <div className="section-divider" />
            {appsLoading ? (
              <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'oklch(0.55 0.04 260)' }}>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-rajdhani">Loading...</span>
              </div>
            ) : appsEvents.length === 0 ? (
              <p className="text-center py-8 font-rajdhani text-sm" style={{ color: 'oklch(0.45 0.04 260)' }}>
                No apps/events found. Admin needs to upload data.
              </p>
            ) : (
              <div className="space-y-4">
                {appsEvents.map(app => (
                  <div key={app.name} className="animate-fadeInUp">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-orbitron font-bold text-xs uppercase tracking-wider" style={{ color: 'oklch(0.82 0.20 70)' }}>
                        {app.name}
                      </h4>
                      <span className="text-xs font-rajdhani" style={{ color: 'oklch(0.55 0.04 260)' }}>
                        {app.usernames.length} users
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {app.usernames.map((username, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-lg text-xs font-rajdhani flex items-center gap-1.5"
                          style={{
                            background: 'oklch(0.10 0.025 260 / 0.8)',
                            border: '1px solid oklch(0.22 0.05 260 / 0.4)',
                            color: 'oklch(0.75 0.04 260)',
                          }}
                        >
                          <span style={{ color: 'oklch(0.45 0.04 260)' }}>{idx + 1}.</span>
                          {username}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
