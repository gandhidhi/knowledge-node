"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { EmailImportResult } from "@/lib/types/app";
import { apiFetch } from "@/lib/utils/fetcher";

type CsvUploadProps = {
  onImported: () => void;
};

/** 許可メールアドレスの CSV 一括アップロード */
export function CsvUpload({ onImported }: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiFetch<EmailImportResult>(
        "/api/admin/emails/import",
        { method: "POST", body: formData },
      );

      let message = `${result.added} 件追加しました`;
      if (result.skipped > 0) {
        message += `（${result.skipped} 件は登録済みのためスキップ）`;
      }
      toast.success(message);

      if (result.invalid.length > 0) {
        toast.warning(
          `形式が不正なため ${result.invalid.length} 件をスキップしました: ${result.invalid
            .slice(0, 5)
            .join(", ")}${result.invalid.length > 5 ? " ..." : ""}`,
        );
      }
      onImported();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "アップロードに失敗しました",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" />
        {uploading ? "アップロード中..." : "CSV一括登録"}
      </Button>
    </>
  );
}
