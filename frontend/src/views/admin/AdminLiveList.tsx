import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useAppsEvents,
  useAddAppEvent,
  useAddUsernamesToAppEvent,
  useRenameAppEvent,
  useDeleteAppEvent,
} from "../../hooks/useQueries";
import { toast } from "sonner";
import { Plus, Users, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

export default function AdminLiveList() {
  const { data: appsEvents, isLoading } = useAppsEvents();
  const addAppEvent = useAddAppEvent();
  const addUsernames = useAddUsernamesToAppEvent();
  const renameAppEvent = useRenameAppEvent();
  const deleteAppEvent = useDeleteAppEvent();

  const [newAppName, setNewAppName] = useState("");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [usernamesInput, setUsernamesInput] = useState("");

  // Edit state: maps app name -> editing name
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAddApp = async () => {
    if (!newAppName.trim()) return;
    try {
      await addAppEvent.mutateAsync(newAppName.trim());
      toast.success(`App "${newAppName.trim()}" added`);
      setNewAppName("");
    } catch {
      toast.error("Failed to add app");
    }
  };

  const handleAddUsernames = async () => {
    if (!selectedApp || !usernamesInput.trim()) return;
    const usernames = usernamesInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (usernames.length === 0) return;
    try {
      await addUsernames.mutateAsync({ name: selectedApp, usernames });
      toast.success(`Added ${usernames.length} username(s) to "${selectedApp}"`);
      setUsernamesInput("");
    } catch {
      toast.error("Failed to add usernames");
    }
  };

  const handleStartEdit = (appName: string) => {
    setEditingApp(appName);
    setEditName(appName);
  };

  const handleCancelEdit = () => {
    setEditingApp(null);
    setEditName("");
  };

  const handleSaveEdit = async (oldName: string) => {
    if (!editName.trim() || editName.trim() === oldName) {
      handleCancelEdit();
      return;
    }
    try {
      await renameAppEvent.mutateAsync({ id: oldName, newName: editName.trim() });
      toast.success(`Renamed to "${editName.trim()}"`);
      if (selectedApp === oldName) setSelectedApp(editName.trim());
      setEditingApp(null);
      setEditName("");
    } catch {
      toast.error("Failed to rename app");
    }
  };

  const handleDelete = async (appName: string) => {
    try {
      await deleteAppEvent.mutateAsync(appName);
      toast.success(`"${appName}" deleted`);
      if (selectedApp === appName) setSelectedApp(null);
    } catch {
      toast.error("Failed to delete app");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="text-lg font-semibold text-foreground">Live List Manager</h3>

      {/* Add New App */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <Label>Add New App / Event</Label>
        <div className="flex gap-2">
          <Input
            placeholder="App or event name…"
            value={newAppName}
            onChange={(e) => setNewAppName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddApp()}
          />
          <Button
            onClick={handleAddApp}
            disabled={addAppEvent.isPending || !newAppName.trim()}
          >
            {addAppEvent.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="ml-1.5">Add</span>
          </Button>
        </div>
      </div>

      {/* Apps List */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <Label>Apps / Events</Label>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : appsEvents && appsEvents.length > 0 ? (
          <div className="space-y-2">
            {appsEvents.map((app) => (
              <div
                key={app.name}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedApp === app.name
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted/30 border-transparent hover:bg-muted/50"
                }`}
                onClick={() => {
                  if (editingApp !== app.name) {
                    setSelectedApp(selectedApp === app.name ? null : app.name);
                  }
                }}
              >
                {editingApp === app.name ? (
                  // Inline edit mode
                  <div
                    className="flex items-center gap-2 flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(app.name);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600 hover:text-green-700"
                      onClick={() => handleSaveEdit(app.name)}
                      disabled={renameAppEvent.isPending}
                    >
                      {renameAppEvent.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{app.name}</p>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                      <Users className="w-3 h-3" />
                      {app.usernames.length}
                    </Badge>
                    {/* Edit Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(app.name);
                      }}
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{app.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete the app/event and all associated usernames. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(app.name)}
                          >
                            {deleteAppEvent.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : null}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No apps or events added yet
          </p>
        )}
      </div>

      {/* Add Usernames to Selected App */}
      {selectedApp && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <Label>
            Add Usernames to{" "}
            <span className="text-primary font-semibold">{selectedApp}</span>
          </Label>
          <textarea
            className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="Enter usernames separated by commas or new lines…"
            value={usernamesInput}
            onChange={(e) => setUsernamesInput(e.target.value)}
          />
          <Button
            onClick={handleAddUsernames}
            disabled={addUsernames.isPending || !usernamesInput.trim()}
          >
            {addUsernames.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Usernames
          </Button>
        </div>
      )}
    </div>
  );
}
