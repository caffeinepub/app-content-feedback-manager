import { DollarSign, Edit2, Plus, Save, Trash2, Upload, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { PriceEntry } from "../../backend";
import {
  useAddPriceEntry,
  useBulkUploadPrices,
  useDeletePriceEntry,
  useEditPriceEntry,
  useGetPriceList,
} from "../../hooks/useQueries";

export default function AdminPricing() {
  const { data: priceList = [], isLoading } = useGetPriceList();
  const addPriceEntry = useAddPriceEntry();
  const editPriceEntry = useEditPriceEntry();
  const deletePriceEntry = useDeletePriceEntry();
  const bulkUploadPrices = useBulkUploadPrices();

  const [appName, setAppName] = useState("");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [bulkText, setBulkText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!appName.trim() || !price) return;
    const priceNum = Number.parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Invalid price value");
      return;
    }
    try {
      await addPriceEntry.mutateAsync({
        appName: appName.trim(),
        pricePerEntry: priceNum,
        isActive,
      });
      setAppName("");
      setPrice("");
      setIsActive(true);
      setSuccess("Price entry added");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to add price entry",
      );
    }
  };

  const handleEdit = async (entry: PriceEntry) => {
    setError(null);
    const priceNum = Number.parseFloat(editPrice);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Invalid price value");
      return;
    }
    try {
      await editPriceEntry.mutateAsync({
        appName: entry.appName,
        pricePerEntry: priceNum,
        isActive: editActive,
      });
      setEditingApp(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update price entry",
      );
    }
  };

  const handleDelete = async (name: string) => {
    setError(null);
    if (!confirm(`Delete price entry for "${name}"?`)) return;
    try {
      await deletePriceEntry.mutateAsync(name);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete price entry",
      );
    }
  };

  const handleBulkUpload = async () => {
    setError(null);
    setSuccess(null);
    if (!bulkText.trim()) return;

    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const entries: PriceEntry[] = [];

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 2) {
        setError(
          `Invalid line format: "${line}". Expected: AppName, Price, [Active]`,
        );
        return;
      }
      const name = parts[0];
      const priceVal = Number.parseFloat(parts[1]);
      const activeVal = parts[2] ? parts[2].toLowerCase() !== "false" : true;
      if (!name || Number.isNaN(priceVal)) {
        setError(`Invalid data in line: "${line}"`);
        return;
      }
      entries.push({
        appName: name,
        pricePerEntry: priceVal,
        isActive: activeVal,
      });
    }

    try {
      await bulkUploadPrices.mutateAsync(entries);
      setBulkText("");
      setSuccess(`${entries.length} price entries uploaded`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to bulk upload prices",
      );
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
      {success && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-rajdhani animate-fadeIn"
          style={{
            background: "oklch(0.65 0.18 145 / 0.12)",
            border: "1px solid oklch(0.65 0.18 145 / 0.3)",
            color: "oklch(0.72 0.20 145)",
          }}
        >
          {success}
        </div>
      )}

      {/* Add Price Entry */}
      <div className="glass-card-gold p-5 rounded-2xl">
        <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 gradient-heading flex items-center gap-2">
          <Plus className="w-4 h-4" style={{ color: "oklch(0.82 0.20 70)" }} />
          Add Price Entry
        </h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="App name"
            className="glass-input w-full px-3 py-2.5 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price per entry"
              step="0.01"
              min="0"
              className="glass-input flex-1 px-3 py-2.5 text-sm"
            />
            <label
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-rajdhani cursor-pointer transition-all duration-200"
              style={{
                background: isActive
                  ? "oklch(0.65 0.18 145 / 0.15)"
                  : "oklch(0.14 0.03 260 / 0.6)",
                border: `1px solid ${isActive ? "oklch(0.65 0.18 145 / 0.3)" : "oklch(0.28 0.06 260 / 0.4)"}`,
                color: isActive
                  ? "oklch(0.72 0.20 145)"
                  : "oklch(0.55 0.04 260)",
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="hidden"
              />
              {isActive ? "✓ Active" : "Inactive"}
            </label>
          </div>
          <button
            type="submit"
            disabled={addPriceEntry.isPending || !appName.trim() || !price}
            className="px-4 py-2.5 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center gap-2"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
              color: "oklch(0.08 0.02 260)",
              opacity:
                addPriceEntry.isPending || !appName.trim() || !price ? 0.5 : 1,
            }}
          >
            {addPriceEntry.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add Entry
          </button>
        </form>
      </div>

      {/* Price List */}
      <div className="glass-card p-5 rounded-2xl">
        <h3
          className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"
          style={{ color: "oklch(0.78 0.22 188)" }}
        >
          <DollarSign className="w-4 h-4" />
          Price List ({priceList.length})
        </h3>
        {isLoading ? (
          <div
            className="text-center py-4 font-rajdhani text-sm"
            style={{ color: "oklch(0.50 0.04 260)" }}
          >
            Loading...
          </div>
        ) : priceList.length === 0 ? (
          <div
            className="text-center py-4 font-rajdhani text-sm"
            style={{ color: "oklch(0.45 0.04 260)" }}
          >
            No price entries yet
          </div>
        ) : (
          <div className="space-y-2">
            {priceList.map((entry: PriceEntry) => (
              <div
                key={entry.appName}
                className="rounded-xl p-3 flex items-center gap-2"
                style={{
                  background: "oklch(0.10 0.025 260 / 0.6)",
                  border: "1px solid oklch(0.22 0.05 260 / 0.5)",
                }}
              >
                {editingApp === entry.appName ? (
                  <>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        step="0.01"
                        min="0"
                        className="glass-input flex-1 px-2 py-1 text-sm"
                      />
                      <label
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-rajdhani cursor-pointer"
                        style={{
                          background: editActive
                            ? "oklch(0.65 0.18 145 / 0.15)"
                            : "oklch(0.14 0.03 260 / 0.6)",
                          border: `1px solid ${editActive ? "oklch(0.65 0.18 145 / 0.3)" : "oklch(0.28 0.06 260 / 0.4)"}`,
                          color: editActive
                            ? "oklch(0.72 0.20 145)"
                            : "oklch(0.55 0.04 260)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={(e) => setEditActive(e.target.checked)}
                          className="hidden"
                        />
                        {editActive ? "✓" : "✗"}
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEdit(entry)}
                      disabled={editPriceEntry.isPending}
                      className="p-1.5 rounded-lg"
                      style={{
                        background: "oklch(0.65 0.18 145 / 0.2)",
                        color: "oklch(0.72 0.20 145)",
                      }}
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingApp(null)}
                      className="p-1.5 rounded-lg"
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
                        {entry.appName}
                      </div>
                      <div
                        className="text-xs font-rajdhani"
                        style={{ color: "oklch(0.50 0.04 260)" }}
                      >
                        ₹{entry.pricePerEntry.toFixed(2)} per entry
                        <span
                          className="ml-2 px-1.5 py-0.5 rounded-full text-xs"
                          style={{
                            background: entry.isActive
                              ? "oklch(0.65 0.18 145 / 0.12)"
                              : "oklch(0.55 0.22 25 / 0.12)",
                            color: entry.isActive
                              ? "oklch(0.72 0.20 145)"
                              : "oklch(0.65 0.22 25)",
                          }}
                        >
                          {entry.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingApp(entry.appName);
                        setEditPrice(String(entry.pricePerEntry));
                        setEditActive(entry.isActive);
                      }}
                      className="p-1.5 rounded-lg"
                      style={{
                        background: "oklch(0.70 0.20 185 / 0.12)",
                        color: "oklch(0.78 0.22 188)",
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.appName)}
                      disabled={deletePriceEntry.isPending}
                      className="p-1.5 rounded-lg"
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
            ))}
          </div>
        )}
      </div>

      {/* Bulk Upload */}
      <div className="glass-card p-5 rounded-2xl">
        <h3
          className="font-orbitron font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"
          style={{ color: "oklch(0.78 0.22 188)" }}
        >
          <Upload className="w-4 h-4" />
          Bulk Upload Prices
        </h3>
        <p
          className="text-xs font-rajdhani mb-3"
          style={{ color: "oklch(0.50 0.04 260)" }}
        >
          Format: AppName, Price, [true/false] — one per line
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="AppName1, 10.00, true&#10;AppName2, 5.50, false"
          rows={5}
          className="glass-input w-full px-3 py-2.5 text-sm resize-none mb-3"
        />
        <button
          type="button"
          onClick={handleBulkUpload}
          disabled={bulkUploadPrices.isPending || !bulkText.trim()}
          className="px-4 py-2.5 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center gap-2"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.70 0.20 185), oklch(0.75 0.18 65))",
            color: "oklch(0.08 0.02 260)",
            opacity: bulkUploadPrices.isPending || !bulkText.trim() ? 0.5 : 1,
          }}
        >
          {bulkUploadPrices.isPending ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Bulk Upload
        </button>
      </div>
    </div>
  );
}
