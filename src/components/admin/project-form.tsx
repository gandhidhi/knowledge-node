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
import type { Project } from "@/lib/types/database";
import { apiFetch } from "@/lib/utils/fetcher";

type ProjectFormProps = {
  open: boolean;
  project: Project | null; // null なら新規作成
  onClose: () => void;
  onSaved: () => void;
};

export function ProjectForm({
  open,
  project,
  onClose,
  onSaved,
}: ProjectFormProps) {
  // 親側で open 時のみマウントされるため、初期値はマウント時に確定する
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = JSON.stringify({ name, description });
      if (project) {
        await apiFetch(`/api/admin/projects/${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
        toast.success("プロジェクトを更新しました");
      } else {
        await apiFetch("/api/admin/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        toast.success("プロジェクトを作成しました");
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
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? "プロジェクトを編集" : "プロジェクトを作成"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">プロジェクト名 *</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="2026年度 ○○ゼミ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">説明</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="プロジェクトの説明（任意）"
              className="max-h-48 overflow-y-auto"
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
