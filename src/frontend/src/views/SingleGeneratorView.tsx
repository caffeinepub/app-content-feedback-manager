import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, RefreshCw, Zap } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import MissionBriefingModal from "../components/MissionBriefingModal";
import { useGenerateSingle } from "../hooks/useQueries";

interface GeneratedItem {
  id: string;
  text: string;
  copied: boolean;
}

export default function SingleGeneratorView() {
  const [generatedComments, setGeneratedComments] = useState<GeneratedItem[]>(
    [],
  );
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(
    null,
  );
  const [showMission, setShowMission] = useState(false);

  // Count input state
  const [count, setCount] = useState(1);

  // Admin controls — read once on mount
  const [forceCountEnabled, setForceCountEnabled] = useState(false);
  const [forceCount, setForceCount] = useState(3);
  const [maxLimit, setMaxLimit] = useState(0);

  const generateSingle = useGenerateSingle();
  const isGenerating = generateSingle.isPending;

  // Keep a ref to the mutation function so we can call it in a loop
  const generateRef = useRef(generateSingle);
  generateRef.current = generateSingle;

  useEffect(() => {
    const enabled = localStorage.getItem("adminForceCountEnabled") === "true";
    const fc = Number(localStorage.getItem("adminForceCount") ?? 3);
    const ml = Number(localStorage.getItem("adminMaxLimit") ?? 0);
    setForceCountEnabled(enabled);
    setForceCount(fc);
    setMaxLimit(ml);
    if (enabled) {
      setCount(fc);
    } else if (ml > 0) {
      setCount((prev) => Math.min(prev, ml));
    }
  }, []);

  const effectiveMax = forceCountEnabled
    ? forceCount
    : maxLimit > 0
      ? maxLimit
      : 20;

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (forceCountEnabled) return;
    const v = Math.min(effectiveMax, Math.max(1, Number(e.target.value)));
    setCount(v);
  };

  const handleGenerate = async () => {
    setErrorModalMessage(null);
    setGeneratedComments([]);

    const requestCount = forceCountEnabled ? forceCount : count;
    const results: GeneratedItem[] = [];
    const batchId = Date.now();

    try {
      for (let i = 0; i < requestCount; i++) {
        const comment = await generateRef.current.mutateAsync();
        results.push({ id: `${batchId}-${i}`, text: comment, copied: false });
      }
      setGeneratedComments(results);
      setShowMission(true);
    } catch (err: unknown) {
      const raw =
        err instanceof Error ? err.message : "Failed to generate comment";
      // Still show whatever we got before the error
      if (results.length > 0) {
        setGeneratedComments(results);
        setShowMission(true);
      }
      if (raw === "Pool is empty") {
        if (results.length === 0) {
          setErrorModalMessage("No comments left. Please try later.");
        }
      } else if (raw === "Not authorized") {
        setErrorModalMessage("You are not authorized to generate comments.");
      } else if (results.length === 0) {
        setErrorModalMessage(raw);
      }
    }
  };

  const handleCopySingle = async (id: string) => {
    const item = generatedComments.find((c) => c.id === id);
    if (!item) return;
    await navigator.clipboard.writeText(item.text);
    setGeneratedComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, copied: true } : c)),
    );
    setTimeout(() => {
      setGeneratedComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, copied: false } : c)),
      );
    }, 2000);
  };

  const handleCopyAll = async () => {
    if (generatedComments.length === 0) return;
    const all = generatedComments.map((c) => c.text).join("\n\n");
    await navigator.clipboard.writeText(all);
  };

  const requestCount = forceCountEnabled ? forceCount : count;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Generate controls */}
      <Card className="glass-card border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Single Comment Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Admin badges */}
          <div className="flex flex-wrap gap-2">
            {forceCountEnabled && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{
                  background: "oklch(0.82 0.20 70 / 0.15)",
                  border: "1px solid oklch(0.82 0.20 70 / 0.4)",
                  color: "oklch(0.85 0.20 72)",
                }}
                data-ocid="single-gen-view.force_count.badge"
              >
                ⚡ Admin: Force {forceCount} comments
              </span>
            )}
            {!forceCountEnabled && maxLimit > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{
                  background: "oklch(0.70 0.20 185 / 0.15)",
                  border: "1px solid oklch(0.70 0.20 185 / 0.4)",
                  color: "oklch(0.78 0.22 188)",
                }}
                data-ocid="single-gen-view.max_limit.badge"
              >
                🔒 Max: {maxLimit} per request
              </span>
            )}
          </div>

          {/* Count input */}
          <div>
            <label
              htmlFor="comment-count"
              className="block text-sm font-medium mb-2"
              style={{ color: "oklch(0.72 0.04 260)" }}
            >
              How many comments?
            </label>
            <input
              id="comment-count"
              type="number"
              min={1}
              max={effectiveMax}
              value={forceCountEnabled ? forceCount : count}
              disabled={forceCountEnabled || isGenerating}
              onChange={handleCountChange}
              className="glass-input w-full px-3 py-2.5 text-sm"
              style={{
                opacity: forceCountEnabled ? 0.6 : 1,
                cursor: forceCountEnabled ? "not-allowed" : undefined,
              }}
              data-ocid="single-gen-view.count.input"
            />
          </div>

          {/* Generate button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
              data-ocid="single-gen-view.generate.button"
              className="gradient-btn px-8 py-3 text-base font-semibold border-none"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating{requestCount > 1 ? ` (0/${requestCount})` : "..."}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Generate{" "}
                  {requestCount > 1
                    ? `${requestCount} Comments`
                    : "One Comment"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Comments */}
      {generatedComments.length > 0 && (
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              <span>
                Generated{" "}
                {generatedComments.length === 1
                  ? "Comment"
                  : `${generatedComments.length} Comments`}
              </span>
              {generatedComments.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAll}
                  className="h-8 px-2 text-xs"
                  data-ocid="single-gen-view.copy_all.button"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {generatedComments.map((item, idx) => (
              <div
                key={item.id}
                className="relative group"
                data-ocid={`single-gen-view.comment.item.${idx + 1}`}
              >
                <div
                  className="rounded-lg p-4 pr-12 text-sm leading-relaxed"
                  style={{
                    background: "oklch(0.14 0.03 260 / 0.7)",
                    border: "1px solid oklch(0.28 0.06 260 / 0.4)",
                  }}
                >
                  {item.text}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySingle(item.id)}
                  className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-ocid={`single-gen-view.copy.button.${idx + 1}`}
                >
                  {item.copied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error Modal */}
      <Dialog
        open={errorModalMessage !== null}
        onOpenChange={(open) => {
          if (!open) setErrorModalMessage(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Unable to Generate Comment
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {errorModalMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setErrorModalMessage(null)}
              className="w-full sm:w-auto"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MissionBriefingModal
        open={showMission}
        onClose={() => setShowMission(false)}
      />
    </div>
  );
}
