import React, { useState, useRef, useEffect } from 'react';
import { Key, RefreshCw, Eye, EyeOff, Save, Music, Upload } from 'lucide-react';
import { useActor } from '../../hooks/useActor';
import { useGetAccessKey, useSetAccessKey, useGetSettings, useUpdateSettings } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';

export default function AdminSettings() {
  const { actor } = useActor();

  // Access Key
  const { data: currentKey, isLoading: keyLoading } = useGetAccessKey();
  const setAccessKey = useSetAccessKey();

  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [keySuccess, setKeySuccess] = useState('');

  // Music Settings
  const { data: settings, isLoading: settingsLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const [bgMusicEnabled, setBgMusicEnabled] = useState(false);
  const [musicUploadProgress, setMusicUploadProgress] = useState<number | null>(null);
  const [musicError, setMusicError] = useState('');
  const [musicSuccess, setMusicSuccess] = useState('');
  const musicFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setBgMusicEnabled(settings.bgMusicEnabled);
    }
  }, [settings]);

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewKey(result);
  };

  const handleSaveKey = async () => {
    const key = newKey.trim();
    if (!key) {
      setKeyError('Please enter a key');
      return;
    }
    if (!actor) {
      setKeyError('Not connected. Please refresh and try again.');
      return;
    }
    setKeyError('');
    setKeySuccess('');
    try {
      await setAccessKey.mutateAsync(key);
      setKeySuccess('Access key saved successfully!');
      setNewKey('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setKeyError(`Failed to save access key: ${msg}`);
    }
  };

  const handleMusicToggle = async (enabled: boolean) => {
    if (!actor) return;
    setBgMusicEnabled(enabled);
    try {
      const musicFile = settings?.musicFile ?? null;
      await updateSettings.mutateAsync({ bgMusicEnabled: enabled, musicFile: musicFile as ExternalBlob | null });
    } catch (err: unknown) {
      console.error('Failed to update music settings:', err);
      setBgMusicEnabled(!enabled); // revert
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!actor) {
      setMusicError('Not connected. Please refresh and try again.');
      return;
    }
    setMusicError('');
    setMusicSuccess('');
    setMusicUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(pct => {
        setMusicUploadProgress(pct);
      });
      await updateSettings.mutateAsync({ bgMusicEnabled, musicFile: blob });
      setMusicSuccess('Music file uploaded successfully!');
      setMusicUploadProgress(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMusicError(`Failed to upload music: ${msg}`);
      setMusicUploadProgress(null);
    }
    if (musicFileRef.current) musicFileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Access Key Management */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          Access Key Management
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          The access key is required for users to use the Bulk Comments Generator.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">Current Access Key</label>
          {keyLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm font-mono text-muted-foreground">
                {currentKey
                  ? (showKey ? currentKey : '•'.repeat(Math.min(currentKey.length, 16)))
                  : 'No key set'}
              </div>
              {currentKey && (
                <button
                  onClick={() => setShowKey(v => !v)}
                  className="text-muted-foreground hover:text-foreground p-2 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-foreground mb-1">Set New Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
              placeholder="Enter new access key..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSaveKey}
              disabled={setAccessKey.isPending || !newKey.trim()}
              className="gradient-button px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {setAccessKey.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <><Save className="w-4 h-4" /> Save</>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={generateRandomKey}
          className="border border-border px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/30 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate Random Key
        </button>

        {keyError && <p className="mt-2 text-sm text-destructive">{keyError}</p>}
        {keySuccess && <p className="mt-2 text-sm text-green-400">{keySuccess}</p>}
      </div>

      {/* Background Music */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Background Music
        </h3>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-foreground">Enable Background Music</p>
            <p className="text-sm text-muted-foreground">Play music automatically when the app loads</p>
          </div>
          <button
            onClick={() => handleMusicToggle(!bgMusicEnabled)}
            disabled={updateSettings.isPending || settingsLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              bgMusicEnabled ? 'bg-primary' : 'bg-muted'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                bgMusicEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Upload Music File</label>
          <button
            onClick={() => musicFileRef.current?.click()}
            disabled={updateSettings.isPending}
            className="border border-border px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/30 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Upload Music File
          </button>
          <input
            ref={musicFileRef}
            type="file"
            accept=".mp3,.wav,.ogg,.aac"
            onChange={handleMusicUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-1">Supported formats: MP3, WAV, OGG, AAC</p>
          {musicUploadProgress !== null && (
            <div className="mt-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${musicUploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{musicUploadProgress}%</p>
            </div>
          )}
          {musicError && <p className="mt-2 text-sm text-destructive">{musicError}</p>}
          {musicSuccess && <p className="mt-2 text-sm text-green-400">{musicSuccess}</p>}
        </div>
      </div>
    </div>
  );
}
