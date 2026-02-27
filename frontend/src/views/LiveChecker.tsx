import { useState } from 'react';
import { useAppsEvents } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CheckCircle, XCircle, Shield } from 'lucide-react';

export function LiveChecker() {
  const { data: appsEvents, isLoading } = useAppsEvents();
  const [username, setUsername] = useState('');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<{ found: string[]; notFound: string[] } | null>(null);
  const [checked, setChecked] = useState(false);

  const allSelected = appsEvents ? selectedApps.size === appsEvents.length : false;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(appsEvents?.map(a => a.name) || []));
    }
  };

  const toggleApp = (name: string) => {
    const next = new Set(selectedApps);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedApps(next);
  };

  const handleCheck = () => {
    if (!username.trim() || !appsEvents) return;
    const lower = username.trim().toLowerCase();
    const found: string[] = [];
    const notFound: string[] = [];
    appsEvents.filter(a => selectedApps.has(a.name)).forEach(app => {
      const inList = app.usernames.some(u => u.toLowerCase() === lower);
      if (inList) found.push(app.name);
      else notFound.push(app.name);
    });
    setResults({ found, notFound });
    setChecked(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold neon-text">Live Checker</h2>
        <p className="text-muted-foreground mt-1">Check username presence across apps/events</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-neon-teal" />
          <h3 className="font-display font-semibold text-lg">Username Lookup</h3>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Username to Check</label>
          <Input
            placeholder="Enter username..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="bg-secondary border-border"
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">Select Apps/Events</label>
            <button
              onClick={toggleSelectAll}
              className="text-xs text-neon-teal hover:underline"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full bg-secondary" />)}
            </div>
          ) : appsEvents && appsEvents.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer" onClick={toggleSelectAll}>
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                <span className="text-sm font-medium text-foreground">Select All</span>
              </div>
              {appsEvents.map(app => (
                <div
                  key={app.name}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                  onClick={() => toggleApp(app.name)}
                >
                  <Checkbox
                    checked={selectedApps.has(app.name)}
                    onCheckedChange={() => toggleApp(app.name)}
                  />
                  <span className="text-sm text-foreground flex-1">{app.name}</span>
                  <span className="text-xs text-muted-foreground">{app.usernames.length} users</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">No apps/events available.</p>
          )}
        </div>

        <Button
          onClick={handleCheck}
          disabled={!username.trim() || selectedApps.size === 0}
          className="gradient-btn text-white font-semibold w-full"
        >
          <Search className="w-4 h-4 mr-2" />
          Check Username
        </Button>

        {checked && results && (
          <div className="space-y-3 animate-fade-in">
            {results.found.length > 0 && (
              <div className="bg-secondary rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  <span className="font-semibold text-neon-green text-sm">Found in:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.found.map(name => (
                    <span key={name} className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: 'oklch(0.65 0.2 160 / 0.2)', color: 'oklch(0.75 0.22 155)' }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {results.notFound.length > 0 && (
              <div className="bg-secondary rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <span className="font-semibold text-destructive text-sm">Not found in:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.notFound.map(name => (
                    <span key={name} className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {results.found.length === 0 && results.notFound.length === 0 && (
              <p className="text-muted-foreground text-sm text-center">No apps/events selected.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
