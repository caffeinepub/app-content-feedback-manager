import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Lock,
  Package,
  Plus,
  Save,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { CommentList } from "../../backend";
import { MetricsDonutChart } from "../../components/MetricsDonutChart";
import {
  useAddCommentList,
  useAddTemplatesToCommentList,
  useCommentLists,
  useDeleteCommentList,
  useGetAvailableCount,
  useGetListMetrics,
  useLockCommentList,
  useRenameCommentList,
  useUnlockCommentList,
} from "../../hooks/useQueries";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AvailableBadge({ listId }: { listId: string }) {
  const { data: availableCountRaw, isLoading } = useGetAvailableCount(listId);
  const current =
    availableCountRaw !== undefined ? Number(availableCountRaw) : 0;

  return (
    <div
      className="flex items-center gap-2 mt-2 pt-2"
      style={{ borderTop: "1px solid oklch(0.22 0.05 260 / 0.4)" }}
    >
      <Package
        className="w-3.5 h-3.5"
        style={{ color: "oklch(0.70 0.20 185)" }}
      />
      <span
        className="text-xs font-rajdhani"
        style={{ color: "oklch(0.72 0.04 260)" }}
      >
        Available:
      </span>
      {isLoading ? (
        <span
          className="text-xs font-rajdhani"
          style={{ color: "oklch(0.55 0.04 260)" }}
        >
          …
        </span>
      ) : (
        <span
          className="font-orbitron font-bold text-xs px-2 py-0.5 rounded-full"
          style={{
            background:
              current > 10
                ? "oklch(0.65 0.18 145 / 0.12)"
                : current > 0
                  ? "oklch(0.75 0.18 65 / 0.12)"
                  : "oklch(0.55 0.22 25 / 0.12)",
            color:
              current > 10
                ? "oklch(0.72 0.20 145)"
                : current > 0
                  ? "oklch(0.82 0.20 70)"
                  : "oklch(0.68 0.22 25)",
            border: `1px solid ${current > 10 ? "oklch(0.65 0.18 145 / 0.3)" : current > 0 ? "oklch(0.75 0.18 65 / 0.3)" : "oklch(0.55 0.22 25 / 0.3)"}`,
          }}
        >
          {current} available
        </span>
      )}
    </div>
  );
}

export default function AdminComments() {
  const { data: rawCommentLists = [], isLoading } = useCommentLists();
  const commentLists: CommentList[] = rawCommentLists as CommentList[];
  const { data: metrics = [] } = useGetListMetrics();
  const createList = useAddCommentList();
  const renameList = useRenameCommentList();
  const deleteList = useDeleteCommentList();
  const addTemplates = useAddTemplatesToCommentList();
  const lockList = useLockCommentList();
  const unlockList = useUnlockCommentList();

  const [newDisplayName, setNewDisplayName] = useState("");
  const [newSuffix, setNewSuffix] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [templateText, setTemplateText] = useState("");
  const [showMetrics, setShowMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newDisplayName.trim()) return;
    const id = slugify(newDisplayName);
    try {
      await createList.mutateAsync({
        id,
        displayName: newDisplayName.trim(),
        suffix: newSuffix.trim(),
      });
      setNewDisplayName("");
      setNewSuffix("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create list");
    }
  };

  const handleRename = async (list: CommentList) => {
    setError(null);
    if (!editName.trim()) return;
    try {
      await renameList.mutateAsync({
        id: list.id,
        newDisplayName: editName.trim(),
      });
      setEditingId(null);
      setEditName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to rename list");
    }
  };

  const handleDelete = async (listId: string) => {
    setError(null);
    if (!confirm("Delete this comment list?")) return;
    try {
      await deleteList.mutateAsync(listId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete list");
    }
  };

  const handleAddTemplates = async (listId: string) => {
    setError(null);
    if (!templateText.trim()) return;
    const templates = templateText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await addTemplates.mutateAsync({ id: listId, templates });
      setTemplateText("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add templates");
    }
  };

  const handleToggleLock = async (list: CommentList) => {
    setError(null);
    try {
      if (list.locked) {
        await unlockList.mutateAsync(list.id);
      } else {
        await lockList.mutateAsync(list.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to toggle lock");
    }
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-rajdhani animate-fadeIn"
          style={{
            background: "oklch(0.55 0.22 25 / 0.12)",
            border: "1px solid oklch(0.55 0.22 25 / 0.3)",
            color: "oklch(0.65 0.22 25)",
          }}
        >
          {error}
        </div>
      )}

      {/* Create New List */}
      <div className="glass-card-gold p-5 rounded-2xl">
        <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 gradient-heading">
          <Plus className="w-4 h-4" style={{ color: "oklch(0.82 0.20 70)" }} />
          Create Comment List
        </h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            placeholder="List display name"
            className="glass-input w-full px-3 py-2.5 text-sm"
          />
          <input
            type="text"
            value={newSuffix}
            onChange={(e) => setNewSuffix(e.target.value)}
            placeholder="Suffix (optional, e.g. ❤️)"
            className="glass-input w-full px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={createList.isPending || !newDisplayName.trim()}
            className="px-4 py-2.5 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center gap-2"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
              color: "oklch(0.08 0.02 260)",
              opacity: createList.isPending || !newDisplayName.trim() ? 0.5 : 1,
            }}
          >
            {createList.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Create List
          </button>
        </form>
      </div>

      {/* Metrics Toggle */}
      <button
        type="button"
        onClick={() => setShowMetrics((v) => !v)}
        className="w-full py-2.5 rounded-xl font-rajdhani font-600 text-sm transition-all duration-300 flex items-center justify-center gap-2"
        style={{
          background: showMetrics
            ? "oklch(0.70 0.20 185 / 0.15)"
            : "oklch(0.12 0.03 260 / 0.6)",
          border: `1px solid ${showMetrics ? "oklch(0.70 0.20 185 / 0.3)" : "oklch(0.22 0.05 260 / 0.4)"}`,
          color: showMetrics ? "oklch(0.78 0.22 188)" : "oklch(0.55 0.04 260)",
        }}
      >
        {showMetrics ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        {showMetrics ? "Hide Metrics" : "Show Usage Metrics"}
      </button>

      {/* Metrics */}
      {showMetrics && metrics.length > 0 && (
        <div className="glass-card p-5 rounded-2xl animate-fadeInUp">
          <h3
            className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4"
            style={{ color: "oklch(0.78 0.22 188)" }}
          >
            Usage Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((m) => (
              <div key={m.listId} className="text-center">
                <MetricsDonutChart
                  usedTemplates={Number(m.usedTemplates)}
                  totalTemplates={Number(m.totalTemplates)}
                  size={80}
                  strokeWidth={8}
                />
                <p
                  className="text-xs font-rajdhani mt-1 truncate"
                  style={{ color: "oklch(0.65 0.04 260)" }}
                >
                  {m.listName}
                </p>
                <p
                  className="text-xs font-orbitron font-bold"
                  style={{ color: "oklch(0.82 0.20 70)" }}
                >
                  {Number(m.availableTemplates)} left
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment Lists */}
      <div className="glass-card p-5 rounded-2xl">
        <h3
          className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4"
          style={{ color: "oklch(0.78 0.22 188)" }}
        >
          Comment Lists ({commentLists.length})
        </h3>
        {isLoading ? (
          <div
            className="text-center py-4 font-rajdhani text-sm"
            style={{ color: "oklch(0.50 0.04 260)" }}
          >
            Loading...
          </div>
        ) : commentLists.length === 0 ? (
          <div
            className="text-center py-4 font-rajdhani text-sm"
            style={{ color: "oklch(0.45 0.04 260)" }}
          >
            No comment lists yet
          </div>
        ) : (
          <div className="space-y-3">
            {commentLists.map((list: CommentList) => (
              <div
                key={list.id}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid oklch(0.22 0.05 260 / 0.5)" }}
              >
                <div
                  className="flex items-center gap-2 p-3"
                  style={{ background: "oklch(0.10 0.025 260 / 0.6)" }}
                >
                  {editingId === list.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="glass-input flex-1 px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRename(list)}
                        disabled={renameList.isPending}
                        className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                        style={{
                          background: "oklch(0.65 0.18 145 / 0.2)",
                          color: "oklch(0.72 0.20 145)",
                        }}
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                        style={{ color: "oklch(0.55 0.04 260)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-rajdhani font-600 text-sm truncate"
                          style={{ color: "oklch(0.85 0.05 80)" }}
                        >
                          {list.displayName}
                          {list.locked && (
                            <span
                              className="ml-2 text-xs"
                              style={{ color: "oklch(0.65 0.22 25)" }}
                            >
                              🔒
                            </span>
                          )}
                        </div>
                        <div
                          className="text-xs font-rajdhani"
                          style={{ color: "oklch(0.50 0.04 260)" }}
                        >
                          {list.templates.length} templates
                          {list.suffix && (
                            <span className="ml-2">
                              · suffix: {list.suffix}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedList(
                            expandedList === list.id ? null : list.id,
                          )
                        }
                        className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                        style={{
                          background: "oklch(0.16 0.03 260 / 0.6)",
                          color: "oklch(0.55 0.04 260)",
                        }}
                      >
                        {expandedList === list.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(list.id);
                          setEditName(list.displayName);
                        }}
                        className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                        style={{
                          background: "oklch(0.70 0.20 185 / 0.12)",
                          color: "oklch(0.78 0.22 188)",
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleLock(list)}
                        disabled={lockList.isPending || unlockList.isPending}
                        className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                        style={{
                          background: "oklch(0.75 0.18 65 / 0.12)",
                          color: "oklch(0.82 0.20 70)",
                        }}
                      >
                        {list.locked ? (
                          <Unlock className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(list.id)}
                        disabled={deleteList.isPending}
                        className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                        style={{
                          background: "oklch(0.55 0.22 25 / 0.12)",
                          color: "oklch(0.65 0.22 25)",
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Available count badge */}
                <div
                  className="px-3 pb-2"
                  style={{ background: "oklch(0.10 0.025 260 / 0.6)" }}
                >
                  <AvailableBadge listId={list.id} />
                </div>

                {/* Expanded: add templates */}
                {expandedList === list.id && (
                  <div
                    className="p-3"
                    style={{
                      borderTop: "1px solid oklch(0.22 0.05 260 / 0.4)",
                      background: "oklch(0.08 0.02 260 / 0.4)",
                    }}
                  >
                    <textarea
                      value={templateText}
                      onChange={(e) => setTemplateText(e.target.value)}
                      placeholder="One template per line..."
                      rows={4}
                      className="glass-input w-full px-3 py-2 text-sm resize-none mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTemplates(list.id)}
                      disabled={addTemplates.isPending || !templateText.trim()}
                      className="px-3 py-2 rounded-lg font-rajdhani font-600 text-xs transition-all duration-300 hover-lift flex items-center gap-1.5"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
                        color: "oklch(0.08 0.02 260)",
                        opacity:
                          addTemplates.isPending || !templateText.trim()
                            ? 0.5
                            : 1,
                      }}
                    >
                      {addTemplates.isPending ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      Add Templates
                    </button>

                    {/* Template preview */}
                    {list.templates.length > 0 && (
                      <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
                        {list.templates.slice(0, 10).map((t, i) => (
                          <div
                            key={`${list.id}-tpl-${i}`}
                            className="text-xs font-rajdhani px-2 py-1 rounded"
                            style={{
                              background: "oklch(0.12 0.03 260 / 0.6)",
                              color: "oklch(0.70 0.04 260)",
                            }}
                          >
                            {i + 1}. {t}
                          </div>
                        ))}
                        {list.templates.length > 10 && (
                          <div
                            className="text-xs font-rajdhani text-center"
                            style={{ color: "oklch(0.45 0.04 260)" }}
                          >
                            +{list.templates.length - 10} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
