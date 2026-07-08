"use client";

import { ArrowLeft, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
      <div className="space-y-6">
        <Skeleton className="h-8 w-96" />
        <div className="flex flex-col gap-6 lg:flex-row">
          <Skeleton className="h-96 flex-1 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl lg:w-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        {presentation.description && (
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">
            {presentation.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <CommentViewer comment={presentation.comment} />
        </div>
        <aside className="w-full shrink-0 lg:w-80">
          <SidebarMaterials
            presentationId={presentation.id}
            materials={presentation.materials}
          />
        </aside>
      </div>
    </div>
  );
}
