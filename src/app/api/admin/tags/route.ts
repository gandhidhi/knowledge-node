import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const categoryId =
    typeof body?.category_id === "string" ? body.category_id : "";
  const value = typeof body?.value === "string" ? body.value.trim() : "";

  if (!categoryId) {
    return apiError("カテゴリを指定してください", 400);
  }
  if (!value) {
    return apiError("タグ名を入力してください", 400);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tags")
    .insert({ category_id: categoryId, value })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return apiError("同じタグが既に存在します", 409);
    }
    return apiError("タグの作成に失敗しました", 500);
  }

  return NextResponse.json({ tag: data }, { status: 201 });
}
