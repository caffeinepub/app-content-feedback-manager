import React, { useState } from 'react';
import { Plus, Trash2, Upload, DollarSign, Edit2, Save, X } from 'lucide-react';
import {
  useGetPriceList,
  useSetPriceEntry,
  useDeletePriceEntry,
  useBulkSetPrices,
} from '../../hooks/useQueries';
import type { PriceEntry } from '../../backend';

export default function AdminPricing() {
  const { data: priceList = [], isLoading } = useGetPriceList();
  const setPriceEntry = useSetPriceEntry();
  const deletePriceEntry = useDeletePriceEntry();
  const bulkSetPrices = useBulkSetPrices();

  const [appName, setAppName] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [bulkText, setBulkText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!appName.trim() || !price) return;
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Invalid price value');
      return;
    }
    try {
      await setPriceEntry.mutateAsync({ appName: appName.trim(), pricePerEntry: priceNum, isActive });
      setAppName('');
      setPrice('');
      setIsActive(true);
      setSuccess('Price entry added');
    } catch (err: any) {
      setError(err.message || 'Failed to add price entry');
    }
  };

  const handleEdit = async (entry: PriceEntry) => {
    setError(null);
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Invalid price value');
      return;
    }
    try {
      await setPriceEntry.mutateAsync({ appName: entry.appName, pricePerEntry: priceNum, isActive: editActive });
      setEditingApp(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update price entry');
    }
  };

  const handleDelete = async (appName: string) => {
    setError(null);
    if (!confirm(`Delete price entry for "${appName}"?`)) return;
    try {
      await deletePriceEntry.mutateAsync(appName);
    } catch (err: any) {
      setError(err.message || 'Failed to delete price entry');
    }
  };

  const handleBulkUpload = async () => {
    setError(null);
    setSuccess(null);
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const entries: Array<[string, number, boolean]> = [];

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2) {
        setError(`Invalid line format: "${line}". Expected: AppName, Price, [Active]`);
        return;
      }
      const name = parts[0];
      const priceVal = parseFloat(parts[1]);
      const activeVal = parts[2] ? parts[2].toLowerCase() !== 'false' : true;
      if (!name || isNaN(priceVal)) {
        setError(`Invalid data in line: "${line}"`);
        return;
      }
      entries.push([name, priceVal, activeVal]);
    }

    try {
      await bulkSetPrices.mutateAsync(entries);
      setBulkText('');
      setSuccess(`${entries.length} price entries uploaded`);
    } catch (err: any) {
      setError(err.message || 'Failed to bulk upload prices');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-primary/10 border border-primary/30 text-primary rounded-xl px-4 py-3 text-sm">
          {success}
        </div>
      )}

      {/* Add Price Entry */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Add Price Entry
        </h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            type="text"
            value={appName}
            onChange={e => setAppName(e.target.value)}
            placeholder="App name"
            className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Price per entry"
              step="0.01"
              min="0"
              className="flex-1 px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/30 border border-border text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="rounded"
              />
              Active
            </label>
          </div>
          <button
            type="submit"
            disabled={setPriceEntry.isPending || !appName.trim() || !price}
            className="gradient-button px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {setPriceEntry.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add Entry
          </button>
        </form>
      </div>

      {/* Price List Table */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Price List ({priceList.length} entries)
        </h3>
        {isLoading ? (
          <div className="text-muted-foreground text-sm text-center py-4">Loading...</div>
        ) : priceList.length === 0 ? (
          <div className="text-muted-foreground text-sm text-center py-4">No price entries yet</div>
        ) : (
          <div className="space-y-2">
            {priceList.map(entry => (
              <div key={entry.appName} className="flex items-center gap-2 p-3 bg-background/30 rounded-xl border border-border/50">
                {editingApp === entry.appName ? (
                  <>
                    <div className="flex-1 font-medium text-foreground text-sm">{entry.appName}</div>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-24 px-2 py-1 rounded bg-background/50 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <label className="flex items-center gap-1 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={e => setEditActive(e.target.checked)}
                        className="rounded"
                      />
                      Active
                    </label>
                    <button
                      onClick={() => handleEdit(entry)}
                      disabled={setPriceEntry.isPending}
                      className="p-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingApp(null)}
                      className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm truncate">{entry.appName}</div>
                      <div className="text-xs text-muted-foreground">₹{entry.pricePerEntry.toFixed(2)} per entry</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${entry.isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {entry.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => { setEditingApp(entry.appName); setEditPrice(entry.pricePerEntry.toString()); setEditActive(entry.isActive); }}
                      className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.appName)}
                      disabled={deletePriceEntry.isPending}
                      className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Upload */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          Bulk Upload Prices
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Format: <code className="bg-background/50 px-1 rounded">AppName, Price, Active(true/false)</code> — one per line
        </p>
        <textarea
          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
          placeholder="Instagram, 2.50, true&#10;YouTube, 3.00, true&#10;TikTok, 1.50, false"
          rows={5}
          className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-3"
        />
        <button
          onClick={handleBulkUpload}
          disabled={bulkSetPrices.isPending || !bulkText.trim()}
          className="gradient-button px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {bulkSetPrices.isPending ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Bulk Upload
        </button>
      </div>
    </div>
  );
}
