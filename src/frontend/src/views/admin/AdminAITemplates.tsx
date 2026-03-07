import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, Plus, Smile, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddTemplatesToCommentList,
  useCommentLists,
} from "../../hooks/useQueries";

// Simple template generator (no external AI)
function generateTemplates(
  topic: string,
  tone: string,
  count: number,
  appendSymbol: string,
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

  const templates = toneMap[tone] || toneMap.positive;
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
  const addTemplates = useAddTemplatesToCommentList();

  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("positive");
  const [count, setCount] = useState("10");
  const [appendSymbol, setAppendSymbol] = useState("");
  const [generatedTemplates, setGeneratedTemplates] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(
    new Set(),
  );
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
    const templates = generateTemplates(
      topic,
      tone,
      Number.parseInt(count),
      appendSymbol,
    );
    setGeneratedTemplates(templates);
    setSelectedTemplates(new Set(templates.map((_, i) => i)));
    setIsGenerating(false);
    toast.success(`Generated ${templates.length} templates`);
  };

  const toggleTemplate = (index: number) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSaveToList = async () => {
    if (!targetListId) {
      toast.error("Please select a target list");
      return;
    }
    const toSave = generatedTemplates.filter((_, i) =>
      selectedTemplates.has(i),
    );
    if (toSave.length === 0) {
      toast.error("No templates selected");
      return;
    }
    try {
      await addTemplates.mutateAsync({ id: targetListId, templates: toSave });
      toast.success(`Saved ${toSave.length} templates to list`);
      setGeneratedTemplates([]);
      setSelectedTemplates(new Set());
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save templates",
      );
    }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="glass-card-gold p-5 rounded-2xl">
        <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 gradient-heading flex items-center gap-2">
          <Sparkles
            className="w-4 h-4"
            style={{ color: "oklch(0.82 0.20 70)" }}
          />
          AI Template Generator
        </h3>

        <div className="space-y-4">
          {/* Topic */}
          <div className="space-y-1.5">
            <Label
              className="text-xs font-rajdhani uppercase tracking-wider"
              style={{ color: "oklch(0.60 0.04 260)" }}
            >
              Topic
            </Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. product review, food, travel..."
              className="glass-input border-0"
            />
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <Label
              className="text-xs font-rajdhani uppercase tracking-wider"
              style={{ color: "oklch(0.60 0.04 260)" }}
            >
              Tone
            </Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="glass-input border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positive 😊</SelectItem>
                <SelectItem value="neutral">Neutral 😐</SelectItem>
                <SelectItem value="hype">Hype 🔥</SelectItem>
                <SelectItem value="question">Question ❓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Count */}
          <div className="space-y-1.5">
            <Label
              className="text-xs font-rajdhani uppercase tracking-wider"
              style={{ color: "oklch(0.60 0.04 260)" }}
            >
              Count
            </Label>
            <Input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="glass-input border-0"
            />
          </div>

          {/* Append Symbol */}
          <div className="space-y-1.5">
            <Label
              className="text-xs font-rajdhani uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: "oklch(0.60 0.04 260)" }}
            >
              <Smile className="w-3.5 h-3.5" />
              Append Symbol (optional)
            </Label>
            <Input
              value={appendSymbol}
              onChange={(e) => setAppendSymbol(e.target.value)}
              placeholder="e.g. ❤️ or 🔥 or ✅"
              className="glass-input border-0"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full font-orbitron font-bold text-xs uppercase tracking-wider"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
              color: "oklch(0.08 0.02 260)",
              border: "none",
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Templates
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generated Templates */}
      {generatedTemplates.length > 0 && (
        <div className="glass-card p-5 rounded-2xl space-y-4 animate-fadeInUp">
          <div className="flex items-center justify-between">
            <h4
              className="font-orbitron font-bold text-xs uppercase tracking-wider"
              style={{ color: "oklch(0.78 0.22 188)" }}
            >
              Generated Templates
            </h4>
            <div className="flex gap-2">
              <Badge
                variant="secondary"
                className="cursor-pointer text-xs"
                onClick={() =>
                  setSelectedTemplates(
                    new Set(generatedTemplates.map((_, i) => i)),
                  )
                }
              >
                Select All
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer text-xs"
                onClick={() => setSelectedTemplates(new Set())}
              >
                Clear
              </Badge>
            </div>
          </div>

          <ScrollArea
            className="h-64 rounded-xl"
            style={{ border: "1px solid oklch(0.22 0.05 260 / 0.4)" }}
          >
            <div className="p-3 space-y-2">
              {generatedTemplates.map((template, index) => (
                <div
                  key={`tpl-${template.slice(0, 60)}`}
                  onClick={() => toggleTemplate(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleTemplate(index);
                    }
                  }}
                  className="flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200"
                  style={{
                    background: selectedTemplates.has(index)
                      ? "oklch(0.70 0.20 185 / 0.12)"
                      : "oklch(0.12 0.03 260 / 0.4)",
                    border: `1px solid ${selectedTemplates.has(index) ? "oklch(0.70 0.20 185 / 0.3)" : "oklch(0.22 0.05 260 / 0.3)"}`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: selectedTemplates.has(index)
                        ? "oklch(0.70 0.20 185)"
                        : "transparent",
                      border: `1px solid ${selectedTemplates.has(index) ? "oklch(0.70 0.20 185)" : "oklch(0.35 0.05 260)"}`,
                    }}
                  >
                    {selectedTemplates.has(index) && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                  <span
                    className="text-xs font-rajdhani"
                    style={{ color: "oklch(0.80 0.03 80)" }}
                  >
                    {template}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator style={{ background: "oklch(0.22 0.05 260 / 0.4)" }} />

          {/* Save to list */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label
                className="text-xs font-rajdhani uppercase tracking-wider"
                style={{ color: "oklch(0.60 0.04 260)" }}
              >
                Save to List ({selectedTemplates.size} selected)
              </Label>
              <Select value={targetListId} onValueChange={setTargetListId}>
                <SelectTrigger className="glass-input border-0">
                  <SelectValue placeholder="Select target list..." />
                </SelectTrigger>
                <SelectContent>
                  {commentLists?.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSaveToList}
              disabled={
                addTemplates.isPending ||
                !targetListId ||
                selectedTemplates.size === 0
              }
              className="w-full font-orbitron font-bold text-xs uppercase tracking-wider"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.65 0.18 145), oklch(0.70 0.20 185))",
                color: "oklch(0.08 0.02 260)",
                border: "none",
              }}
            >
              {addTemplates.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Save {selectedTemplates.size} Templates to List
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
