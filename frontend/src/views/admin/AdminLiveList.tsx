import React, { useState } from 'react';
import { Plus, Upload, Users, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppsEvents, useAddAppEvent } from '../../hooks/useQueries';
import { parseLiveListReport } from '../../utils/liveListParser';
import type { AppEvent } from '../../backend';

export default function AdminLiveList() {
  const { data: appEvents = [], isLoading } = useAppsEvents();
  const addAppEventMutation = useAddAppEvent();

  // Create event form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newUsernames, setNewUsernames] = useState('');
  const [createFeedback, setCreateFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto import
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Expanded event
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const handleCreateEvent = async () => {
    if (!newAppName.trim()) return;
    setCreateFeedback(null);

    const usernames = newUsernames
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    const event: AppEvent = {
      name: newAppName.trim(),
      usernames,
    };

    try {
      await addAppEventMutation.mutateAsync(event);
      setCreateFeedback({ type: 'success', message: `App event "${event.name}" created successfully!` });
      setNewAppName('');
      setNewUsernames('');
      setShowCreateForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create app event';
      setCreateFeedback({ type: 'error', message: msg });
    }
  };

  const handleAutoImport = async () => {
    if (!importText.trim()) return;
    setImportFeedback(null);
    setIsImporting(true);

    const result = parseLiveListReport(importText);
    if (!result.success || result.entries.length === 0) {
      const errMsg = (result as { success: false; errorMessage?: string }).errorMessage
        ?? 'Could not parse the report. Check the format.';
      setImportFeedback({ type: 'error', message: errMsg });
      setIsImporting(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const entry of result.entries) {
      const event: AppEvent = {
        name: entry.appName,
        usernames: entry.usernames,
      };
      try {
        await addAppEventMutation.mutateAsync(event);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setIsImporting(false);
    if (errorCount === 0) {
      setImportFeedback({
        type: 'success',
        message: `Imported ${successCount} app event${successCount !== 1 ? 's' : ''} successfully!`,
      });
      setImportText('');
    } else {
      setImportFeedback({
        type: 'error',
        message: `Imported ${successCount} events, but ${errorCount} failed. Some may already exist.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading app events…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Live List Manager</h2>
          <p className="text-sm text-muted-foreground">{appEvents.length} app event{appEvents.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowCreateForm((v) => !v); setCreateFeedback(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="space-card p-5 space-y-4 border-primary/30">
          <h3 className="font-semibold text-sm">Create App / Event List</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">App / Event Name *</label>
              <input
                type="text"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="e.g. TikTok Live"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Usernames (one per line)</label>
              <textarea
                value={newUsernames}
                onChange={(e) => setNewUsernames(e.target.value)}
                placeholder={"@user1\n@user2\n@user3"}
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateEvent}
              disabled={!newAppName.trim() || addAppEventMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addAppEventMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Event
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setCreateFeedback(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
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

      {/* Auto Import */}
      <div className="space-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Auto Import & Save</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste a "REVIEWS WORLD Reports" formatted text to auto-detect apps and usernames.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste report text here…"
          rows={6}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
        />
        <button
          onClick={handleAutoImport}
          disabled={!importText.trim() || isImporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Import & Save
        </button>
        {importFeedback && (
          <div
            className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
              importFeedback.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {importFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {importFeedback.message}
          </div>
        )}
      </div>

      {/* App Events List */}
      {appEvents.length === 0 ? (
        <div className="space-card p-8 text-center">
          <p className="text-muted-foreground text-sm">No app events yet. Create one above or import a report.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">All App Events</h3>
          </div>
          {appEvents.map((event) => {
            const isExpanded = expandedEvent === event.name;
            return (
              <div key={event.name} className="space-card overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedEvent(isExpanded ? null : event.name)}
                >
                  <div>
                    <p className="font-medium text-sm">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.usernames.length} username{event.usernames.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Usernames:</p>
                    {event.usernames.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No usernames.</p>
                    ) : (
                      <ul className="space-y-1 max-h-48 overflow-y-auto">
                        {event.usernames.map((u, i) => (
                          <li key={i} className="text-xs p-2 rounded bg-muted/30 font-mono">
                            {u}
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
