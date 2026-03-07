import { Lock, Shield } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { initAdminActor, persistAdminToken } from "../hooks/useQueries";

interface AdminUnlockProps {
  onUnlocked: () => void;
}

export default function AdminUnlock({ onUnlocked }: AdminUnlockProps) {
  const [code, setCode] = useState("");
  const { unlock, error, isLoading, isUnlocked } = useAdminAuth();
  const { actor } = useActor();

  // Auto-skip if already unlocked via localStorage — also pre-warm actor
  useEffect(() => {
    const storedCode = localStorage.getItem("adminCode");
    const storedIsAdmin = localStorage.getItem("isAdmin");
    if (storedCode === "7898" && storedIsAdmin === "true") {
      // Pre-warm actor with admin token so all subsequent mutations work
      if (actor) {
        initAdminActor(actor).catch(console.warn);
      }
      onUnlocked();
    }
  }, [onUnlocked, actor]);

  // Also respond to isUnlocked state changes
  useEffect(() => {
    if (isUnlocked) {
      onUnlocked();
    }
  }, [isUnlocked, onUnlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await unlock(code);
    if (success) {
      // Persist the platform admin token so it survives navigation
      persistAdminToken();
      // Pre-warm the actor immediately so the first admin action succeeds
      if (actor) {
        initAdminActor(actor).catch(console.warn);
      }
      onUnlocked();
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
          />

          {error && (
            <div className="text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !code}
            className="gradient-button w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Unlocking...
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
