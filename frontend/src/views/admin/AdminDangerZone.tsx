import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { useBulkDeleteLiveLists, useBulkDeleteCommentLists } from '../../hooks/useQueries';
import { toast } from 'sonner';

const ACCESS_KEY = '7898';

type ActionType = 'livelist' | 'commentlists' | null;

interface ConfirmModalProps {
  action: ActionType;
  onConfirm: (key: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ConfirmModal({ action, onConfirm, onCancel, isLoading }: ConfirmModalProps) {
  const [key, setKey] = useState('');
  const [keyError, setKeyError] = useState('');

  const label = action === 'livelist' ? 'Live List' : 'Comments List';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key !== ACCESS_KEY) {
      setKeyError('Incorrect access key. Please try again.');
      return;
    }
    setKeyError('');
    onConfirm(key);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'oklch(0.08 0.02 240 / 0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="space-card p-6 rounded-2xl w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Delete All {label}</h3>
            <p className="text-xs text-muted-foreground">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Enter the access key to confirm deletion of <strong className="text-foreground">all {label.toLowerCase()} entries</strong>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="password"
              value={key}
              onChange={e => { setKey(e.target.value); setKeyError(''); }}
              placeholder="Enter access key"
              className={`w-full px-4 py-2.5 rounded-xl bg-background/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 text-center tracking-widest ${
                keyError ? 'border-destructive' : 'border-border'
              }`}
              autoFocus
              disabled={isLoading}
            />
            {keyError && (
              <p className="text-destructive text-xs mt-1.5">{keyError}</p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !key}
              className="flex-1 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete All
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDangerZone() {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const deleteLiveLists = useBulkDeleteLiveLists();
  const deleteCommentLists = useBulkDeleteCommentLists();

  const isLoading = deleteLiveLists.isPending || deleteCommentLists.isPending;

  const handleConfirm = async (_key: string) => {
    try {
      if (activeAction === 'livelist') {
        await deleteLiveLists.mutateAsync();
        toast.success('All Live List entries deleted successfully.');
      } else if (activeAction === 'commentlists') {
        await deleteCommentLists.mutateAsync();
        toast.success('All Comments List entries deleted successfully.');
      }
    } catch {
      toast.error('Failed to delete. Please try again.');
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
        <div className="flex items-center gap-3 mb-2">
          <ShieldAlert className="w-5 h-5 text-destructive" />
          <h3 className="font-bold text-destructive">Danger Zone</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Actions in this section are <strong className="text-foreground">irreversible</strong>. All data will be permanently deleted. An access key is required to proceed.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Delete Live List */}
        <div className="space-card p-5 rounded-2xl border border-destructive/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Delete All Live List</h4>
              <p className="text-sm text-muted-foreground">
                Permanently removes all app/event entries and their associated usernames from the Live List.
              </p>
            </div>
            <button
              onClick={() => setActiveAction('livelist')}
              disabled={isLoading}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
          </div>
        </div>

        {/* Delete Comments List */}
        <div className="space-card p-5 rounded-2xl border border-destructive/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Delete All Comments List</h4>
              <p className="text-sm text-muted-foreground">
                Permanently removes all comment lists and their templates from the system.
              </p>
            </div>
            <button
              onClick={() => setActiveAction('commentlists')}
              disabled={isLoading}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {activeAction && (
        <ConfirmModal
          action={activeAction}
          onConfirm={handleConfirm}
          onCancel={() => setActiveAction(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
