import React, { useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useGetAllChatMessages, useAddChatMessage } from '../../hooks/useQueries';

export default function AdminChat() {
  const { data: messages = [], isLoading } = useGetAllChatMessages();
  const addMessage = useAddChatMessage();

  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSend = async () => {
    if (!text.trim()) return;
    setFeedback(null);
    try {
      await addMessage.mutateAsync(text.trim());
      setText('');
      setFeedback('Message sent!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setFeedback(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading messages…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Chat Messages</h2>
          <p className="text-sm text-muted-foreground">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Send message */}
      <div className="space-card p-5 space-y-3">
        <h3 className="font-semibold text-sm">Send Message</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || addMessage.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {addMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </div>
        {feedback && (
          <p className={`text-sm ${feedback === 'Message sent!' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
            {feedback}
          </p>
        )}
      </div>

      {/* Messages list */}
      {messages.length === 0 ? (
        <div className="space-card p-8 text-center">
          <p className="text-muted-foreground text-sm">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...messages].reverse().map((msg) => (
            <div key={String(msg.id)} className="space-card p-3">
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(Number(msg.timestamp) / 1_000_000).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
