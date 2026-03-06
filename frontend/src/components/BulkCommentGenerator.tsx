import { useState } from 'react';
import { Copy, Zap, CheckCircle, Loader2, Package } from 'lucide-react';
import { useGetAllCommentLists, useGetInventoryCount, useSetInventoryCount, useGetSettings } from '../hooks/useQueries';
import { useCommentGenerator } from '../hooks/useCommentGenerator';
import type { CommentList } from '../backend';

interface BulkCommentGeneratorProps {
  onGenerated?: (comments: string[]) => void;
}

export default function BulkCommentGenerator({ onGenerated }: BulkCommentGeneratorProps) {
  const [selectedListId, setSelectedListId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [generatedComments, setGeneratedComments] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: commentLists = [] } = useGetAllCommentLists();
  const { data: settings } = useGetSettings();
  const { generateBulk } = useCommentGenerator();

  const { data: inventoryCount } = useGetInventoryCount(selectedListId);
  const updateInventoryMutation = useSetInventoryCount();

  const accessKey = settings?.accessKey ?? null;

  const selectedList: CommentList | undefined = commentLists.find((l) => l.id === selectedListId);
  const maxQuantity = selectedList ? selectedList.templates.length : 50;
  const inventoryRemaining = inventoryCount !== undefined ? Number(inventoryCount) : null;

  const handleGenerate = async () => {
    setError('');
    if (!selectedListId) {
      setError('Please select a comment list.');
      return;
    }
    if (!accessKeyInput.trim()) {
      setError('Please enter your access key.');
      return;
    }
    if (accessKey && accessKeyInput.trim() !== accessKey) {
      setError('Invalid access key.');
      return;
    }
    if (!selectedList) {
      setError('Selected list not found.');
      return;
    }
    if (selectedList.locked) {
      setError('This list is currently locked.');
      return;
    }

    setIsGenerating(true);
    try {
      const comments = generateBulk(selectedList, quantity);
      setGeneratedComments(comments);
      onGenerated?.(comments);

      // Decrement inventory
      if (comments.length > 0 && inventoryRemaining !== null && inventoryRemaining > 0) {
        const newCount = Math.max(0, inventoryRemaining - comments.length);
        await updateInventoryMutation.mutateAsync({
          listId: selectedListId,
          count: BigInt(newCount),
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAll = async () => {
    if (generatedComments.length === 0) return;
    await navigator.clipboard.writeText(generatedComments.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card-gold p-5 rounded-2xl space-y-4 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider gradient-heading flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: 'oklch(0.82 0.20 70)' }} />
          Bulk Comment Generator
        </h3>
        {selectedListId && inventoryRemaining !== null && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{
              background: inventoryRemaining > 10
                ? 'oklch(0.65 0.18 145 / 0.12)'
                : inventoryRemaining > 0
                  ? 'oklch(0.75 0.18 65 / 0.12)'
                  : 'oklch(0.55 0.22 25 / 0.12)',
              border: `1px solid ${inventoryRemaining > 10
                ? 'oklch(0.65 0.18 145 / 0.3)'
                : inventoryRemaining > 0
                  ? 'oklch(0.75 0.18 65 / 0.3)'
                  : 'oklch(0.55 0.22 25 / 0.3)'}`,
            }}
          >
            <Package className="w-3.5 h-3.5" style={{
              color: inventoryRemaining > 10
                ? 'oklch(0.72 0.20 145)'
                : inventoryRemaining > 0
                  ? 'oklch(0.82 0.20 70)'
                  : 'oklch(0.65 0.22 25)',
            }} />
            <span className="font-orbitron font-bold text-xs" style={{
              color: inventoryRemaining > 10
                ? 'oklch(0.72 0.20 145)'
                : inventoryRemaining > 0
                  ? 'oklch(0.82 0.20 70)'
                  : 'oklch(0.65 0.22 25)',
            }}>
              {inventoryRemaining} left
            </span>
          </div>
        )}
      </div>

      {/* List selector */}
      <div>
        <label className="block text-xs font-rajdhani font-600 mb-1.5 uppercase tracking-wider" style={{ color: 'oklch(0.60 0.04 260)' }}>
          Comment List
        </label>
        <select
          value={selectedListId}
          onChange={(e) => setSelectedListId(e.target.value)}
          className="glass-input w-full px-4 py-2.5 text-sm"
        >
          <option value="">— Select a list —</option>
          {commentLists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.displayName} ({list.templates.length} templates)
            </option>
          ))}
        </select>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-xs font-rajdhani font-600 mb-1.5 uppercase tracking-wider" style={{ color: 'oklch(0.60 0.04 260)' }}>
          Quantity: <span style={{ color: 'oklch(0.82 0.20 70)' }}>{quantity}</span>
        </label>
        <input
          type="range"
          min={1}
          max={Math.min(maxQuantity, 50)}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full accent-amber-400"
          style={{ accentColor: 'oklch(0.82 0.20 70)' }}
        />
        <div className="flex justify-between text-xs font-rajdhani mt-1" style={{ color: 'oklch(0.45 0.04 260)' }}>
          <span>1</span>
          <span>{Math.min(maxQuantity, 50)}</span>
        </div>
      </div>

      {/* Access Key */}
      <div>
        <label className="block text-xs font-rajdhani font-600 mb-1.5 uppercase tracking-wider" style={{ color: 'oklch(0.60 0.04 260)' }}>
          Access Key
        </label>
        <input
          type="password"
          value={accessKeyInput}
          onChange={(e) => setAccessKeyInput(e.target.value)}
          placeholder="Enter access key..."
          className="glass-input w-full px-4 py-2.5 text-sm"
        />
      </div>

      {error && (
        <p className="text-xs font-rajdhani animate-fadeIn" style={{ color: 'oklch(0.65 0.22 25)' }}>
          ⚠ {error}
        </p>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !selectedListId}
        className="w-full py-3 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center justify-center gap-2"
        style={{
          background: !selectedListId
            ? 'oklch(0.16 0.03 260)'
            : 'linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))',
          color: !selectedListId ? 'oklch(0.40 0.04 260)' : 'oklch(0.08 0.02 260)',
          boxShadow: selectedListId ? '0 4px 15px oklch(0.75 0.18 65 / 0.3)' : 'none',
        }}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Generate {quantity} Comments
          </>
        )}
      </button>

      {/* Generated comments */}
      {generatedComments.length > 0 && (
        <div className="animate-fadeInUp space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbitron font-bold uppercase tracking-wider" style={{ color: 'oklch(0.72 0.20 145)' }}>
              ✓ {generatedComments.length} Generated
            </span>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-rajdhani font-600 transition-all duration-200 hover:scale-105"
              style={{
                background: copied ? 'oklch(0.65 0.18 145 / 0.15)' : 'oklch(0.70 0.20 185 / 0.15)',
                border: `1px solid ${copied ? 'oklch(0.65 0.18 145 / 0.3)' : 'oklch(0.70 0.20 185 / 0.3)'}`,
                color: copied ? 'oklch(0.72 0.20 145)' : 'oklch(0.78 0.22 188)',
              }}
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          <div
            className="rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5"
            style={{
              background: 'oklch(0.08 0.02 260 / 0.8)',
              border: '1px solid oklch(0.22 0.05 260 / 0.4)',
            }}
          >
            {generatedComments.map((comment, idx) => (
              <div
                key={idx}
                className="text-xs font-rajdhani px-3 py-2 rounded-lg"
                style={{
                  background: 'oklch(0.12 0.03 260 / 0.6)',
                  border: '1px solid oklch(0.22 0.05 260 / 0.3)',
                  color: 'oklch(0.80 0.03 80)',
                }}
              >
                <span style={{ color: 'oklch(0.45 0.04 260)' }}>{idx + 1}. </span>
                {comment}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
