import {
  Eye,
  EyeOff,
  Key,
  Music,
  Music2,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import {
  useGetBulkCheckerEarningsEnabled,
  useGetEarningsMode,
  useGetMusicUrl,
  useGetPerLinkRate,
  useGetSettings,
  useGetSingleCheckerEarningsEnabled,
  useGetSpotifyUrl,
  useSetAccessKey,
  useSetBgMusicEnabled,
  useSetBulkCheckerEarningsEnabled,
  useSetEarningsMode,
  useSetMusicBlob,
  useSetMusicUrl,
  useSetPerLinkRate,
  useSetSingleCheckerEarningsEnabled,
  useSetSpotifyUrl,
  useWipeAllData,
} from "../../hooks/useQueries";

export default function AdminSettings() {
  const { data: settings } = useGetSettings();
  const { data: currentMusicUrl } = useGetMusicUrl();
  const setAccessKeyMutation = useSetAccessKey();
  const setBgMusicEnabled = useSetBgMusicEnabled();
  const setMusicUrlMutation = useSetMusicUrl();
  const wipeAll = useWipeAllData();
  const { data: currentSpotifyUrl } = useGetSpotifyUrl();
  const { data: perLinkRate = 0 } = useGetPerLinkRate();
  const setPerLinkRateMutation = useSetPerLinkRate();
  const setSpotifyUrlMutation = useSetSpotifyUrl();
  const setMusicBlobMutation = useSetMusicBlob();
  const { data: earningsMode = "flatRate" } = useGetEarningsMode();
  const setEarningsModeMutation = useSetEarningsMode();
  const { data: singleCheckerEarningsEnabled = true } =
    useGetSingleCheckerEarningsEnabled();
  const setSingleCheckerEarningsMutation = useSetSingleCheckerEarningsEnabled();
  const { data: bulkCheckerEarningsEnabled = true } =
    useGetBulkCheckerEarningsEnabled();
  const setBulkCheckerEarningsMutation = useSetBulkCheckerEarningsEnabled();
  const [spotifyInput, setSpotifyInput] = useState("");
  const [rateInput, setRateInput] = useState("");
  const [waLink, setWaLink] = useState(
    () =>
      localStorage.getItem("waLink") ??
      "https://chat.whatsapp.com/JZ5w3hyx4gYDtPWx91Xena",
  );
  const [waNumber, setWaNumber] = useState(
    () => localStorage.getItem("waNumber") ?? "7986131899",
  );
  const [waDesc, setWaDesc] = useState(
    () =>
      localStorage.getItem("waDesc") ??
      "Join our elite community for premium review work. We provide high-quality engagement at the best market prices with guaranteed weekly payouts.",
  );

  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [wipeConfirm, setWipeConfirm] = useState("");
  const [wipeChecked, setWipeChecked] = useState(false);

  // Music upload state
  const [musicUrlInput, setMusicUrlInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/x-m4a",
    ];
    if (
      !allowedTypes.includes(file.type) &&
      !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)
    ) {
      setError("Please select an MP3, WAV, OGG, or M4A audio file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    setIsUploadingMusic(true);
    setError(null);
    setSuccess(null);
    try {
      // Use ExternalBlob for large file uploads (bypasses IC 2MB limit)
      await setMusicBlobMutation.mutateAsync(selectedFile);
      setSuccess(`Music uploaded: ${selectedFile.name}`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload music");
    } finally {
      setIsUploadingMusic(false);
    }
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicUrlInput.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      await setMusicUrlMutation.mutateAsync(musicUrlInput.trim());
      setSuccess("Music URL saved.");
      setMusicUrlInput("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save music URL");
    }
  };

  const handleClearMusic = async () => {
    setError(null);
    setSuccess(null);
    try {
      // Set empty string to clear
      await setMusicUrlMutation.mutateAsync("");
      setSuccess("Music cleared.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to clear music");
    }
  };

  const handleWipeAll = async () => {
    if (!wipeChecked || wipeConfirm !== "WIPE") return;
    setError(null);
    setSuccess(null);
    try {
      await wipeAll.mutateAsync();
      setWipeConfirm("");
      setWipeChecked(false);
      setSuccess("All data wiped successfully.");
      localStorage.clear();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to wipe data");
    }
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm animate-fadeIn"
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
          className="rounded-xl px-4 py-3 text-sm animate-fadeIn"
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
            className="text-xs mb-1"
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
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-300 hover-lift"
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

        {/* Enable toggle */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-sm font-medium"
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
            data-ocid="settings.music_enabled.toggle"
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

        {/* Current music */}
        {currentMusicUrl && (
          <div
            className="mb-4 p-3 rounded-xl flex items-center justify-between gap-2"
            style={{
              background: "oklch(0.70 0.20 185 / 0.08)",
              border: "1px solid oklch(0.70 0.20 185 / 0.25)",
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Music
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "oklch(0.72 0.20 145)" }}
              />
              <span
                className="text-xs truncate"
                style={{ color: "oklch(0.72 0.20 145)" }}
              >
                {currentMusicUrl.startsWith("data:")
                  ? "Uploaded audio file"
                  : currentMusicUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearMusic}
              className="p-1.5 rounded-lg flex-shrink-0 transition-all hover:scale-110"
              style={{
                background: "oklch(0.55 0.22 25 / 0.15)",
                color: "oklch(0.65 0.22 25)",
              }}
              title="Remove music"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Upload file */}
        <div
          className="p-4 rounded-xl mb-3"
          style={{
            background: "oklch(0.10 0.025 260 / 0.6)",
            border: "1px solid oklch(0.22 0.05 260 / 0.4)",
          }}
        >
          <p
            className="text-xs mb-3 font-medium"
            style={{ color: "oklch(0.65 0.04 260)" }}
          >
            Upload audio file (MP3, WAV, OGG · max 10MB)
          </p>
          <div className="flex items-center gap-2">
            <label
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-all hover-lift"
              style={{
                background: "oklch(0.16 0.03 260 / 0.8)",
                border: "1px solid oklch(0.28 0.06 260 / 0.5)",
                color: "oklch(0.70 0.04 260)",
              }}
            >
              <Upload className="w-3.5 h-3.5" />
              {selectedFile ? selectedFile.name : "Choose file"}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"
                onChange={handleFileSelect}
                className="hidden"
                data-ocid="settings.music.upload_button"
              />
            </label>
            {selectedFile && (
              <button
                type="button"
                onClick={handleUploadFile}
                disabled={isUploadingMusic}
                className="px-3 py-2 rounded-lg text-xs font-bold transition-all hover-lift flex items-center gap-1.5"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
                  color: "oklch(0.08 0.02 260)",
                  opacity: isUploadingMusic ? 0.6 : 1,
                }}
                data-ocid="settings.music.save_button"
              >
                {isUploadingMusic ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {isUploadingMusic ? "Uploading..." : "Upload"}
              </button>
            )}
          </div>
        </div>

        {/* Or enter URL */}
        <p className="text-xs mb-2" style={{ color: "oklch(0.50 0.04 260)" }}>
          Or enter a direct music URL:
        </p>
        <form onSubmit={handleSaveUrl} className="flex gap-2">
          <input
            type="url"
            value={musicUrlInput}
            onChange={(e) => setMusicUrlInput(e.target.value)}
            placeholder="https://example.com/music.mp3"
            className="glass-input flex-1 px-3 py-2.5 text-sm"
            data-ocid="settings.music_url.input"
          />
          <button
            type="submit"
            disabled={setMusicUrlMutation.isPending || !musicUrlInput.trim()}
            className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover-lift flex items-center gap-1.5"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
              color: "oklch(0.08 0.02 260)",
              opacity:
                setMusicUrlMutation.isPending || !musicUrlInput.trim()
                  ? 0.5
                  : 1,
            }}
            data-ocid="settings.music_url.save_button"
          >
            {setMusicUrlMutation.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        </form>
      </div>

      {/* Spotify Player */}
      <div className="glass-card p-5 rounded-2xl">
        <h3
          className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"
          style={{ color: "#00FFFF" }}
        >
          <Music2 className="w-4 h-4" />
          Spotify Player
        </h3>
        <p className="text-xs mb-4" style={{ color: "oklch(0.55 0.04 260)" }}>
          Paste any Spotify track, playlist, or album link. It will appear as a
          sticky neon player for all visitors.
        </p>
        {currentSpotifyUrl && (
          <div
            className="mb-4 p-3 rounded-xl flex items-center justify-between gap-2"
            style={{
              background: "rgba(0,255,255,0.07)",
              border: "1px solid rgba(0,255,255,0.25)",
            }}
          >
            <span
              className="text-xs truncate flex-1"
              style={{ color: "#00FFFF" }}
            >
              {currentSpotifyUrl}
            </span>
            <button
              type="button"
              onClick={() => setSpotifyUrlMutation.mutate("")}
              className="p-1.5 rounded-lg flex-shrink-0 transition-all hover:scale-110"
              style={{
                background: "oklch(0.55 0.22 25 / 0.15)",
                color: "oklch(0.65 0.22 25)",
              }}
              title="Remove Spotify player"
              data-ocid="settings.spotify.delete_button"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (spotifyInput.trim()) {
              setSpotifyUrlMutation.mutate(spotifyInput.trim());
              setSpotifyInput("");
            }
          }}
          className="flex gap-2"
        >
          <input
            type="url"
            value={spotifyInput}
            onChange={(e) => setSpotifyInput(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            className="glass-input flex-1 px-3 py-2.5 text-sm"
            data-ocid="settings.spotify.input"
          />
          <button
            type="submit"
            disabled={setSpotifyUrlMutation.isPending || !spotifyInput.trim()}
            className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover-lift flex items-center gap-1.5"
            style={{
              background: "linear-gradient(135deg, #00FFFF, #0099ff)",
              color: "#050A30",
              opacity: !spotifyInput.trim() ? 0.5 : 1,
            }}
            data-ocid="settings.spotify.save_button"
          >
            {setSpotifyUrlMutation.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        </form>
      </div>

      {/* Community / WhatsApp Settings */}
      <div
        className="glass-card p-5 rounded-2xl"
        data-ocid="admin.community.panel"
      >
        <h3
          className="font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"
          style={{ color: "#25D366" }}
        >
          <span>💬</span> Community / WhatsApp
        </h3>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="wa-link"
              className="block text-xs mb-1"
              style={{ color: "oklch(0.55 0.04 260)" }}
            >
              WhatsApp Group Link
            </label>
            <input
              id="wa-link"
              type="url"
              value={waLink}
              onChange={(e) => setWaLink(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="glass-input w-full px-3 py-2.5 text-sm"
              data-ocid="admin.whatsapp.input"
            />
          </div>
          <div>
            <label
              htmlFor="wa-number"
              className="block text-xs mb-1"
              style={{ color: "oklch(0.55 0.04 260)" }}
            >
              Contact Number (display)
            </label>
            <input
              id="wa-number"
              type="text"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="e.g. 7986131899"
              className="glass-input w-full px-3 py-2.5 text-sm"
              data-ocid="admin.contact.input"
            />
          </div>
          <div>
            <label
              htmlFor="wa-desc"
              className="block text-xs mb-1"
              style={{ color: "oklch(0.55 0.04 260)" }}
            >
              Community Description
            </label>
            <textarea
              id="wa-desc"
              value={waDesc}
              onChange={(e) => setWaDesc(e.target.value)}
              placeholder="Community description shown in footer..."
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={3}
              data-ocid="admin.description.textarea"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("waLink", waLink);
              localStorage.setItem("waNumber", waNumber);
              localStorage.setItem("waDesc", waDesc);
              setSuccess("Community settings saved.");
            }}
            className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover-lift flex items-center gap-1.5"
            style={{
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              color: "#fff",
            }}
            data-ocid="admin.community.save_button"
          >
            Save Community Settings
          </button>
        </div>
      </div>

      {/* Per Link Rate */}
      <div className="glass-card p-5 rounded-2xl">
        <h3
          className="font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2"
          style={{ color: "oklch(0.70 0.20 185)" }}
        >
          💰 Per Link Rate
        </h3>
        <p className="text-xs mb-4" style={{ color: "oklch(0.55 0.04 260)" }}>
          Set the earnings rate per valid link. Current rate: ₹
          {perLinkRate.toFixed(2)}
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "oklch(0.70 0.20 185)" }}
            >
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              placeholder={perLinkRate.toFixed(2)}
              className="glass-input w-full pl-8 pr-3 py-2.5 text-sm"
              data-ocid="admin.settings.rate.input"
            />
          </div>
          <button
            type="button"
            data-ocid="admin.settings.rate.save_button"
            onClick={async () => {
              const v = Number.parseFloat(rateInput);
              if (Number.isNaN(v) || v < 0) return;
              try {
                await setPerLinkRateMutation.mutateAsync(v);
                setRateInput("");
                setSuccess("Per link rate updated!");
              } catch (e: unknown) {
                setError(
                  e instanceof Error ? e.message : "Failed to update rate",
                );
              }
            }}
            disabled={setPerLinkRateMutation.isPending || !rateInput.trim()}
            className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
            style={{
              background: "oklch(0.70 0.20 185 / 0.15)",
              border: "1px solid oklch(0.70 0.20 185 / 0.4)",
              color: "oklch(0.78 0.22 188)",
              opacity: !rateInput.trim() ? 0.5 : 1,
            }}
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* Earnings Calculation Mode */}
      <div className="glass-card p-5 rounded-2xl">
        <h3
          className="font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2"
          style={{ color: "oklch(0.75 0.18 280)" }}
        >
          ⚡ Earnings Calculation Mode
        </h3>
        <p className="text-xs mb-4" style={{ color: "oklch(0.55 0.04 260)" }}>
          Choose how total earnings are calculated for the username checker.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            data-ocid="admin.settings.mode_a.toggle"
            disabled={setEarningsModeMutation.isPending}
            onClick={async () => {
              try {
                await setEarningsModeMutation.mutateAsync("valueSum");
                setSuccess("Earnings mode set to Value Sum!");
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to set mode");
              }
            }}
            className="p-3 rounded-xl text-left transition-all"
            style={{
              background:
                earningsMode === "valueSum"
                  ? "oklch(0.70 0.18 145 / 0.15)"
                  : "oklch(0.10 0.025 260 / 0.5)",
              border: `1px solid ${earningsMode === "valueSum" ? "oklch(0.65 0.20 145 / 0.5)" : "oklch(0.22 0.05 260 / 0.4)"}`,
              color:
                earningsMode === "valueSum"
                  ? "oklch(0.75 0.22 145)"
                  : "oklch(0.55 0.04 260)",
            }}
          >
            <div className="font-bold text-xs uppercase mb-1">
              {setEarningsModeMutation.isPending
                ? "SAVING..."
                : "Mode A: Value Sum"}
            </div>
            <div className="text-xs" style={{ color: "oklch(0.50 0.04 260)" }}>
              Sum of individual app prices from price list
            </div>
          </button>
          <button
            type="button"
            data-ocid="admin.settings.mode_b.toggle"
            disabled={setEarningsModeMutation.isPending}
            onClick={async () => {
              try {
                await setEarningsModeMutation.mutateAsync("flatRate");
                setSuccess("Earnings mode set to Flat Rate!");
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to set mode");
              }
            }}
            className="p-3 rounded-xl text-left transition-all"
            style={{
              background:
                earningsMode === "flatRate"
                  ? "oklch(0.70 0.20 185 / 0.15)"
                  : "oklch(0.10 0.025 260 / 0.5)",
              border: `1px solid ${earningsMode === "flatRate" ? "oklch(0.70 0.20 185 / 0.5)" : "oklch(0.22 0.05 260 / 0.4)"}`,
              color:
                earningsMode === "flatRate"
                  ? "oklch(0.78 0.22 188)"
                  : "oklch(0.55 0.04 260)",
            }}
          >
            <div className="font-bold text-xs uppercase mb-1">
              {setEarningsModeMutation.isPending
                ? "SAVING..."
                : "Mode B: Flat Rate × Links"}
            </div>
            <div className="text-xs" style={{ color: "oklch(0.50 0.04 260)" }}>
              Total valid links × per link rate
            </div>
          </button>
        </div>
      </div>

      {/* Checker Earnings On/Off Toggles */}
      <div
        className="glass-card p-5 rounded-2xl space-y-4"
        style={{ border: "1px solid oklch(0.65 0.20 145 / 0.3)" }}
      >
        <h3
          className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"
          style={{ color: "oklch(0.72 0.20 145)" }}
        >
          ⚙️ Checker Earnings Visibility
        </h3>
        <p className="text-xs" style={{ color: "oklch(0.55 0.04 260)" }}>
          Turn off earnings calculation display in each checker.
        </p>
        <div className="flex flex-col gap-3">
          {/* Single Checker toggle */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{
              background: "oklch(0.10 0.03 260 / 0.6)",
              border: "1px solid oklch(0.22 0.05 260 / 0.4)",
            }}
          >
            <div>
              <div
                className="font-bold text-xs uppercase"
                style={{ color: "oklch(0.82 0.04 260)" }}
              >
                Single Checker Earnings
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.50 0.04 260)" }}
              >
                Show/hide earnings in username checker
              </div>
            </div>
            <button
              type="button"
              disabled={setSingleCheckerEarningsMutation.isPending}
              onClick={async () => {
                await setSingleCheckerEarningsMutation.mutateAsync(
                  !singleCheckerEarningsEnabled,
                );
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: singleCheckerEarningsEnabled
                  ? "oklch(0.65 0.20 145 / 0.2)"
                  : "oklch(0.55 0.22 25 / 0.2)",
                border: `1px solid ${singleCheckerEarningsEnabled ? "oklch(0.65 0.20 145 / 0.5)" : "oklch(0.55 0.22 25 / 0.5)"}`,
                color: singleCheckerEarningsEnabled
                  ? "oklch(0.72 0.20 145)"
                  : "oklch(0.68 0.22 25)",
                opacity: setSingleCheckerEarningsMutation.isPending ? 0.6 : 1,
              }}
            >
              {setSingleCheckerEarningsMutation.isPending
                ? "SAVING..."
                : singleCheckerEarningsEnabled
                  ? "ON"
                  : "OFF"}
            </button>
          </div>
          {/* Bulk Checker toggle */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{
              background: "oklch(0.10 0.03 260 / 0.6)",
              border: "1px solid oklch(0.22 0.05 260 / 0.4)",
            }}
          >
            <div>
              <div
                className="font-bold text-xs uppercase"
                style={{ color: "oklch(0.82 0.04 260)" }}
              >
                Bulk Checker Earnings
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.50 0.04 260)" }}
              >
                Show/hide earnings in bulk checker
              </div>
            </div>
            <button
              type="button"
              disabled={setBulkCheckerEarningsMutation.isPending}
              onClick={async () => {
                await setBulkCheckerEarningsMutation.mutateAsync(
                  !bulkCheckerEarningsEnabled,
                );
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: bulkCheckerEarningsEnabled
                  ? "oklch(0.65 0.20 145 / 0.2)"
                  : "oklch(0.55 0.22 25 / 0.2)",
                border: `1px solid ${bulkCheckerEarningsEnabled ? "oklch(0.65 0.20 145 / 0.5)" : "oklch(0.55 0.22 25 / 0.5)"}`,
                color: bulkCheckerEarningsEnabled
                  ? "oklch(0.72 0.20 145)"
                  : "oklch(0.68 0.22 25)",
                opacity: setBulkCheckerEarningsMutation.isPending ? 0.6 : 1,
              }}
            >
              {setBulkCheckerEarningsMutation.isPending
                ? "SAVING..."
                : bulkCheckerEarningsEnabled
                  ? "ON"
                  : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        className="glass-card p-5 rounded-2xl"
        style={{ border: "1px solid oklch(0.65 0.22 25 / 0.3)" }}
        data-ocid="danger.panel"
      >
        <h3
          className="font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2"
          style={{ color: "oklch(0.65 0.22 25)" }}
        >
          ⚠️ DANGER ZONE
        </h3>
        <p className="text-xs mb-4" style={{ color: "oklch(0.55 0.04 260)" }}>
          Permanently deletes ALL data: apps, comment lists, comments, live
          lists, prices, images, music. This cannot be undone.
        </p>
        <div className="space-y-3">
          <label
            className="flex items-center gap-2 text-xs cursor-pointer"
            style={{ color: "oklch(0.65 0.04 260)" }}
          >
            <input
              type="checkbox"
              checked={wipeChecked}
              onChange={(e) => setWipeChecked(e.target.checked)}
              data-ocid="danger.wipe.checkbox"
            />
            I understand this is permanent and cannot be undone
          </label>
          <input
            type="text"
            value={wipeConfirm}
            onChange={(e) => setWipeConfirm(e.target.value)}
            placeholder='Type "WIPE" to confirm'
            className="glass-input w-full px-3 py-2 text-sm"
            data-ocid="danger.wipe.input"
          />
          <button
            type="button"
            onClick={handleWipeAll}
            disabled={
              !wipeChecked || wipeConfirm !== "WIPE" || wipeAll.isPending
            }
            data-ocid="danger.wipe.delete_button"
            className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            style={{
              background: "oklch(0.55 0.22 25 / 0.2)",
              border: "1px solid oklch(0.55 0.22 25 / 0.4)",
              color: "oklch(0.65 0.22 25)",
              opacity: !wipeChecked || wipeConfirm !== "WIPE" ? 0.4 : 1,
            }}
          >
            {wipeAll.isPending ? "Wiping..." : "WIPE ALL DATA"}
          </button>
        </div>
      </div>
    </div>
  );
}
