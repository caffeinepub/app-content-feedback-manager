import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSettings, useUpdateSettings, useAccessKey, useSetAccessKey } from "../../hooks/useQueries";
import { ExternalBlob } from "../../backend";
import { toast } from "sonner";
import { Upload, Music, Eye, EyeOff, RefreshCw, Key, Save, Loader2 } from "lucide-react";

function generateRandomKey(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function AdminSettings() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: currentAccessKey, isLoading: keyLoading } = useAccessKey();
  const updateSettings = useUpdateSettings();
  const setAccessKey = useSetAccessKey();

  const [bgMusicEnabled, setBgMusicEnabled] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Access key state
  const [newKey, setNewKey] = useState("");
  const [showCurrentKey, setShowCurrentKey] = useState(false);

  useEffect(() => {
    if (settings) {
      setBgMusicEnabled(settings.bgMusicEnabled);
    }
  }, [settings]);

  const handleMusicToggle = async (enabled: boolean) => {
    setBgMusicEnabled(enabled);
    try {
      const musicFile = settings?.musicFile ?? null;
      await updateSettings.mutateAsync({ bgMusicEnabled: enabled, musicFile: musicFile as ExternalBlob | null });
      toast.success(enabled ? "Background music enabled" : "Background music disabled");
    } catch {
      toast.error("Failed to update settings");
      setBgMusicEnabled(!enabled);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
      await updateSettings.mutateAsync({ bgMusicEnabled, musicFile: blob });
      setUploadProgress(null);
      toast.success("Music file uploaded successfully");
    } catch {
      setUploadProgress(null);
      toast.error("Failed to upload music file");
    }
  };

  const handleSaveKey = async () => {
    if (!newKey.trim()) {
      toast.error("Please enter a key");
      return;
    }
    try {
      await setAccessKey.mutateAsync(newKey.trim());
      setNewKey("");
      toast.success("Access key saved successfully");
    } catch {
      toast.error("Failed to save access key");
    }
  };

  const handleRegenerateKey = async () => {
    const key = generateRandomKey(16);
    try {
      await setAccessKey.mutateAsync(key);
      setNewKey("");
      toast.success("New access key generated and saved");
    } catch {
      toast.error("Failed to regenerate access key");
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl">
      {/* ── Access Key Management ─────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Access Key Management</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          The access key is required for users to use the Bulk Comments Generator.
        </p>

        {/* Current Key Display */}
        <div className="space-y-1.5">
          <Label>Current Access Key</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono text-sm text-foreground min-h-[38px] flex items-center">
              {keyLoading ? (
                <span className="text-muted-foreground">Loading…</span>
              ) : currentAccessKey ? (
                showCurrentKey ? (
                  currentAccessKey
                ) : (
                  "•".repeat(Math.min(currentAccessKey.length, 16))
                )
              ) : (
                <span className="text-muted-foreground italic">No key set</span>
              )}
            </div>
            {currentAccessKey && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCurrentKey((v) => !v)}
                title={showCurrentKey ? "Hide key" : "Show key"}
              >
                {showCurrentKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Set Custom Key */}
        <div className="space-y-1.5">
          <Label htmlFor="new-key">Set New Key</Label>
          <div className="flex gap-2">
            <Input
              id="new-key"
              type="text"
              placeholder="Enter custom access key…"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="flex-1 font-mono"
            />
            <Button
              onClick={handleSaveKey}
              disabled={setAccessKey.isPending || !newKey.trim()}
            >
              {setAccessKey.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="ml-1.5">Save</span>
            </Button>
          </div>
        </div>

        {/* Regenerate */}
        <Button
          variant="outline"
          onClick={handleRegenerateKey}
          disabled={setAccessKey.isPending}
          className="flex items-center gap-2"
        >
          {setAccessKey.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Regenerate Random Key
        </Button>
      </section>

      <Separator />

      {/* ── Background Music ──────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Background Music</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Background Music</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Play music automatically when the app loads
            </p>
          </div>
          <Switch
            checked={bgMusicEnabled}
            onCheckedChange={handleMusicToggle}
            disabled={updateSettings.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label>Upload Music File</Label>
          {settings?.musicFile && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <Music className="w-3 h-3" />
              Music file uploaded
            </p>
          )}
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={updateSettings.isPending}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploadProgress !== null ? `Uploading… ${uploadProgress}%` : "Upload Music File"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <p className="text-xs text-muted-foreground">
            Supported formats: MP3, WAV, OGG, AAC
          </p>
        </div>
      </section>
    </div>
  );
}
