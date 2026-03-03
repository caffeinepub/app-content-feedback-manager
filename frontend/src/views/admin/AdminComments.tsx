import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Save, X, BarChart2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  useCommentLists,
  useAddCommentList,
  useListMetrics,
} from '../../hooks/useQueries';
import { MetricsDonutChart } from '../../components/MetricsDonutChart';
import type { CommentList } from '../../backend';

function generateId(): string {
  return `list_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminComments() {
  const { data: commentLists = [], isLoading } = useCommentLists();
  const { data: metrics = [] } = useListMetrics();
  const addListMutation = useAddCommentList();

  // Create list form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListSuffix, setNewListSuffix] = useState('');
  const [newListTemplates, setNewListTemplates] = useState('');
  const [createFeedback, setCreateFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Expanded list state
  const [expandedListId, setExpandedListId] = useState<string | null>(null);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setCreateFeedback(null);

    const templates = newListTemplates
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    const newList: CommentList = {
      id: generateId(),
      displayName: newListName.trim(),
      templates,
      locked: false,
      suffix: newListSuffix.trim(),
    };

    try {
      await addListMutation.mutateAsync(newList);
      setCreateFeedback({ type: 'success', message: `List "${newList.displayName}" created successfully!` });
      setNewListName('');
      setNewListSuffix('');
      setNewListTemplates('');
      setShowCreateForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create list';
      setCreateFeedback({ type: 'error', message: msg });
    }
  };

  const getMetricsForList = (listId: string) =>
    metrics.find((m) => m.listId === listId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading comment lists…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Comment Lists</h2>
          <p className="text-sm text-muted-foreground">{commentLists.length} list{commentLists.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => { setShowCreateForm((v) => !v); setCreateFeedback(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New List
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="space-card p-5 space-y-4 border-primary/30">
          <h3 className="font-semibold text-sm">Create New Comment List</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Display Name *</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. Positive Reviews"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Suffix (appended to each comment)</label>
              <input
                type="text"
                value={newListSuffix}
                onChange={(e) => setNewListSuffix(e.target.value)}
                placeholder="e.g. 👍"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Templates (one per line)</label>
              <textarea
                value={newListTemplates}
                onChange={(e) => setNewListTemplates(e.target.value)}
                placeholder={"Great app!\nLove this!\nHighly recommend."}
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateList}
              disabled={!newListName.trim() || addListMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addListMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create List
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setCreateFeedback(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
          {createFeedback && (
            <div
              className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                createFeedback.type === 'success'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {createFeedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {createFeedback.message}
            </div>
          )}
        </div>
      )}

      {/* Feedback outside form */}
      {!showCreateForm && createFeedback && (
        <div
          className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
            createFeedback.type === 'success'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {createFeedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {createFeedback.message}
        </div>
      )}

      {/* Usage Metrics */}
      {metrics.length > 0 && (
        <div className="space-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Usage Metrics</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {metrics.map((m) => (
              <div key={m.listId} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                <MetricsDonutChart
                  usedTemplates={Number(m.usedTemplates)}
                  totalTemplates={Number(m.totalTemplates)}
                  size={64}
                  strokeWidth={8}
                />
                <div className="text-center">
                  <p className="text-xs font-medium truncate max-w-[100px]">{m.listName}</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(m.availableTemplates)}/{Number(m.totalTemplates)} available
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment Lists */}
      {commentLists.length === 0 ? (
        <div className="space-card p-8 text-center">
          <p className="text-muted-foreground text-sm">No comment lists yet. Create your first list above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {commentLists.map((list) => {
            const m = getMetricsForList(list.id);
            const isExpanded = expandedListId === list.id;
            return (
              <div key={list.id} className="space-card overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedListId(isExpanded ? null : list.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{list.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {list.templates.length} template{list.templates.length !== 1 ? 's' : ''}
                        {list.suffix ? ` · suffix: "${list.suffix}"` : ''}
                        {list.locked ? ' · 🔒 locked' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m && (
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {m.percentUsed.toFixed(0)}% used
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Templates:</p>
                    {list.templates.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No templates.</p>
                    ) : (
                      <ul className="space-y-1 max-h-48 overflow-y-auto">
                        {list.templates.map((t, i) => (
                          <li key={i} className="text-xs p-2 rounded bg-muted/30 font-mono">
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
