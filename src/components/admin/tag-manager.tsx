"use client";

import { FilePen, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { CategoryWithTags } from "@/lib/types/app";
import { apiFetch } from "@/lib/utils/fetcher";

type CategoryFormState = {
  id: string | null; // null なら新規作成
  name: string;
  sortOrder: number;
};

export function TagManager() {
  const [categories, setCategories] = useState<CategoryWithTags[] | null>(
    null,
  );
  const [categoryForm, setCategoryForm] = useState<CategoryFormState | null>(
    null,
  );
  const [newTagValues, setNewTagValues] = useState<Record<string, string>>({});
  const [deleteCategory, setDeleteCategory] =
    useState<CategoryWithTags | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiFetch<{ categories: CategoryWithTags[] }>("/api/tags")
      .then((res) => setCategories(res.categories))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCategorySave(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryForm) return;
    setBusy(true);
    try {
      const body = JSON.stringify({
        name: categoryForm.name,
        sort_order: categoryForm.sortOrder,
      });
      if (categoryForm.id) {
        await apiFetch(`/api/admin/tags/categories/${categoryForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
        toast.success("カテゴリを更新しました");
      } else {
        await apiFetch("/api/admin/tags/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        toast.success("カテゴリを作成しました");
      }
      setCategoryForm(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function handleCategoryDelete() {
    if (!deleteCategory) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/tags/categories/${deleteCategory.id}`, {
        method: "DELETE",
      });
      toast.success("カテゴリを削除しました");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusy(false);
      setDeleteCategory(null);
    }
  }

  async function handleTagAdd(categoryId: string) {
    const value = (newTagValues[categoryId] ?? "").trim();
    if (!value) return;
    try {
      await apiFetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, value }),
      });
      setNewTagValues((prev) => ({ ...prev, [categoryId]: "" }));
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    }
  }

  async function handleTagDelete(tagId: string) {
    try {
      await apiFetch(`/api/admin/tags/${tagId}`, { method: "DELETE" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          カテゴリ（学生名・回生・分野など）を作成し、その中にタグを追加します
        </p>
        <Button
          onClick={() =>
            setCategoryForm({
              id: null,
              name: "",
              sortOrder: (categories?.length ?? 0) * 10,
            })
          }
        >
          <Plus className="size-4" />
          カテゴリ作成
        </Button>
      </div>

      {categories === null ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          カテゴリがまだありません。「カテゴリ作成」から追加してください。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{category.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setCategoryForm({
                        id: category.id,
                        name: category.name,
                        sortOrder: category.sort_order,
                      })
                    }
                  >
                    <FilePen className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteCategory(category)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {category.tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      タグがありません
                    </p>
                  ) : (
                    category.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="gap-1 font-normal"
                      >
                        {tag.value}
                        <button
                          type="button"
                          onClick={() => handleTagDelete(tag.id)}
                          className="ml-0.5 rounded-full hover:text-destructive"
                          aria-label={`${tag.value} を削除`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleTagAdd(category.id);
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={newTagValues[category.id] ?? ""}
                    onChange={(e) =>
                      setNewTagValues((prev) => ({
                        ...prev,
                        [category.id]: e.target.value,
                      }))
                    }
                    placeholder="新しいタグ"
                    className="h-8"
                  />
                  <Button type="submit" variant="outline" size="sm">
                    追加
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* カテゴリ作成・編集ダイアログ */}
      <Dialog
        open={categoryForm !== null}
        onOpenChange={(open) => !open && setCategoryForm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {categoryForm?.id ? "カテゴリを編集" : "カテゴリを作成"}
            </DialogTitle>
          </DialogHeader>
          {categoryForm && (
            <form onSubmit={handleCategorySave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">カテゴリ名 *</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  required
                  placeholder="学生名 / 回生 / 分野 / 研究対象"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-sort">表示順</Label>
                <Input
                  id="category-sort"
                  type="number"
                  value={categoryForm.sortOrder}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      sortOrder: Number(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  小さい順にフィルターへ表示されます
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCategoryForm(null)}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "保存中..." : "保存"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* カテゴリ削除確認 */}
      <AlertDialog
        open={deleteCategory !== null}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteCategory?.name}」を削除します。カテゴリ内のタグ（
              {deleteCategory?.tags.length} 件）と発表への割り当てもすべて削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleCategoryDelete} disabled={busy}>
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
