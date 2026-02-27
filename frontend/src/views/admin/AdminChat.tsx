import { useState, useRef, useEffect } from 'react';
import { useChatMessages, useAddChatMessage } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send } from 'lucide-react';

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleString();
}

export function AdminChat() {
  const { data: messages, isLoading } = useChatMessages();
  const addMessage = useAddChatMessage();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await addMessage.mutateAsync(text.trim());
    setText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-neon-teal" />
        <h3 className="font-display font-semibold text-lg">Admin Chat</h3>
        <span className="text-xs text-muted-foreground ml-auto">Auto-refreshes every 5s</span>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <ScrollArea className="h-80 p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-24 bg-secondary rounded animate-pulse" />
                  <div className="h-10 w-full bg-secondary rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map(msg => (
                <div key={String(msg.id)} className="bg-secondary rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatTimestamp(msg.timestamp)}</span>
                    <span className="text-xs text-neon-teal">#{String(msg.id)}</span>
                  </div>
                  <p className="text-sm text-foreground">{msg.text}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No messages yet.</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-border flex gap-2">
          <Input
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="bg-secondary border-border flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim() || addMessage.isPending}
            className="gradient-btn text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
