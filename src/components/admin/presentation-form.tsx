"use client";

import { useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import type { Presentation } from "@/lib/types/database";
import { apiFetch } from "@/lib/utils/fetcher";

type PresentationFormProps = {
  open: boolean;
  projectId: string;
  presentation: Presentation | null; // null なら新規作成
  onClose: () => void;
  onSaved: () => void;
};

export function PresentationForm({
  open,
  projectId,
  presentation,
  onClose,
  onSaved,
}: PresentationFormProps) {
  // 親側で open 時のみマウントされるため、初期値はマウント時に確定する
  const [title, setTitle] = useState(presentation?.title ?? "");
  const [description, setDescription] = useState(
    presentation?.description ?? "",
  );
  const [presentedAt, setPresentedAt] = useState(
    presentation?.presented_at ?? new Date().toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (presentation) {
        await apiFetch(`/api/admin/presentations/${presentation.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            presented_at: presentedAt,
          }),
        });
        toast.success("発表を更新しました");
      } else {
        await apiFetch("/api/admin/presentations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            title,
            description,
            presented_at: presentedAt,
          }),
        });
        toast.success("発表を作成しました");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {presentation ? "発表を編集" : "発表を作成"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="presentation-title">タイトル *</Label>
            <Input
              id="presentation-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="研究進捗報告"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="presentation-date">発表日 *</Label>
            <Input
              id="presentation-date"
              type="date"
              value={presentedAt}
              onChange={(e) => setPresentedAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="presentation-description">説明文</Label>
            <Textarea
              id="presentation-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="発表の概要（任意）"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
