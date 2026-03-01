import React, { useState, useRef } from 'react';
import { Plus, Upload, RefreshCw, Trash2, Edit2, Check, X, Users, FileText } from 'lucide-react';
import { useActor } from '../../hooks/useActor';
import {
  useGetAppEvents,
  useAddAppEvent,
  useAddUsernamesToAppEvent,
  useRenameAppEvent,
  useDeleteAppEvent,
  useImportLiveList,
} from '../../hooks/useQueries';
import { parseLiveListReport } from '../../utils/liveListParser';
import type { ImportSummary } from '../../backend';

export default function AdminLiveList() {
  const { actor } = useActor();
  const { data: appEvents = [], isLoading } = useGetAppEvents();

  const addAppEvent = useAddAppEvent();
  const addUsernames = useAddUsernamesToAppEvent();
  const renameAppEvent = useRenameAppEvent();
  const deleteAppEvent = useDeleteAppEvent();
  const importLiveList = useImportLiveList();

  // Create list
  const [newListName, setNewListName] = useState('');
  const [createError, setCreateError] = useState('');

  // Add usernames
  const [selectedApp, setSelectedApp] = useState('');
  const [usernamesText, setUsernamesText] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rename
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Auto import
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) {
      setCreateError('Please enter a list name');
      return;
    }
    if (!actor) {
      setCreateError('Not connected. Please refresh and try again.');
      return;
    }
    setCreateError('');
    try {
      await addAppEvent.mutateAsync(name);
      setNewListName('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCreateError(`Failed to create list: ${msg}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreateList();
  };

  const parseUsernames = (text: string): string[] => {
    return text
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
  };

  const handleAddUsernames = async () => {
    if (!selectedApp) {
      setUploadError('Please select an app/event first');
      return;
    }
    const usernames = parseUsernames(usernamesText);
    if (usernames.length === 0) {
      setUploadError('Please enter at least one username');
      return;
    }
    if (!actor) {
      setUploadError('Not connected. Please refresh and try again.');
      return;
    }
    setUploadError('');
    setUploadSuccess('');
    try {
      await addUsernames.mutateAsync({ name: selectedApp, usernames });
      setUploadSuccess(`Successfully added ${usernames.length} username(s) to "${selectedApp}"`);
      setUsernamesText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(`Failed to add usernames: ${msg}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedApp) {
      setUploadError('Please select an app/event first');
      return;
    }
    if (!actor) {
      setUploadError('Not connected. Please refresh and try again.');
      return;
    }
    setUploadError('');
    setUploadSuccess('');
    try {
      const text = await file.text();
      const usernames = parseUsernames(text);
      if (usernames.length === 0) {
        setUploadError('No valid usernames found in file');
        return;
      }
      await addUsernames.mutateAsync({ name: selectedApp, usernames });
      setUploadSuccess(`Successfully added ${usernames.length} username(s) from file to "${selectedApp}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(`Failed to upload file: ${msg}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRenameStart = (appName: string) => {
    setEditingApp(appName);
    setEditName(appName);
  };

  const handleRenameConfirm = async () => {
    if (!editingApp || !editName.trim()) return;
    if (!actor) return;
    try {
      await renameAppEvent.mutateAsync({ oldName: editingApp, newName: editName.trim() });
      setEditingApp(null);
      setEditName('');
    } catch (err: unknown) {
      console.error('Rename failed:', err);
    }
  };

  const handleDelete = async (appName: string) => {
    if (!actor) return;
    if (!window.confirm(`Delete "${appName}" and all its usernames?`)) return;
    try {
      await deleteAppEvent.mutateAsync(appName);
    } catch (err: unknown) {
      console.error('Delete failed:', err);
    }
  };

  const handleImportAndSave = async () => {
    if (!importText.trim()) {
      setImportError('Please paste a report first');
      return;
    }
    if (!actor) {
      setImportError('Not connected. Please refresh and try again.');
      return;
    }
    setImportError('');
    setImportSummary(null);

    const parseResult = parseLiveListReport(importText);
    if (!parseResult.success || parseResult.entries.length === 0) {
      // Use errorMessage (the correct field name from liveListParser)
      setImportError(parseResult.errorMessage ?? 'Could not parse any app/event data from the report');
      return;
    }

    const imports = parseResult.entries.map((entry) => {
      const imp: import('../../backend').AppImport = {
        appName: entry.appName,
        usernames: entry.usernames,
      };
      if (entry.importDate) imp.importDate = entry.importDate;
      return imp;
    });

    try {
      const summary = await importLiveList.mutateAsync(imports);
      setImportSummary(summary);
      setImportText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(`Import failed: ${msg}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create App / Event List */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Create App / Event List
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Name"
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleCreateList}
            disabled={addAppEvent.isPending || !newListName.trim()}
            className="gradient-button px-5 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 min-w-[90px] justify-center"
          >
            {addAppEvent.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Create'
            )}
          </button>
        </div>
        {createError && (
          <p className="mt-2 text-sm text-destructive">{createError}</p>
        )}
      </div>

      {/* App / Event Lists */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          App / Event Lists
        </h3>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        ) : appEvents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No lists yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {appEvents.map((app) => (
              <div
                key={app.name}
                className="flex items-center justify-between bg-background/50 border border-border rounded-lg px-4 py-3"
              >
                {editingApp === app.name ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
                      className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <button
                      onClick={handleRenameConfirm}
                      disabled={renameAppEvent.isPending}
                      className="text-primary hover:text-primary/80 p-1"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingApp(null)}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-foreground">{app.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.usernames.length} username{app.usernames.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRenameStart(app.name)}
                        className="text-muted-foreground hover:text-primary p-1 transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(app.name)}
                        disabled={deleteAppEvent.isPending}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Usernames */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Add Usernames
        </h3>
        <div className="space-y-3">
          <select
            value={selectedApp}
            onChange={(e) => {
              setSelectedApp(e.target.value);
              setUploadError('');
              setUploadSuccess('');
            }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select App / Event</option>
            {appEvents.map((app) => (
              <option key={app.name} value={app.name}>{app.name}</option>
            ))}
          </select>
          <textarea
            value={usernamesText}
            onChange={(e) => setUsernamesText(e.target.value)}
            placeholder="Enter one username per line (or comma-separated)..."
            rows={5}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleAddUsernames}
              disabled={addUsernames.isPending || !selectedApp || !usernamesText.trim()}
              className="gradient-button px-5 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {addUsernames.isPending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Adding...</>
              ) : (
                'Add Usernames'
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={addUsernames.isPending || !selectedApp}
              className="border border-border px-5 py-2 rounded-lg font-medium text-foreground hover:bg-muted/30 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload .txt / .csv
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          {uploadSuccess && <p className="text-sm text-green-400">{uploadSuccess}</p>}
        </div>
      </div>

      {/* Auto Import & Save */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Auto Import &amp; Save
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Paste a "REVIEWS WORLD Reports" formatted text to automatically extract and import app/event lists with usernames.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste Report..."
          rows={8}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
        />
        <button
          onClick={handleImportAndSave}
          disabled={importLiveList.isPending || !importText.trim()}
          className="gradient-button px-5 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {importLiveList.isPending ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Importing...</>
          ) : (
            'Import & Save'
          )}
        </button>
        {importError && <p className="mt-2 text-sm text-destructive">{importError}</p>}
        {importSummary && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 space-y-1">
            <p className="font-semibold">Import successful!</p>
            <p>Apps detected: {Number(importSummary.totalAppsDetected)}</p>
            <p>Usernames added: {Number(importSummary.totalUsernamesAdded)}</p>
            <p>Duplicates skipped: {Number(importSummary.totalDuplicatesSkipped)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
