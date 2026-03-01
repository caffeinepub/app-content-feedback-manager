import { useState, useEffect } from 'react';
import { useCommentLists, useAccessKey, useAvailableCount } from '@/hooks/useQueries';
import { useCommentGenerator } from '@/hooks/useCommentGenerator';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Copy, Check, AlertCircle, Lock, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { CommentList } from '@/backend';

const QUANTITY_OPTIONS = [5, 10, 20, 50];

export function BulkCommentGenerator() {
  const { data: commentLists, isLoading: listsLoading } = useCommentLists();
  const { data: storedKey, isLoading: keyLoading } = useAccessKey();
  const { generateBulk } = useCommentGenerator();

  const [selectedListId, setSelectedListId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [accessKey, setAccessKey] = useState('');
  const [keyError, setKeyError] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [generatedComments, setGeneratedComments] = useState<string[]>([]);
  const [actualGeneratedCount, setActualGeneratedCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isLoading = listsLoading || keyLoading;
  const availableLists = (commentLists ?? []).filter((l) => !l.locked);
  const selectedList: CommentList | undefined = availableLists.find((l) => l.id === selectedListId);
  const templateCount = selectedList ? selectedList.templates.length : 0;

  // Fetch available count from backend for the selected list
  const { data: availableCountRaw, isLoading: availableCountLoading } = useAvailableCount(selectedListId);
  const availableCount = availableCountRaw !== undefined ? Number(availableCountRaw) : templateCount;

  // When selected list changes, reset state
  useEffect(() => {
    setValidationError('');
    setGeneratedComments([]);
    setActualGeneratedCount(0);
  }, [selectedListId]);

  // Clamp quantity when availableCount changes
  useEffect(() => {
    if (availableCount > 0 && quantity > availableCount) {
      setQuantity(availableCount);
    }
  }, [availableCount]);

  const isOutOfComments = templateCount === 0 && !availableCountLoading && !!selectedListId;

  async function handleGenerate() {
    setKeyError(false);
    setValidationError('');

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

    // Validate list selection
    if (!selectedListId || !selectedList) {
      setValidationError('Please select a comment list.');
      return;
    }

    // Validate template count
    if (templateCount === 0) {
      setValidationError('No templates available for this list.');
      return;
    }

    // Validate quantity
    if (quantity <= 0) {
      setValidationError('Invalid count. Please select a valid quantity.');
      return;
    }

    const effectiveCount = Math.min(quantity, templateCount);

    setIsGenerating(true);
    try {
      const comments = generateBulk(selectedList, effectiveCount);
      setGeneratedComments(comments);
      setActualGeneratedCount(comments.length);

      if (comments.length < quantity) {
        toast.warning(`Only ${comments.length} templates available, generated ${comments.length}.`);
      } else {
        toast.success(`Generated ${comments.length} comment${comments.length === 1 ? '' : 's'} successfully!`);
      }
    } catch {
      setValidationError('Failed to generate comments. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleListChange(newListId: string) {
    setSelectedListId(newListId);
    setGeneratedComments([]);
    setActualGeneratedCount(0);
    setValidationError('');
    setKeyError(false);
  }

  function handleQuantityChange(newQty: number) {
    if (newQty > templateCount && templateCount > 0) return;
    setQuantity(newQty);
    setValidationError('');
  }

  function handleCopyAll() {
    if (generatedComments.length === 0) return;
    navigator.clipboard.writeText(generatedComments.join('\n')).then(() => {
      setCopied(true);
      toast.success('All comments copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full bg-secondary" />
        <Skeleton className="h-10 w-full bg-secondary" />
        <Skeleton className="h-12 w-full bg-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* List Selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Select Comment List</label>
        {availableLists.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No comment lists available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {availableLists.map((list) => (
              <button
                key={list.id}
                onClick={() => handleListChange(list.id)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background:
                    selectedListId === list.id
                      ? 'oklch(0.22 0.06 220 / 0.8)'
                      : 'oklch(0.18 0.04 240 / 0.6)',
                  border:
                    selectedListId === list.id
                      ? '1px solid oklch(0.55 0.2 220 / 0.6)'
                      : '1px solid oklch(0.3 0.05 240 / 0.4)',
                }}
              >
                <span className="font-medium text-foreground text-sm">{list.displayName}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background:
                      list.id === selectedListId && isOutOfComments
                        ? 'oklch(0.3 0.1 25 / 0.3)'
                        : 'oklch(0.25 0.06 220 / 0.5)',
                    color:
                      list.id === selectedListId && isOutOfComments
                        ? 'oklch(0.7 0.2 25)'
                        : 'oklch(0.75 0.2 200)',
                  }}
                >
                  {list.id === selectedListId && isOutOfComments
                    ? 'No templates'
                    : `${list.templates.length} templates`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Available Templates Count */}
      {selectedListId && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{
            background: 'oklch(0.18 0.04 220 / 0.6)',
            border: '1px solid oklch(0.35 0.08 220 / 0.5)',
          }}
        >
          <span className="text-sm font-semibold text-foreground">Available Templates:</span>
          <div className="flex items-center gap-2">
            {isOutOfComments && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: 'oklch(0.3 0.1 25 / 0.3)',
                  color: 'oklch(0.7 0.2 25)',
                  border: '1px solid oklch(0.5 0.15 25 / 0.4)',
                }}
              >
                No templates
              </span>
            )}
            <div
              className="min-w-[48px] h-9 rounded-xl flex items-center justify-center font-bold text-base"
              style={{
                background: 'oklch(0.15 0.03 240)',
                border: `2px solid ${isOutOfComments ? 'oklch(0.5 0.15 25 / 0.6)' : 'oklch(0.55 0.18 200 / 0.6)'}`,
                color: isOutOfComments ? 'oklch(0.65 0.2 25)' : 'oklch(0.75 0.2 200)',
                minWidth: '52px',
                padding: '0 10px',
              }}
            >
              {availableCountLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                templateCount
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      {selectedListId && !isOutOfComments && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            Quantity
            {templateCount > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (max {templateCount})
              </span>
            )}
          </label>
          <div className="flex gap-2 flex-wrap">
            {QUANTITY_OPTIONS.map((opt) => {
              const isDisabled = opt > templateCount;
              return (
                <button
                  key={opt}
                  onClick={() => !isDisabled && handleQuantityChange(opt)}
                  disabled={isDisabled}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background:
                      quantity === opt && !isDisabled
                        ? 'linear-gradient(135deg, oklch(0.55 0.2 220), oklch(0.65 0.2 175))'
                        : isDisabled
                        ? 'oklch(0.2 0.03 240 / 0.5)'
                        : 'oklch(0.22 0.05 240 / 0.7)',
                    color:
                      quantity === opt && !isDisabled
                        ? 'oklch(0.98 0.005 240)'
                        : isDisabled
                        ? 'oklch(0.4 0.03 240)'
                        : 'oklch(0.75 0.1 220)',
                    border:
                      quantity === opt && !isDisabled
                        ? '1px solid oklch(0.55 0.2 220 / 0.6)'
                        : '1px solid oklch(0.3 0.05 240 / 0.4)',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                >
                  {opt}
                </button>
              );
            })}
            {/* Custom quantity input */}
            <input
              type="number"
              min={1}
              max={templateCount}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) {
                  handleQuantityChange(Math.min(val, templateCount));
                }
              }}
              className="w-20 px-3 py-2 rounded-xl text-sm font-semibold text-center"
              style={{
                background: 'oklch(0.22 0.05 240 / 0.7)',
                border: '1px solid oklch(0.35 0.08 220 / 0.5)',
                color: 'oklch(0.85 0.05 220)',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Access Key Input */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          Access Key
        </label>
        <input
          type="password"
          placeholder="Enter access key..."
          value={accessKey}
          onChange={(e) => {
            setAccessKey(e.target.value);
            setKeyError(false);
          }}
          className="w-full px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: 'oklch(0.18 0.04 240 / 0.8)',
            border: `1px solid ${keyError ? 'oklch(0.55 0.2 25)' : 'oklch(0.35 0.08 220 / 0.5)'}`,
            color: 'oklch(0.9 0.02 220)',
            outline: 'none',
          }}
        />
        {keyError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Invalid access key.
          </p>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{
            background: 'oklch(0.2 0.06 25 / 0.3)',
            border: '1px solid oklch(0.5 0.15 25 / 0.4)',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{validationError}</p>
        </div>
      )}

      {/* Out of Comments Notice */}
      {isOutOfComments && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{
            background: 'oklch(0.2 0.06 25 / 0.3)',
            border: '1px solid oklch(0.5 0.15 25 / 0.4)',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-destructive" />
          <p className="text-sm text-destructive">
            No templates available for this list.
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={
          !selectedListId ||
          !selectedList ||
          isOutOfComments ||
          isGenerating ||
          templateCount === 0
        }
        className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
        style={{
          background:
            !selectedListId || isOutOfComments || templateCount === 0
              ? 'oklch(0.25 0.04 240)'
              : 'linear-gradient(135deg, oklch(0.55 0.2 220) 0%, oklch(0.65 0.2 175) 50%, oklch(0.68 0.2 155) 100%)',
          color:
            !selectedListId || isOutOfComments || templateCount === 0
              ? 'oklch(0.5 0.04 240)'
              : 'oklch(0.98 0.005 240)',
          cursor:
            !selectedListId || isOutOfComments || isGenerating || templateCount === 0
              ? 'not-allowed'
              : 'pointer',
          boxShadow:
            !selectedListId || isOutOfComments || templateCount === 0
              ? 'none'
              : '0 4px 20px oklch(0.55 0.2 220 / 0.4)',
          opacity: isGenerating ? 0.8 : 1,
        }}
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Generate {quantity} Comment{quantity === 1 ? '' : 's'}
          </>
        )}
      </button>

      {/* Generated Comments Output */}
      {generatedComments.length > 0 && (
        <div
          className="rounded-xl p-4 space-y-3 animate-fade-in"
          style={{
            background: 'oklch(0.18 0.04 220 / 0.5)',
            border: '1px solid oklch(0.4 0.1 175 / 0.5)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Generated {actualGeneratedCount} comment{actualGeneratedCount === 1 ? '' : 's'}
              </span>
            </div>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: copied
                  ? 'oklch(0.65 0.2 155 / 0.2)'
                  : 'oklch(0.25 0.06 220 / 0.6)',
                color: copied ? 'oklch(0.75 0.22 155)' : 'oklch(0.75 0.1 220)',
                border: '1px solid oklch(0.35 0.08 220 / 0.4)',
              }}
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5" /> Copied!</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy All</>
              )}
            </button>
          </div>

          {/* Comment List */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {generatedComments.map((comment, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg px-3 py-2"
                style={{ background: 'oklch(0.15 0.03 240 / 0.6)' }}
              >
                <span
                  className="text-xs font-mono mt-0.5 flex-shrink-0 w-5 text-right"
                  style={{ color: 'oklch(0.55 0.08 220)' }}
                >
                  {idx + 1}.
                </span>
                <span className="text-sm text-foreground flex-1 break-words">{comment}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
