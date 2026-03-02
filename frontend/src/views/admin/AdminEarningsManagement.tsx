import React, { useState } from 'react';
import { PlusCircle, Edit2, Users, Loader2, CheckCircle } from 'lucide-react';
import { useGetAllEarnings, useAddOrUpdateEarning } from '../../hooks/useQueries';
import type { Earning } from '../../backend';
import { toast } from 'sonner';

export default function AdminEarningsManagement() {
  const { data: earnings = [], isLoading } = useGetAllEarnings();
  const addOrUpdate = useAddOrUpdateEarning();

  const [formUsername, setFormUsername] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [editingUsername, setEditingUsername] = useState<string | null>(null);

  const handleRowClick = (earning: Earning) => {
    setEditingUsername(earning.username);
    setFormUsername(earning.username);
    setFormAmount(String(Number(earning.totalAmount)));
  };

  const handleClear = () => {
    setEditingUsername(null);
    setFormUsername('');
    setFormAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = formUsername.trim();
    const amount = parseInt(formAmount, 10);

    if (!trimmedUsername) {
      toast.error('Username is required.');
      return;
    }
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    try {
      await addOrUpdate.mutateAsync({ username: trimmedUsername, totalAmount: BigInt(amount) });
      toast.success(editingUsername ? 'Earnings updated!' : 'Earnings record added!');
      handleClear();
    } catch {
      toast.error('Failed to save earnings record.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          {editingUsername ? (
            <>
              <Edit2 className="w-4 h-4 text-primary" />
              Edit Earnings — {editingUsername}
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4 text-primary" />
              Add / Update Earnings
            </>
          )}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Username</label>
            <input
              type="text"
              value={formUsername}
              onChange={e => setFormUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              disabled={addOrUpdate.isPending || !!editingUsername}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Total Amount (₹)</label>
            <input
              type="number"
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
              placeholder="Enter amount"
              min={0}
              className="w-full px-3 py-2.5 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              disabled={addOrUpdate.isPending}
            />
          </div>

          <div className="flex gap-2 pt-1">
            {editingUsername && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-sm font-medium transition-colors"
                disabled={addOrUpdate.isPending}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={addOrUpdate.isPending || !formUsername.trim() || !formAmount}
              className="flex-1 gradient-button py-2 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {addOrUpdate.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {editingUsername ? 'Update Earnings' : 'Save Earnings'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Earnings Table */}
      <div className="space-card p-5 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          All Earnings Records
          <span className="ml-auto text-xs text-muted-foreground font-normal">Click a row to edit</span>
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading earnings...
          </div>
        ) : earnings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No earnings records yet. Add one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs text-muted-foreground pb-2 font-medium">Username</th>
                  <th className="text-right text-xs text-muted-foreground pb-2 font-medium">Total (₹)</th>
                  <th className="text-right text-xs text-muted-foreground pb-2 font-medium">Wallet Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {earnings.map(e => (
                  <tr
                    key={e.username}
                    onClick={() => handleRowClick(e)}
                    className={`cursor-pointer transition-colors hover:bg-primary/5 ${
                      editingUsername === e.username ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="py-2.5 text-foreground font-medium">{e.username}</td>
                    <td className="py-2.5 text-right text-primary font-semibold">
                      ₹{Number(e.totalAmount).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground font-mono text-xs">
                      {e.walletPhone ?? <span className="italic">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
