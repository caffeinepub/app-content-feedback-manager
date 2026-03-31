import type { CommentList } from "@/backend";
import MissionBriefingModal from "@/components/MissionBriefingModal";
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

const MAX_CLAIMS = 6;

export default function UserView() {
  const { data: commentLists = [], isLoading: listsLoading } =
    useCommentLists();
  const claimComment = useClaimComment();
  const {
    getClaimedComment,
    getClaimedComments,
    storeClaimedComment,
    hasClaimedComment,
    hasReachedLimit,
    getRemainingClaims,
  } = useClaimedComments();

  const [selectedListId, setSelectedListId] = useState<string>("");
  const [generatedComment, setGeneratedComment] = useState<string>("");
  const [claimedComments, setClaimedComments] = useState<string[]>([]);
  const [noCommentsLeft, setNoCommentsLeft] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isPreviousClaim, setIsPreviousClaim] = useState(false);
  const [showMission, setShowMission] = useState(false);

  const selectedList: CommentList | null =
    commentLists.find((l: CommentList) => l.id === selectedListId) ?? null;

  const availableLists: CommentList[] = commentLists.filter(
    (l: CommentList) => !l.locked,
  );

  function handleSelectList(listId: string) {
    setSelectedListId(listId);
    setNoCommentsLeft(false);
    setCopied(false);
    setCopiedIdx(null);

    const all = getClaimedComments(listId);
    setClaimedComments(all);
    if (all.length > 0) {
      setGeneratedComment(all[all.length - 1]);
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
      const all = getClaimedComments(selectedListId);
      setClaimedComments(all);
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

    if (hasReachedLimit(selectedList.id)) {
      toast.info(
        "You have reached the 6-comment limit for this list on this device.",
      );
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
        const updatedAll = getClaimedComments(selectedList.id);
        setClaimedComments(updatedAll);
        setGeneratedComment(comment);
        setNoCommentsLeft(false);
        setIsPreviousClaim(false);
        toast.success("Comment generated successfully!");
        setShowMission(true);
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

  const handleCopyHistory = (comment: string, idx: number) => {
    navigator.clipboard.writeText(comment).then(() => {
      setCopiedIdx(idx);
      toast.success("Comment copied!");
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const isGenerating = claimComment.isPending;
  const limitReached = selectedListId ? hasReachedLimit(selectedListId) : false;
  const remainingClaims = selectedListId
    ? getRemainingClaims(selectedListId)
    : MAX_CLAIMS;
  const usedClaims = selectedListId ? claimedComments.length : 0;
  const alreadyClaimed = selectedListId
    ? hasClaimedComment(selectedListId)
    : false;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mission Briefing Modal */}
      <MissionBriefingModal
        open={showMission}
        onClose={() => setShowMission(false)}
      />

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
          Generate your unique comments — up to {MAX_CLAIMS} per list per device
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
              Up to {MAX_CLAIMS} unique comments per device per list
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
                      className="w-full min-h-[48px] border-border font-bold shadow-sm focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/80 transition"
                      style={{
                        background: "#0d1b2a",
                        color: "#e0f7ff",
                        fontWeight: 700,
                        border: "1px solid rgba(0,255,255,0.3)",
                      }}
                    >
                      <SelectValue placeholder="Choose a list..." />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: "#0d1b2a",
                        border: "1px solid rgba(0,255,255,0.3)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                      }}
                    >
                      {availableLists.map((list: CommentList) => (
                        <SelectItem
                          key={list.id}
                          value={list.id}
                          style={{
                            color: "#e0f7ff",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                          }}
                          className="cursor-pointer focus:bg-cyan-900/60 focus:text-white data-[highlighted]:bg-cyan-900/60 data-[highlighted]:text-white"
                        >
                          {list.displayName}
                          {hasClaimedComment(list.id) && (
                            <span className="ml-2 text-xs opacity-60">
                              ✓{" "}
                              {getRemainingClaims(list.id) === 0
                                ? "full"
                                : `${MAX_CLAIMS - getRemainingClaims(list.id)}/${MAX_CLAIMS}`}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Progress indicator */}
              {selectedListId && usedClaims > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#87CEEB" }}
                    >
                      {usedClaims} of {MAX_CLAIMS} slots used
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: limitReached ? "#ff4466" : "#6f88a3" }}
                    >
                      {limitReached
                        ? "Limit reached"
                        : `${remainingClaims} remaining`}
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(135,206,235,0.1)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(usedClaims / MAX_CLAIMS) * 100}%`,
                        background: limitReached
                          ? "linear-gradient(90deg, #ff4466, #cc1133)"
                          : "linear-gradient(90deg, #87CEEB, #4682B4)",
                        boxShadow: limitReached
                          ? "0 0 8px rgba(255,68,102,0.5)"
                          : "0 0 8px rgba(135,206,235,0.4)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Previously claimed notice */}
              {alreadyClaimed &&
                selectedListId &&
                !noCommentsLeft &&
                !limitReached && (
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
                      You have {usedClaims} comment{usedClaims !== 1 ? "s" : ""}{" "}
                      from this list. You can generate {remainingClaims} more.
                    </p>
                  </div>
                )}

              {/* Status badge for fresh list */}
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
              <button
                type="button"
                onClick={handleGenerate}
                disabled={
                  !selectedList ||
                  isGenerating ||
                  noCommentsLeft ||
                  limitReached
                }
                data-ocid="single-gen.generate.button"
                className="w-full min-h-[48px] py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                style={{
                  background:
                    selectedList && !noCommentsLeft && !limitReached
                      ? "linear-gradient(135deg, #87CEEB, #4682B4)"
                      : limitReached
                        ? "rgba(255,68,102,0.1)"
                        : "rgba(30,30,50,0.5)",
                  color:
                    selectedList && !noCommentsLeft && !limitReached
                      ? "#000"
                      : limitReached
                        ? "#ff4466"
                        : "#555",
                  border:
                    selectedList && !noCommentsLeft && !limitReached
                      ? "none"
                      : limitReached
                        ? "1px solid rgba(255,68,102,0.4)"
                        : "1px solid rgba(60,60,90,0.4)",
                  boxShadow:
                    selectedList && !noCommentsLeft && !limitReached
                      ? "0 0 20px rgba(135,206,235,0.3)"
                      : "none",
                  fontStyle: "italic",
                  cursor:
                    !selectedList ||
                    isGenerating ||
                    noCommentsLeft ||
                    limitReached
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
                ) : limitReached ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Limit Reached ({MAX_CLAIMS}/{MAX_CLAIMS})
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {alreadyClaimed
                      ? `Generate Another (${remainingClaims} left)`
                      : "Generate Comment"}
                  </>
                )}
              </button>

              {/* Latest Generated Comment */}
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
                        Latest comment
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

              {/* Comment History */}
              {claimedComments.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <History
                      className="w-3.5 h-3.5"
                      style={{ color: "#87CEEB" }}
                    />
                    <span
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: "#87CEEB" }}
                    >
                      Your Comments ({claimedComments.length}/{MAX_CLAIMS})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {claimedComments.map((c, idx) => (
                      <div
                        key={`comment-${idx}-${c.slice(0, 10)}`}
                        className="rounded-lg px-3 py-2.5 flex items-start gap-2 relative"
                        data-ocid={`single-gen.item.${idx + 1}`}
                        style={{
                          background: "rgba(135,206,235,0.04)",
                          border: "1px solid rgba(135,206,235,0.1)",
                        }}
                      >
                        <span
                          className="flex-shrink-0 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mt-0.5"
                          style={{
                            background: "rgba(135,206,235,0.15)",
                            color: "#87CEEB",
                          }}
                        >
                          {idx + 1}
                        </span>
                        <p
                          className="text-xs pr-7 whitespace-pre-wrap break-words leading-relaxed flex-1"
                          style={{ color: "#c0d0e0" }}
                        >
                          {c}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopyHistory(c, idx)}
                          className="absolute top-2 right-2 p-1 rounded transition-colors"
                          style={{ color: "#555" }}
                          title="Copy"
                          data-ocid={`single-gen.copy.button.${idx + 1}`}
                        >
                          {copiedIdx === idx ? (
                            <CheckCircle2
                              className="w-3.5 h-3.5"
                              style={{ color: "#87CEEB" }}
                            />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
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
