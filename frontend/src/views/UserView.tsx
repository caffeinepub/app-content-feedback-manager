import { useState, useEffect } from "react";
import { useCommentLists, useAvailableCount, getLocalClaim, setLocalClaim } from "@/hooks/useQueries";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useActor } from "@/hooks/useActor";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Sparkles, Gamepad2, AlertCircle } from "lucide-react";
import { TopDownShooter } from "@/components/TopDownShooter";
import { toast } from "sonner";
import type { CommentList } from "@/backend";

export default function UserView() {
  const { data: commentLists, isLoading: listsLoading } = useCommentLists();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const deviceId = useDeviceId();

  const [selectedListId, setSelectedListId] = useState<string>("");
  const [generatedComment, setGeneratedComment] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isOutOfComments, setIsOutOfComments] = useState(false);

  // Available count from backend for selected list
  const { data: availableCountRaw, isLoading: countLoading } = useAvailableCount(selectedListId);
  const availableCount = availableCountRaw !== undefined ? Number(availableCountRaw) : null;

  // Check lock state from localStorage whenever selected list changes
  useEffect(() => {
    setGeneratedComment("");
    setIsOutOfComments(false);
    if (selectedListId) {
      const claim = getLocalClaim(selectedListId);
      setIsLocked(!!claim);
    } else {
      setIsLocked(false);
    }
  }, [selectedListId]);

  // All unlocked comment lists
  const availableLists: CommentList[] = (commentLists ?? []).filter((l) => !l.locked);

  const selectedList = (commentLists ?? []).find((l) => l.id === selectedListId) ?? null;

  async function handleGenerate() {
    if (!selectedList || !actor || isLocked || isOutOfComments) return;

    setIsGenerating(true);
    try {
      const available = await actor.getAvailableCount(selectedList.id);
      const availableNum = Number(available);

      if (availableNum === 0) {
        setIsOutOfComments(true);
        toast.error("No comments left for this list.");
        return;
      }

      const templates = selectedList.templates;
      if (templates.length === 0) {
        setIsOutOfComments(true);
        toast.error("No templates in this list.");
        return;
      }

      const randomIndex = Math.floor(Math.random() * templates.length);
      let comment = templates[randomIndex];
      if (selectedList.suffix) {
        comment = comment + selectedList.suffix;
      }

      setGeneratedComment(comment);
      setLocalClaim(selectedList.id, deviceId);
      setIsLocked(true);

      queryClient.invalidateQueries({ queryKey: ["availableCount", selectedList.id] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });

      toast.success("Comment generated successfully!");
    } catch (err) {
      toast.error("Failed to generate comment. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy() {
    if (!generatedComment) return;
    navigator.clipboard.writeText(generatedComment).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="text-center pt-2">
        <h2 className="text-3xl font-display font-bold gradient-heading">Customer View</h2>
        <p className="text-muted-foreground mt-1">Generate comments, upload images, and view your activity</p>
      </div>

      {/* Top-Down Shooter Game */}
      <div className="space-card p-0 overflow-hidden">
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid oklch(0.28 0.04 240 / 0.5)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))" }}
          >
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base gradient-heading">Top-Down Shooter</h3>
            <p className="text-xs text-muted-foreground">
              Use WASD or Arrow keys to move. Click to shoot. Survive as long as you can!
            </p>
          </div>
        </div>
        <div className="p-4">
          <div className="w-full overflow-hidden rounded-xl">
            <TopDownShooter />
          </div>
        </div>
      </div>

      {/* Single Comment Generator */}
      <div className="space-card p-0 overflow-hidden">
        {/* Card Header */}
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid oklch(0.28 0.04 240 / 0.5)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.2 220), oklch(0.65 0.2 175))",
              boxShadow: "0 0 16px oklch(0.55 0.2 220 / 0.4)",
            }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">Single Comment Generator</h3>
            <p className="text-sm text-muted-foreground">Generate one comment per list (one per device)</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {listsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full bg-secondary" />
              <Skeleton className="h-14 w-full bg-secondary" />
              <Skeleton className="h-12 w-full bg-secondary" />
            </div>
          ) : (
            <>
              {/* Comment List Selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Select Comment List</label>
                {availableLists.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No comment lists available.</p>
                ) : (
                  <Select value={selectedListId} onValueChange={setSelectedListId}>
                    <SelectTrigger className="w-full bg-secondary border-border">
                      <SelectValue placeholder="Choose a list..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Available Comments Display */}
              {selectedListId && (
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{
                    background: "oklch(0.18 0.04 220 / 0.6)",
                    border: "1px solid oklch(0.35 0.08 220 / 0.5)",
                  }}
                >
                  <span className="text-sm font-semibold text-foreground">Available Comments:</span>
                  <div
                    className="min-w-[48px] h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                    style={{
                      background: "oklch(0.15 0.03 240)",
                      border: "2px solid oklch(0.55 0.18 200 / 0.6)",
                      color: "oklch(0.75 0.2 200)",
                      minWidth: "56px",
                      padding: "0 12px",
                    }}
                  >
                    {countLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      availableCount ?? 0
                    )}
                  </div>
                </div>
              )}

              {/* Lock Notice */}
              {isLocked && selectedListId && (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "oklch(0.2 0.06 220 / 0.5)",
                    border: "1px solid oklch(0.5 0.15 220 / 0.5)",
                  }}
                >
                  <Sparkles
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.65 0.2 220)" }}
                  />
                  <p className="text-sm font-medium" style={{ color: "oklch(0.65 0.2 220)" }}>
                    You have already generated a comment for this list on this device.
                  </p>
                </div>
              )}

              {/* Out of Comments Notice */}
              {isOutOfComments && !isLocked && selectedListId && (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "oklch(0.2 0.06 25 / 0.4)",
                    border: "1px solid oklch(0.5 0.15 25 / 0.5)",
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-destructive" />
                  <p className="text-sm font-medium text-destructive">
                    Out of comments — no more comments available for this list.
                  </p>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!selectedList || isLocked || isOutOfComments || isGenerating}
                className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                style={{
                  background:
                    !selectedList || isLocked || isOutOfComments
                      ? "oklch(0.25 0.04 240)"
                      : "linear-gradient(135deg, oklch(0.55 0.2 220) 0%, oklch(0.65 0.2 175) 50%, oklch(0.68 0.2 155) 100%)",
                  color:
                    !selectedList || isLocked || isOutOfComments
                      ? "oklch(0.5 0.04 240)"
                      : "oklch(0.98 0.005 240)",
                  cursor:
                    !selectedList || isLocked || isOutOfComments || isGenerating
                      ? "not-allowed"
                      : "pointer",
                  boxShadow:
                    !selectedList || isLocked || isOutOfComments
                      ? "none"
                      : "0 4px 20px oklch(0.55 0.2 220 / 0.4)",
                  opacity: isGenerating ? 0.8 : 1,
                }}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Single Comment
                  </>
                )}
              </button>

              {/* Generated Comment Output */}
              {generatedComment && (
                <div
                  className="rounded-xl p-4 relative animate-fade-in"
                  style={{
                    background: "oklch(0.18 0.04 220 / 0.5)",
                    border: "1px solid oklch(0.4 0.1 175 / 0.5)",
                  }}
                >
                  <p className="text-sm text-foreground pr-10 whitespace-pre-wrap break-words leading-relaxed">
                    {generatedComment}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
                    style={{
                      background: copied
                        ? "oklch(0.65 0.2 155 / 0.2)"
                        : "oklch(0.25 0.04 240 / 0.8)",
                    }}
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" style={{ color: "oklch(0.75 0.22 155)" }} />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid oklch(0.3 0.05 220 / 0.4)" }}>
                    <button
                      onClick={handleCopy}
                      className="w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.55 0.2 220) 0%, oklch(0.65 0.2 175) 100%)",
                        color: "oklch(0.98 0.005 240)",
                      }}
                    >
                      {copied ? (
                        <><Check className="w-4 h-4" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copy to Clipboard</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
