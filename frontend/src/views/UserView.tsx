import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCommentLists, useAppsEvents, useAccessKey } from "../hooks/useQueries";
import { useCommentGenerator } from "../hooks/useCommentGenerator";
import { Copy, CheckCheck, Lock, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const QUANTITY_OPTIONS = [5, 10, 20, 50];

export default function UserView() {
  const { data: commentLists, isLoading: listsLoading } = useCommentLists();
  const { data: appsEvents, isLoading: appsLoading } = useAppsEvents();
  const { data: accessKey } = useAccessKey();
  const { generateBulk } = useCommentGenerator();

  const [selectedApp, setSelectedApp] = useState<string>("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(10);
  const [enteredKey, setEnteredKey] = useState<string>("");
  const [generatedComments, setGeneratedComments] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [keyError, setKeyError] = useState(false);

  const isLoading = listsLoading || appsLoading;

  // Filter comment lists by selected app
  const filteredLists = commentLists?.filter((list) => {
    if (!selectedApp) return false;
    // Match lists whose id or displayName contains the app name
    return (
      list.id.toLowerCase().includes(selectedApp.toLowerCase()) ||
      list.displayName.toLowerCase().includes(selectedApp.toLowerCase()) ||
      list.id === selectedApp
    );
  }) ?? [];

  const selectedList = commentLists?.find((l) => l.id === selectedListId);

  const handleGenerate = () => {
    setKeyError(false);

    if (!enteredKey.trim()) {
      setKeyError(true);
      toast.error("Please enter an access key");
      return;
    }

    if (!accessKey || enteredKey.trim() !== accessKey) {
      setKeyError(true);
      toast.error("Invalid access key");
      return;
    }

    if (!selectedList) {
      toast.error("Please select a comment list");
      return;
    }

    if (selectedList.locked) {
      toast.error("This comment list is locked");
      return;
    }

    const comments = generateBulk(selectedList, quantity);
    if (comments.length === 0) {
      toast.error("No templates found in this list");
      return;
    }

    setGeneratedComments(comments);
    toast.success(`Generated ${comments.length} comments!`);
  };

  const handleCopyOne = async (comment: string, index: number) => {
    await navigator.clipboard.writeText(comment);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = async () => {
    if (generatedComments.length === 0) return;
    await navigator.clipboard.writeText(generatedComments.join("\n"));
    setCopiedAll(true);
    toast.success("All comments copied!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          Bulk Comments Generator
        </h2>
        <p className="text-muted-foreground text-sm">
          Generate multiple comments at once for your selected app
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
        {/* App/Event Selector */}
        <div className="space-y-1.5">
          <Label>App / Event</Label>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedApp}
              onValueChange={(val) => {
                setSelectedApp(val);
                setSelectedListId("");
                setGeneratedComments([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an app or event…" />
              </SelectTrigger>
              <SelectContent>
                {appsEvents && appsEvents.length > 0 ? (
                  appsEvents.map((app) => (
                    <SelectItem key={app.name} value={app.name}>
                      {app.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none__" disabled>
                    No apps available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Comment List Selector */}
        <div className="space-y-1.5">
          <Label>Comment List</Label>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedListId}
              onValueChange={(val) => {
                setSelectedListId(val);
                setGeneratedComments([]);
              }}
              disabled={!selectedApp}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedApp ? "Select a comment list…" : "Select an app first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredLists.length > 0 ? (
                  filteredLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.displayName}
                      {list.locked && " 🔒"}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none__" disabled>
                    {selectedApp ? "No lists for this app" : "Select an app first"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Quantity Selector */}
        <div className="space-y-1.5">
          <Label>Number of Comments</Label>
          <div className="flex gap-2 flex-wrap">
            {QUANTITY_OPTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  quantity === q
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Access Key Input */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Access Key
          </Label>
          <Input
            type="password"
            placeholder="Enter access key…"
            value={enteredKey}
            onChange={(e) => {
              setEnteredKey(e.target.value);
              setKeyError(false);
            }}
            className={keyError ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {keyError && (
            <p className="text-destructive text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Invalid access key
            </p>
          )}
        </div>

        {/* Generate Button */}
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={!selectedListId || isLoading}
        >
          <Zap className="w-4 h-4 mr-2" />
          Generate {quantity} Comments
        </Button>
      </div>

      {/* Generated Comments Output */}
      {generatedComments.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Generated Comments
              <Badge variant="secondary">{generatedComments.length}</Badge>
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5"
            >
              {copiedAll ? (
                <CheckCheck className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Copy All
            </Button>
          </div>

          <ScrollArea className="h-72">
            <div className="space-y-2 pr-3">
              {generatedComments.map((comment, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 bg-muted/50 rounded-lg p-3 group"
                >
                  <span className="text-xs text-muted-foreground font-mono w-5 shrink-0 mt-0.5">
                    {index + 1}.
                  </span>
                  <p className="flex-1 text-sm text-foreground leading-relaxed">{comment}</p>
                  <button
                    onClick={() => handleCopyOne(comment, index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-muted"
                    title="Copy"
                  >
                    {copiedIndex === index ? (
                      <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
