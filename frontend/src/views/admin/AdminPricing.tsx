import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, RefreshCw, DollarSign, Upload } from 'lucide-react';
import { useActor } from '../../hooks/useActor';
import {
  useGetPriceList,
  useSetPriceEntry,
  useDeletePriceEntry,
  useBulkSetPrices,
} from '../../hooks/useQueries';

export default function AdminPricing() {
  const { actor } = useActor();
  const { data: priceList = [], isLoading } = useGetPriceList();

  const setPriceEntry = useSetPriceEntry();
  const deletePriceEntry = useDeletePriceEntry();
  const bulkSetPrices = useBulkSetPrices();

  // Add/Edit form
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [formAppName, setFormAppName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState('');

  // Bulk upload
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  const handleSave = async () => {
    const appName = formAppName.trim();
    const price = parseFloat(formPrice);
    if (!appName) { setFormError('App name is required'); return; }
    if (isNaN(price) || price < 0) { setFormError('Enter a valid price'); return; }
    if (!actor) { setFormError('Not connected. Please refresh.'); return; }
    setFormError('');
    try {
      await setPriceEntry.mutateAsync({ appName, pricePerEntry: price, isActive: formActive });
      setFormAppName('');
      setFormPrice('');
      setFormActive(true);
      setEditingApp(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Failed to save: ${msg}`);
    }
  };

  const handleEdit = (appName: string, price: number, isActive: boolean) => {
    setEditingApp(appName);
    setFormAppName(appName);
    setFormPrice(String(price));
    setFormActive(isActive);
    setFormError('');
  };

  const handleDelete = async (appName: string) => {
    if (!actor) return;
    if (!window.confirm(`Delete price entry for "${appName}"?`)) return;
    try {
      await deletePriceEntry.mutateAsync(appName);
    } catch (err: unknown) {
      console.error('Delete price entry failed:', err);
    }
  };

  const handleBulkSave = async () => {
    if (!bulkText.trim()) { setBulkError('Please enter data'); return; }
    if (!actor) { setBulkError('Not connected. Please refresh.'); return; }
    setBulkError('');
    setBulkSuccess('');
    try {
      const entries: Array<[string, number, boolean]> = bulkText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          const parts = line.split(',').map((p) => p.trim());
          const appName = parts[0];
          const price = parseFloat(parts[1] ?? '0');
          const isActive = parts[2]?.toLowerCase() !== 'false';
          if (!appName || isNaN(price)) throw new Error(`Invalid line: "${line}"`);
          return [appName, price, isActive];
        });
      await bulkSetPrices.mutateAsync(entries);
      setBulkSuccess(`Saved ${entries.length} price entries`);
      setBulkText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBulkError(`Bulk save failed: ${msg}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add / Edit Price Entry */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          {editingApp ? 'Edit Price Entry' : 'Add Price Entry'}
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={formAppName}
            onChange={(e) => setFormAppName(e.target.value)}
            placeholder="App Name"
            disabled={!!editingApp}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
          <input
            type="number"
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
            placeholder="Price per entry (e.g. 2.5)"
            min="0"
            step="0.01"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">Active</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={setPriceEntry.isPending || !formAppName.trim() || !formPrice}
              className="gradient-button px-5 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {setPriceEntry.isPending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-4 h-4" /> Save</>
              )}
            </button>
            {editingApp && (
              <button
                onClick={() => {
                  setEditingApp(null);
                  setFormAppName('');
                  setFormPrice('');
                  setFormActive(true);
                  setFormError('');
                }}
                className="border border-border px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>
      </div>

      {/* Price List Table */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          App Price List
        </h3>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : priceList.length === 0 ? (
          <p className="text-muted-foreground text-sm">No price entries yet. Add one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 pr-4">App Name</th>
                  <th className="text-right py-2 pr-4">Price/Entry</th>
                  <th className="text-center py-2 pr-4">Active</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {priceList.map((entry) => (
                  <tr key={entry.appName} className="border-b border-border/50 hover:bg-muted/10">
                    <td className="py-2 pr-4 font-medium text-foreground">{entry.appName}</td>
                    <td className="py-2 pr-4 text-right text-foreground">₹{entry.pricePerEntry.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${entry.isActive ? 'bg-green-400' : 'bg-muted'}`} />
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(entry.appName, entry.pricePerEntry, entry.isActive)}
                          className="text-muted-foreground hover:text-primary p-1 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.appName)}
                          disabled={deletePriceEntry.isPending}
                          className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Upload */}
      <div className="space-card p-5">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Bulk Upload Prices
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Format: <span className="font-mono">AppName,Price,Active</span> (one per line). Active is optional, defaults to true.
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={"Instagram,2.5,true\nYouTube,3.0,true\nTikTok,1.5,false"}
          rows={5}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
        />
        <button
          onClick={handleBulkSave}
          disabled={bulkSetPrices.isPending || !bulkText.trim()}
          className="gradient-button px-5 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {bulkSetPrices.isPending ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            'Bulk Save'
          )}
        </button>
        {bulkError && <p className="mt-2 text-sm text-destructive">{bulkError}</p>}
        {bulkSuccess && <p className="mt-2 text-sm text-green-400">{bulkSuccess}</p>}
      </div>
    </div>
  );
}
