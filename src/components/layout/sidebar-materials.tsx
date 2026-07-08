"use client";

import { Download, Eye, FileText, Paperclip } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Material } from "@/lib/types/database";
import { apiFetch } from "@/lib/utils/fetcher";
import { formatFileSize } from "@/lib/utils/format";

type MaterialUrlResponse = {
  url: string;
  downloadUrl: string;
  fileName: string;
  fileType: string;
};

function isPreviewable(material: Material) {
  return (
    material.file_type.includes("pdf") ||
    material.file_name.toLowerCase().endsWith(".pdf")
  );
}

export function SidebarMaterials({
  presentationId,
  materials,
}: {
  presentationId: string;
  materials: Material[];
}) {
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  async function fetchUrl(material: Material) {
    return apiFetch<MaterialUrlResponse>(
      `/api/presentations/${presentationId}/materials/${material.id}/url`,
    );
  }

  async function handlePreview(material: Material) {
    setBusyId(material.id);
    try {
      const { url } = await fetchUrl(material);
      setPreview({ name: material.file_name, url });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "プレビューに失敗しました");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDownload(material: Material) {
    setBusyId(material.id);
    try {
      const { downloadUrl } = await fetchUrl(material);
      window.location.href = downloadUrl;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "ダウンロードに失敗しました",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="size-4" />
            資料
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              資料はありません
            </p>
          ) : (
            <ul className="space-y-3">
              {materials.map((material) => (
                <li
                  key={material.id}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium break-all">
                        {material.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(material.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {isPreviewable(material) && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === material.id}
                        onClick={() => handlePreview(material)}
                      >
                        <Eye className="size-3.5" />
                        プレビュー
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === material.id}
                      onClick={() => handleDownload(material)}
                    >
                      <Download className="size-3.5" />
                      ダウンロード
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={preview !== null} onOpenChange={() => setPreview(null)}>
        <DialogContent className="h-[85vh] sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <iframe
              src={preview.url}
              title={preview.name}
              className="h-full w-full rounded-md border"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
