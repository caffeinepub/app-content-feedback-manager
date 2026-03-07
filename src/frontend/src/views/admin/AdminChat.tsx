import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAddChatMessage, useGetChatMessages } from "../../hooks/useQueries";

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleString();
}

export function AdminChat() {
  const { data: messages, isLoading } = useGetChatMessages();
  const addMessage = useAddChatMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: bottomRef is a stable ref, intentionally omitted
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await addMessage.mutateAsync(text.trim());
      setText("");
    } catch {
      // error handled silently
    }
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      <div className="glass-card-gold p-4 rounded-2xl flex items-center gap-3">
        <MessageSquare
          className="w-5 h-5"
          style={{ color: "oklch(0.82 0.20 70)" }}
        />
        <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider gradient-heading">
          Chat Messages
        </h3>
        <span
          className="ml-auto text-xs font-rajdhani"
          style={{ color: "oklch(0.55 0.04 260)" }}
        >
          {messages?.length ?? 0} messages
        </span>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <ScrollArea className="h-80 p-4">
          {isLoading ? (
            <div
              className="text-center py-8 font-rajdhani text-sm"
              style={{ color: "oklch(0.50 0.04 260)" }}
            >
              Loading messages...
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={String(msg.id)}
                  className="rounded-xl p-3"
                  style={{
                    background: "oklch(0.10 0.025 260 / 0.6)",
                    border: "1px solid oklch(0.22 0.05 260 / 0.4)",
                  }}
                >
                  <p
                    className="text-sm font-rajdhani"
                    style={{ color: "oklch(0.85 0.05 80)" }}
                  >
                    {msg.text}
                  </p>
                  <p
                    className="text-xs font-rajdhani mt-1"
                    style={{ color: "oklch(0.45 0.04 260)" }}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div
              className="text-center py-8 font-rajdhani text-sm"
              style={{ color: "oklch(0.45 0.04 260)" }}
            >
              No messages yet
            </div>
          )}
        </ScrollArea>

        <form
          onSubmit={handleSend}
          className="flex gap-2 p-4"
          style={{ borderTop: "1px solid oklch(0.22 0.05 260 / 0.4)" }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 glass-input border-0"
            disabled={addMessage.isPending}
          />
          <Button
            type="submit"
            disabled={!text.trim() || addMessage.isPending}
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
              color: "oklch(0.08 0.02 260)",
              border: "none",
            }}
          >
            {addMessage.isPending ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
