"use client";

import { FileUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MarkdownViewer } from "@/components/markdown-viewer";
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

/** テキストファイル読み込みの上限（2MB） */
const MAX_TEXT_FILE_SIZE = 2 * 1024 * 1024;
const TEXT_EXTENSIONS = [".txt", ".md"];

type Kind = "transcript" | "summary";

const KIND_LABELS: Record<Kind, string> = {
  transcript: "文字起こし",
  summary: "要約",
};

type CommentEditorProps = {
  open: boolean;
  presentationId: string | null;
  onClose: () => void;
};

/** 編集/プレビュー切り替え付きのテキスト入力エリア */
function ContentSection({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Tabs defaultValue="edit">
      <TabsList>
        <TabsTrigger value="edit">編集</TabsTrigger>
        <TabsTrigger value="preview">プレビュー</TabsTrigger>
      </TabsList>
      <TabsContent value="edit">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-[42vh] resize-none overflow-y-auto font-mono text-sm field-sizing-fixed"
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="h-[42vh] overflow-y-auto rounded-md border p-4">
          {value.trim() === "" ? (
            <span className="text-sm text-muted-foreground">
              （内容がありません）
            </span>
          ) : (
            <MarkdownViewer content={value} />
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

/** コメント/議事録（文字起こし + 要約）の入力フォーム */
export function CommentEditor({
  open,
  presentationId,
  onClose,
}: CommentEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>("transcript");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loaded = transcript !== null && summary !== null;
  const current = kind === "transcript" ? transcript : summary;
  const setCurrent = kind === "transcript" ? setTranscript : setSummary;

  const load = useCallback(() => {
    if (!presentationId) return;
    apiFetch<{ presentation: PresentationDetail }>(
      `/api/presentations/${presentationId}`,
    )
      .then((res) => {
        setTranscript(res.presentation.comment?.transcript ?? "");
        setSummary(res.presentation.comment?.summary ?? "");
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        setTranscript("");
        setSummary("");
      });
  }, [presentationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFileLoad(file: File) {
    const lower = file.name.toLowerCase();
    if (!TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      toast.error("対応形式は .txt / .md です");
      return;
    }
    if (file.size > MAX_TEXT_FILE_SIZE) {
      toast.error("ファイルサイズは 2MB 以下にしてください");
      return;
    }
    if (
      current &&
      current.trim() !== "" &&
      !window.confirm(
        `現在の${KIND_LABELS[kind]}の内容をファイルの内容で置き換えます。よろしいですか？`,
      )
    ) {
      return;
    }
    try {
      const text = await file.text();
      setCurrent(text);
      toast.success(`${file.name} を${KIND_LABELS[kind]}に読み込みました`);
    } catch {
      toast.error("ファイルの読み込みに失敗しました");
    }
  }

  async function handleSave() {
    if (!presentationId || !loaded) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/presentations/${presentationId}/comment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, summary }),
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
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>コメント / 議事録</DialogTitle>
          <DialogDescription>
            文字起こしと要約をそれぞれ登録できます。直接入力のほか、ファイル（.txt /
            .md）からの読み込みにも対応。Markdown
            記法が使えます。両方を空にして保存すると削除されます。
          </DialogDescription>
        </DialogHeader>

        {!loaded ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <div className="min-h-0 flex-1 space-y-3">
            <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <TabsList>
                  <TabsTrigger value="transcript">
                    文字起こし{transcript?.trim() ? " ●" : ""}
                  </TabsTrigger>
                  <TabsTrigger value="summary">
                    要約{summary?.trim() ? " ●" : ""}
                  </TabsTrigger>
                </TabsList>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileLoad(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="size-3.5" />
                  {KIND_LABELS[kind]}をファイルから読み込み
                </Button>
              </div>
            </Tabs>

            {kind === "transcript" ? (
              <ContentSection
                value={transcript ?? ""}
                onChange={setTranscript}
                placeholder={"発表・質疑応答の文字起こしを入力..."}
              />
            ) : (
              <ContentSection
                value={summary ?? ""}
                onChange={setSummary}
                placeholder={"・研究の方向性について...\n・手法の改善点として...\n・次回までに..."}
              />
            )}
          </div>
        )}

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving || !loaded}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
