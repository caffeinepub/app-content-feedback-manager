import { Lock, Shield } from "lucide-react";
import type React from "react";
import { useState } from "react";

const ADMIN_CODE = "7898";

interface AdminUnlockProps {
  onUnlocked: () => void;
}

export default function AdminUnlock({ onUnlocked }: AdminUnlockProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Small delay so it feels like a real check
    await new Promise((r) => setTimeout(r, 300));
    setIsLoading(false);

    if (code === ADMIN_CODE) {
      // Persist code so mutations can pass it to backend
      localStorage.setItem("adminCode", ADMIN_CODE);
      // Do NOT set isAdmin — session state only, not persisted across reloads
      onUnlocked();
    } else {
      setError("Invalid admin code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="space-card p-8 rounded-2xl w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold gradient-heading mb-2">
          Admin Panel
        </h2>
        <p className="text-muted-foreground mb-8">
          Enter your admin code to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter admin code"
            className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-center text-xl tracking-widest"
            disabled={isLoading}
            data-ocid="admin.unlock.input"
          />

          {error && (
            <div
              className="text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-2"
              data-ocid="admin.unlock.error_state"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !code}
            className="gradient-button w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            data-ocid="admin.unlock.submit_button"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Unlock Admin Panel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
