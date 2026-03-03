import React, { useState, useEffect, useRef } from 'react';
import { Music, Music2, Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import AdminView from './views/admin/AdminView';
import UserView from './views/UserView';
import LiveChecker from './views/LiveChecker';
import { UploadView } from './views/UploadView';
import { useGetSettings } from './hooks/useQueries';

type Tab = 'comment' | 'live' | 'upload' | 'admin';

function getMidnightCountdown() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // next midnight
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { hours, minutes, seconds };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('comment');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { data: settings } = useGetSettings();

  // Countdown to midnight
  const [timeLeft, setTimeLeft] = useState(getMidnightCountdown);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getMidnightCountdown());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Music control
  useEffect(() => {
    if (settings?.bgMusicEnabled && settings?.musicFile) {
      const url = settings.musicFile.getDirectURL();
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.loop = true;
      }
      if (musicPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [musicPlaying, settings]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'comment', label: 'Comment' },
    { id: 'live', label: 'Live' },
    { id: 'upload', label: 'Upload' },
    { id: 'admin', label: 'Admin' },
  ];

  const isDark = resolvedTheme === 'dark';

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="min-h-screen app-bg-gradient flex flex-col">
      <div className="floating-shapes" aria-hidden="true">
        <div className="shape" />
        <div className="shape" />
        <div className="shape" />
      </div>

      {/* Midnight Countdown Banner */}
      <div className="relative z-10 w-full flex justify-center pt-3 px-4">
        <div className="countdown-banner flex items-center gap-2 px-5 py-2 rounded-full">
          <span className="countdown-label text-xs font-semibold uppercase tracking-widest opacity-70">
            Midnight in
          </span>
          <div className="flex items-center gap-1">
            {[
              { v: timeLeft.hours, l: 'h' },
              { v: timeLeft.minutes, l: 'm' },
              { v: timeLeft.seconds, l: 's' },
            ].map(({ v, l }, i) => (
              <React.Fragment key={l}>
                {i > 0 && <span className="countdown-sep font-mono font-bold opacity-50">:</span>}
                <span className="countdown-digit font-mono font-bold text-sm">
                  {pad(v)}<span className="text-xs opacity-60 ml-0.5">{l}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-3 pb-2">
        <div className="max-w-2xl mx-auto">
          <div className="space-card px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/app-avatar-icon.dim_128x128.png"
                alt="Reviews World"
                className="w-9 h-9 rounded-xl"
              />
              <div>
                <h1 className="gradient-heading text-lg font-bold leading-tight">Reviews World</h1>
                <p className="text-xs text-muted-foreground">Comment Tools</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Light/Dark Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              )}
              {/* Music toggle */}
              <button
                onClick={() => setMusicPlaying((p) => !p)}
                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
                title={musicPlaying ? 'Pause music' : 'Play music'}
              >
                {musicPlaying ? <Music2 size={16} /> : <Music size={16} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="relative z-10 px-4 py-2">
        <div className="max-w-2xl mx-auto">
          <div className="space-card p-1 flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'gradient-button text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
                }`}
              >
                {tab.id === 'admin' && <Shield size={12} className="inline mr-1" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-4 py-2 pb-6">
        <div className="max-w-2xl mx-auto">
          {activeTab === 'comment' && <UserView />}
          {activeTab === 'live' && <LiveChecker />}
          {activeTab === 'upload' && <UploadView />}
          {activeTab === 'admin' && <AdminView />}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-4 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Reviews World · Built with{' '}
          <span className="text-red-400">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.hostname : 'reviews-world'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
