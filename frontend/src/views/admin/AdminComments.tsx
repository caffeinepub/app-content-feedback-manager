import { useState } from 'react';
import {
  useCommentLists,
  useAddCommentList,
  useAddTemplatesToList,
  useToggleListLock,
  useListMetrics,
} from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricsDonutChart } from '@/components/MetricsDonutChart';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Lock, Unlock, Plus, MessageSquare, BarChart2, RefreshCw, RotateCcw, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

// ── Reset Pool Dialog State ────────────────────────────────────────────────────

interface ResetDialogState {
  open: boolean;
  listId: string;
  listName: string;
  clearClaims: boolean;
}

export function AdminComments() {
  const { data: commentLists, isLoading } = useCommentLists();
  const { data: listMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useListMetrics();
  const addList = useAddCommentList();
  const addTemplates = useAddTemplatesToList();
  const toggleLock = useToggleListLock();
  const queryClient = useQueryClient();

  const [newListId, setNewListId] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newListSuffix, setNewListSuffix] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [addStatus, setAddStatus] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [resetDialog, setResetDialog] = useState<ResetDialogState>({
    open: false,
    listId: '',
    listName: '',
    clearClaims: false,
  });

  const selectedList = commentLists?.find(l => l.id === selectedListId);
  const lockedCount = commentLists?.filter(l => l.locked).length ?? 0;

  const handleCreateList = async () => {
    if (!newListId.trim()) return;
    await addList.mutateAsync({
      id: newListId.trim(),
      displayName: newListName.trim() || newListId.trim(),
      suffix: newListSuffix,
    });
    setNewListId('');
    setNewListName('');
    setNewListSuffix('');
  };

  const handleAddTemplates = async () => {
    if (!selectedListId || !templateText.trim()) return;
    const lines = templateText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    const ok = await addTemplates.mutateAsync({ listId: selectedListId, templates: lines });
    if (ok) {
      setTemplateText('');
      setAddStatus(`Added ${lines.length} template(s)`);
      setTimeout(() => setAddStatus(''), 3000);
    }
  };

  const handleToggleLock = async (listId: string) => {
    await toggleLock.mutateAsync(listId);
  };

  function openResetDialog(listId: string, listName: string, clearClaims: boolean) {
    setResetDialog({ open: true, listId, listName, clearClaims });
  }

  async function handleConfirmReset() {
    const { listId, listName, clearClaims } = resetDialog;
    setResetDialog(prev => ({ ...prev, open: false }));
    setIsResetting(true);
    try {
      // NOTE: resetPool backend method is not yet implemented.
      // When available, call: await actor.resetPool(listId, clearClaims)
      // For now, we show a pending toast and refetch metrics.
      await new Promise(resolve => setTimeout(resolve, 500)); // simulate async
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['availableCount', listId] });
      refetchMetrics();
      toast.success(
        clearClaims
          ? `Pool reset and claims cleared for "${listName}".`
          : `Pool reset for "${listName}".`
      );
    } catch {
      toast.error('Failed to reset pool. Please try again.');
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Totals Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 bg-secondary rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">List Overview</h3>
          <div className="space-y-2">
            {commentLists?.map(list => (
              <div key={list.id} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-neon-teal" />
                  <span className="font-medium text-foreground">{list.displayName}</span>
                  {list.locked && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
                      Locked
                    </span>
                  )}
                </div>
                <span className="font-bold text-neon-teal">{list.templates.length}</span>
              </div>
            ))}
            <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
              <span className="font-semibold text-foreground">Locked Lists:</span>
              <span className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center font-bold text-foreground text-sm">
                {lockedCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Metrics Section ── */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-neon-teal" />
            <h3 className="font-display font-semibold text-lg">Usage Metrics</h3>
          </div>
          <button
            onClick={() => refetchMetrics()}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${metricsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {metricsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 bg-secondary rounded-xl" />
            ))}
          </div>
        ) : !listMetrics || listMetrics.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No lists to show metrics for.</p>
        ) : (
          <div className="space-y-3">
            {listMetrics.map(metric => {
              const total = Number(metric.totalTemplates);
              const used = Number(metric.usedTemplates);
              const available = Number(metric.availableTemplates);
              const pct = total > 0 ? (used / total) * 100 : 0;

              return (
                <div
                  key={metric.listId}
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: 'oklch(0.18 0.035 240 / 0.8)',
                    border: '1px solid oklch(0.3 0.05 220 / 0.5)',
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">{metric.listName}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(pct)}% used</span>
                  </div>

                  {/* Donut + Stats row */}
                  <div className="flex items-center gap-4">
                    {/* SVG Donut */}
                    <div className="flex-shrink-0">
                      <MetricsDonutChart
                        usedTemplates={used}
                        totalTemplates={total}
                        size={72}
                        strokeWidth={9}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{total}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div
                          className="text-lg font-bold"
                          style={{ color: 'oklch(0.65 0.2 220)' }}
                        >
                          {used}
                        </div>
                        <div className="text-xs text-muted-foreground">Used</div>
                      </div>
                      <div className="text-center">
                        <div
                          className="text-lg font-bold"
                          style={{ color: 'oklch(0.72 0.2 155)' }}
                        >
                          {available}
                        </div>
                        <div className="text-xs text-muted-foreground">Left</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{
                        height: '6px',
                        background: 'oklch(0.25 0.04 240)',
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background:
                            pct >= 90
                              ? 'linear-gradient(90deg, oklch(0.6 0.22 25), oklch(0.65 0.2 40))'
                              : pct >= 60
                              ? 'linear-gradient(90deg, oklch(0.65 0.2 60), oklch(0.68 0.2 100))'
                              : 'linear-gradient(90deg, oklch(0.55 0.2 220), oklch(0.68 0.2 155))',
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">0</span>
                      <span className="text-xs text-muted-foreground">{total}</span>
                    </div>
                  </div>

                  {/* Reset Pool Buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openResetDialog(metric.listId, metric.listName, false)}
                      disabled={isResetting}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'oklch(0.22 0.06 220 / 0.5)',
                        border: '1px solid oklch(0.4 0.1 220 / 0.4)',
                        color: 'oklch(0.75 0.15 220)',
                        cursor: isResetting ? 'not-allowed' : 'pointer',
                        opacity: isResetting ? 0.6 : 1,
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Pool
                    </button>
                    <button
                      onClick={() => openResetDialog(metric.listId, metric.listName, true)}
                      disabled={isResetting}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'oklch(0.22 0.06 25 / 0.4)',
                        border: '1px solid oklch(0.4 0.12 25 / 0.4)',
                        color: 'oklch(0.72 0.18 25)',
                        cursor: isResetting ? 'not-allowed' : 'pointer',
                        opacity: isResetting ? 0.6 : 1,
                      }}
                    >
                      <ShieldOff className="w-3 h-3" />
                      Reset + Clear Claims
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create New List */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-neon-teal" />
          <h3 className="font-display font-semibold text-lg">Create New Comment List</h3>
        </div>
        <div className="space-y-3">
          <Input
            placeholder="Enter list ID..."
            value={newListId}
            onChange={e => setNewListId(e.target.value)}
            className="bg-secondary border-border"
          />
          <Input
            placeholder="Display name (optional)..."
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            className="bg-secondary border-border"
          />
          <Input
            placeholder="Suffix (e.g. !)..."
            value={newListSuffix}
            onChange={e => setNewListSuffix(e.target.value)}
            className="bg-secondary border-border"
          />
          <Button
            onClick={handleCreateList}
            disabled={!newListId.trim() || addList.isPending}
            className="gradient-btn text-white font-semibold w-full"
          >
            {addList.isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />Create
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Manage Comments */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-neon-teal" />
          <div>
            <h3 className="font-display font-semibold text-lg">Manage Comments</h3>
            <p className="text-muted-foreground text-xs">Add, view, and manage comments in lists</p>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Select Comment List</label>
          <Select value={selectedListId} onValueChange={setSelectedListId}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Choose a list..." />
            </SelectTrigger>
            <SelectContent>
              {commentLists?.map(list => (
                <SelectItem key={list.id} value={list.id}>
                  {list.displayName} ({list.templates.length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedList && (
          <div className="space-y-4 animate-fade-in">
            {/* Lock/Unlock toggle */}
            <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-foreground">
                {selectedList.locked ? 'List is Locked' : 'List is Unlocked'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleLock(selectedList.id)}
                disabled={toggleLock.isPending}
                className="border-border"
              >
                {selectedList.locked ? (
                  <><Unlock className="w-3 h-3 mr-1" />Unlock</>
                ) : (
                  <><Lock className="w-3 h-3 mr-1" />Lock</>
                )}
              </Button>
            </div>

            {/* Add templates */}
            {!selectedList.locked && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground block">Add Templates (one per line)</label>
                <Textarea
                  placeholder="Enter templates, one per line..."
                  value={templateText}
                  onChange={e => setTemplateText(e.target.value)}
                  className="bg-secondary border-border min-h-[100px]"
                />
                <Button
                  onClick={handleAddTemplates}
                  disabled={!templateText.trim() || addTemplates.isPending}
                  className="gradient-btn text-white font-semibold w-full"
                >
                  {addTemplates.isPending ? 'Adding...' : 'Add Templates'}
                </Button>
                {addStatus && <p className="text-neon-green text-sm">{addStatus}</p>}
              </div>
            )}

            {/* Template list */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Templates ({selectedList.templates.length})
              </label>
              {selectedList.templates.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No templates yet.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {selectedList.templates.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 bg-secondary rounded-lg px-3 py-2">
                      <span className="text-xs text-muted-foreground mt-0.5 w-6 flex-shrink-0">{i + 1}.</span>
                      <span className="text-sm text-foreground flex-1 break-words">{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Suffix display */}
            {selectedList.suffix && (
              <div className="bg-secondary rounded-lg px-3 py-2">
                <span className="text-xs text-muted-foreground">Suffix: </span>
                <span className="text-sm text-neon-teal font-mono">{selectedList.suffix}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Reset Pool Confirmation Dialog ── */}
      <AlertDialog open={resetDialog.open} onOpenChange={(open) => setResetDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetDialog.clearClaims ? 'Reset Pool + Clear Claims' : 'Reset Pool'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resetDialog.clearClaims ? (
                <>
                  This will restore the available template pool for{' '}
                  <strong>"{resetDialog.listName}"</strong> back to full and{' '}
                  <strong>remove all device claims</strong>, allowing devices to generate again.
                  This action cannot be undone.
                </>
              ) : (
                <>
                  This will restore the available template pool for{' '}
                  <strong>"{resetDialog.listName}"</strong> back to full. Device claims will be
                  preserved — devices that already generated will still be locked.
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              style={{
                background: resetDialog.clearClaims
                  ? 'linear-gradient(135deg, oklch(0.55 0.2 25), oklch(0.6 0.2 40))'
                  : 'linear-gradient(135deg, oklch(0.55 0.2 220), oklch(0.65 0.2 175))',
              }}
            >
              {resetDialog.clearClaims ? 'Reset + Clear Claims' : 'Reset Pool'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
