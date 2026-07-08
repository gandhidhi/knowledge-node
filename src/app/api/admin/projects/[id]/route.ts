import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { removeStorageFolder } from "@/lib/api/storage";
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
  const description =
    typeof body?.description === "string" ? body.description.trim() : null;

  if (!name) {
    return apiError("プロジェクト名を入力してください", 400);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .update({ name, description: description || null })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return apiError("プロジェクトの更新に失敗しました", 500);
  }

  return NextResponse.json({ project: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();

  // 添付ファイルを Storage から削除してから DB を削除（発表・資料は CASCADE）
  await removeStorageFolder(admin, id);

  const { error } = await admin.from("projects").delete().eq("id", id);

  if (error) {
    return apiError("プロジェクトの削除に失敗しました", 500);
  }

  return NextResponse.json({ ok: true });
}
