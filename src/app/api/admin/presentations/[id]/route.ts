import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { removeStorageFolder } from "@/lib/api/storage";
import { createAdminClient } from "@/lib/supabase/admin";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : null;
  const presentedAt =
    typeof body?.presented_at === "string" ? body.presented_at : "";

  if (!title) {
    return apiError("タイトルを入力してください", 400);
  }
  if (!DATE_RE.test(presentedAt)) {
    return apiError("発表日を正しく入力してください", 400);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("presentations")
    .update({
      title,
      description: description || null,
      presented_at: presentedAt,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return apiError("発表の更新に失敗しました", 500);
  }

  return NextResponse.json({ presentation: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: presentation } = await admin
    .from("presentations")
    .select("id, project_id")
    .eq("id", id)
    .single();

  if (!presentation) {
    return apiError("発表が見つかりません", 404);
  }

  // 添付ファイルを Storage から削除（資料・コメント・タグは CASCADE）
  await removeStorageFolder(
    admin,
    `${presentation.project_id}/${presentation.id}`,
  );

  const { error } = await admin.from("presentations").delete().eq("id", id);

  if (error) {
    return apiError("発表の削除に失敗しました", 500);
  }

  return NextResponse.json({ ok: true });
}
