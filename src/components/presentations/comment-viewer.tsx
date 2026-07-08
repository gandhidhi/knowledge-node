import { MessageSquareText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";

type CommentViewerProps = {
  comment: { content: string; updated_at: string } | null;
};

export function CommentViewer({ comment }: CommentViewerProps) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareText className="size-4" />
          コメント / 議事録
        </CardTitle>
        {comment && (
          <CardDescription>
            最終更新: {formatDateTime(comment.updated_at)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {comment ? (
          <div className="max-h-[65vh] overflow-y-auto text-sm leading-7 whitespace-pre-wrap">
            {comment.content}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            コメント/議事録はまだ登録されていません
          </p>
        )}
      </CardContent>
    </Card>
  );
}
