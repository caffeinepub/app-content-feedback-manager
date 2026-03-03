import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Music, VolumeX } from 'lucide-react';
import { usePublicSettings } from './hooks/useQueries';
import UserView from './views/UserView';
import LiveChecker from './views/LiveChecker';
import UploadView from './views/UploadView';
import AdminView from './views/admin/AdminView';
import { Toaster } from './components/ui/sonner';

function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const getMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - now.getTime();
    };

    const format = (ms: number) => {
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const tick = () => setTimeLeft(format(getMidnight()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="countdown-banner mx-auto w-fit px-4 py-1.5 rounded-full text-xs font-mono font-semibold tracking-widest mb-3">
      ⏳ Resets in {timeLeft}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || theme === 'system';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
      title="Toggle theme"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

function MusicToggle() {
  const { data: publicSettings } = usePublicSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const musicUrl = publicSettings?.musicFile ? publicSettings.musicFile.getDirectURL() : null;

  useEffect(() => {
    if (!musicUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
    }
  }, [musicUrl]);

  if (!musicUrl) return null;

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
      title={playing ? 'Pause music' : 'Play music'}
    >
      {playing ? <Music className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
}

type Tab = 'comment' | 'live' | 'upload' | 'admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('comment');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'comment', label: '💬 Comment' },
    { id: 'live', label: '🔴 Live' },
    { id: 'upload', label: '📤 Upload' },
    { id: 'admin', label: '⚙️ Admin' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/assets/generated/app-avatar-icon.dim_128x128.png" alt="Logo" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-base gradient-text">Reviews World</span>
            </div>
            <div className="flex items-center gap-2">
              <MusicToggle />
              <ThemeToggle />
            </div>
          </div>
          <CountdownBanner />
          {/* Tabs */}
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {activeTab === 'comment' && <UserView />}
        {activeTab === 'live' && <LiveChecker />}
        {activeTab === 'upload' && <UploadView />}
        {activeTab === 'admin' && <AdminView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Reviews World · Built with{' '}
          <span className="text-red-500">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'reviews-world')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster />
    </div>
  );
}
