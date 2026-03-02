import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowDown, ArrowUp, Plus, Trash2, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Drama, Episode } from "../backend.d";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { useActor } from "../hooks/useActor";

interface EpisodeFormData {
  partNumber: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  duration: string;
  isPremium: boolean;
  coinsRequired: string;
}

const defaultForm: EpisodeFormData = {
  partNumber: "1",
  title: "",
  videoUrl: "",
  thumbnail: "",
  duration: "0",
  isPremium: false,
  coinsRequired: "0",
};

export function Episodes() {
  const { actor, isFetching } = useActor();
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [selectedDramaId, setSelectedDramaId] = useState<string>("");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Episode | null>(null);
  const [form, setForm] = useState<EpisodeFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isFetching && actor) {
      actor
        .getDramas()
        .then(setDramas)
        .catch(() => toast.error("Failed to load dramas"));
    }
  }, [actor, isFetching]);

  const loadEpisodes = async (dramaId: string) => {
    if (!dramaId || !actor) return;
    setIsLoading(true);
    setError(null);
    try {
      const eps = await actor.getEpisodesByDrama(dramaId);
      setEpisodes(eps.sort((a, b) => Number(a.order) - Number(b.order)));
    } catch {
      setError("Failed to load episodes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDramaChange = (id: string) => {
    setSelectedDramaId(id);
    loadEpisodes(id);
  };

  const handleSave = async () => {
    if (!actor) return;
    if (!form.title.trim()) {
      toast.error("Title required");
      return;
    }
    if (!selectedDramaId) {
      toast.error("Select a drama first");
      return;
    }
    setSaving(true);
    try {
      await actor.createEpisode(
        selectedDramaId,
        crypto.randomUUID(),
        BigInt(Number.parseInt(form.partNumber) || 1),
        form.title,
        form.videoUrl,
        form.thumbnail,
        BigInt(Number.parseInt(form.duration) || 0),
        form.isPremium,
        BigInt(Math.max(0, Number.parseInt(form.coinsRequired) || 0)),
      );
      toast.success("Episode created");
      setModalOpen(false);
      setForm(defaultForm);
      await loadEpisodes(selectedDramaId);
    } catch {
      toast.error("Failed to save episode");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actor || !deleteTarget) return;
    try {
      await actor.deleteEpisode(deleteTarget.id);
      toast.success("Episode deleted");
      setDeleteTarget(null);
      await loadEpisodes(selectedDramaId);
    } catch {
      toast.error("Failed to delete episode");
    }
  };

  const handleReorder = async (episode: Episode, direction: "up" | "down") => {
    if (!actor) return;
    const sorted = [...episodes].sort(
      (a, b) => Number(a.order) - Number(b.order),
    );
    const idx = sorted.findIndex((e) => e.id === episode.id);
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sorted.length) return;

    const newOrder = Number(sorted[newIdx].order);
    try {
      await actor.reorderEpisode(episode.id, BigInt(newOrder));
      await loadEpisodes(selectedDramaId);
    } catch {
      toast.error("Failed to reorder episode");
    }
  };

  const formatDuration = (secs: bigint) => {
    const s = Number(secs);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  if (error)
    return (
      <ErrorState
        message={error}
        onRetry={() => loadEpisodes(selectedDramaId)}
      />
    );

  const columns = [
    {
      header: "Part #",
      cell: (row: Episode) => (
        <span className="tabular-nums font-semibold text-sm">
          #{Number(row.partNumber)}
        </span>
      ),
    },
    {
      header: "Title",
      cell: (row: Episode) => (
        <div>
          <div className="font-medium text-sm">{row.title}</div>
          {row.isPremium && (
            <span className="text-xs badge-vip px-1.5 py-0.5 rounded-full">
              Premium
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Thumbnail",
      cell: (row: Episode) => (
        <div
          className="w-[50px] h-[32px] rounded overflow-hidden"
          style={{ background: "oklch(0.2 0.016 285)" }}
        >
          {row.thumbnail ? (
            <img
              src={row.thumbnail}
              alt={row.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Duration",
      cell: (row: Episode) => (
        <span className="tabular-nums text-sm text-muted-foreground">
          {formatDuration(row.duration)}
        </span>
      ),
    },
    {
      header: "Coins",
      cell: (row: Episode) => (
        <span
          className="tabular-nums text-sm"
          style={{ color: "oklch(0.88 0.18 86)" }}
        >
          {row.isPremium ? `🪙 ${Number(row.coinsRequired)}` : "Free"}
        </span>
      ),
    },
    {
      header: "Views",
      cell: (row: Episode) => (
        <span className="tabular-nums text-sm">
          {Number(row.views).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Order",
      cell: (row: Episode) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleReorder(row, "up")}
          >
            <ArrowUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleReorder(row, "down")}
          >
            <ArrowDown className="w-3 h-3" />
          </Button>
        </div>
      ),
    },
    {
      header: "Actions",
      cell: (row: Episode) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:text-destructive"
          onClick={() => setDeleteTarget(row)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Episodes Manager"
        subtitle="Manage drama episodes and parts"
        action={
          selectedDramaId ? (
            <Button
              onClick={() => setModalOpen(true)}
              style={{ background: "oklch(0.58 0.24 340)", color: "white" }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Episode
            </Button>
          ) : undefined
        }
      />

      {/* Drama selector */}
      <div className="card-surface rounded-xl p-5 mb-4">
        <Label className="text-sm font-medium mb-2 block">Select Drama</Label>
        <Select value={selectedDramaId} onValueChange={handleDramaChange}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Choose a drama to manage episodes..." />
          </SelectTrigger>
          <SelectContent>
            {dramas.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedDramaId && (
        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold">
              {episodes.length} episode{episodes.length !== 1 ? "s" : ""}
            </h3>
          </div>
          <DataTable
            columns={columns}
            data={episodes}
            isLoading={isLoading}
            emptyMessage="No episodes for this drama yet"
          />
        </div>
      )}

      {!selectedDramaId && (
        <div className="card-surface rounded-xl p-16 flex flex-col items-center justify-center text-center">
          <Video className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Select a drama above to manage its episodes
          </p>
        </div>
      )}

      {/* Add Episode Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-lg"
          style={{
            background: "oklch(0.13 0.014 285)",
            border: "1px solid oklch(0.22 0.018 285)",
          }}
        >
          <DialogHeader>
            <DialogTitle>Add Episode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Part Number</Label>
                <Input
                  type="number"
                  value={form.partNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, partNumber: e.target.value }))
                  }
                  min="1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration: e.target.value }))
                  }
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Episode title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Video URL</Label>
              <Input
                value={form.videoUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, videoUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Thumbnail URL</Label>
              <Input
                value={form.thumbnail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, thumbnail: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isPremium}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isPremium: v }))
                  }
                />
                <Label>Premium</Label>
              </div>
              {form.isPremium && (
                <div className="flex items-center gap-2">
                  <Label>Coins</Label>
                  <Input
                    type="number"
                    value={form.coinsRequired}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, coinsRequired: e.target.value }))
                    }
                    className="w-20"
                    min="0"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ background: "oklch(0.58 0.24 340)", color: "white" }}
            >
              {saving ? "Saving..." : "Add Episode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent
          style={{
            background: "oklch(0.13 0.014 285)",
            border: "1px solid oklch(0.22 0.018 285)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteTarget?.title}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
