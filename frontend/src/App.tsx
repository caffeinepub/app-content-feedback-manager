import { useState, useEffect, useRef } from 'react';
import UserView from './views/UserView';
import { UploadView } from './views/UploadView';
import LiveChecker from './views/LiveChecker';
import AdminView from './views/admin/AdminView';
import { Toaster } from '@/components/ui/sonner';
import { Radio, Upload, Shield, User } from 'lucide-react';

const TABS = [
  { id: 'user', label: 'User View', icon: User },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'live', label: 'Live Checker', icon: Radio },
  { id: 'admin', label: 'Admin', icon: Shield },
] as const;

type TabId = typeof TABS[number]['id'];

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('');
  const [message] = useState(() => {
    const messages = [
      'Make the most of today! ✨',
      'Keep pushing forward! 💪',
      'Every second counts! ⚡',
      'Stay focused! 🎯',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-3 mx-4 mb-4 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm">
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Time Until Midnight</span>
        <span className="text-2xl font-bold text-primary font-mono tracking-wider">{timeLeft}</span>
        <span className="text-xs text-muted-foreground mt-0.5">{message}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('user');

  return (
    <div className="min-h-screen app-bg-gradient text-foreground">
      <div className="floating-shapes" aria-hidden="true">
        <div className="shape" />
        <div className="shape" />
        <div className="shape" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-0 pb-24">
        {/* Header */}
        <header className="pt-6 pb-2 px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/40">
            <img
              src="/assets/generated/app-avatar-icon.dim_128x128.png"
              alt="App"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold gradient-heading leading-tight">App Content &amp; Features</h1>
            <p className="text-xs text-muted-foreground">Manage your content efficiently</p>
          </div>
        </header>

        {/* Countdown */}
        <div className="mt-4">
          <CountdownTimer />
        </div>

        {/* Tab Navigation */}
        <nav className="px-4 mb-4">
          <div className="flex gap-1 bg-card/40 border border-border/30 rounded-2xl p-1 backdrop-blur-sm overflow-x-auto scrollbar-hide">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        <main className="px-4">
          {activeTab === 'user' && <UserView />}
          {activeTab === 'upload' && <UploadView />}
          {activeTab === 'live' && <LiveChecker />}
          {activeTab === 'admin' && <AdminView />}
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-muted-foreground border-t border-border/20 mt-8">
        <p>
          Built with{' '}
          <span className="text-red-400">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.hostname : 'app-content-features'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
        <p className="mt-1">© {new Date().getFullYear()} App Content &amp; Features</p>
      </footer>

      <Toaster />
    </div>
  );
}
