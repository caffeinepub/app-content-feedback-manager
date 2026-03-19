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
import React, { useState } from "react";
import MissionBriefingModal from "../components/MissionBriefingModal";
import { useGenerateSingle } from "../hooks/useQueries";

export default function SingleGeneratorView() {
  const [generatedComment, setGeneratedComment] = useState<string | null>(null);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [showMission, setShowMission] = useState(false);

  const generateSingle = useGenerateSingle();

  const handleGenerate = async () => {
    setErrorModalMessage(null);
    setGeneratedComment(null);
    try {
      const comment = await generateSingle.mutateAsync();
      setGeneratedComment(comment);
      setShowMission(true);
    } catch (err: unknown) {
      const raw =
        err instanceof Error ? err.message : "Failed to generate comment";
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
      {/* Generate Button */}
      <Card className="glass-card border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Single Comment Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

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
            <button
              type="button"
              className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed cursor-pointer hover:bg-muted/70 transition-colors w-full text-left"
              onClick={handleCopy}
            >
              {generatedComment}
            </button>
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
