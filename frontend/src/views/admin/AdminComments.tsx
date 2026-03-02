import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Lock, Unlock, Save, X } from 'lucide-react';
import {
  useGetCommentLists,
  useCreateCommentList,
  useRenameCommentList,
  useDeleteCommentList,
  useAddTemplatesToList,
  useToggleListLock,
  useGetListMetrics,
} from '../../hooks/useQueries';
import { MetricsDonutChart } from '../../components/MetricsDonutChart';
import type { CommentList } from '../../backend';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminComments() {
  const { data: commentLists = [], isLoading } = useGetCommentLists();
  const { data: metrics = [] } = useGetListMetrics();
  const createList = useCreateCommentList();
  const renameList = useRenameCommentList();
  const deleteList = useDeleteCommentList();
  const addTemplates = useAddTemplatesToList();
  const toggleLock = useToggleListLock();

  const [newDisplayName, setNewDisplayName] = useState('');
  const [newSuffix, setNewSuffix] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [templateText, setTemplateText] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newDisplayName.trim()) return;
    const id = slugify(newDisplayName);
    try {
      await createList.mutateAsync({ id, displayName: newDisplayName.trim(), suffix: newSuffix.trim() });
      setNewDisplayName('');
      setNewSuffix('');
    } catch (err: any) {
      setError(err.message || 'Failed to create list');
    }
  };

  const handleRename = async (list: CommentList) => {
    setError(null);
    if (!editName.trim()) return;
    const newId = slugify(editName);
    try {
      await renameList.mutateAsync({ oldId: list.id, newId, newDisplayName: editName.trim() });
      setEditingId(null);
      setEditName('');
    } catch (err: any) {
      setError(err.message || 'Failed to rename list');
    }
  };

  const handleDelete = async (listId: string) => {
    setError(null);
    if (!confirm('Delete this comment list?')) return;
    try {
      await deleteList.mutateAsync(listId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete list');
    }
  };

  const handleAddTemplates = async (listId: string) => {
    setError(null);
    if (!templateText.trim()) return;
    const templates = templateText.split('\n').map(t => t.trim()).filter(Boolean);
    try {
      await addTemplates.mutateAsync({ listId, templates });
      setTemplateText('');
    } catch (err: any) {
      setError(err.message || 'Failed to add templates');
    }
  };

  const handleToggleLock = async (listId: string) => {
    setError(null);
    try {
      await toggleLock.mutateAsync(listId);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle lock');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Create New List */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Create Comment List
        </h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            value={newDisplayName}
            onChange={e => setNewDisplayName(e.target.value)}
            placeholder="List display name"
            className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            value={newSuffix}
            onChange={e => setNewSuffix(e.target.value)}
            placeholder="Suffix (optional, e.g. ❤️)"
            className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={createList.isPending || !newDisplayName.trim()}
            className="gradient-button px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {createList.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Create List
          </button>
        </form>
      </div>

      {/* Comment Lists */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4">Comment Lists</h3>
        {isLoading ? (
          <div className="text-muted-foreground text-sm text-center py-4">Loading...</div>
        ) : commentLists.length === 0 ? (
          <div className="text-muted-foreground text-sm text-center py-4">No comment lists yet</div>
        ) : (
          <div className="space-y-3">
            {commentLists.map(list => (
              <div key={list.id} className="border border-border/50 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-background/30">
                  {editingId === list.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 rounded bg-background/50 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(list)}
                        disabled={renameList.isPending}
                        className="p-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditName(''); }}
                        className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm truncate">{list.displayName}</div>
                        <div className="text-xs text-muted-foreground">{list.templates.length} templates{list.suffix ? ` · suffix: ${list.suffix}` : ''}</div>
                      </div>
                      <button
                        onClick={() => handleToggleLock(list.id)}
                        disabled={toggleLock.isPending}
                        className={`p-1.5 rounded-lg transition-colors ${list.locked ? 'bg-warning/20 text-warning hover:bg-warning/30' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                        title={list.locked ? 'Unlock list' : 'Lock list'}
                      >
                        {list.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => { setEditingId(list.id); setEditName(list.displayName); }}
                        className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(list.id)}
                        disabled={deleteList.isPending}
                        className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setExpandedList(expandedList === list.id ? null : list.id)}
                        className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                      >
                        {expandedList === list.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  )}
                </div>

                {expandedList === list.id && (
                  <div className="p-3 border-t border-border/50 bg-background/20 space-y-3">
                    {/* Add Templates */}
                    {!list.locked && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Add Templates (one per line)</label>
                        <textarea
                          value={templateText}
                          onChange={e => setTemplateText(e.target.value)}
                          placeholder="Template 1&#10;Template 2&#10;Template 3"
                          rows={4}
                          className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                        <button
                          onClick={() => handleAddTemplates(list.id)}
                          disabled={addTemplates.isPending || !templateText.trim()}
                          className="gradient-button px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {addTemplates.isPending ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          Add Templates
                        </button>
                      </div>
                    )}

                    {/* Available Comments */}
                    {list.templates.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Templates ({list.templates.length})</label>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {list.templates.map((t, i) => (
                            <div key={i} className="text-xs text-foreground/80 bg-background/30 rounded px-2 py-1">
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Metrics */}
      <div className="space-card p-5 rounded-2xl">
        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className="w-full flex items-center justify-between text-foreground font-semibold"
        >
          <span>Usage Metrics</span>
          {showMetrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showMetrics && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {metrics.map(m => (
              <div key={m.listId} className="flex flex-col items-center gap-2 p-3 bg-background/30 rounded-xl">
                <MetricsDonutChart
                  usedTemplates={Number(m.usedTemplates)}
                  totalTemplates={Number(m.totalTemplates)}
                  size={80}
                  strokeWidth={8}
                />
                <div className="text-center">
                  <div className="text-xs font-medium text-foreground">{m.listName}</div>
                  <div className="text-xs text-muted-foreground">{Number(m.usedTemplates)}/{Number(m.totalTemplates)} used</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
