import React, { useState } from 'react';
import { Key, Music, Eye, EyeOff, RefreshCw, Save } from 'lucide-react';
import { useGetSettings, useUpdateSettings, useSetAccessKey, useGetAccessKey } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';

export default function AdminSettings() {
  const { data: settings } = useGetSettings();
  const { data: accessKey } = useGetAccessKey();
  const updateSettings = useUpdateSettings();
  const setAccessKey = useSetAccessKey();

  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSetKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newKey.trim()) return;
    try {
      await setAccessKey.mutateAsync(newKey.trim());
      setNewKey('');
      setSuccess('Access key updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to set access key');
    }
  };

  const handleRegenerateKey = async () => {
    setError(null);
    setSuccess(null);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomKey = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    try {
      await setAccessKey.mutateAsync(randomKey);
      setSuccess(`New key generated: ${randomKey}`);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate key');
    }
  };

  const handleMusicToggle = async () => {
    setError(null);
    try {
      await updateSettings.mutateAsync({
        bgMusicEnabled: !settings?.bgMusicEnabled,
        musicFile: settings?.musicFile ?? null,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      await updateSettings.mutateAsync({
        bgMusicEnabled: settings?.bgMusicEnabled ?? false,
        musicFile: blob,
      });
      setSuccess('Music file uploaded successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to upload music');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-primary/10 border border-primary/30 text-primary rounded-xl px-4 py-3 text-sm">
          {success}
        </div>
      )}

      {/* Access Key Management */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          Access Key Management
        </h3>

        {/* Current Key */}
        <div className="mb-4 p-3 bg-background/30 rounded-xl">
          <div className="text-xs text-muted-foreground mb-1">Current Access Key</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-foreground">
              {accessKey ? (showKey ? accessKey : '••••••••••••••••') : 'No key set'}
            </code>
            {accessKey && (
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Set Custom Key */}
        <form onSubmit={handleSetKey} className="flex gap-2 mb-3">
          <input
            type="text"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder="Enter custom access key"
            className="flex-1 px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={setAccessKey.isPending || !newKey.trim()}
            className="gradient-button px-3 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
          >
            {setAccessKey.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Set Key
          </button>
        </form>

        <button
          onClick={handleRegenerateKey}
          disabled={setAccessKey.isPending}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground text-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate Random Key
        </button>
      </div>

      {/* Background Music */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" />
          Background Music
        </h3>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-foreground">Music Enabled</span>
          <button
            onClick={handleMusicToggle}
            disabled={updateSettings.isPending}
            className={`relative w-12 h-6 rounded-full transition-colors ${settings?.bgMusicEnabled ? 'bg-primary' : 'bg-muted'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings?.bgMusicEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground text-sm cursor-pointer transition-colors w-fit">
          <Music className="w-3.5 h-3.5" />
          Upload Music File
          <input type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
        </label>

        {settings?.musicFile && (
          <div className="mt-3 text-xs text-muted-foreground">
            ✓ Music file uploaded
          </div>
        )}
      </div>
    </div>
  );
}
