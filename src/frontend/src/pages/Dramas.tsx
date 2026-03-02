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
import { Textarea } from "@/components/ui/textarea";
import { Archive, Film, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Status } from "../backend.d";
import type { Category, Creator, Drama } from "../backend.d";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { useActor } from "../hooks/useActor";

const STATUS_LABELS: Record<Status, { label: string; className: string }> = {
  [Status.active]: { label: "Active", className: "badge-active" },
  [Status.draft]: { label: "Draft", className: "badge-draft" },
  [Status.archived]: { label: "Archived", className: "badge-archived" },
};

interface DramaFormData {
  title: string;
  description: string;
  thumbnail: string;
  categoryId: string;
  creatorId: string;
  tags: string;
  isPremium: boolean;
  coinsRequired: string;
}

const defaultForm: DramaFormData = {
  title: "",
  description: "",
  thumbnail: "",
  categoryId: "",
  creatorId: "",
  tags: "",
  isPremium: false,
  coinsRequired: "0",
};

export function Dramas() {
  const { actor, isFetching } = useActor();
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDrama, setEditingDrama] = useState<Drama | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Drama | null>(null);
  const [form, setForm] = useState<DramaFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!actor) return;
    setIsLoading(true);
    setError(null);
    try {
      const [d, c, cr] = await Promise.all([
        actor.getDramas(),
        actor.getCategories(),
        actor.getCreators(),
      ]);
      setDramas(d);
      setCategories(c);
      setCreators(cr);
    } catch {
      setError("Failed to load dramas");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within actor/isFetching context
  useEffect(() => {
    if (!isFetching && actor) load();
  }, [actor, isFetching]);

  const openAdd = () => {
    setEditingDrama(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (drama: Drama) => {
    setEditingDrama(drama);
    setForm({
      title: drama.title,
      description: drama.description,
      thumbnail: drama.thumbnail,
      categoryId: drama.categoryId,
      creatorId: drama.creatorId,
      tags: drama.tags.join(", "),
      isPremium: drama.isPremium,
      coinsRequired: String(Number(drama.coinsRequired)),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!actor) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const coinsRequired = BigInt(
        Math.max(0, Number.parseInt(form.coinsRequired) || 0),
      );

      if (editingDrama) {
        await actor.updateDrama(editingDrama.id, {
          ...editingDrama,
          title: form.title,
          description: form.description,
          thumbnail: form.thumbnail,
          categoryId: form.categoryId,
          creatorId: form.creatorId,
          tags,
          isPremium: form.isPremium,
          coinsRequired,
          updatedAt: BigInt(Date.now() * 1_000_000),
        });
        toast.success("Drama updated");
      } else {
        await actor.createDrama(
          crypto.randomUUID(),
          form.title,
          form.description,
          form.thumbnail,
          form.categoryId,
          form.creatorId,
          tags,
          form.isPremium,
          coinsRequired,
        );
        toast.success("Drama created");
      }
      setModalOpen(false);
      await load();
    } catch {
      toast.error("Failed to save drama");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actor || !deleteTarget) return;
    try {
      await actor.deleteDrama(deleteTarget.id);
      toast.success("Drama deleted");
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error("Failed to delete drama");
    }
  };

  const handleArchive = async (drama: Drama) => {
    if (!actor) return;
    try {
      await actor.setDramaStatus(drama.id, Status.archived);
      toast.success("Drama archived");
      await load();
    } catch {
      toast.error("Failed to archive drama");
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;
  const getCreatorName = (id: string) =>
    creators.find((c) => c.id === id)?.name ?? id;

  const showLoading = isLoading || isFetching;

  const columns = [
    {
      header: "Thumbnail",
      cell: (row: Drama) => (
        <div
          className="w-[60px] h-[40px] rounded overflow-hidden flex-shrink-0"
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
              <Film className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Title",
      cell: (row: Drama) => (
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
      header: "Category",
      cell: (row: Drama) => (
        <span className="text-xs text-muted-foreground">
          {getCategoryName(row.categoryId)}
        </span>
      ),
    },
    {
      header: "Creator",
      cell: (row: Drama) => (
        <span className="text-xs text-muted-foreground">
          {getCreatorName(row.creatorId)}
        </span>
      ),
    },
    {
      header: "Parts",
      cell: (row: Drama) => (
        <span className="tabular-nums text-sm">{Number(row.totalParts)}</span>
      ),
    },
    {
      header: "Views",
      cell: (row: Drama) => (
        <span className="tabular-nums text-sm">
          {Number(row.views).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row: Drama) => {
        const s = STATUS_LABELS[row.status] ?? STATUS_LABELS[Status.draft];
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}
          >
            {s.label}
          </span>
        );
      },
    },
    {
      header: "Actions",
      cell: (row: Drama) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:text-yellow-400"
            onClick={(e) => {
              e.stopPropagation();
              handleArchive(row);
            }}
            title="Archive"
          >
            <Archive className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dramas Management"
        subtitle={`${dramas.length} dramas total`}
        action={
          <Button
            onClick={openAdd}
            style={{ background: "oklch(0.58 0.24 340)", color: "white" }}
            className="hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Drama
          </Button>
        }
      />

      <div className="card-surface rounded-xl p-5">
        <DataTable
          columns={columns}
          data={dramas}
          isLoading={showLoading}
          emptyMessage="No dramas yet"
        />
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-lg"
          style={{
            background: "oklch(0.13 0.014 285)",
            border: "1px solid oklch(0.22 0.018 285)",
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingDrama ? "Edit Drama" : "Add Drama"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Drama title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Drama description"
                rows={3}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, categoryId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Creator</Label>
                <Select
                  value={form.creatorId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, creatorId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select creator" />
                  </SelectTrigger>
                  <SelectContent>
                    {creators.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="romance, drama, thriller"
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
                <Label>Premium Content</Label>
              </div>
              {form.isPremium && (
                <div className="flex items-center gap-2">
                  <Label>Coins Required</Label>
                  <Input
                    type="number"
                    value={form.coinsRequired}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, coinsRequired: e.target.value }))
                    }
                    className="w-24"
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
              {saving ? "Saving..." : "Save"}
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
            <AlertDialogTitle>Delete Drama</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
