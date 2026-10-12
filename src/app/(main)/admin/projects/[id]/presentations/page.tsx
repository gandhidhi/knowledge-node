"use client";

import {
  ArrowLeft,
  ExternalLink,
  FilePen,
  GripVertical,
  MessageSquareText,
  Paperclip,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CommentEditor } from "@/components/admin/comment-editor";
import { MaterialManager } from "@/components/admin/material-manager";
import { PresentationForm } from "@/components/admin/presentation-form";
import { TagAssigner } from "@/components/admin/tag-assigner";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  PresentationListItem,
  PresentationListResponse,
} from "@/lib/types/app";
import type { Presentation, Project } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/utils/fetcher";
import { formatDate } from "@/lib/utils/format";

export default function AdminPresentationsPage() {
  const { id: projectId } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [presentations, setPresentations] = useState<
    PresentationListItem[] | null
  >(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Presentation | null>(null);
  const [materialTarget, setMaterialTarget] = useState<string | null>(null);
  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const [tagTarget, setTagTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<PresentationListItem | null>(null);
  const [busy, setBusy] = useState(false);

  // ドラッグ&ドロップによる並び替え
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const load = useCallback(() => {
    apiFetch<PresentationListResponse>(
      `/api/projects/${projectId}/presentations?limit=100&sort=sort_order&order=asc`,
    )
      .then((res) => setPresentations(res.presentations))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        setPresentations([]);
      });
  }, [projectId]);

  /** 新しい並び順をサーバーに保存する。失敗時は元の並びへ戻す。 */
  async function persistOrder(ordered: PresentationListItem[]) {
    const previous = presentations;
    setPresentations(ordered);
    setSavingOrder(true);
    try {
      await apiFetch(
        `/api/admin/projects/${projectId}/presentations/reorder`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: ordered.map((p) => p.id) }),
        },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "並び順の保存に失敗しました");
      if (previous) setPresentations(previous);
    } finally {
      setSavingOrder(false);
    }
  }

  /** dragId の行を overId の位置へ移動した配列を保存する */
  function handleDrop(targetId: string) {
    if (!presentations || !dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const fromIndex = presentations.findIndex((p) => p.id === dragId);
    const toIndex = presentations.findIndex((p) => p.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const next = [...presentations];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setDragId(null);
    setOverId(null);
    void persistOrder(next);
  }

  useEffect(() => {
    apiFetch<{ project: Project }>(`/api/projects/${projectId}`)
      .then((res) => setProject(res.project))
      .catch(() => setProject(null));
    load();
  }, [projectId, load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/presentations/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success("発表を削除しました");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/projects"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          プロジェクト管理へ戻る
        </Link>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            発表管理{project ? `: ${project.name}` : ""}
          </h2>
          <Button
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            新規作成
          </Button>
        </div>
        {presentations && presentations.length > 1 && (
          <p className="mt-1 text-xs text-muted-foreground">
            左端のハンドルをドラッグすると並び順を変更できます
            {savingOrder && "（保存中...）"}
          </p>
        )}
      </div>

      {presentations === null ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : presentations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          発表がまだありません。「新規作成」から追加してください。
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>タイトル</TableHead>
                <TableHead className="w-32">発表日</TableHead>
                <TableHead className="w-72" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentations.map((presentation) => (
                <TableRow
                  key={presentation.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (overId !== presentation.id) setOverId(presentation.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(presentation.id);
                  }}
                  data-dragging={dragId === presentation.id || undefined}
                  className={cn(
                    "transition-colors",
                    dragId === presentation.id && "opacity-40",
                    overId === presentation.id &&
                      dragId !== presentation.id &&
                      "border-t-2 border-t-primary",
                  )}
                >
                  <TableCell className="w-10 align-middle">
                    <button
                      type="button"
                      aria-label="ドラッグして並び替え"
                      className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={savingOrder}
                      draggable={!savingOrder}
                      onDragStart={() => setDragId(presentation.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverId(null);
                      }}
                    >
                      <GripVertical className="size-4" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{presentation.title}</p>
                      <Link
                        href={`/presentations/${presentation.id}`}
                        className="text-muted-foreground hover:text-foreground"
                        title="閲覧ページを開く"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                    {presentation.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {presentation.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {tag.value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(presentation.presented_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMaterialTarget(presentation.id)}
                      >
                        <Paperclip className="size-3.5" />
                        資料
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCommentTarget(presentation.id)}
                      >
                        <MessageSquareText className="size-3.5" />
                        議事録
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTagTarget(presentation.id)}
                      >
                        <Tags className="size-3.5" />
                        タグ
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditTarget(presentation);
                          setFormOpen(true);
                        }}
                      >
                        <FilePen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(presentation)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {formOpen && (
        <PresentationForm
          open
          projectId={projectId}
          presentation={editTarget}
          onClose={() => setFormOpen(false)}
          onSaved={load}
        />
      )}
      {materialTarget !== null && (
        <MaterialManager
          open
          projectId={projectId}
          presentationId={materialTarget}
          onClose={() => setMaterialTarget(null)}
        />
      )}
      {commentTarget !== null && (
        <CommentEditor
          open
          presentationId={commentTarget}
          onClose={() => setCommentTarget(null)}
        />
      )}
      {tagTarget !== null && (
        <TagAssigner
          open
          presentationId={tagTarget}
          onClose={() => {
            setTagTarget(null);
            load();
          }}
        />
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>発表を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.title}
              」を削除します。資料・コメント/議事録もすべて削除されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy}>
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
