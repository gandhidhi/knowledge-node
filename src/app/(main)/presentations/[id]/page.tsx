"use client";

import { ArrowLeft, CalendarDays, Info } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CollapsibleCard } from "@/components/collapsible-card";
import { SidebarMaterials } from "@/components/layout/sidebar-materials";
import { CommentViewer } from "@/components/presentations/comment-viewer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PresentationDetail } from "@/lib/types/app";
import { apiFetch } from "@/lib/utils/fetcher";
import { formatDate } from "@/lib/utils/format";

export default function PresentationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [presentation, setPresentation] = useState<PresentationDetail | null>(
    null,
  );
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiFetch<{ presentation: PresentationDetail }>(`/api/presentations/${id}`)
      .then((res) => setPresentation(res.presentation))
      .catch((e) => {
        setNotFound(true);
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
      });
  }, [id]);

  if (notFound) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        発表が見つかりませんでした
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="space-y-6 px-4">
        <Skeleton className="h-8 w-96" />
        <div className="flex flex-col gap-6 lg:flex-row">
          <Skeleton className="h-96 flex-1 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl lg:w-80" />
        </div>
      </div>
    );
  }

  return (
    // レイアウト共通の px-4 に加えてさらに px-4（余白 2 倍）
    <div className="space-y-6 px-4">
      <div className="space-y-3">
        <Link
          href={`/projects/${presentation.project_id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {presentation.project.name}
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{presentation.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            {formatDate(presentation.presented_at)}
          </p>
        </div>
        {presentation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {presentation.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="font-normal">
                <span className="text-muted-foreground">
                  {tag.category_name}:
                </span>
                {tag.value}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/*
        モバイル: 説明文 → 議事録 → 資料 の順に縦積み
        lg 以上: 左カラムに議事録、右カラムに説明文（上）+ 資料（下）
      */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <CollapsibleCard
          icon={<Info className="size-4" />}
          title="説明文"
          className="self-start lg:col-start-2 lg:row-start-1"
        >
          {presentation.description ? (
            <div className="max-h-[40vh] overflow-y-auto text-sm leading-7 whitespace-pre-wrap">
              {presentation.description}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              説明文はありません
            </p>
          )}
        </CollapsibleCard>

        <div className="min-w-0 self-start lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <CommentViewer comment={presentation.comment} />
        </div>

        <aside className="self-start lg:col-start-2 lg:row-start-2">
          <SidebarMaterials
            presentationId={presentation.id}
            materials={presentation.materials}
          />
        </aside>
      </div>
    </div>
  );
}
