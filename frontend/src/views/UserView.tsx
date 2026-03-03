import React, { useState } from 'react';
import { Copy, RefreshCw, Lock, Unlock, Loader2 } from 'lucide-react';
import { useCommentLists, useSettings } from '../hooks/useQueries';
import { useCommentGenerator } from '../hooks/useCommentGenerator';
import { useClaimedComments } from '../hooks/useClaimedComments';
import type { CommentList } from '../backend';

export default function UserView() {
  const { data: commentLists = [], isLoading } = useCommentLists();
  const { data: settings } = useSettings();
  const { generate } = useCommentGenerator();
  const { getClaimedComment, storeClaimedComment, hasClaimedComment } = useClaimedComments();

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [accessKeyVerified, setAccessKeyVerified] = useState(false);
  const [generatedComment, setGeneratedComment] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedList: CommentList | undefined = commentLists.find((l) => l.id === selectedListId) as CommentList | undefined;

  const requiresKey = !!settings?.accessKey;

  const handleVerifyKey = () => {
    if (settings?.accessKey && accessKeyInput.trim() === settings.accessKey) {
      setAccessKeyVerified(true);
      setError(null);
    } else {
      setError('Invalid access key. Please try again.');
    }
  };

  const handleSelectList = (list: CommentList) => {
    setSelectedListId(list.id);
    setGeneratedComment(null);
    setError(null);

    // Check if already claimed — extract the comment string
    const claimed = getClaimedComment(list.id);
    if (claimed) {
      setGeneratedComment(claimed.comment);
    }
  };

  const handleGenerate = async () => {
    if (!selectedList) return;
    setError(null);
    setIsClaiming(true);

    try {
      // Check if already claimed from this device
      if (hasClaimedComment(selectedList.id)) {
        const saved = getClaimedComment(selectedList.id);
        setGeneratedComment(saved ? saved.comment : null);
        setIsClaiming(false);
        return;
      }

      const comment = generate(selectedList);
      if (!comment) {
        setError('No templates available in this list.');
        setIsClaiming(false);
        return;
      }

      storeClaimedComment(selectedList.id, comment);
      setGeneratedComment(comment);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate comment';
      setError(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCopy = () => {
    if (!generatedComment) return;
    navigator.clipboard.writeText(generatedComment).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading comment lists…</span>
      </div>
    );
  }

  // Access key gate
  if (requiresKey && !accessKeyVerified) {
    return (
      <div className="space-y-4">
        <div className="space-card p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h2 className="font-semibold text-lg">Access Required</h2>
          <p className="text-sm text-muted-foreground">Enter your access key to use the comment generator.</p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="text"
              value={accessKeyInput}
              onChange={(e) => setAccessKeyInput(e.target.value)}
              placeholder="Enter access key…"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyKey()}
            />
            <button
              onClick={handleVerifyKey}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Unlock
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Unlocked indicator */}
      {requiresKey && accessKeyVerified && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 px-1">
          <Unlock className="w-3 h-3" />
          Access granted
        </div>
      )}

      {/* List selection */}
      <div className="space-card p-4 space-y-3">
        <h2 className="font-semibold text-sm">Select Comment List</h2>
        {commentLists.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No comment lists available.</p>
        ) : (
          <div className="grid gap-2">
            {commentLists.map((list) => (
              <button
                key={list.id}
                onClick={() => handleSelectList(list)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                  selectedListId === list.id
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <span className="font-medium">{list.displayName}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({list.templates.length} templates)
                </span>
                {list.locked && <span className="ml-1 text-xs">🔒</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generate */}
      {selectedList && (
        <div className="space-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Your Comment</h2>
            {hasClaimedComment(selectedList.id) && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Your saved comment
              </span>
            )}
          </div>

          {generatedComment ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-mono leading-relaxed">
                {generatedComment}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                {!hasClaimedComment(selectedList.id) && (
                  <button
                    onClick={handleGenerate}
                    disabled={isClaiming}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isClaiming || selectedList.templates.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isClaiming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {selectedList.templates.length === 0 ? 'No templates available' : 'Generate Comment'}
            </button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
