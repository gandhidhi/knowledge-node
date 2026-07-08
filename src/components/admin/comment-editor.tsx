"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { PresentationDetail } from "@/lib/types/app";
import { apiFetch } from "@/lib/utils/fetcher";

type CommentEditorProps = {
  open: boolean;
  presentationId: string | null;
  onClose: () => void;
};

/** コメント/議事録の入力フォーム（プレビュー付き） */
export function CommentEditor({
  open,
  presentationId,
  onClose,
}: CommentEditorProps) {
  const [content, setContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!presentationId) return;
    apiFetch<{ presentation: PresentationDetail }>(
      `/api/presentations/${presentationId}`,
    )
      .then((res) => setContent(res.presentation.comment?.content ?? ""))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        setContent("");
      });
  }, [presentationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!presentationId || content === null) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/presentations/${presentationId}/comment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      toast.success("コメント/議事録を保存しました");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>コメント / 議事録</DialogTitle>
          <DialogDescription>
            先生からの指摘・議事録を記録します。空にして保存すると削除されます。
          </DialogDescription>
        </DialogHeader>

        {content === null ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit">編集</TabsTrigger>
              <TabsTrigger value="preview">プレビュー</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                placeholder={"・研究の方向性について...\n・手法の改善点として...\n・次回までに..."}
                className="font-mono text-sm"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="max-h-96 min-h-48 overflow-y-auto rounded-md border p-4 text-sm leading-7 whitespace-pre-wrap">
                {content.trim() === "" ? (
                  <span className="text-muted-foreground">
                    （内容がありません）
                  </span>
                ) : (
                  content
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving || content === null}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
