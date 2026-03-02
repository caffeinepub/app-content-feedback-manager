import { useState, useEffect } from "react";
import { Copy, Sparkles, AlertCircle, CheckCircle2, Gamepad2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommentLists, useClaimComment } from "@/hooks/useQueries";
import { useClaimedComments } from "@/hooks/useClaimedComments";
import { TopDownShooter } from "@/components/TopDownShooter";
import { toast } from "sonner";
import type { CommentList } from "@/backend";

export default function UserView() {
  const { data: commentLists = [], isLoading: listsLoading } = useCommentLists();
  const claimComment = useClaimComment();
  const { getClaimedComment, storeClaimedComment, hasClaimedComment } = useClaimedComments();

  const [selectedListId, setSelectedListId] = useState<string>("");
  const [generatedComment, setGeneratedComment] = useState<string>("");
  const [noCommentsLeft, setNoCommentsLeft] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPreviousClaim, setIsPreviousClaim] = useState(false);

  const selectedList: CommentList | null =
    commentLists.find((l: CommentList) => l.id === selectedListId) ?? null;

  const availableLists: CommentList[] = commentLists.filter((l: CommentList) => !l.locked);

  // When list selection changes, check localStorage for a previously claimed comment
  function handleSelectList(listId: string) {
    setSelectedListId(listId);
    setNoCommentsLeft(false);
    setCopied(false);

    const existing = getClaimedComment(listId);
    if (existing) {
      setGeneratedComment(existing.comment);
      setIsPreviousClaim(true);
    } else {
      setGeneratedComment("");
      setIsPreviousClaim(false);
    }
  }

  // On mount or when lists load, restore previously claimed comment if a list was already selected
  useEffect(() => {
    if (selectedListId) {
      const existing = getClaimedComment(selectedListId);
      if (existing) {
        setGeneratedComment(existing.comment);
        setIsPreviousClaim(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListId]);

  const handleGenerate = async () => {
    if (!selectedList) {
      toast.error("Please select a comment list first.");
      return;
    }

    // Check if this device already claimed a comment from this list
    const existing = getClaimedComment(selectedList.id);
    if (existing) {
      setGeneratedComment(existing.comment);
      setIsPreviousClaim(true);
      toast.info("You already claimed a comment from this list.");
      return;
    }

    try {
      const result = await claimComment.mutateAsync(selectedList.id);

      if (result.__kind__ === "claimSuccess") {
        const comment = result.claimSuccess;
        // Store in localStorage so this device always sees the same comment
        storeClaimedComment(selectedList.id, comment);
        setGeneratedComment(comment);
        setNoCommentsLeft(false);
        setIsPreviousClaim(false);
        toast.success("Comment generated successfully!");
      } else {
        // noCommentsRemaining
        setGeneratedComment("");
        setNoCommentsLeft(true);
        toast.error("No more comments left in this list.");
      }
    } catch {
      toast.error("Failed to generate comment. Please try again.");
    }
  };

  const handleCopy = () => {
    if (!generatedComment) return;
    navigator.clipboard.writeText(generatedComment).then(() => {
      setCopied(true);
      toast.success("Comment copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isGenerating = claimComment.isPending;
  const alreadyClaimed = selectedListId ? hasClaimedComment(selectedListId) : false;

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
            <p className="text-sm text-muted-foreground">Each comment is a one-time treasure — first come, first served</p>
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
                  <Select value={selectedListId} onValueChange={handleSelectList}>
                    <SelectTrigger className="w-full bg-secondary border-border">
                      <SelectValue placeholder="Choose a list..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLists.map((list: CommentList) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.displayName}
                          {hasClaimedComment(list.id) && (
                            <span className="ml-2 text-xs opacity-60">✓ claimed</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Previously claimed badge */}
              {alreadyClaimed && selectedListId && !noCommentsLeft && (
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                  style={{
                    background: "oklch(0.2 0.05 200 / 0.4)",
                    border: "1px solid oklch(0.45 0.12 200 / 0.5)",
                  }}
                >
                  <History className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                  <p className="text-xs text-primary/90 font-medium">
                    You've already claimed a comment from this list — showing your saved comment below.
                  </p>
                </div>
              )}

              {/* Status badges */}
              {selectedList && !noCommentsLeft && !alreadyClaimed && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Ready to claim
                  </Badge>
                </div>
              )}

              {/* No Comments Left Notice */}
              {noCommentsLeft && selectedListId && (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "oklch(0.2 0.06 25 / 0.4)",
                    border: "1px solid oklch(0.5 0.15 25 / 0.5)",
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-destructive" />
                  <p className="text-sm font-medium text-destructive">
                    No more comments left — all comments in this list have been claimed.
                  </p>
                </div>
              )}

              {/* Generate Button — hidden if already claimed and comment is shown */}
              {!alreadyClaimed && (
                <button
                  onClick={handleGenerate}
                  disabled={!selectedList || isGenerating || noCommentsLeft}
                  className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                  style={{
                    background:
                      !selectedList || noCommentsLeft
                        ? "oklch(0.25 0.04 240)"
                        : "linear-gradient(135deg, oklch(0.55 0.2 220) 0%, oklch(0.65 0.2 175) 50%, oklch(0.68 0.2 155) 100%)",
                    color:
                      !selectedList || noCommentsLeft
                        ? "oklch(0.5 0.04 240)"
                        : "oklch(0.98 0.005 240)",
                    cursor:
                      !selectedList || isGenerating || noCommentsLeft
                        ? "not-allowed"
                        : "pointer",
                    boxShadow:
                      !selectedList || noCommentsLeft
                        ? "none"
                        : "0 4px 20px oklch(0.55 0.2 220 / 0.4)",
                    opacity: isGenerating ? 0.8 : 1,
                  }}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Comment
                    </>
                  )}
                </button>
              )}

              {/* Generated Comment Output */}
              {generatedComment && (
                <div
                  className="rounded-xl p-4 relative animate-fade-in"
                  style={{
                    background: "oklch(0.18 0.04 220 / 0.5)",
                    border: isPreviousClaim
                      ? "1px solid oklch(0.45 0.12 200 / 0.6)"
                      : "1px solid oklch(0.4 0.1 175 / 0.5)",
                  }}
                >
                  {isPreviousClaim && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <History className="w-3 h-3 text-primary/70" />
                      <span className="text-xs text-primary/70 font-medium">Your saved comment</span>
                    </div>
                  )}
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
                      <CheckCircle2 className="h-4 w-4" style={{ color: "oklch(0.75 0.22 155)" }} />
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
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy Comment"}
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
