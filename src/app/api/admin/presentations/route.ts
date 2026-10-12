import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const projectId =
    typeof body?.project_id === "string" ? body.project_id : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : null;
  const presentedAt =
    typeof body?.presented_at === "string" ? body.presented_at : "";

  if (!projectId) {
    return apiError("プロジェクトを指定してください", 400);
  }
  if (!title) {
    return apiError("タイトルを入力してください", 400);
  }
  if (!DATE_RE.test(presentedAt)) {
    return apiError("発表日を正しく入力してください", 400);
  }

  const admin = createAdminClient();

  // 新規発表はプロジェクト内の末尾に配置する
  const { data: last } = await admin
    .from("presentations")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (last?.sort_order ?? -1) + 1;

  const { data, error } = await admin
    .from("presentations")
    .insert({
      project_id: projectId,
      title,
      description: description || null,
      presented_at: presentedAt,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error) {
    return apiError("発表の作成に失敗しました", 500);
  }

  return NextResponse.json({ presentation: data }, { status: 201 });
}
