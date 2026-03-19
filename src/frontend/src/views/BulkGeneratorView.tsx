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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Copy, RefreshCw, Zap } from "lucide-react";
import React, { useState } from "react";
import MissionBriefingModal from "../components/MissionBriefingModal";
import { useGenerateBulkGlobal, useGetPoolStats } from "../hooks/useQueries";

export default function BulkGeneratorView() {
  const [batchSize, setBatchSize] = useState<string>("10");
  const [generatedComments, setGeneratedComments] = useState<string[]>([]);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(
    null,
  );
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showMission, setShowMission] = useState(false);

  const { data: poolStats } = useGetPoolStats();
  const generateBulk = useGenerateBulkGlobal();

  const available = poolStats ? Number(poolStats.availableCount) : 0;

  const parsedBatchSize = Number.parseInt(batchSize, 10);
  const isValidBatch =
    !Number.isNaN(parsedBatchSize) &&
    parsedBatchSize > 0 &&
    parsedBatchSize <= 1000;
  const isGenerating = generateBulk.isPending;

  const handleGenerate = async () => {
    if (!isValidBatch) return;
    setErrorModalMessage(null);
    setGeneratedComments([]);

    try {
      const comments = await generateBulk.mutateAsync(BigInt(parsedBatchSize));
      setGeneratedComments(comments);
      setShowMission(true);
      setShowMission(true);
    } catch (err: unknown) {
      const raw =
        err instanceof Error ? err.message : "Failed to generate comments";
      if (raw === "Not authorized") {
        setErrorModalMessage("You are not authorized to generate comments.");
      } else if (available === 0) {
        setErrorModalMessage("No comments left. Please try later.");
      } else {
        setErrorModalMessage(raw);
      }
    }
  };

  const handleCopyAll = async () => {
    if (generatedComments.length === 0) return;
    await navigator.clipboard.writeText(generatedComments.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyOne = async (comment: string, index: number) => {
    await navigator.clipboard.writeText(comment);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Batch Size Input + Generate */}
      <Card className="glass-card border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Bulk Comment Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label
                htmlFor="batchSize"
                className="text-sm font-medium mb-2 block"
              >
                Number of Comments
              </Label>
              <Input
                id="batchSize"
                type="number"
                min={1}
                max={1000}
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="e.g. 10"
                className="bg-card text-card-foreground border-border"
                disabled={isGenerating}
              />
              {!isValidBatch && batchSize !== "" && (
                <p className="text-xs text-destructive mt-1">
                  Enter a number between 1 and 1000
                </p>
              )}
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !isValidBatch}
              data-ocid="bulk-gen.generate.button"
              className="px-6 gradient-btn border-none"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Bulk
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
                Generated {generatedComments.length} Comment
                {generatedComments.length !== 1 ? "s" : ""}
                <span className="ml-2 text-green-500 text-xs">
                  ✓ All fulfilled
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAll}
                className="h-8 px-2 text-xs"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-green-500" />
                    Copied All!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy All
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-2 pr-3">
                {generatedComments.map((comment, index) => (
                  <div
                    key={`comment-${comment.slice(0, 30)}-${index}`}
                    className="flex items-start gap-2 bg-muted/40 rounded-lg p-3 group hover:bg-muted/60 transition-colors"
                  >
                    <span className="text-xs text-muted-foreground mt-0.5 w-6 shrink-0 text-right">
                      {index + 1}.
                    </span>
                    <p className="text-sm flex-1 leading-relaxed">{comment}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleCopyOne(comment, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
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
              Unable to Generate Comments
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
