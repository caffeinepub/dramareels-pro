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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category } from "../backend.d";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { useActor } from "../hooks/useActor";

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  order: string;
}

const defaultForm: CategoryFormData = {
  name: "",
  icon: "🎬",
  color: "#E91E8C",
  order: "0",
};

export function Categories() {
  const { actor, isFetching } = useActor();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!actor) return;
    setIsLoading(true);
    setError(null);
    try {
      const cats = await actor.getCategories();
      setCategories(cats.sort((a, b) => Number(a.order) - Number(b.order)));
    } catch {
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within actor/isFetching context
  useEffect(() => {
    if (!isFetching && actor) load();
  }, [actor, isFetching]);

  const openAdd = () => {
    setEditingCat(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setForm({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      order: String(Number(cat.order)),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!actor) return;
    if (!form.name.trim()) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    try {
      if (editingCat) {
        await actor.updateCategory(editingCat.id, {
          ...editingCat,
          name: form.name,
          icon: form.icon,
          color: form.color,
          order: BigInt(Number.parseInt(form.order) || 0),
        });
        toast.success("Category updated");
      } else {
        await actor.createCategory(
          crypto.randomUUID(),
          form.name,
          form.icon,
          form.color,
          BigInt(Number.parseInt(form.order) || 0),
        );
        toast.success("Category created");
      }
      setModalOpen(false);
      await load();
    } catch {
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actor || !deleteTarget) return;
    try {
      await actor.deleteCategory(deleteTarget.id);
      toast.success("Category deleted");
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const handleToggle = async (cat: Category) => {
    if (!actor) return;
    try {
      await actor.toggleCategoryActive(cat.id);
      await load();
    } catch {
      toast.error("Failed to toggle category");
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  const showLoading = isLoading || isFetching;

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories`}
        action={
          <Button
            onClick={openAdd}
            style={{ background: "oklch(0.58 0.24 340)", color: "white" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        }
      />

      {showLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"].map((k) => (
            <Skeleton key={k} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl p-4 card-surface relative overflow-hidden"
            >
              {/* Color accent top line */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: cat.color }}
              />

              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{
                    background: `${cat.color}22`,
                    border: `1px solid ${cat.color}44`,
                  }}
                >
                  {cat.icon}
                </div>
                <Switch
                  checked={cat.active}
                  onCheckedChange={() => handleToggle(cat)}
                />
              </div>

              <div className="mb-3">
                <div className="font-semibold text-sm">{cat.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Order: {Number(cat.order)}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${cat.active ? "badge-active" : "badge-archived"}`}
                >
                  {cat.active ? "Active" : "Inactive"}
                </span>
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:text-destructive"
                    onClick={() => setDeleteTarget(cat)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full card-surface rounded-xl p-16 text-center">
              <p className="text-muted-foreground">No categories yet</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          style={{
            background: "oklch(0.13 0.014 285)",
            border: "1px solid oklch(0.22 0.018 285)",
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Romance, Thriller, Horror..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Icon (emoji)</Label>
                <Input
                  value={form.icon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, icon: e.target.value }))
                  }
                  placeholder="🎬"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, order: e.target.value }))
                  }
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0.5"
                  style={{ background: "transparent" }}
                />
                <Input
                  value={form.color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  placeholder="#E91E8C"
                  className="font-mono"
                />
              </div>
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteTarget?.name}"? This may affect dramas in this
              category.
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
