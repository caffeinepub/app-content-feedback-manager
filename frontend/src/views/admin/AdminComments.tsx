import { useState } from 'react';
import { useCommentLists, useAddCommentList, useAddTemplatesToList, useToggleListLock } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, Unlock, Plus, Trash2, MessageSquare } from 'lucide-react';

export function AdminComments() {
  const { data: commentLists, isLoading } = useCommentLists();
  const addList = useAddCommentList();
  const addTemplates = useAddTemplatesToList();
  const toggleLock = useToggleListLock();

  const [newListId, setNewListId] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newListSuffix, setNewListSuffix] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [addStatus, setAddStatus] = useState('');

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
                  {list.locked && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Locked</span>}
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
              <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Create</span>
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
    </div>
  );
}
