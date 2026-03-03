import React, { useState } from 'react';
import { Copy, Zap, Loader2, Lock } from 'lucide-react';
import { useCommentLists, useSettings } from '../hooks/useQueries';
import { useCommentGenerator } from '../hooks/useCommentGenerator';

export default function BulkCommentGenerator() {
  const { data: commentLists = [] } = useCommentLists();
  const { data: settings } = useSettings();
  const { generateBulk } = useCommentGenerator();

  const [selectedListId, setSelectedListId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [accessKey, setAccessKey] = useState('');
  const [accessKeyVerified, setAccessKeyVerified] = useState(false);
  const [generatedComments, setGeneratedComments] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const requiresKey = !!settings?.accessKey;
  const selectedList = commentLists.find((l) => l.id === selectedListId);
  const maxQty = selectedList ? Math.min(selectedList.templates.length, 50) : 50;

  const handleVerifyKey = () => {
    if (settings?.accessKey && accessKey.trim() === settings.accessKey) {
      setAccessKeyVerified(true);
      setError(null);
    } else {
      setError('Invalid access key.');
    }
  };

  const handleGenerate = () => {
    if (!selectedList) return;
    setError(null);
    setIsGenerating(true);
    try {
      const comments = generateBulk(selectedList, quantity);
      setGeneratedComments(comments);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate comments';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generatedComments.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Access key gate
  if (requiresKey && !accessKeyVerified) {
    return (
      <div className="space-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Bulk Comment Generator</h2>
        </div>
        <p className="text-sm text-muted-foreground">Enter your access key to use bulk generation.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Access key…"
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
    );
  }

  return (
    <div className="space-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <h2 className="font-semibold">Bulk Comment Generator</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Select List</label>
          <select
            value={selectedListId}
            onChange={(e) => { setSelectedListId(e.target.value); setGeneratedComments([]); }}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Choose a list…</option>
            {commentLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.displayName} ({list.templates.length} templates)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Quantity: {quantity}
          </label>
          <input
            type="range"
            min={1}
            max={maxQty || 50}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selectedListId || isGenerating || !selectedList || selectedList.templates.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        Generate {quantity} Comments
      </button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {generatedComments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{generatedComments.length} comments generated</span>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {generatedComments.map((comment, i) => (
              <div key={i} className="text-xs p-2 rounded bg-muted/30 font-mono">
                {comment}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
