import {
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { AppEvent } from "../../backend";
import {
  useAddAppEvent,
  useAddUsernamesToAppEvent,
  useAppsEvents,
  useDeleteAppEvent,
  useImportLiveList,
  useRenameAppEvent,
} from "../../hooks/useQueries";
import { parseLiveListReport } from "../../utils/liveListParser";

export default function AdminLiveList() {
  const { data: appEvents = [], isLoading } = useAppsEvents();
  const createEvent = useAddAppEvent();
  const _renameEvent = useRenameAppEvent();
  const deleteEvent = useDeleteAppEvent();
  const addUsernames = useAddUsernamesToAppEvent();
  const importList = useImportLiveList();

  const [newEventName, setNewEventName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [importText, setImportText] = useState("");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newEventName.trim()) return;
    try {
      await createEvent.mutateAsync(newEventName.trim());
      setNewEventName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  const handleDeleteEvent = async (name: string) => {
    setError(null);
    if (!confirm(`Delete event "${name}"?`)) return;
    try {
      await deleteEvent.mutateAsync(name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  const handleBulkUpload = async () => {
    setError(null);
    if (!selectedEvent || !bulkText.trim()) return;
    const usernames = bulkText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    try {
      await addUsernames.mutateAsync({ name: selectedEvent, usernames });
      setBulkText("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add usernames");
    }
  };

  const handleAutoImport = async () => {
    setError(null);
    setImportResult(null);
    if (!importText.trim()) return;

    const parseResult = parseLiveListReport(importText);
    if (!parseResult.success) {
      setError(parseResult.errorMessage || "Failed to parse report");
      return;
    }

    try {
      const imports = parseResult.entries.map((entry) => ({
        appName: entry.appName,
        usernames: entry.usernames,
        importDate: entry.importDate,
      }));
      await importList.mutateAsync(imports);
      setImportResult("✅ Import complete");
      setImportText("");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to import live list",
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBulkText((ev.target?.result as string) || "");
    };
    reader.readAsText(file);
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

      {importResult && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-rajdhani animate-fadeIn"
          style={{
            background: "oklch(0.65 0.18 145 / 0.12)",
            border: "1px solid oklch(0.65 0.18 145 / 0.3)",
            color: "oklch(0.72 0.20 145)",
          }}
        >
          {importResult}
        </div>
      )}

      {/* Create App/Event */}
      <div className="glass-card-gold p-5 rounded-2xl">
        <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 gradient-heading flex items-center gap-2">
          <Plus className="w-4 h-4" style={{ color: "oklch(0.82 0.20 70)" }} />
          Create App / Event List
        </h3>
        <form onSubmit={handleCreateEvent} className="flex gap-2">
          <input
            type="text"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
            placeholder="App or event name"
            className="glass-input flex-1 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={createEvent.isPending || !newEventName.trim()}
            className="px-4 py-2.5 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center gap-2"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
              color: "oklch(0.08 0.02 260)",
              opacity: createEvent.isPending || !newEventName.trim() ? 0.5 : 1,
            }}
          >
            {createEvent.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Create
          </button>
        </form>
      </div>

      {/* Auto Import & Save */}
      <div className="glass-card p-5 rounded-2xl">
        <h3
          className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"
          style={{ color: "oklch(0.78 0.22 188)" }}
        >
          <RefreshCw className="w-4 h-4" />
          Auto Import & Save
        </h3>
        <p
          className="text-xs font-rajdhani mb-3"
          style={{ color: "oklch(0.50 0.04 260)" }}
        >
          Paste a "REVIEWS WORLD Reports" formatted text to auto-detect apps and
          usernames.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste report text here..."
          rows={6}
          className="glass-input w-full px-3 py-2.5 text-sm resize-none mb-3"
        />
        <button
          type="button"
          onClick={handleAutoImport}
          disabled={importList.isPending || !importText.trim()}
          className="px-4 py-2.5 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center gap-2"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.70 0.20 185), oklch(0.75 0.18 65))",
            color: "oklch(0.08 0.02 260)",
            opacity: importList.isPending || !importText.trim() ? 0.5 : 1,
          }}
        >
          {importList.isPending ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Auto Import & Save
        </button>
      </div>

      {/* Bulk Username Upload */}
      <div className="glass-card p-5 rounded-2xl">
        <h3
          className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"
          style={{ color: "oklch(0.78 0.22 188)" }}
        >
          <Upload className="w-4 h-4" />
          Bulk Username Upload
        </h3>
        <div className="space-y-3">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="glass-input w-full px-3 py-2.5 text-sm"
          >
            <option value="">Select app/event...</option>
            {appEvents.map((ev) => (
              <option key={ev.name} value={ev.name}>
                {ev.name}
              </option>
            ))}
          </select>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="One username per line..."
            rows={5}
            className="glass-input w-full px-3 py-2.5 text-sm resize-none"
          />
          <div className="flex gap-2">
            <label
              className="flex items-center gap-2 px-3 py-2 rounded-xl font-rajdhani font-600 text-xs cursor-pointer transition-all duration-200 hover:scale-105"
              style={{
                background: "oklch(0.14 0.03 260 / 0.6)",
                border: "1px solid oklch(0.28 0.06 260 / 0.4)",
                color: "oklch(0.60 0.04 260)",
              }}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload File
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleBulkUpload}
              disabled={
                addUsernames.isPending || !selectedEvent || !bulkText.trim()
              }
              className="px-4 py-2 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center gap-2"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
                color: "oklch(0.08 0.02 260)",
                opacity:
                  addUsernames.isPending || !selectedEvent || !bulkText.trim()
                    ? 0.5
                    : 1,
              }}
            >
              {addUsernames.isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Users className="w-3.5 h-3.5" />
              )}
              Upload Usernames
            </button>
          </div>
        </div>
      </div>

      {/* App Events List */}
      <div className="glass-card p-5 rounded-2xl">
        <h3
          className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4"
          style={{ color: "oklch(0.78 0.22 188)" }}
        >
          App / Event Lists ({appEvents.length})
        </h3>
        {isLoading ? (
          <div
            className="text-center py-4 font-rajdhani text-sm"
            style={{ color: "oklch(0.50 0.04 260)" }}
          >
            Loading...
          </div>
        ) : appEvents.length === 0 ? (
          <div
            className="text-center py-4 font-rajdhani text-sm"
            style={{ color: "oklch(0.45 0.04 260)" }}
          >
            No app events yet
          </div>
        ) : (
          <div className="space-y-2">
            {appEvents.map((ev: AppEvent) => (
              <div
                key={ev.name}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid oklch(0.22 0.05 260 / 0.5)" }}
              >
                <div
                  className="flex items-center gap-2 p-3"
                  style={{ background: "oklch(0.10 0.025 260 / 0.6)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-rajdhani font-600 text-sm truncate"
                      style={{ color: "oklch(0.85 0.05 80)" }}
                    >
                      {ev.name}
                    </div>
                    <div
                      className="text-xs font-rajdhani"
                      style={{ color: "oklch(0.50 0.04 260)" }}
                    >
                      {ev.usernames.length} usernames
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedEvent(
                        expandedEvent === ev.name ? null : ev.name,
                      )
                    }
                    className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                    style={{
                      background: "oklch(0.16 0.03 260 / 0.6)",
                      color: "oklch(0.55 0.04 260)",
                    }}
                  >
                    {expandedEvent === ev.name ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(ev.name)}
                    disabled={deleteEvent.isPending}
                    className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.12)",
                      color: "oklch(0.65 0.22 25)",
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {expandedEvent === ev.name && ev.usernames.length > 0 && (
                  <div
                    className="p-3"
                    style={{
                      borderTop: "1px solid oklch(0.22 0.05 260 / 0.4)",
                      background: "oklch(0.08 0.02 260 / 0.4)",
                    }}
                  >
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {ev.usernames.map((u, i) => (
                        <div
                          key={u}
                          className="text-xs font-rajdhani px-2 py-1 rounded"
                          style={{
                            background: "oklch(0.12 0.03 260 / 0.6)",
                            color: "oklch(0.70 0.04 260)",
                          }}
                        >
                          {i + 1}. {u}
                        </div>
                      ))}
                    </div>
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
