import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownViewerProps = {
  content: string;
  className?: string;
};

/**
 * Markdown レンダラー（コメント/議事録の表示用）。
 * - GFM（表・打ち消し線・タスクリスト等）対応
 * - remark-breaks により通常の改行もそのまま反映される（プレーンテキストの議事録も崩れない）
 * - react-markdown は生の HTML を描画しないため XSS 安全
 */
export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none leading-7",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
