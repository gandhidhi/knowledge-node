import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

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
    .insert({ name, sort_order: sortOrder })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return apiError("同名のカテゴリが既に存在します", 409);
    }
    return apiError("カテゴリの作成に失敗しました", 500);
  }

  return NextResponse.json({ category: data }, { status: 201 });
}
