"use client";

import {
  ArrowLeft,
  ExternalLink,
  FilePen,
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

  const load = useCallback(() => {
    apiFetch<PresentationListResponse>(
      `/api/projects/${projectId}/presentations?limit=100`,
    )
      .then((res) => setPresentations(res.presentations))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        setPresentations([]);
      });
  }, [projectId]);

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
                <TableHead>タイトル</TableHead>
                <TableHead className="w-32">発表日</TableHead>
                <TableHead className="w-72" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentations.map((presentation) => (
                <TableRow key={presentation.id}>
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
