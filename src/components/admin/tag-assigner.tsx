"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryWithTags, PresentationDetail } from "@/lib/types/app";
import { apiFetch } from "@/lib/utils/fetcher";

type TagAssignerProps = {
  open: boolean;
  presentationId: string | null;
  onClose: () => void;
};

/** 発表へのタグ付け・タグ解除 */
export function TagAssigner({
  open,
  presentationId,
  onClose,
}: TagAssignerProps) {
  const [categories, setCategories] = useState<CategoryWithTags[] | null>(
    null,
  );
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [busyTagId, setBusyTagId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!presentationId) return;
    Promise.all([
      apiFetch<{ categories: CategoryWithTags[] }>("/api/tags"),
      apiFetch<{ presentation: PresentationDetail }>(
        `/api/presentations/${presentationId}`,
      ),
    ])
      .then(([tagsRes, detailRes]) => {
        setCategories(tagsRes.categories);
        setAssigned(new Set(detailRes.presentation.tags.map((t) => t.id)));
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        setCategories([]);
      });
  }, [presentationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(tagId: string) {
    if (!presentationId) return;
    setBusyTagId(tagId);
    const isAssigned = assigned.has(tagId);
    try {
      if (isAssigned) {
        await apiFetch(
          `/api/admin/presentations/${presentationId}/tags/${tagId}`,
          { method: "DELETE" },
        );
        setAssigned((prev) => {
          const next = new Set(prev);
          next.delete(tagId);
          return next;
        });
      } else {
        await apiFetch(`/api/admin/presentations/${presentationId}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag_id: tagId }),
        });
        setAssigned((prev) => new Set(prev).add(tagId));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setBusyTagId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>タグ付け</DialogTitle>
          <DialogDescription>
            チェックの変更は即座に保存されます
          </DialogDescription>
        </DialogHeader>

        {categories === null ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            タグがまだ登録されていません。先にタグ管理からタグを作成してください。
          </p>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto">
            {categories
              .filter((category) => category.tags.length > 0)
              .map((category) => (
                <div key={category.id}>
                  <p className="mb-2 text-sm font-medium">{category.name}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {category.tags.map((tag) => (
                      <div key={tag.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`assign-${tag.id}`}
                          checked={assigned.has(tag.id)}
                          disabled={busyTagId === tag.id}
                          onCheckedChange={() => handleToggle(tag.id)}
                        />
                        <Label
                          htmlFor={`assign-${tag.id}`}
                          className="text-sm font-normal"
                        >
                          {tag.value}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
