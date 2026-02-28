import { useState } from 'react';
import { useCommentLists, useAccessKey } from '@/hooks/useQueries';
import { useCommentGenerator } from '@/hooks/useCommentGenerator';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Copy, Check, AlertCircle, Lock } from 'lucide-react';

const QUANTITY_OPTIONS = [5, 10, 20, 50];

export function BulkCommentGenerator() {
  const { data: commentLists, isLoading: listsLoading } = useCommentLists();
  const { data: storedKey, isLoading: keyLoading } = useAccessKey();
  const { generateBulk } = useCommentGenerator();

  const [selectedListId, setSelectedListId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [accessKey, setAccessKey] = useState('');
  const [keyError, setKeyError] = useState(false);
  const [generatedComments, setGeneratedComments] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isLoading = listsLoading || keyLoading;
  const availableLists = (commentLists ?? []).filter((l) => !l.locked);

  async function handleGenerate() {
    setKeyError(false);

    // Validate access key
    const trimmedKey = accessKey.trim();
    if (!trimmedKey) {
      setKeyError(true);
      return;
    }
    if (storedKey !== trimmedKey) {
      setKeyError(true);
      return;
    }

    const selectedList = availableLists.find((l) => l.id === selectedListId);
    if (!selectedList) return;

    setIsGenerating(true);
    try {
      const comments = generateBulk(selectedList, quantity);
      setGeneratedComments(comments);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopyAll() {
    if (generatedComments.length === 0) return;
    navigator.clipboard.writeText(generatedComments.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-card p-0 overflow-hidden">
      {/* Card Header */}
      <div
        className="px-5 pt-5 pb-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid oklch(0.28 0.04 240 / 0.5)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' }}
        >
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-base text-foreground">Bulk Comment Generator</h3>
          <p className="text-xs text-muted-foreground">Generate multiple comments at once (requires access key)</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full bg-secondary" />
            <Skeleton className="h-10 w-full bg-secondary" />
            <Skeleton className="h-10 w-full bg-secondary" />
          </div>
        ) : (
          <>
            {/* Comment List Selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Select Comment List</label>
              {availableLists.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No comment lists available.</p>
              ) : (
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ background: 'oklch(0.22 0.04 240)' }}
                >
                  <option value="">Choose a comment list...</option>
                  {availableLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.displayName} ({list.templates.length} templates)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Number of Comments */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Number of Comments</label>
              <div className="flex gap-2">
                {QUANTITY_OPTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium transition-all border"
                    style={
                      quantity === q
                        ? {
                            background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))',
                            borderColor: 'transparent',
                            color: 'white',
                          }
                        : {
                            background: 'oklch(0.22 0.04 240)',
                            borderColor: 'oklch(0.28 0.04 240)',
                            color: 'oklch(0.7 0.04 240)',
                          }
                    }
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Access Key Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Access Key
              </label>
              <input
                type="password"
                value={accessKey}
                onChange={(e) => {
                  setAccessKey(e.target.value);
                  setKeyError(false);
                }}
                placeholder="Enter access key..."
                className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground border focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{
                  background: 'oklch(0.22 0.04 240)',
                  borderColor: keyError ? 'oklch(0.6 0.22 25)' : 'oklch(0.28 0.04 240)',
                }}
              />
              {keyError && (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'oklch(0.6 0.22 25)' }} />
                  <p className="text-xs" style={{ color: 'oklch(0.6 0.22 25)' }}>
                    Invalid access key
                  </p>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedListId || isGenerating}
              className="gradient-button w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate Bulk Comments
                </>
              )}
            </button>

            {/* Output */}
            {generatedComments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Generated {generatedComments.length} comments
                  </span>
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'oklch(0.22 0.04 240)', border: '1px solid oklch(0.28 0.04 240)', color: 'oklch(0.72 0.18 175)' }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy All
                      </>
                    )}
                  </button>
                </div>
                <div
                  className="rounded-xl border border-border p-3 space-y-1.5 overflow-y-auto"
                  style={{ background: 'oklch(0.18 0.03 240)', maxHeight: '240px' }}
                >
                  {generatedComments.map((comment, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-foreground py-1.5 px-2 rounded-lg"
                      style={{ background: 'oklch(0.22 0.04 240 / 0.6)', borderBottom: idx < generatedComments.length - 1 ? '1px solid oklch(0.28 0.04 240 / 0.4)' : 'none' }}
                    >
                      <span className="text-xs text-muted-foreground mr-2">{idx + 1}.</span>
                      {comment}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
