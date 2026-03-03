import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  usePriceList,
  useSetPriceEntry,
  useDeletePriceEntry,
  useBulkSetPrices,
} from '../../hooks/useQueries';
import type { PriceEntry } from '../../backend';

export default function AdminPricing() {
  const { data: priceList = [], isLoading } = usePriceList();
  const setPriceEntry = useSetPriceEntry();
  const deletePriceEntry = useDeletePriceEntry();
  const bulkSetPrices = useBulkSetPrices();

  const [appName, setAppName] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [bulkText, setBulkText] = useState('');
  const [bulkFeedback, setBulkFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAddEntry = async () => {
    if (!appName.trim() || !price.trim()) return;
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormFeedback({ type: 'error', message: 'Please enter a valid price.' });
      return;
    }
    setFormFeedback(null);
    try {
      await setPriceEntry.mutateAsync({ appName: appName.trim(), pricePerEntry: priceNum, isActive });
      setFormFeedback({ type: 'success', message: `Price entry for "${appName}" saved!` });
      setAppName('');
      setPrice('');
      setIsActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save price entry';
      setFormFeedback({ type: 'error', message: msg });
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deletePriceEntry.mutateAsync(name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      setFormFeedback({ type: 'error', message: msg });
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkText.trim()) return;
    setBulkFeedback(null);
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const entries: PriceEntry[] = [];
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2) continue;
      const priceNum = parseFloat(parts[1]);
      if (isNaN(priceNum)) continue;
      const activeVal = parts[2] ? parts[2].toLowerCase() !== 'false' : true;
      entries.push({ appName: parts[0], pricePerEntry: priceNum, isActive: activeVal });
    }
    if (entries.length === 0) {
      setBulkFeedback({ type: 'error', message: 'No valid entries found. Format: AppName, Price, true/false' });
      return;
    }
    try {
      await bulkSetPrices.mutateAsync(entries);
      setBulkFeedback({ type: 'success', message: `${entries.length} entries processed!` });
      setBulkText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to bulk upload';
      setBulkFeedback({ type: 'error', message: msg });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading price list…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <DollarSign className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">App Price List</h2>
          <p className="text-sm text-muted-foreground">{priceList.length} price entr{priceList.length !== 1 ? 'ies' : 'y'}</p>
        </div>
      </div>

      {/* Add/Edit form */}
      <div className="space-card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Add / Edit Price Entry</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">App Name *</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. TikTok"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Price per Entry (₹) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 5.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Active</span>
        </label>
        <button
          onClick={handleAddEntry}
          disabled={!appName.trim() || !price.trim() || setPriceEntry.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {setPriceEntry.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Save Entry
        </button>
        {formFeedback && (
          <div
            className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
              formFeedback.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {formFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {formFeedback.message}
          </div>
        )}
      </div>

      {/* Price list table */}
      {priceList.length > 0 && (
        <div className="space-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">App</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Price</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {priceList.map((entry) => (
                  <tr key={entry.appName} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2 font-medium">{entry.appName}</td>
                    <td className="px-4 py-2 text-right">₹{entry.pricePerEntry.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          entry.isActive
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {entry.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDelete(entry.appName)}
                        disabled={deletePriceEntry.isPending}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Upload */}
      <div className="space-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Bulk Upload Prices</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          One entry per line. Format: <code className="bg-muted px-1 rounded">AppName, Price, true/false</code>
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={"TikTok, 5.00, true\nInstagram, 3.50, true\nYouTube, 4.00, false"}
          rows={5}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono"
        />
        <button
          onClick={handleBulkUpload}
          disabled={!bulkText.trim() || bulkSetPrices.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {bulkSetPrices.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Bulk Upload
        </button>
        {bulkFeedback && (
          <div
            className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
              bulkFeedback.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {bulkFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {bulkFeedback.message}
          </div>
        )}
      </div>
    </div>
  );
}
