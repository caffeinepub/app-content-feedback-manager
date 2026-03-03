import React, { useState, useRef } from 'react';
import { Settings, Music, Key, Eye, EyeOff, RefreshCw, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useSettings, useSetAccessKey, useUploadMusicFile } from '../../hooks/useQueries';

function generateRandomKey(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AdminSettings() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const setAccessKeyMutation = useSetAccessKey();
  const uploadMusicMutation = useUploadMusicFile();

  // Access key state
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Music upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [musicFeedback, setMusicFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSetKey = async () => {
    if (!keyInput.trim()) return;
    setKeyFeedback(null);
    try {
      await setAccessKeyMutation.mutateAsync(keyInput.trim());
      setKeyFeedback({ type: 'success', message: 'Access key updated successfully!' });
      setKeyInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set access key';
      setKeyFeedback({ type: 'error', message: msg });
    }
  };

  const handleRegenerateKey = async () => {
    const newKey = generateRandomKey();
    setKeyInput(newKey);
    setKeyFeedback(null);
    try {
      await setAccessKeyMutation.mutateAsync(newKey);
      setKeyFeedback({ type: 'success', message: `New key generated and saved: ${newKey}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to regenerate key';
      setKeyFeedback({ type: 'error', message: msg });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMusicFeedback(null);
      setUploadProgress(null);
    }
  };

  const handleUploadMusic = async () => {
    if (!selectedFile) return;
    setMusicFeedback(null);
    setUploadProgress(0);
    try {
      await uploadMusicMutation.mutateAsync({
        file: selectedFile,
        onProgress: (pct) => setUploadProgress(pct),
      });
      setMusicFeedback({ type: 'success', message: `"${selectedFile.name}" uploaded successfully!` });
      setSelectedFile(null);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload music file';
      setMusicFeedback({ type: 'error', message: msg });
      setUploadProgress(null);
    }
  };

  const currentKey = settings?.accessKey;
  const currentMusicUrl = settings?.musicFile ? settings.musicFile.getDirectURL() : null;

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Admin Settings</h2>
          <p className="text-sm text-muted-foreground">Manage access keys and background music</p>
        </div>
      </div>

      {/* Access Key Management */}
      <div className="space-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Access Key Management</h3>
        </div>

        {/* Current key display */}
        {currentKey && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <span className="text-xs text-muted-foreground flex-1 font-mono">
              {showKey ? currentKey : '•'.repeat(Math.min(currentKey.length, 20))}
            </span>
            <button
              onClick={() => setShowKey((v) => !v)}
              className="p-1 rounded hover:bg-muted transition-colors"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}
        {!currentKey && (
          <p className="text-sm text-muted-foreground italic">No access key set.</p>
        )}

        {/* Set custom key */}
        <div className="flex gap-2">
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Enter new access key…"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => e.key === 'Enter' && handleSetKey()}
          />
          <button
            onClick={handleSetKey}
            disabled={!keyInput.trim() || setAccessKeyMutation.isPending}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {setAccessKeyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Set Key
          </button>
          <button
            onClick={handleRegenerateKey}
            disabled={setAccessKeyMutation.isPending}
            className="px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Generate random key"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        </div>

        {/* Key feedback */}
        {keyFeedback && (
          <div
            className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
              keyFeedback.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {keyFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {keyFeedback.message}
          </div>
        )}
      </div>

      {/* Background Music */}
      <div className="space-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Music className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Background Music</h3>
        </div>

        {/* Current music */}
        {currentMusicUrl && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
            <p className="text-xs text-muted-foreground">Current music file:</p>
            <audio controls src={currentMusicUrl} className="w-full h-8" />
          </div>
        )}
        {!currentMusicUrl && (
          <p className="text-sm text-muted-foreground italic">No music file uploaded.</p>
        )}

        {/* File picker */}
        <div className="flex gap-2 items-center">
          <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground truncate">
              {selectedFile ? selectedFile.name : 'Choose audio file…'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          <button
            onClick={handleUploadMusic}
            disabled={!selectedFile || uploadMusicMutation.isPending}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {uploadMusicMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload
          </button>
        </div>

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Music feedback */}
        {musicFeedback && (
          <div
            className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
              musicFeedback.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {musicFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {musicFeedback.message}
          </div>
        )}
      </div>
    </div>
  );
}
