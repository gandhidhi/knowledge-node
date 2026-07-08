import { NextResponse } from "next/server";

import { apiError, requireUser } from "@/lib/api/auth";
import { mapTagRows, type RawTagRow } from "@/lib/api/mappers";
import type { PresentationListResponse } from "@/lib/types/app";
import { sanitizeSearchKeyword } from "@/lib/utils/filters";

const SORTABLE = ["presented_at", "created_at", "title"] as const;
type SortKey = (typeof SORTABLE)[number];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id: projectId } = await params;
  const { searchParams } = new URL(request.url);

  const q = sanitizeSearchKeyword(searchParams.get("q") ?? "");
  const tagIds = (searchParams.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const sortParam = searchParams.get("sort") ?? "presented_at";
  const sort: SortKey = (SORTABLE as readonly string[]).includes(sortParam)
    ? (sortParam as SortKey)
    : "presented_at";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

  const emptyResponse: PresentationListResponse = {
    presentations: [],
    total: 0,
    page,
    limit,
  };

  // タグフィルター（AND 条件）: 指定タグをすべて持つ発表 ID を求める
  let matchedIds: string[] | null = null;
  if (tagIds.length > 0) {
    const { data: ptRows, error: ptError } = await supabase
      .from("presentation_tags")
      .select("presentation_id, tag_id")
      .in("tag_id", tagIds);

    if (ptError) {
      return apiError("発表の検索に失敗しました", 500);
    }

    const tagSets = new Map<string, Set<string>>();
    for (const row of ptRows) {
      const set = tagSets.get(row.presentation_id) ?? new Set<string>();
      set.add(row.tag_id);
      tagSets.set(row.presentation_id, set);
    }
    matchedIds = [...tagSets.entries()]
      .filter(([, set]) => set.size === tagIds.length)
      .map(([presentationId]) => presentationId);

    if (matchedIds.length === 0) {
      return NextResponse.json(emptyResponse);
    }
  }

  let query = supabase
    .from("presentations")
    .select("*", { count: "exact" })
    .eq("project_id", projectId);

  if (matchedIds) {
    query = query.in("id", matchedIds);
  }
  if (q) {
    query = query.or(`title.ilike.*${q}*,description.ilike.*${q}*`);
  }

  const from = (page - 1) * limit;
  const { data, count, error } = await query
    .order(sort, { ascending: order === "asc" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    return apiError("発表一覧の取得に失敗しました", 500);
  }

  // 取得した発表のタグをまとめて取得
  const ids = data.map((p) => p.id);
  const tagsByPresentation = new Map<string, RawTagRow[]>();
  if (ids.length > 0) {
    const { data: tagRows } = await supabase
      .from("presentation_tags")
      .select(
        "presentation_id, tag:tags(id, category_id, value, created_at, category:tag_categories(id, name, sort_order))",
      )
      .in("presentation_id", ids);

    for (const row of (tagRows ?? []) as unknown as (RawTagRow & {
      presentation_id: string;
    })[]) {
      const list = tagsByPresentation.get(row.presentation_id) ?? [];
      list.push(row);
      tagsByPresentation.set(row.presentation_id, list);
    }
  }

  const response: PresentationListResponse = {
    presentations: data.map((p) => ({
      ...p,
      tags: mapTagRows(tagsByPresentation.get(p.id)),
    })),
    total: count ?? 0,
    page,
    limit,
  };

  return NextResponse.json(response);
}
