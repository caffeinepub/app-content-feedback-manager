import React, { useState } from 'react';
import {
  Plus, Trash2, Edit2, Check, X, Lock, Unlock, RefreshCw,
  List, BarChart2,
} from 'lucide-react';
import { useActor } from '../../hooks/useActor';
import {
  useGetCommentListsOrdered,
  useAddCommentList,
  useRenameCommentList,
  useDeleteCommentList,
  useAddTemplatesToList,
  useToggleListLock,
  useGetListMetrics,
  useAvailableComments,
} from '../../hooks/useQueries';
import { MetricsDonutChart } from '../../components/MetricsDonutChart';

// Sub-component to show available comments for a list
function AvailableCommentsPanel({ listId }: { listId: string }) {
  const { data, isLoading } = useAvailableComments(listId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm p-3">
        <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
      </div>
    );
  }

  const comments = data?.comments ?? [];

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground p-3">No available comments in pool.</p>;
  }

  return (
    <div className="p-3 space-y-1 max-h-48 overflow-y-auto">
      {comments.map((c, i) => (
        <div key={i} className="text-xs text-foreground/80 bg-background/40 rounded px-2 py-1 border border-border/50">
          {c}
        </div>
      ))}
    </div>
  );
}

export default function AdminComments() {
  const { actor } = useActor();
  const { data: commentLists = [], isLoading } = useGetCommentListsOrdered();
  const { data: metrics = [] } = useGetListMetrics();

  const addCommentList = useAddCommentList();
  const renameCommentList = useRenameCommentList();
  const deleteCommentList = useDeleteCommentList();
  const addTemplatesToList = useAddTemplatesToList();
  const toggleListLock = useToggleListLock();

  // Create form — NO List ID field; auto-generate from display name
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newSuffix, setNewSuffix] = useState('');
  const [createError, setCreateError] = useState('');

  // Rename
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');

  // Add templates
  const [addingTemplatesTo, setAddingTemplatesTo] = useState<string | null>(null);
  const [templatesText, setTemplatesText] = useState('');

  // Available comments panel
  const [expandedAvailable, setExpandedAvailable] = useState<string | null>(null);

  // Slugify helper: convert display name to a valid list ID
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCreateList = async () => {
    const displayName = newDisplayName.trim();
    if (!displayName) {
      setCreateError('Please enter a display name');
      return;
    }
    if (!actor) {
      setCreateError('Not connected. Please refresh and try again.');
      return;
    }
    const id = slugify(displayName);
    if (!id) {
      setCreateError('Display name must contain at least one letter or number');
      return;
    }
    setCreateError('');
    try {
      await addCommentList.mutateAsync({ id, displayName, suffix: newSuffix.trim() });
      setNewDisplayName('');
      setNewSuffix('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCreateError(`Failed to create list: ${msg}`);
    }
  };

  const handleRenameConfirm = async () => {
    if (!editingId || !editDisplayName.trim()) return;
    if (!actor) return;
    const newId = slugify(editDisplayName.trim());
    try {
      await renameCommentList.mutateAsync({
        oldId: editingId,
        newId: newId || editingId,
        newDisplayName: editDisplayName.trim(),
      });
      setEditingId(null);
      setEditDisplayName('');
    } catch (err: unknown) {
      console.error('Rename failed:', err);
    }
  };

  const handleDelete = async (listId: string) => {
    if (!actor) return;
    if (!window.confirm('Delete this comment list and all its templates?')) return;
    try {
      await deleteCommentList.mutateAsync(listId);
    } catch (err: unknown) {
      console.error('Delete failed:', err);
    }
  };

  const handleAddTemplates = async (listId: string) => {
    if (!templatesText.trim()) return;
    if (!actor) return;
    const templates = templatesText
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    try {
      await addTemplatesToList.mutateAsync({ listId, templates });
      setTemplatesText('');
      setAddingTemplatesTo(null);
    } catch (err: unknown) {
      console.error('Add templates failed:', err);
    }
  };

  const handleToggleLock = async (listId: string) => {
    if (!actor) return;
    try {
      await toggleListLock.mutateAsync(listId);
    } catch (err: unknown) {
      console.error('Toggle lock failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Comment List */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Create Comment List
        </h3>
        <div className="space-y-3">
          {/* NO List ID field — auto-generated from display name */}
          <input
            type="text"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
            placeholder="Display Name"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            value={newSuffix}
            onChange={(e) => setNewSuffix(e.target.value)}
            placeholder="Suffix (optional)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {newDisplayName.trim() && (
            <p className="text-xs text-muted-foreground">
              List ID will be: <span className="font-mono text-primary">{slugify(newDisplayName)}</span>
            </p>
          )}
          <button
            onClick={handleCreateList}
            disabled={addCommentList.isPending || !newDisplayName.trim()}
            className="gradient-button px-5 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {addCommentList.isPending ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              'Create List'
            )}
          </button>
          {createError && <p className="text-sm text-destructive">{createError}</p>}
        </div>
      </div>

      {/* Comment Lists */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">Comment Lists</h3>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : commentLists.length === 0 ? (
          <p className="text-muted-foreground text-sm">No comment lists yet. Create one above.</p>
        ) : (
          <div className="space-y-3">
            {commentLists.map((list) => (
              <div key={list.id} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between bg-background/50 px-4 py-3">
                  {editingId === list.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
                        className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button onClick={handleRenameConfirm} className="text-primary p-1">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-foreground">{list.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {list.id} · {list.templates.length} templates
                          {list.suffix && ` · Suffix: "${list.suffix}"`}
                          {list.locked && ' · 🔒 Locked'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpandedAvailable(expandedAvailable === list.id ? null : list.id)}
                          className="text-muted-foreground hover:text-primary p-1 transition-colors"
                          title="View available comments"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAddingTemplatesTo(addingTemplatesTo === list.id ? null : list.id)}
                          className="text-muted-foreground hover:text-primary p-1 transition-colors"
                          title="Add templates"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleLock(list.id)}
                          className="text-muted-foreground hover:text-primary p-1 transition-colors"
                          title={list.locked ? 'Unlock' : 'Lock'}
                        >
                          {list.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => { setEditingId(list.id); setEditDisplayName(list.displayName); }}
                          className="text-muted-foreground hover:text-primary p-1 transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(list.id)}
                          className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Add Templates Panel */}
                {addingTemplatesTo === list.id && (
                  <div className="border-t border-border p-3 bg-background/30">
                    <textarea
                      value={templatesText}
                      onChange={(e) => setTemplatesText(e.target.value)}
                      placeholder="Enter one template per line..."
                      rows={4}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddTemplates(list.id)}
                        disabled={addTemplatesToList.isPending || !templatesText.trim()}
                        className="gradient-button px-3 py-1 rounded text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                      >
                        {addTemplatesToList.isPending ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          'Add Templates'
                        )}
                      </button>
                      <button
                        onClick={() => { setAddingTemplatesTo(null); setTemplatesText(''); }}
                        className="border border-border px-3 py-1 rounded text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Available Comments Panel */}
                {expandedAvailable === list.id && (
                  <div className="border-t border-border bg-background/20">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                      <span className="text-xs font-medium text-muted-foreground">Available Comments Pool</span>
                      <button
                        onClick={() => setExpandedAvailable(null)}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <AvailableCommentsPanel listId={list.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Metrics */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          Usage Metrics
        </h3>
        {metrics.length === 0 ? (
          <p className="text-muted-foreground text-sm">No metrics available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.map((m) => (
              <div key={m.listId} className="bg-background/50 border border-border rounded-lg p-4 flex items-center gap-4">
                <MetricsDonutChart
                  usedTemplates={Number(m.usedTemplates)}
                  totalTemplates={Number(m.totalTemplates)}
                  size={64}
                  strokeWidth={8}
                />
                <div>
                  <p className="font-medium text-foreground text-sm">{m.listName}</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(m.usedTemplates)}/{Number(m.totalTemplates)} used ({m.percentUsed.toFixed(1)}%)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Number(m.availableTemplates)} available
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
