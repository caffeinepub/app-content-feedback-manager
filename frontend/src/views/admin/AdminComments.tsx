import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, Plus, Lock, Unlock, RotateCcw, BarChart2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricsDonutChart } from "@/components/MetricsDonutChart";
import {
  useCommentLists,
  useAddCommentList,
  useAddTemplatesToList,
  useToggleListLock,
  useListMetrics,
  useDeleteCommentList,
  useEditListName,
} from "@/hooks/useQueries";

export function AdminComments() {
  const { data: commentLists = [], isLoading } = useCommentLists();
  const { data: listMetrics = [], isLoading: metricsLoading, refetch: refetchMetrics } = useListMetrics();
  const addCommentListMutation = useAddCommentList();
  const addTemplatesMutation = useAddTemplatesToList();
  const toggleLockMutation = useToggleListLock();
  const deleteListMutation = useDeleteCommentList();
  const editListNameMutation = useEditListName();

  const [newListName, setNewListName] = useState("");
  const [newListSuffix, setNewListSuffix] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newTemplates, setNewTemplates] = useState("");

  // Inline editing state
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editNameError, setEditNameError] = useState("");

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error("List name cannot be empty");
      return;
    }
    const id = `list_${Date.now()}`;
    await addCommentListMutation.mutateAsync({
      id,
      displayName: newListName.trim(),
      suffix: newListSuffix.trim(),
    });
    toast.success("Comment list created!");
    setNewListName("");
    setNewListSuffix("");
  };

  const handleAddTemplates = async (listId: string) => {
    if (!newTemplates.trim()) {
      toast.error("Templates cannot be empty");
      return;
    }
    const templates = newTemplates
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (templates.length === 0) {
      toast.error("No valid templates found");
      return;
    }
    await addTemplatesMutation.mutateAsync({ listId, templates });
    toast.success(`Added ${templates.length} template(s)!`);
    setNewTemplates("");
    setSelectedListId(null);
  };

  const handleToggleLock = async (listId: string) => {
    await toggleLockMutation.mutateAsync(listId);
    toast.success("Lock status updated!");
  };

  const handleDeleteList = async (id: string) => {
    await deleteListMutation.mutateAsync(id);
    toast.success("List deleted successfully!");
  };

  const startEditName = (id: string, currentName: string) => {
    setEditingListId(id);
    setEditedName(currentName);
    setEditNameError("");
  };

  const cancelEditName = () => {
    setEditingListId(null);
    setEditedName("");
    setEditNameError("");
  };

  const saveEditName = async (id: string) => {
    if (!editedName.trim()) {
      setEditNameError("Name cannot be empty");
      return;
    }
    await editListNameMutation.mutateAsync({ id, newName: editedName.trim() });
    toast.success("List name updated!");
    setEditingListId(null);
    setEditedName("");
    setEditNameError("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      saveEditName(id);
    } else if (e.key === "Escape") {
      cancelEditName();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 bg-secondary rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New List */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-neon-teal" />
          <h3 className="font-display font-semibold text-lg">Create New Comment List</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">List Name</label>
            <Input
              placeholder="e.g. Motivational Comments"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Suffix (optional)</label>
            <Input
              placeholder="e.g. 🔥 or #hashtag"
              value={newListSuffix}
              onChange={(e) => setNewListSuffix(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <Button
            onClick={handleCreateList}
            disabled={addCommentListMutation.isPending || !newListName.trim()}
            className="gradient-btn text-white font-semibold w-full"
          >
            {addCommentListMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create List
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Usage Metrics */}
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
            <RefreshCw className={`w-4 h-4 ${metricsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {metricsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 bg-secondary rounded-xl" />
            ))}
          </div>
        ) : listMetrics.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No lists to show metrics for.</p>
        ) : (
          <div className="space-y-3">
            {listMetrics.map((metric) => {
              const total = Number(metric.totalTemplates);
              const used = Number(metric.usedTemplates);
              const available = Number(metric.availableTemplates);
              const pct = total > 0 ? (used / total) * 100 : 0;
              return (
                <div
                  key={metric.listId}
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: "oklch(0.18 0.035 240 / 0.8)",
                    border: "1px solid oklch(0.3 0.05 220 / 0.5)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">{metric.listName}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(pct)}% used</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <MetricsDonutChart usedTemplates={used} totalTemplates={total} size={64} strokeWidth={8} />
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-base font-bold text-foreground">{total}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div>
                        <div className="text-base font-bold" style={{ color: "oklch(0.65 0.2 220)" }}>{used}</div>
                        <div className="text-xs text-muted-foreground">Used</div>
                      </div>
                      <div>
                        <div className="text-base font-bold" style={{ color: "oklch(0.72 0.2 155)" }}>{available}</div>
                        <div className="text-xs text-muted-foreground">Left</div>
                      </div>
                    </div>
                  </div>
                  {/* Reset Pool Buttons */}
                  <div className="flex gap-2 pt-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: "oklch(0.22 0.06 220 / 0.5)",
                            border: "1px solid oklch(0.4 0.1 220 / 0.4)",
                            color: "oklch(0.75 0.15 220)",
                          }}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset Pool
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset Pool</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reset the used template pool for "{metric.listName}", making all templates available again. Device claims will be preserved.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => toast.success("Pool reset!")}>Reset Pool</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: "oklch(0.22 0.06 25 / 0.4)",
                            border: "1px solid oklch(0.4 0.12 25 / 0.4)",
                            color: "oklch(0.72 0.18 25)",
                          }}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset + Clear Claims
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset Pool & Clear Claims</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reset the used template pool AND clear all device claims for "{metric.listName}". All devices will be able to generate comments again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => toast.success("Pool reset and claims cleared!")}
                          >
                            Reset + Clear Claims
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comment Lists */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Comment Lists ({commentLists.length})
        </h3>

        {commentLists.length === 0 ? (
          <div className="glass-card p-8 rounded-xl text-center text-muted-foreground">
            No comment lists yet. Create one above.
          </div>
        ) : (
          commentLists.map((list) => {
            const isEditing = editingListId === list.id;

            return (
              <div key={list.id} className="glass-card rounded-2xl p-5 space-y-3">
                {/* List Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1">
                          <Input
                            value={editedName}
                            onChange={(e) => {
                              setEditedName(e.target.value);
                              setEditNameError("");
                            }}
                            onKeyDown={(e) => handleEditKeyDown(e, list.id)}
                            className="bg-secondary border-border h-8 text-sm"
                            autoFocus
                          />
                          {editNameError && (
                            <p className="text-destructive text-xs mt-1">{editNameError}</p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-400/10 shrink-0"
                          onClick={() => saveEditName(list.id)}
                          disabled={editListNameMutation.isPending}
                        >
                          {editListNameMutation.isPending ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={cancelEditName}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-semibold text-foreground truncate">{list.displayName}</h4>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0"
                          onClick={() => startEditName(list.id, list.displayName)}
                          title="Edit list name"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant={list.locked ? "destructive" : "secondary"} className="text-xs">
                        {list.locked ? "Locked" : "Unlocked"}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-yellow-400"
                        onClick={() => handleToggleLock(list.id)}
                        disabled={toggleLockMutation.isPending}
                        title={list.locked ? "Unlock list" : "Lock list"}
                      >
                        {list.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                      </Button>

                      {/* Delete Button with Confirmation */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Delete list"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Comment List</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>"{list.displayName}"</strong>? This will permanently remove the list and all {list.templates.length} template(s) inside it. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteList(list.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteListMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                  Deleting...
                                </span>
                              ) : (
                                "Delete List"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>

                {/* List Info */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{list.templates.length} templates</span>
                  {list.suffix && (
                    <span>
                      Suffix: <code className="bg-secondary px-1 rounded">{list.suffix}</code>
                    </span>
                  )}
                </div>

                <Separator className="opacity-30" />

                {/* Add Templates */}
                {!list.locked && (
                  <div>
                    {selectedListId === list.id ? (
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Add templates (one per line)</label>
                        <textarea
                          className="w-full bg-secondary border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                          rows={5}
                          placeholder={"Template 1\nTemplate 2\nTemplate 3"}
                          value={newTemplates}
                          onChange={(e) => setNewTemplates(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddTemplates(list.id)}
                            disabled={addTemplatesMutation.isPending}
                            className="gradient-btn text-white"
                          >
                            {addTemplatesMutation.isPending ? (
                              <span className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                Adding...
                              </span>
                            ) : (
                              "Add Templates"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedListId(null);
                              setNewTemplates("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-border"
                        onClick={() => setSelectedListId(list.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Templates
                      </Button>
                    )}
                  </div>
                )}

                {/* Templates Preview */}
                {list.templates.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Templates preview:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {list.templates.slice(0, 5).map((template, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-secondary rounded px-2 py-1 text-foreground/80 truncate"
                        >
                          {idx + 1}. {template}
                        </div>
                      ))}
                      {list.templates.length > 5 && (
                        <div className="text-xs text-muted-foreground px-2">
                          +{list.templates.length - 5} more templates...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminComments;
