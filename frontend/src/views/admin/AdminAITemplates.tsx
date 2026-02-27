import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCommentLists, useAddTemplatesToList } from "../../hooks/useQueries";
import { toast } from "sonner";
import { Sparkles, Plus, Check, Loader2, Smile } from "lucide-react";

// Simple template generator (no external AI)
function generateTemplates(
  topic: string,
  tone: string,
  count: number,
  appendSymbol: string
): string[] {
  const toneMap: Record<string, string[]> = {
    positive: [
      "Amazing {topic}! Absolutely loved it 🔥",
      "This {topic} is incredible, keep it up!",
      "Best {topic} I've seen in a while 👏",
      "Wow, {topic} never disappoints!",
      "Such a great {topic}, totally worth it!",
      "Love this {topic} so much ❤️",
      "The {topic} is on another level!",
      "Obsessed with this {topic} 😍",
      "This {topic} made my day!",
      "Incredible work on this {topic}!",
    ],
    neutral: [
      "Interesting {topic}, thanks for sharing",
      "Good {topic} overall",
      "Nice {topic}, appreciate the effort",
      "Decent {topic}, looking forward to more",
      "Solid {topic} content",
      "Thanks for the {topic} update",
      "Noted on the {topic}",
      "Fair enough {topic}",
      "Reasonable {topic} approach",
      "Okay {topic}, will check again",
    ],
    hype: [
      "LET'S GOOO {topic}!! 🚀🚀🚀",
      "THIS {topic} IS INSANE 🔥🔥",
      "NO WAY THIS {topic} IS REAL 😱",
      "BEST {topic} EVER!!!",
      "{topic} JUST BROKE THE INTERNET 💥",
      "I CAN'T HANDLE THIS {topic} 🤯",
      "ABSOLUTE FIRE {topic} 🔥",
      "THIS {topic} HIT DIFFERENT 💯",
      "LEGENDARY {topic} RIGHT HERE 👑",
      "THE {topic} WE NEEDED 🙌",
    ],
    question: [
      "What do you think about this {topic}?",
      "Has anyone else tried this {topic}?",
      "Is this {topic} worth it?",
      "How long have you been doing {topic}?",
      "Where can I learn more about {topic}?",
      "Who else is into {topic}?",
      "When did {topic} get this good?",
      "Why is {topic} so popular now?",
      "Can you share more about {topic}?",
      "What's next for {topic}?",
    ],
  };

  const templates = toneMap[tone] || toneMap["positive"];
  const results: string[] = [];
  const symbol = appendSymbol.trim();

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    let text = template.replace(/\{topic\}/g, topic || "this");
    if (symbol) {
      text = `${text}${symbol}`;
    }
    results.push(text);
  }

  return results;
}

export default function AdminAITemplates() {
  const { data: commentLists } = useCommentLists();
  const addTemplates = useAddTemplatesToList();

  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("positive");
  const [count, setCount] = useState("10");
  const [appendSymbol, setAppendSymbol] = useState("");
  const [generatedTemplates, setGeneratedTemplates] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [targetListId, setTargetListId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    setIsGenerating(true);
    // Simulate async generation
    await new Promise((r) => setTimeout(r, 600));
    const templates = generateTemplates(topic, tone, parseInt(count), appendSymbol);
    setGeneratedTemplates(templates);
    setSelectedTemplates(new Set(templates.map((_, i) => i)));
    setIsGenerating(false);
    toast.success(`Generated ${templates.length} templates`);
  };

  const toggleTemplate = (index: number) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSaveToList = async () => {
    if (!targetListId) {
      toast.error("Please select a comment list");
      return;
    }
    const toSave = generatedTemplates.filter((_, i) => selectedTemplates.has(i));
    if (toSave.length === 0) {
      toast.error("No templates selected");
      return;
    }
    try {
      await addTemplates.mutateAsync({ listId: targetListId, templates: toSave });
      toast.success(`Saved ${toSave.length} templates to list`);
      setGeneratedTemplates([]);
      setSelectedTemplates(new Set());
    } catch {
      toast.error("Failed to save templates");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Template Generator</h3>
      </div>

      {/* Generation Controls */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Topic */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="topic">Topic / App Name</Label>
            <Input
              id="topic"
              placeholder="e.g. TikTok, Instagram, gaming…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="hype">Hype</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Count */}
          <div className="space-y-1.5">
            <Label>Number of Templates</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Append Symbol */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="append-symbol" className="flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5" />
              Append Symbol
            </Label>
            <Input
              id="append-symbol"
              placeholder="e.g. ⭐, ✅, 🔥 — appended to end of every comment"
              value={appendSymbol}
              onChange={(e) => setAppendSymbol(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              This symbol will be automatically added to the end of every generated template.
            </p>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Generate Templates
        </Button>
      </div>

      {/* Generated Templates */}
      {generatedTemplates.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">
              Generated Templates
              <Badge variant="secondary" className="ml-2">
                {selectedTemplates.size} / {generatedTemplates.length} selected
              </Badge>
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedTemplates.size === generatedTemplates.length) {
                  setSelectedTemplates(new Set());
                } else {
                  setSelectedTemplates(new Set(generatedTemplates.map((_, i) => i)));
                }
              }}
            >
              {selectedTemplates.size === generatedTemplates.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2 pr-3">
              {generatedTemplates.map((template, index) => (
                <div
                  key={index}
                  onClick={() => toggleTemplate(index)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplates.has(index)
                      ? "bg-primary/10 border-primary/30"
                      : "bg-muted/30 border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedTemplates.has(index)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selectedTemplates.has(index) && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{template}</p>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          {/* Save to List */}
          <div className="space-y-3">
            <Label>Save to Comment List</Label>
            <div className="flex gap-2">
              <Select value={targetListId} onValueChange={setTargetListId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a list…" />
                </SelectTrigger>
                <SelectContent>
                  {commentLists?.map((list) => (
                    <SelectItem key={list.id} value={list.id} disabled={list.locked}>
                      {list.displayName} {list.locked ? "🔒" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSaveToList}
                disabled={addTemplates.isPending || selectedTemplates.size === 0 || !targetListId}
              >
                {addTemplates.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span className="ml-1.5">Save</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
