import type { CommentList } from "@/backend";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useClaimedComments } from "@/hooks/useClaimedComments";
import { useClaimComment, useCommentLists } from "@/hooks/useQueries";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  History,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function UserView() {
  const { data: commentLists = [], isLoading: listsLoading } =
    useCommentLists();
  const claimComment = useClaimComment();
  const { getClaimedComment, storeClaimedComment, hasClaimedComment } =
    useClaimedComments();

  const [selectedListId, setSelectedListId] = useState<string>("");
  const [generatedComment, setGeneratedComment] = useState<string>("");
  const [noCommentsLeft, setNoCommentsLeft] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPreviousClaim, setIsPreviousClaim] = useState(false);

  const selectedList: CommentList | null =
    commentLists.find((l: CommentList) => l.id === selectedListId) ?? null;

  const availableLists: CommentList[] = commentLists.filter(
    (l: CommentList) => !l.locked,
  );

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on selectedListId change
  useEffect(() => {
    if (selectedListId) {
      const existing = getClaimedComment(selectedListId);
      if (existing) {
        setGeneratedComment(existing.comment);
        setIsPreviousClaim(true);
      }
    }
  }, [selectedListId]);

  const handleGenerate = async () => {
    if (!selectedList) {
      toast.error("Please select a comment list first.");
      return;
    }

    const existing = getClaimedComment(selectedList.id);
    if (existing) {
      setGeneratedComment(existing.comment);
      setIsPreviousClaim(true);
      toast.info("You already claimed a comment from this list.");
      return;
    }

    try {
      const result = await claimComment.mutateAsync({
        listId: selectedList.id,
        username: "",
      });

      if (result.__kind__ === "claimSuccess") {
        const comment = result.claimSuccess;
        storeClaimedComment(selectedList.id, comment);
        setGeneratedComment(comment);
        setNoCommentsLeft(false);
        setIsPreviousClaim(false);
        toast.success("Comment generated successfully!");
      } else {
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
  const alreadyClaimed = selectedListId
    ? hasClaimedComment(selectedListId)
    : false;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="text-center pt-2">
        <h2
          className="text-3xl font-bold"
          style={{
            color: "#87CEEB",
            textShadow: "0 0 20px rgba(135,206,235,0.4)",
            fontStyle: "italic",
          }}
        >
          USER
        </h2>
        <p className="text-sm mt-1" style={{ color: "#9fb3c8" }}>
          Generate your unique comment — first come, first served
        </p>
      </div>

      {/* Single Comment Generator */}
      <div className="space-card p-0 overflow-hidden">
        {/* Card Header */}
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid rgba(135,206,235,0.08)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #87CEEB, #4682B4)",
              boxShadow: "0 0 16px rgba(135,206,235,0.3)",
            }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: "#fff" }}>
              Single Comment Generator
            </h3>
            <p className="text-sm" style={{ color: "#6f88a3" }}>
              Each comment is a one-time treasure — first come, first served
            </p>
          </div>
        </div>

        <div className="p-5 space-y-5">
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
                <label
                  htmlFor="comment-list-select"
                  className="text-sm font-semibold"
                  style={{ color: "#e0e0e0" }}
                >
                  Select Comment List
                </label>
                {availableLists.length === 0 ? (
                  <p className="text-sm italic" style={{ color: "#6f88a3" }}>
                    No comment lists available.
                  </p>
                ) : (
                  <Select
                    value={selectedListId}
                    onValueChange={handleSelectList}
                    name="comment-list-select"
                  >
                    <SelectTrigger
                      id="comment-list-select"
                      data-ocid="single-gen.list.select"
                      className="w-full min-h-[48px] bg-card text-card-foreground border-border font-medium shadow-sm focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/80 transition"
                    >
                      <SelectValue placeholder="Choose a list..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLists.map((list: CommentList) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.displayName}
                          {hasClaimedComment(list.id) && (
                            <span className="ml-2 text-xs opacity-60">
                              ✓ claimed
                            </span>
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
                    background: "rgba(135,206,235,0.08)",
                    border: "1px solid rgba(135,206,235,0.2)",
                  }}
                >
                  <History
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: "#87CEEB" }}
                  />
                  <p
                    className="text-xs font-medium"
                    style={{ color: "#87CEEB" }}
                  >
                    You've already claimed a comment from this list — showing
                    your saved comment below.
                  </p>
                </div>
              )}

              {/* Status badges */}
              {selectedList && !noCommentsLeft && !alreadyClaimed && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
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
                    background: "rgba(220,20,60,0.1)",
                    border: "1px solid rgba(220,20,60,0.25)",
                  }}
                >
                  <AlertCircle
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "#DC143C" }}
                  />
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#ff6680" }}
                  >
                    No more comments left — all comments in this list have been
                    claimed.
                  </p>
                </div>
              )}

              {/* Generate Button */}
              {!alreadyClaimed && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!selectedList || isGenerating || noCommentsLeft}
                  data-ocid="single-gen.generate.button"
                  className="w-full min-h-[48px] py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                  style={{
                    background:
                      selectedList && !noCommentsLeft
                        ? "linear-gradient(135deg, #87CEEB, #4682B4)"
                        : "rgba(30,30,50,0.5)",
                    color: selectedList && !noCommentsLeft ? "#000" : "#555",
                    border:
                      selectedList && !noCommentsLeft
                        ? "none"
                        : "1px solid rgba(60,60,90,0.4)",
                    boxShadow:
                      selectedList && !noCommentsLeft
                        ? "0 0 20px rgba(135,206,235,0.3)"
                        : "none",
                    fontStyle: "italic",
                    cursor:
                      !selectedList || isGenerating || noCommentsLeft
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      !selectedList || isGenerating || noCommentsLeft ? 0.7 : 1,
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
                    background: "rgba(15,15,25,0.9)",
                    border: "1px solid rgba(135,206,235,0.2)",
                  }}
                >
                  {isPreviousClaim && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <History
                        className="w-3 h-3"
                        style={{ color: "#87CEEB" }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#87CEEB" }}
                      >
                        Your saved comment
                      </span>
                    </div>
                  )}
                  <p
                    className="text-sm pr-10 whitespace-pre-wrap break-words leading-relaxed"
                    style={{ color: "#e0e0e0" }}
                  >
                    {generatedComment}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
                    style={{ color: "#666" }}
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <CheckCircle2
                        className="h-4 w-4"
                        style={{ color: "#87CEEB" }}
                      />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <div
                    className="mt-3 pt-3"
                    style={{ borderTop: "1px solid rgba(135,206,235,0.1)" }}
                  >
                    <button
                      type="button"
                      onClick={handleCopy}
                      data-ocid="single-gen.copy.button"
                      className="w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: "linear-gradient(135deg, #87CEEB, #4682B4)",
                        color: "#000",
                        border: "none",
                        boxShadow: "0 0 14px rgba(135,206,235,0.25)",
                        fontStyle: "italic",
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
