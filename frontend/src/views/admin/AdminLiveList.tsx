import React, { useState } from 'react';
import { Plus, Trash2, Upload, RefreshCw, Users, ChevronDown, ChevronUp } from 'lucide-react';
import {
  useGetAppEvents,
  useCreateAppEvent,
  useRenameAppEvent,
  useDeleteAppEvent,
  useAddUsernamesToEvent,
  useImportLiveList,
} from '../../hooks/useQueries';
import { parseLiveListReport } from '../../utils/liveListParser';
import type { AppEvent } from '../../backend';

export default function AdminLiveList() {
  const { data: appEvents = [], isLoading } = useGetAppEvents();
  const createEvent = useCreateAppEvent();
  const renameEvent = useRenameAppEvent();
  const deleteEvent = useDeleteAppEvent();
  const addUsernames = useAddUsernamesToEvent();
  const importList = useImportLiveList();

  const [newEventName, setNewEventName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [importText, setImportText] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newEventName.trim()) return;
    try {
      await createEvent.mutateAsync(newEventName.trim());
      setNewEventName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (name: string) => {
    setError(null);
    if (!confirm(`Delete event "${name}"?`)) return;
    try {
      await deleteEvent.mutateAsync(name);
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    }
  };

  const handleBulkUpload = async () => {
    setError(null);
    if (!selectedEvent || !bulkText.trim()) return;
    const usernames = bulkText.split('\n').map(u => u.trim()).filter(Boolean);
    try {
      await addUsernames.mutateAsync({ name: selectedEvent, usernames });
      setBulkText('');
    } catch (err: any) {
      setError(err.message || 'Failed to add usernames');
    }
  };

  const handleAutoImport = async () => {
    setError(null);
    setImportResult(null);
    if (!importText.trim()) return;

    const parseResult = parseLiveListReport(importText);
    if (!parseResult.success) {
      setError(parseResult.errorMessage || 'Failed to parse report');
      return;
    }

    try {
      const imports = parseResult.entries.map(entry => ({
        appName: entry.appName,
        usernames: entry.usernames,
        importDate: entry.importDate,
      }));
      const summary = await importList.mutateAsync(imports);
      setImportResult(
        `✅ Import complete: ${summary.totalAppsDetected} apps detected, ${summary.totalUsernamesAdded} usernames added, ${summary.totalDuplicatesSkipped} duplicates skipped`
      );
      setImportText('');
    } catch (err: any) {
      setError(err.message || 'Failed to import live list');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setBulkText(ev.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {importResult && (
        <div className="bg-primary/10 border border-primary/30 text-primary rounded-xl px-4 py-3 text-sm">
          {importResult}
        </div>
      )}

      {/* Create App/Event */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Create App / Event List
        </h3>
        <form onSubmit={handleCreateEvent} className="flex gap-2">
          <input
            type="text"
            value={newEventName}
            onChange={e => setNewEventName(e.target.value)}
            placeholder="App or event name"
            className="flex-1 px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={createEvent.isPending || !newEventName.trim()}
            className="gradient-button px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {createEvent.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Create
          </button>
        </form>
      </div>

      {/* Auto Import & Save */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary" />
          Auto Import & Save
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Paste a "REVIEWS WORLD Reports" formatted text to auto-detect apps and usernames.
        </p>
        <textarea
          value={importText}
          onChange={e => setImportText(e.target.value)}
          placeholder="Paste report text here..."
          rows={6}
          className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-3"
        />
        <button
          onClick={handleAutoImport}
          disabled={importList.isPending || !importText.trim()}
          className="gradient-button px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {importList.isPending ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Auto Import & Save
        </button>
      </div>

      {/* Bulk Username Upload */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          Bulk Username Upload
        </h3>
        <div className="space-y-3">
          <select
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Select app/event...</option>
            {appEvents.map(ev => (
              <option key={ev.name} value={ev.name}>{ev.name}</option>
            ))}
          </select>
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder="One username per line..."
            rows={5}
            className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground text-sm cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Upload File
              <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={handleBulkUpload}
              disabled={addUsernames.isPending || !selectedEvent || !bulkText.trim()}
              className="gradient-button px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {addUsernames.isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Users className="w-3.5 h-3.5" />
              )}
              Upload Usernames
            </button>
          </div>
        </div>
      </div>

      {/* App Events List */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4">App / Event Lists ({appEvents.length})</h3>
        {isLoading ? (
          <div className="text-muted-foreground text-sm text-center py-4">Loading...</div>
        ) : appEvents.length === 0 ? (
          <div className="text-muted-foreground text-sm text-center py-4">No app events yet</div>
        ) : (
          <div className="space-y-2">
            {appEvents.map((ev: AppEvent) => (
              <div key={ev.name} className="border border-border/50 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-background/30">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">{ev.name}</div>
                    <div className="text-xs text-muted-foreground">{ev.usernames.length} usernames</div>
                  </div>
                  <button
                    onClick={() => setExpandedEvent(expandedEvent === ev.name ? null : ev.name)}
                    className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                  >
                    {expandedEvent === ev.name ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(ev.name)}
                    disabled={deleteEvent.isPending}
                    className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {expandedEvent === ev.name && ev.usernames.length > 0 && (
                  <div className="p-3 border-t border-border/50 bg-background/20">
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {ev.usernames.map((u, i) => (
                        <div key={i} className="text-xs text-foreground/80 bg-background/30 rounded px-2 py-1">
                          {u}
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
