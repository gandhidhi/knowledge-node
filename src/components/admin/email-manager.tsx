"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CsvUpload } from "@/components/admin/csv-upload";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AllowedEmail } from "@/lib/types/database";
import { apiFetch } from "@/lib/utils/fetcher";
import { formatDateTime } from "@/lib/utils/format";

export function EmailManager() {
  const [emails, setEmails] = useState<AllowedEmail[] | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AllowedEmail | null>(null);

  const load = useCallback(() => {
    apiFetch<{ emails: AllowedEmail[] }>("/api/admin/emails")
      .then((res) => setEmails(res.emails))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        setEmails([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setBusy(true);
    try {
      await apiFetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      toast.success("メールアドレスを追加しました");
      setNewEmail("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/emails/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success("メールアドレスを削除しました");
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleAdd} className="flex max-w-md flex-1 gap-2">
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="student@example.ac.jp"
            required
          />
          <Button type="submit" disabled={busy}>
            <Plus className="size-4" />
            追加
          </Button>
        </form>
        <CsvUpload onImported={load} />
      </div>

      <p className="text-xs text-muted-foreground">
        CSV は 1 行に 1 メールアドレス（またはカンマ区切り）。ヘッダー行「email」は自動的にスキップされます。
      </p>

      {emails === null ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : emails.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          許可メールアドレスがまだ登録されていません
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>メールアドレス</TableHead>
                <TableHead className="w-48">登録日時</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell className="font-medium">{email.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(email.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(email)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>メールアドレスを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.email} を許可リストから削除します。
              このメールアドレスでの新規サインアップができなくなります（既存アカウントは削除されません）。
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
