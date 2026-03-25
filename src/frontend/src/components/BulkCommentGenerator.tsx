import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Copy, Loader2, Package, Zap } from "lucide-react";
import { useState } from "react";
import type { CommentList } from "../backend";
import {
  useConsumeFromList,
  useGetAllCommentLists,
  useGetAvailableCount,
  useGetBulkCheckerEarningsEnabled,
  useGetEarningsMode,
  useGetPerLinkRate,
  useGetSettings,
  usePriceList,
} from "../hooks/useQueries";

interface BulkCommentGeneratorProps {
  onGenerated?: (comments: string[]) => void;
}

const CHIPS = [5, 10, 20, 50];

export default function BulkCommentGenerator({
  onGenerated,
}: BulkCommentGeneratorProps) {
  const [selectedListId, setSelectedListId] = useState("");
  const [quantity, setQuantity] = useState(5);
  const [manualInput, setManualInput] = useState("5");
  const [accessKeyInput, setAccessKeyInput] = useState("");
  const [generatedComments, setGeneratedComments] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const { data: commentLists = [] } = useGetAllCommentLists();
  const { data: settings } = useGetSettings();
  const { data: availableCountRaw, isLoading: countLoading } =
    useGetAvailableCount(selectedListId);
  const consumeFromList = useConsumeFromList();
  const { data: bulkCheckerEarningsEnabled = true } =
    useGetBulkCheckerEarningsEnabled();
  const { data: earningsMode = "flatRate" } = useGetEarningsMode();
  const { data: perLinkRate = 0 } = useGetPerLinkRate();
  const { data: priceList = [] } = usePriceList();

  const accessKey = settings?.accessKey ?? null;
  const available =
    availableCountRaw !== undefined ? Number(availableCountRaw) : 0;
  const selectedList: CommentList | undefined = commentLists.find(
    (l) => l.id === selectedListId,
  );

  const isGenerating = consumeFromList.isPending;

  const handleChipClick = (chip: number) => {
    setQuantity(chip);
    setManualInput(String(chip));
    setInlineError("");
  };

  const handleManualInput = (val: string) => {
    setManualInput(val);
    const num = Number.parseInt(val, 10);
    if (!Number.isNaN(num) && num >= 1) {
      const clamped = selectedListId ? Math.min(num, available) : num;
      setQuantity(clamped);
      if (selectedListId && num > available) {
        setInlineError(`Only ${available} templates left. Quantity clamped.`);
      } else {
        setInlineError("");
      }
    }
  };

  const handleGenerate = async () => {
    setInlineError("");
    if (!selectedListId) {
      setInlineError("Please select a comment list.");
      return;
    }
    if (!accessKeyInput.trim()) {
      setInlineError("Please enter your access key.");
      return;
    }
    if (accessKey && accessKeyInput.trim() !== accessKey) {
      setInlineError("Invalid access key.");
      return;
    }
    if (!selectedList) {
      setInlineError("Selected list not found.");
      return;
    }
    if (selectedList.locked) {
      setInlineError("This list is currently locked.");
      return;
    }
    if (available === 0) {
      setErrorModal("No templates left. Please try later.");
      return;
    }
    if (quantity > available) {
      setErrorModal(
        `Only ${available} templates left. Please reduce quantity.`,
      );
      return;
    }

    try {
      const comments = await consumeFromList.mutateAsync({
        listId: selectedListId,
        count: BigInt(quantity),
      });
      setGeneratedComments(comments);
      onGenerated?.(comments);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed.";
      setErrorModal(msg);
    }
  };

  const handleCopyAll = async () => {
    if (generatedComments.length === 0) return;
    await navigator.clipboard.writeText(generatedComments.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeColor =
    available > 10
      ? {
          bg: "oklch(0.65 0.18 145 / 0.12)",
          border: "oklch(0.65 0.18 145 / 0.35)",
          text: "oklch(0.72 0.20 145)",
        }
      : available > 0
        ? {
            bg: "oklch(0.75 0.18 65 / 0.12)",
            border: "oklch(0.75 0.18 65 / 0.35)",
            text: "oklch(0.82 0.20 70)",
          }
        : {
            bg: "oklch(0.55 0.22 25 / 0.12)",
            border: "oklch(0.55 0.22 25 / 0.35)",
            text: "oklch(0.68 0.22 25)",
          };

  return (
    <>
      <div className="glass-card-gold p-5 rounded-2xl space-y-4 animate-fadeInUp">
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider gradient-heading flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: "oklch(0.82 0.20 70)" }} />
            Bulk Comment Generator
          </h3>

          {/* Templates left badge — always show when list selected */}
          {selectedListId && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{
                background: badgeColor.bg,
                border: `1px solid ${badgeColor.border}`,
              }}
              data-ocid="bulk.loading_state"
            >
              <Package
                className="w-3.5 h-3.5"
                style={{ color: badgeColor.text }}
              />
              <span
                className="font-orbitron font-bold text-xs"
                style={{ color: badgeColor.text }}
              >
                {countLoading ? "…" : `${available} left`}
              </span>
            </div>
          )}
        </div>

        {/* List selector */}
        <div>
          <label
            htmlFor="bulk-list-select"
            className="block text-xs font-rajdhani font-600 mb-1.5 uppercase tracking-wider"
            style={{ color: "oklch(0.72 0.04 260)" }}
          >
            Comment List
          </label>
          <select
            id="bulk-list-select"
            value={selectedListId}
            onChange={(e) => {
              setSelectedListId(e.target.value);
              setInlineError("");
              setGeneratedComments([]);
            }}
            className="glass-input w-full px-4 py-2.5 text-sm"
            data-ocid="bulk.select"
          >
            <option value="">— Select a list —</option>
            {commentLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity chips + manual input */}
        <div>
          <label
            htmlFor="bulk-manual-input"
            className="block text-xs font-rajdhani font-600 mb-1.5 uppercase tracking-wider"
            style={{ color: "oklch(0.72 0.04 260)" }}
          >
            Quantity
            {selectedListId && (
              <span
                className="ml-2 normal-case font-400"
                style={{ color: badgeColor.text }}
              >
                ({available} templates left)
              </span>
            )}
          </label>

          {/* Preset chips */}
          <div className="flex gap-2 mb-2 flex-wrap">
            {CHIPS.map((chip) => {
              const isDisabled = selectedListId ? chip > available : false;
              const isActive = quantity === chip;
              return (
                <button
                  type="button"
                  key={chip}
                  onClick={() => !isDisabled && handleChipClick(chip)}
                  disabled={isDisabled}
                  className="px-3 py-1 rounded-lg text-xs font-orbitron font-bold transition-all duration-200"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))"
                      : isDisabled
                        ? "oklch(0.14 0.03 260 / 0.4)"
                        : "oklch(0.16 0.03 260 / 0.6)",
                    color: isActive
                      ? "oklch(0.08 0.02 260)"
                      : isDisabled
                        ? "oklch(0.40 0.04 260)"
                        : "oklch(0.78 0.04 260)",
                    border: isActive
                      ? "1px solid oklch(0.75 0.18 65 / 0.5)"
                      : isDisabled
                        ? "1px solid oklch(0.20 0.03 260 / 0.3)"
                        : "1px solid oklch(0.26 0.05 260 / 0.5)",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                  data-ocid={`bulk.button.${chip}`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* Manual numeric input */}
          <div className="flex items-center gap-2">
            <input
              id="bulk-manual-input"
              type="number"
              min={1}
              max={selectedListId ? available : 500}
              value={manualInput}
              onChange={(e) => handleManualInput(e.target.value)}
              placeholder="Custom amount"
              className="glass-input w-full px-4 py-2.5 text-sm"
              data-ocid="bulk.input"
            />
          </div>
          {inlineError && (
            <p
              className="text-xs font-rajdhani mt-1 animate-fadeIn"
              style={{ color: "oklch(0.68 0.22 25)" }}
              data-ocid="bulk.error_state"
            >
              ⚠ {inlineError}
            </p>
          )}
        </div>

        {/* Access Key */}
        <div>
          <label
            htmlFor="bulk-access-key"
            className="block text-xs font-rajdhani font-600 mb-1.5 uppercase tracking-wider"
            style={{ color: "oklch(0.72 0.04 260)" }}
          >
            Access Key
          </label>
          <input
            id="bulk-access-key"
            type="password"
            value={accessKeyInput}
            onChange={(e) => setAccessKeyInput(e.target.value)}
            placeholder="Enter access key..."
            className="glass-input w-full px-4 py-2.5 text-sm"
            data-ocid="bulk.input"
          />
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !selectedListId || available === 0}
          className="w-full py-3 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center justify-center gap-2"
          style={{
            background:
              !selectedListId || available === 0
                ? "oklch(0.16 0.03 260)"
                : "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
            color:
              !selectedListId || available === 0
                ? "oklch(0.42 0.04 260)"
                : "oklch(0.08 0.02 260)",
            boxShadow:
              selectedListId && available > 0
                ? "0 4px 15px oklch(0.75 0.18 65 / 0.3)"
                : "none",
          }}
          data-ocid="bulk.primary_button"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate {quantity} Comments
            </>
          )}
        </button>

        {/* Generated comments */}
        {generatedComments.length > 0 && (
          <div
            className="animate-fadeInUp space-y-2"
            data-ocid="bulk.success_state"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-orbitron font-bold uppercase tracking-wider"
                style={{ color: "oklch(0.72 0.20 145)" }}
              >
                ✓ {generatedComments.length} Generated
              </span>
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-rajdhani font-600 transition-all duration-200 hover:scale-105"
                style={{
                  background: copied
                    ? "oklch(0.65 0.18 145 / 0.15)"
                    : "oklch(0.70 0.20 185 / 0.15)",
                  border: `1px solid ${
                    copied
                      ? "oklch(0.65 0.18 145 / 0.3)"
                      : "oklch(0.70 0.20 185 / 0.3)"
                  }`,
                  color: copied
                    ? "oklch(0.72 0.20 145)"
                    : "oklch(0.78 0.22 188)",
                }}
                data-ocid="bulk.secondary_button"
              >
                {copied ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied!" : "Copy All"}
              </button>
            </div>
            <div
              className="rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5"
              style={{
                background: "oklch(0.08 0.02 260 / 0.8)",
                border: "1px solid oklch(0.22 0.05 260 / 0.4)",
              }}
            >
              {generatedComments.map((comment, idx) => (
                <div
                  key={`${idx}-${comment.slice(0, 12)}`}
                  className="text-xs font-rajdhani px-3 py-2 rounded-lg"
                  style={{
                    background: "oklch(0.12 0.03 260 / 0.6)",
                    border: "1px solid oklch(0.22 0.05 260 / 0.3)",
                    color: "oklch(0.82 0.03 80)",
                  }}
                >
                  <span style={{ color: "oklch(0.55 0.04 260)" }}>
                    {idx + 1}.{" "}
                  </span>
                  {comment}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Earnings Display */}
      {bulkCheckerEarningsEnabled && generatedComments.length > 0 && (
        <div
          className="glass-card p-4 rounded-2xl space-y-3 animate-fadeInUp"
          style={{
            border: "1px solid oklch(0.65 0.20 145 / 0.3)",
            background: "oklch(0.65 0.20 145 / 0.05)",
          }}
        >
          <h4
            className="font-bold text-xs uppercase tracking-wider"
            style={{ color: "oklch(0.72 0.20 145)" }}
          >
            💰 Bulk Earnings
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "oklch(0.10 0.03 260 / 0.6)",
                border: "1px solid oklch(0.22 0.05 260 / 0.4)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: "oklch(0.55 0.04 260)" }}
              >
                Comments Generated
              </p>
              <p
                className="font-bold text-lg"
                style={{ color: "oklch(0.82 0.04 260)" }}
              >
                {generatedComments.length}
              </p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "oklch(0.10 0.03 260 / 0.6)",
                border: "1px solid oklch(0.65 0.20 145 / 0.3)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: "oklch(0.55 0.04 260)" }}
              >
                Earnings ({earningsMode === "valueSum" ? "Mode A" : "Mode B"})
              </p>
              <p
                className="font-bold text-lg"
                style={{
                  color: "oklch(0.72 0.20 145)",
                  textShadow: "0 0 10px oklch(0.72 0.20 145 / 0.4)",
                }}
              >
                ₹
                {earningsMode === "valueSum"
                  ? priceList
                      .filter((p) => p.isActive)
                      .reduce((sum, p) => sum + Number(p.pricePerEntry), 0)
                      .toFixed(2)
                  : (generatedComments.length * perLinkRate).toFixed(2)}
              </p>
            </div>
          </div>
          {earningsMode === "flatRate" && (
            <p
              className="text-xs text-center"
              style={{ color: "oklch(0.50 0.04 260)" }}
            >
              ₹{perLinkRate.toFixed(2)} × {generatedComments.length} comments
            </p>
          )}
        </div>
      )}

      {/* Error Modal */}
      <Dialog
        open={errorModal !== null}
        onOpenChange={(open) => {
          if (!open) setErrorModal(null);
        }}
      >
        <DialogContent className="sm:max-w-md" data-ocid="bulk.dialog">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Unable to Generate Comments
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {errorModal}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setErrorModal(null)}
              className="w-full sm:w-auto"
              data-ocid="bulk.confirm_button"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
