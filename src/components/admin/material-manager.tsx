"use client";

import { FileText, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ALLOWED_EXTENSIONS,
  getExtension,
  isAllowedFile,
  MATERIALS_BUCKET,
  MAX_FILE_SIZE,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { PresentationDetail } from "@/lib/types/app";
import type { Material } from "@/lib/types/database";
import { apiFetch } from "@/lib/utils/fetcher";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils/format";

type MaterialManagerProps = {
  open: boolean;
  projectId: string;
  presentationId: string | null;
  onClose: () => void;
};

/** 資料のアップロード（ドラッグ&ドロップ対応）と削除 */
export function MaterialManager({
  open,
  projectId,
  presentationId,
  onClose,
}: MaterialManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const load = useCallback(() => {
    if (!presentationId) return;
    apiFetch<{ presentation: PresentationDetail }>(
      `/api/presentations/${presentationId}`,
    )
      .then((res) => setMaterials(res.presentation.materials))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        setMaterials([]);
      });
  }, [presentationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFiles(files: FileList | File[]) {
    if (!presentationId) return;
    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      if (!isAllowedFile(file.name)) {
        toast.error(
          `${file.name}: このファイル形式はアップロードできません（対応: ${ALLOWED_EXTENSIONS.join(", ")}）`,
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: ファイルサイズは 50MB 以下にしてください`);
        continue;
      }

      try {
        // Vercel のリクエストサイズ制限を避けるため Storage へ直接アップロード
        const ext = getExtension(file.name);
        const storagePath = `${projectId}/${presentationId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(MATERIALS_BUCKET)
          .upload(storagePath, file, {
            contentType: file.type || undefined,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        await apiFetch(
          `/api/admin/presentations/${presentationId}/materials`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_name: file.name,
              storage_path: storagePath,
              file_type: ext,
              file_size: file.size,
            }),
          },
        );
        toast.success(`${file.name} をアップロードしました`);
      } catch (e) {
        toast.error(
          `${file.name}: ${e instanceof Error ? e.message : "アップロードに失敗しました"}`,
        );
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    load();
  }

  async function handleDelete(material: Material) {
    try {
      await apiFetch(`/api/admin/materials/${material.id}`, {
        method: "DELETE",
      });
      toast.success(`${material.file_name} を削除しました`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>資料管理</DialogTitle>
          <DialogDescription>
            PDF / Word などの発表資料をアップロードできます（最大 50MB）
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            dragging ? "border-primary bg-accent" : "hover:bg-accent/50",
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length > 0) {
              uploadFiles(e.dataTransfer.files);
            }
          }}
        >
          <UploadCloud className="size-8 text-muted-foreground" />
          <p className="text-sm">
            {uploading
              ? "アップロード中..."
              : "クリックまたはドラッグ&ドロップでアップロード"}
          </p>
          <p className="text-xs text-muted-foreground">
            対応形式: {ALLOWED_EXTENSIONS.join(", ")}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files);
            }}
          />
        </div>

        {materials === null ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : materials.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            資料はまだありません
          </p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {materials.map((material) => (
              <li
                key={material.id}
                className="flex items-center gap-2 rounded-lg border p-2.5"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {material.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(material.file_size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(material)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
