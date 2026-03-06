import React, { useState } from "react";
import { Copy, Check, Zap, RefreshCw } from "lucide-react";
import { useGetPoolStats, useGenerateSingle } from "../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SingleGeneratorView() {
  const [generatedComment, setGeneratedComment] = useState<string | null>(null);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: poolStats, isLoading: statsLoading } = useGetPoolStats();
  const generateSingle = useGenerateSingle();

  const available = poolStats ? Number(poolStats.availableCount) : 0;
  const total = poolStats ? Number(poolStats.totalPoolSize) : 0;
  const used = total - available;

  const handleGenerate = async () => {
    setErrorModalMessage(null);
    setGeneratedComment(null);
    try {
      const comment = await generateSingle.mutateAsync();
      setGeneratedComment(comment);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Failed to generate comment";
      // Map backend error messages to user-friendly modal text
      if (raw === "Pool is empty") {
        setErrorModalMessage("No comments left. Please try later.");
      } else if (raw === "Not authorized") {
        setErrorModalMessage("You are not authorized to generate comments.");
      } else {
        setErrorModalMessage(raw);
      }
    }
  };

  const handleCopy = async () => {
    if (!generatedComment) return;
    await navigator.clipboard.writeText(generatedComment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isGenerating = generateSingle.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Pool Stats */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Global Comment Pool
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex gap-4 animate-pulse">
              <div className="h-12 bg-muted rounded flex-1" />
              <div className="h-12 bg-muted rounded flex-1" />
              <div className="h-12 bg-muted rounded flex-1" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">{available}</div>
                <div className="text-xs text-muted-foreground mt-1">Comments Left</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold">{used}</div>
                <div className="text-xs text-muted-foreground mt-1">Used</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-xs text-muted-foreground mt-1">Total</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="lg"
          className="gradient-btn px-8 py-3 text-base font-semibold"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Generate One Comment
            </>
          )}
        </Button>
      </div>

      {/* Generated Comment */}
      {generatedComment && (
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              <span>Generated Comment</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={handleCopy}
            >
              {generatedComment}
            </div>
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
            <DialogTitle className="text-destructive">Unable to Generate Comment</DialogTitle>
            <DialogDescription className="text-base pt-2">
              {errorModalMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorModalMessage(null)} className="w-full sm:w-auto">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
