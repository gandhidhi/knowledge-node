"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SidebarFilter } from "@/components/layout/sidebar-filter";
import { PresentationList } from "@/components/presentations/presentation-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  CategoryWithTags,
  PresentationListResponse,
} from "@/lib/types/app";
import type { Project } from "@/lib/types/database";
import { apiFetch } from "@/lib/utils/fetcher";
import { buildPresentationQuery } from "@/lib/utils/filters";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<CategoryWithTags[]>([]);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    key: string;
    data: PresentationListResponse;
  } | null>(null);

  const query = buildPresentationQuery({
    q: debouncedKeyword,
    tags: selectedTagIds,
    page,
  });
  const queryKey = `${id}?${query}`;
  // 表示中の結果が現在の検索条件と一致しなければローディング中
  const loading = result === null || result.key !== queryKey;
  const data = result?.data ?? null;

  // プロジェクト情報とタグ一覧の初期取得
  useEffect(() => {
    apiFetch<{ project: Project }>(`/api/projects/${id}`)
      .then((res) => setProject(res.project))
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "取得に失敗しました"),
      );
    apiFetch<{ categories: CategoryWithTags[] }>("/api/tags")
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]));
  }, [id]);

  // キーワードのデバウンス
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 発表一覧の取得
  useEffect(() => {
    let cancelled = false;
    apiFetch<PresentationListResponse>(
      `/api/projects/${id}/presentations${query ? `?${query}` : ""}`,
    )
      .then((res) => {
        if (!cancelled) setResult({ key: queryKey, data: res });
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, query, queryKey]);

  const handleToggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId],
    );
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setKeyword("");
    setSelectedTagIds([]);
    setPage(1);
  }, []);

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1),
    [data],
  );

  return (
    <div className="space-y-6">
      <div>
        {project ? (
          <>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </>
        ) : (
          <Skeleton className="h-8 w-64" />
        )}
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-60">
          <SidebarFilter
            categories={categories}
            keyword={keyword}
            selectedTagIds={selectedTagIds}
            onKeywordChange={setKeyword}
            onToggleTag={handleToggleTag}
            onClear={handleClear}
          />
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <PresentationList
            presentations={data?.presentations ?? []}
            loading={loading && data === null}
          />

          {data && data.total > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                全 {data.total} 件 ({page} / {totalPages} ページ)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  次へ
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
