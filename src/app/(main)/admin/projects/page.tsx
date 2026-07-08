"use client";

import { FilePen, Plus, Presentation, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ProjectForm } from "@/components/admin/project-form";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProjectWithCount } from "@/lib/types/app";
import type { Project } from "@/lib/types/database";
import { apiFetch } from "@/lib/utils/fetcher";
import { formatDate } from "@/lib/utils/format";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithCount[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectWithCount | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiFetch<{ projects: ProjectWithCount[] }>("/api/projects")
      .then((res) => setProjects(res.projects))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        setProjects([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/projects/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success("プロジェクトを削除しました");
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">プロジェクト管理</h2>
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

      {projects === null ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          プロジェクトがまだありません。「新規作成」から追加してください。
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>プロジェクト名</TableHead>
                <TableHead className="w-24 text-right">発表数</TableHead>
                <TableHead className="w-36">作成日</TableHead>
                <TableHead className="w-56" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <p className="font-medium">{project.name}</p>
                    {project.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {project.presentation_count}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(project.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/projects/${project.id}/presentations`}>
                          <Presentation className="size-3.5" />
                          発表管理
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditTarget(project);
                          setFormOpen(true);
                        }}
                      >
                        <FilePen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(project)}
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
        <ProjectForm
          open
          project={editTarget}
          onClose={() => setFormOpen(false)}
          onSaved={load}
        />
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>プロジェクトを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name}」を削除します。プロジェクト内の発表（
              {deleteTarget?.presentation_count} 件）・資料・コメントもすべて削除されます。この操作は取り消せません。
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
