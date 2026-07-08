/** 発表一覧のフィルター条件 */
export type PresentationFilters = {
  q?: string;
  tags?: string[];
  sort?: "presented_at" | "created_at" | "title";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

/** フィルター条件を API のクエリ文字列に変換する */
export function buildPresentationQuery(filters: PresentationFilters): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  return params.toString();
}

/**
 * ilike / or() フィルターに安全に渡せるよう検索キーワードを整形する。
 * PostgREST の or() 構文を壊す文字を除去する。
 */
export function sanitizeSearchKeyword(q: string): string {
  return q.replace(/[,()"'\\%_]/g, " ").trim();
}
