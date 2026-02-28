import { useState, useRef } from "react";
import {
  useAppsEvents,
  useAddAppEvent,
  useAddUsernamesToAppEvent,
  useRenameAppEvent,
  useDeleteAppEvent,
} from "@/hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import type { AppEvent } from "@/backend";

export default function AdminLiveList() {
  const { data: appsEvents, isLoading } = useAppsEvents();
  const addAppEventMutation = useAddAppEvent();
  const addUsernamesMutation = useAddUsernamesToAppEvent();
  const renameMutation = useRenameAppEvent();
  const deleteMutation = useDeleteAppEvent();

  // New app/event form
  const [newAppName, setNewAppName] = useState("");

  // Add usernames form
  const [selectedAppForAdd, setSelectedAppForAdd] = useState<string>("");
  const [usernamesText, setUsernamesText] = useState("");

  // Inline rename state
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Bulk upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Username checker
  const [checkerUsername, setCheckerUsername] = useState("");
  const [selectedAppsForCheck, setSelectedAppsForCheck] = useState<Set<string>>(new Set());
  const [checkResults, setCheckResults] = useState<{
    foundIn: string[];
    notFoundIn: string[];
  } | null>(null);

  function handleAddApp() {
    const name = newAppName.trim();
    if (!name) return;
    addAppEventMutation.mutate(name, {
      onSuccess: () => setNewAppName(""),
    });
  }

  function handleAddUsernames() {
    if (!selectedAppForAdd || !usernamesText.trim()) return;
    const usernames = usernamesText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (usernames.length === 0) return;
    addUsernamesMutation.mutate(
      { name: selectedAppForAdd, usernames },
      { onSuccess: () => setUsernamesText("") }
    );
  }

  function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedAppForAdd) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const usernames = text
        .split(/[\n,]/)
        .map((u) => u.trim())
        .filter(Boolean);
      if (usernames.length === 0) return;
      addUsernamesMutation.mutate({ name: selectedAppForAdd, usernames });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function startEdit(app: AppEvent) {
    setEditingApp(app.name);
    setEditName(app.name);
  }

  function handleRename(oldName: string) {
    const newName = editName.trim();
    if (!newName || newName === oldName) {
      setEditingApp(null);
      return;
    }
    renameMutation.mutate(
      { id: oldName, newName },
      {
        onSuccess: () => {
          setEditingApp(null);
          if (selectedAppForAdd === oldName) setSelectedAppForAdd(newName);
          if (selectedAppsForCheck.has(oldName)) {
            setSelectedAppsForCheck((prev) => {
              const next = new Set(prev);
              next.delete(oldName);
              next.add(newName);
              return next;
            });
          }
        },
      }
    );
  }

  function handleDelete(name: string) {
    deleteMutation.mutate(name, {
      onSuccess: () => {
        if (selectedAppForAdd === name) setSelectedAppForAdd("");
        setSelectedAppsForCheck((prev) => {
          const next = new Set(prev);
          next.delete(name);
          return next;
        });
      },
    });
  }

  function toggleAppForCheck(name: string) {
    setSelectedAppsForCheck((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setCheckResults(null);
  }

  function handleCheck() {
    const username = checkerUsername.trim().toLowerCase();
    if (!username || selectedAppsForCheck.size === 0) return;
    const foundIn: string[] = [];
    const notFoundIn: string[] = [];
    (appsEvents ?? []).forEach((app) => {
      if (!selectedAppsForCheck.has(app.name)) return;
      const found = app.usernames.some((u) => u.toLowerCase() === username);
      if (found) foundIn.push(app.name);
      else notFoundIn.push(app.name);
    });
    setCheckResults({ foundIn, notFoundIn });
  }

  function selectAllApps() {
    setSelectedAppsForCheck(new Set((appsEvents ?? []).map((a) => a.name)));
    setCheckResults(null);
  }

  function clearAllApps() {
    setSelectedAppsForCheck(new Set());
    setCheckResults(null);
  }

  return (
    <div className="space-y-6">
      {/* Apps/Events Table */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Apps / Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new app */}
          <div className="flex gap-2">
            <Input
              placeholder="New app/event name…"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddApp()}
              className="flex-1"
            />
            <Button
              onClick={handleAddApp}
              disabled={!newAppName.trim() || addAppEventMutation.isPending}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (appsEvents ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              No apps/events yet. Add one above.
            </p>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Usernames</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(appsEvents ?? []).map((app) => (
                    <TableRow key={app.name}>
                      <TableCell>
                        {editingApp === app.name ? (
                          <div className="flex gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename(app.name);
                                if (e.key === "Escape") setEditingApp(null);
                              }}
                              className="h-7 text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleRename(app.name)}
                              disabled={renameMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditingApp(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span className="font-medium text-sm">{app.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {app.usernames.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => startEdit(app)}
                            disabled={editingApp !== null}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{app.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this app/event and all{" "}
                                  {app.usernames.length} username(s) associated with it.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(app.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Usernames Section */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" />
            Add Usernames
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select app */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Select App / Event</label>
            {isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (appsEvents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No apps/events available.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(appsEvents ?? []).map((app) => (
                  <button
                    key={app.name}
                    onClick={() => setSelectedAppForAdd(app.name)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedAppForAdd === app.name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-accent"
                    }`}
                  >
                    {app.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Usernames (one per line)</label>
            <Textarea
              placeholder={"username1\nusername2\nusername3"}
              value={usernamesText}
              onChange={(e) => setUsernamesText(e.target.value)}
              rows={6}
              className="font-mono text-sm"
              disabled={!selectedAppForAdd}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAddUsernames}
              disabled={
                !selectedAppForAdd ||
                !usernamesText.trim() ||
                addUsernamesMutation.isPending
              }
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {addUsernamesMutation.isPending ? "Adding…" : "Add Usernames"}
            </Button>

            {/* Bulk upload */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedAppForAdd || addUsernamesMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload (.txt / .csv)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              className="hidden"
              onChange={handleBulkUpload}
            />
          </div>

          {addUsernamesMutation.isSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Usernames added successfully.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Username Checker Section */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" />
            Username Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Username to check</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter username…"
                value={checkerUsername}
                onChange={(e) => {
                  setCheckerUsername(e.target.value);
                  setCheckResults(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                className="flex-1"
              />
              <Button
                onClick={handleCheck}
                disabled={!checkerUsername.trim() || selectedAppsForCheck.size === 0}
                size="sm"
              >
                <Search className="h-4 w-4 mr-1" />
                Check
              </Button>
            </div>
          </div>

          {/* Multi-select apps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Select apps/events to search</label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllApps}
                  className="text-xs text-primary hover:underline"
                >
                  Select all
                </button>
                <span className="text-xs text-muted-foreground">·</span>
                <button
                  onClick={clearAllApps}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (appsEvents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No apps/events available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(appsEvents ?? []).map((app) => (
                  <label
                    key={app.name}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      checked={selectedAppsForCheck.has(app.name)}
                      onCheckedChange={() => toggleAppForCheck(app.name)}
                    />
                    <span className="text-sm flex-1">{app.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {app.usernames.length}
                    </Badge>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          {checkResults && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {/* Found in */}
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Found in ({checkResults.foundIn.length})
                  </span>
                </div>
                {checkResults.foundIn.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Not found in any selected app.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {checkResults.foundIn.map((name) => (
                      <li key={name} className="text-sm text-green-700 dark:text-green-400 font-medium">
                        ✓ {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Not found in */}
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">
                    Not found in ({checkResults.notFoundIn.length})
                  </span>
                </div>
                {checkResults.notFoundIn.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Found in all selected apps.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {checkResults.notFoundIn.map((name) => (
                      <li key={name} className="text-sm text-destructive font-medium">
                        ✗ {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
