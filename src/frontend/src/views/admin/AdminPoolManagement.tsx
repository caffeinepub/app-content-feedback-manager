import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  Database,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import {
  useAddGlobalComments,
  useGetGlobalCommentPoolStats,
} from "../../hooks/useQueries";

export default function AdminPoolManagement() {
  const [commentInput, setCommentInput] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: poolStats, isLoading: statsLoading } =
    useGetGlobalCommentPoolStats();
  const addCommentsMutation = useAddGlobalComments();

  const remaining = poolStats ? Number(poolStats.templatesRemaining) : 0;
  const total = poolStats ? Number(poolStats.totalTemplates) : 0;
  const claimed = poolStats ? Number(poolStats.totalClaimed) : 0;

  const handleSubmit = async () => {
    setSuccessMsg(null);
    setErrorMsg(null);

    const lines = commentInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setErrorMsg("Please enter at least one comment.");
      return;
    }

    try {
      await addCommentsMutation.mutateAsync(lines);
      setSuccessMsg(
        `Successfully added ${lines.length} comment${lines.length !== 1 ? "s" : ""} to the pool.`,
      );
      setCommentInput("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add comments.";
      setErrorMsg(message);
    }
  };

  const lineCount = commentInput
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Live Stats */}
      <Card className="space-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="w-4 h-4 text-accent" />
            Global Pool Live Stats
          </CardTitle>
          <CardDescription className="text-xs">
            Auto-refreshes every 3 seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading stats...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-accent">
                  {remaining}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Available
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-foreground">
                  {claimed}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Claimed
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-foreground">
                  {total}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total Added
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-foreground">
                  {total > 0 ? Math.round((remaining / total) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Remaining
                </div>
              </div>
            </div>
          )}
          {poolStats && (
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-accent h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: total > 0 ? `${(remaining / total) * 100}%` : "0%",
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {remaining} of {total} comments remaining
                </span>
                <Badge
                  variant={remaining > 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {remaining > 0 ? "Active" : "Empty"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Comments */}
      <Card className="space-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" />
            Add Comments to Pool
          </CardTitle>
          <CardDescription className="text-xs">
            Enter one comment per line. All lines will be added to the global
            pool.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="commentInput" className="text-sm">
                Comments (one per line)
              </Label>
              {lineCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {lineCount} comment{lineCount !== 1 ? "s" : ""} ready
                </span>
              )}
            </div>
            <Textarea
              id="commentInput"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={
                "Great product, highly recommend!\nAmazing quality, will buy again.\nFast shipping and excellent service."
              }
              className="min-h-[180px] bg-background/60 font-mono text-sm resize-y"
            />
          </div>

          {/* Feedback messages */}
          {successMsg && (
            <div className="flex items-start gap-2 bg-accent/10 border border-accent/30 rounded-lg p-3">
              <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <p className="text-sm text-accent">{successMsg}</p>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{errorMsg}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={addCommentsMutation.isPending || lineCount === 0}
              className="gradient-button gap-2 flex-1"
            >
              {addCommentsMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add{" "}
                  {lineCount > 0
                    ? `${lineCount} Comment${lineCount !== 1 ? "s" : ""}`
                    : "Comments"}{" "}
                  to Pool
                </>
              )}
            </Button>
            {commentInput.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setCommentInput("");
                  setSuccessMsg(null);
                  setErrorMsg(null);
                }}
                title="Clear input"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
