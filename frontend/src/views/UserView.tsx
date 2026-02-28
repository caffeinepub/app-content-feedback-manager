import { useState } from "react";
import {
  Copy,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  MessageSquare,
  Hash,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCommentLists, useAssignComment, useAvailableCountsForLists } from "@/hooks/useQueries";
import { useDeviceId } from "@/hooks/useDeviceId";
import { TopDownShooter } from "@/components/TopDownShooter";

// localStorage key prefix for storing generated comments per device per list
const STORAGE_PREFIX = "generated_comment_";

interface GeneratedState {
  comment: string;
  isAlreadyGenerated: boolean;
  error?: string;
}

export default function UserView() {
  const deviceId = useDeviceId();
  const { data: commentLists = [], isLoading: listsLoading } = useCommentLists();
  const assignMutation = useAssignComment();

  const unlockedLists = commentLists.filter((l) => !l.locked);
  const unlockedListIds = unlockedLists.map((l) => l.id);

  // Poll available counts for all unlocked lists every 5 seconds
  const { data: availableCounts = {} } = useAvailableCountsForLists(unlockedListIds);

  // Game visibility state
  const [gameStarted, setGameStarted] = useState(false);

  // Map of listId -> GeneratedState (persisted in localStorage)
  const [generatedMap, setGeneratedMap] = useState<Record<string, GeneratedState>>(() => {
    // Restore any previously generated comments from localStorage on mount
    const restored: Record<string, GeneratedState> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const listId = key.slice(STORAGE_PREFIX.length);
          const raw = localStorage.getItem(key);
          if (raw) {
            restored[listId] = JSON.parse(raw);
          }
        }
      }
    } catch {
      // ignore parse errors
    }
    return restored;
  });

  // Track which list is currently loading
  const [loadingListId, setLoadingListId] = useState<string | null>(null);

  // Track copied state per list
  const [copiedListId, setCopiedListId] = useState<string | null>(null);

  const handleGenerate = async (listId: string) => {
    // If already generated, show the stored result (no new request needed)
    if (generatedMap[listId]) {
      toast.info("You've already generated a comment from this list.");
      return;
    }

    setLoadingListId(listId);
    try {
      const result = await assignMutation.mutateAsync({ listId, deviceId });

      const state: GeneratedState = {
        comment: result.comment,
        isAlreadyGenerated: result.isAlreadyGenerated,
      };

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_PREFIX + listId, JSON.stringify(state));
      } catch {
        // ignore storage errors
      }

      setGeneratedMap((prev) => ({ ...prev, [listId]: state }));

      if (result.isAlreadyGenerated) {
        toast.info("You've already generated a comment from this list.");
      } else {
        toast.success("Comment generated!");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate comment.";

      let userMessage = "Failed to generate comment. Please try again.";
      if (message.includes("No available comments left")) {
        userMessage = "No comments available in this list. Please check back later.";
      } else if (message.includes("not found")) {
        userMessage = "This comment list could not be found.";
      }

      const errorState: GeneratedState = {
        comment: "",
        isAlreadyGenerated: false,
        error: userMessage,
      };

      setGeneratedMap((prev) => ({ ...prev, [listId]: errorState }));
      toast.error(userMessage);
    } finally {
      setLoadingListId(null);
    }
  };

  const handleCopy = async (text: string, listId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedListId(listId);
      toast.success("Comment copied!");
      setTimeout(() => setCopiedListId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (listsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top-Down Shooter Game Card */}
      <div className="space-card rounded-xl overflow-hidden">
        {!gameStarted ? (
          /* Pre-game card — matches screenshot layout */
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <h3 className="gradient-heading text-xl font-bold">Top-Down Shooter</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use WASD or Arrow keys to move. Click to shoot.<br />
              Survive as long as you can!
            </p>
            <Button
              className="gradient-button px-8 py-2 font-semibold text-white rounded-full"
              onClick={() => setGameStarted(true)}
            >
              Start Game
            </Button>
          </div>
        ) : (
          /* Active game */
          <div className="p-3">
            <TopDownShooter />
          </div>
        )}
      </div>

      {/* Single Comment Generator header */}
      <div className="space-card p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Comment Generator</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Each list gives you one unique comment per device. Generate once and it's yours to keep.
        </p>
      </div>

      {unlockedLists.length === 0 ? (
        <div className="space-card p-8 rounded-xl text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No comment lists are available yet.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Check back later!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {unlockedLists.map((list) => {
            const state = generatedMap[list.id];
            const isLoading = loadingListId === list.id;
            const hasGenerated = !!state && !state.error;
            const hasError = !!state?.error;
            const isCopied = copiedListId === list.id;

            // Available count from polling (falls back to list.availableCount from initial load)
            const availableCount =
              list.id in availableCounts
                ? availableCounts[list.id]
                : Number(list.availableCount);

            const isExhausted = availableCount === 0;

            return (
              <div key={list.id} className="space-card rounded-xl overflow-hidden">
                {/* List Header */}
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {list.displayName}
                      </h4>
                      {/* Available count badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                          isExhausted
                            ? "bg-destructive/10 border-destructive/30 text-destructive"
                            : "bg-primary/10 border-primary/30 text-primary"
                        }`}
                      >
                        <Hash className="h-2.5 w-2.5" />
                        {availableCount} left
                      </span>
                    </div>
                    {state?.isAlreadyGenerated && (
                      <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                        <RefreshCcw className="h-3 w-3" />
                        Already generated from this list
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasGenerated && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-8 w-8 transition-colors ${
                          isCopied
                            ? "text-green-400 hover:text-green-300"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => handleCopy(state.comment, list.id)}
                        title="Copy comment"
                      >
                        {isCopied ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={() => handleGenerate(list.id)}
                      disabled={isLoading || (!hasGenerated && isExhausted)}
                      className={`gap-1.5 text-xs ${
                        hasGenerated
                          ? "variant-outline border border-border bg-transparent text-muted-foreground hover:text-foreground"
                          : isExhausted
                          ? "opacity-50 cursor-not-allowed"
                          : "gradient-button"
                      }`}
                      variant={hasGenerated ? "outline" : "default"}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : hasGenerated ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                          Generated
                        </>
                      ) : isExhausted ? (
                        <>
                          <AlertCircle className="h-3.5 w-3.5" />
                          Unavailable
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Generated Comment */}
                {hasGenerated && (
                  <div className="px-4 pb-4">
                    <div
                      className="rounded-lg p-3 text-sm text-foreground leading-relaxed break-words"
                      style={{
                        background: "oklch(0.18 0.03 240 / 0.6)",
                        border: "1px solid oklch(0.35 0.08 220 / 0.4)",
                      }}
                    >
                      {state.comment}
                    </div>
                  </div>
                )}

                {/* Error State */}
                {hasError && (
                  <div className="px-4 pb-4">
                    <div
                      className="rounded-lg p-3 flex items-start gap-2 text-sm"
                      style={{
                        background: "oklch(0.18 0.04 25 / 0.4)",
                        border: "1px solid oklch(0.4 0.12 25 / 0.4)",
                      }}
                    >
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <span className="text-destructive">{state.error}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
