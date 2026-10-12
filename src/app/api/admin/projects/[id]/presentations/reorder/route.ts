import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * プロジェクト内の発表の並び順を一括更新する。
 * body: { ids: string[] } — 新しい並び順に並べた発表 ID の配列。
 * 配列の先頭から 0,1,2... の sort_order を振り直す。
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;
  const body = await request.json().catch(() => null);
  const ids: unknown = body?.ids;

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    !ids.every((v) => typeof v === "string")
  ) {
    return apiError("並び順の指定が不正です", 400);
  }

  const idList = ids as string[];
  if (new Set(idList).size !== idList.length) {
    return apiError("発表 ID が重複しています", 400);
  }

  const admin = createAdminClient();

  // 指定された ID がすべて当該プロジェクトの発表であることを検証する
  const { data: existing, error: fetchError } = await admin
    .from("presentations")
    .select("id")
    .eq("project_id", projectId);

  if (fetchError) {
    return apiError("発表の取得に失敗しました", 500);
  }

  const projectIds = new Set((existing ?? []).map((p) => p.id));
  if (
    idList.length !== projectIds.size ||
    !idList.every((id) => projectIds.has(id))
  ) {
    return apiError(
      "並び順の対象がプロジェクトの発表と一致しません",
      400,
    );
  }

  // 各発表の sort_order を配列順に振り直す
  const results = await Promise.all(
    idList.map((id, index) =>
      admin
        .from("presentations")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("project_id", projectId),
    ),
  );

  if (results.some((r) => r.error)) {
    return apiError("並び順の更新に失敗しました", 500);
  }

  return NextResponse.json({ ok: true });
}
