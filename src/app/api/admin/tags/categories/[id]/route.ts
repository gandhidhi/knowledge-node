import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const sortOrder =
    typeof body?.sort_order === "number" ? body.sort_order : 0;

  if (!name) {
    return apiError("カテゴリ名を入力してください", 400);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tag_categories")
    .update({ name, sort_order: sortOrder })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return apiError("同名のカテゴリが既に存在します", 409);
    }
    return apiError("カテゴリの更新に失敗しました", 500);
  }

  return NextResponse.json({ category: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin.from("tag_categories").delete().eq("id", id);

  if (error) {
    return apiError("カテゴリの削除に失敗しました", 500);
  }

  return NextResponse.json({ ok: true });
}
