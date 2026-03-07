import { Eye, EyeOff, Key, Music, RefreshCw, Save } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  useGetSettings,
  useSetAccessKey,
  useSetBgMusicEnabled,
} from "../../hooks/useQueries";

export default function AdminSettings() {
  const { data: settings } = useGetSettings();
  const setAccessKeyMutation = useSetAccessKey();
  const setBgMusicEnabled = useSetBgMusicEnabled();

  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const accessKey = settings?.accessKey ?? null;

  const handleSetKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newKey.trim()) return;
    try {
      await setAccessKeyMutation.mutateAsync(newKey.trim());
      setNewKey("");
      setSuccess("Access key updated successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to set access key");
    }
  };

  const handleRegenerateKey = async () => {
    setError(null);
    setSuccess(null);
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomKey = Array.from(
      { length: 16 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
    try {
      await setAccessKeyMutation.mutateAsync(randomKey);
      setSuccess(`New key generated: ${randomKey}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to regenerate key");
    }
  };

  const handleMusicToggle = async () => {
    setError(null);
    try {
      await setBgMusicEnabled.mutateAsync(!settings?.bgMusicEnabled);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update settings",
      );
    }
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-rajdhani animate-fadeIn"
          style={{
            background: "oklch(0.55 0.22 25 / 0.12)",
            border: "1px solid oklch(0.55 0.22 25 / 0.3)",
            color: "oklch(0.65 0.22 25)",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-rajdhani animate-fadeIn"
          style={{
            background: "oklch(0.65 0.18 145 / 0.12)",
            border: "1px solid oklch(0.65 0.18 145 / 0.3)",
            color: "oklch(0.72 0.20 145)",
          }}
        >
          {success}
        </div>
      )}

      {/* Access Key Management */}
      <div className="glass-card-gold p-5 rounded-2xl">
        <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 gradient-heading flex items-center gap-2">
          <Key className="w-4 h-4" style={{ color: "oklch(0.82 0.20 70)" }} />
          Access Key Management
        </h3>

        {/* Current Key */}
        <div
          className="mb-4 p-3 rounded-xl"
          style={{
            background: "oklch(0.10 0.025 260 / 0.8)",
            border: "1px solid oklch(0.22 0.05 260 / 0.4)",
          }}
        >
          <div
            className="text-xs font-rajdhani mb-1"
            style={{ color: "oklch(0.50 0.04 260)" }}
          >
            Current Access Key
          </div>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 text-sm font-orbitron"
              style={{ color: "oklch(0.82 0.20 70)" }}
            >
              {accessKey
                ? showKey
                  ? accessKey
                  : "••••••••••••••••"
                : "No key set"}
            </code>
            {accessKey && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                style={{
                  background: "oklch(0.16 0.03 260 / 0.6)",
                  color: "oklch(0.55 0.04 260)",
                }}
              >
                {showKey ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Set Custom Key */}
        <form onSubmit={handleSetKey} className="flex gap-2 mb-3">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Enter custom access key"
            className="glass-input flex-1 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={setAccessKeyMutation.isPending || !newKey.trim()}
            className="px-3 py-2.5 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center gap-1.5"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
              color: "oklch(0.08 0.02 260)",
              opacity:
                setAccessKeyMutation.isPending || !newKey.trim() ? 0.5 : 1,
            }}
          >
            {setAccessKeyMutation.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Set Key
          </button>
        </form>

        <button
          type="button"
          onClick={handleRegenerateKey}
          disabled={setAccessKeyMutation.isPending}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-rajdhani font-600 text-xs transition-all duration-300 hover-lift"
          style={{
            background: "oklch(0.70 0.20 185 / 0.12)",
            border: "1px solid oklch(0.70 0.20 185 / 0.25)",
            color: "oklch(0.78 0.22 188)",
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate Random Key
        </button>
      </div>

      {/* Background Music */}
      <div className="glass-card p-5 rounded-2xl">
        <h3
          className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"
          style={{ color: "oklch(0.78 0.22 188)" }}
        >
          <Music className="w-4 h-4" />
          Background Music
        </h3>

        <div className="flex items-center justify-between mb-4">
          <span
            className="font-rajdhani font-600 text-sm"
            style={{ color: "oklch(0.75 0.04 260)" }}
          >
            Music Enabled
          </span>
          <button
            type="button"
            onClick={handleMusicToggle}
            disabled={setBgMusicEnabled.isPending}
            className="relative w-12 h-6 rounded-full transition-all duration-300"
            style={{
              background: settings?.bgMusicEnabled
                ? "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))"
                : "oklch(0.22 0.05 260)",
            }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full transition-transform duration-300"
              style={{
                background: "oklch(0.95 0.02 80)",
                transform: settings?.bgMusicEnabled
                  ? "translateX(28px)"
                  : "translateX(4px)",
              }}
            />
          </button>
        </div>

        <p
          className="text-xs font-rajdhani"
          style={{ color: "oklch(0.50 0.04 260)" }}
        >
          Toggle background music on or off. Music URL can be configured via the
          backend settings.
        </p>

        {settings?.musicFile && (
          <div
            className="mt-3 text-xs font-rajdhani"
            style={{ color: "oklch(0.72 0.20 145)" }}
          >
            ✓ Music file configured
          </div>
        )}
      </div>
    </div>
  );
}
