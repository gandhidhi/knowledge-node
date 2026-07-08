"use client";

import { MessageSquareText } from "lucide-react";
import { useState } from "react";

import { CollapsibleCard } from "@/components/collapsible-card";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CommentContent } from "@/lib/types/app";
import { formatDateTime } from "@/lib/utils/format";

type Kind = "transcript" | "summary";

type CommentViewerProps = {
  comment: CommentContent | null;
};

export function CommentViewer({ comment }: CommentViewerProps) {
  // 内容のある方をデフォルトタブにする（文字起こし優先）
  const [tab, setTab] = useState<Kind>(
    comment?.transcript?.trim() || !comment?.summary?.trim()
      ? "transcript"
      : "summary",
  );

  const active = tab === "transcript" ? comment?.transcript : comment?.summary;
  const emptyLabel =
    tab === "transcript" ? "文字起こし" : "要約";

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as Kind)}>
      <CollapsibleCard
        icon={<MessageSquareText className="size-4" />}
        title="コメント / 議事録"
        headerExtra={
          comment ? (
            <TabsList className="h-8">
              <TabsTrigger value="transcript">文字起こし</TabsTrigger>
              <TabsTrigger value="summary">要約</TabsTrigger>
            </TabsList>
          ) : undefined
        }
        subtitle={
          comment
            ? `最終更新: ${formatDateTime(comment.updated_at)}`
            : undefined
        }
      >
        {!comment ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            コメント/議事録はまだ登録されていません
          </p>
        ) : active?.trim() ? (
          <div className="max-h-[65vh] overflow-y-auto">
            <MarkdownViewer content={active} />
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyLabel}はまだ登録されていません
          </p>
        )}
      </CollapsibleCard>
    </Tabs>
  );
}
