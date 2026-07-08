import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

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
    .insert({ name, description: description || null })
    .select()
    .single();

  if (error) {
    return apiError("プロジェクトの作成に失敗しました", 500);
  }

  return NextResponse.json({ project: data }, { status: 201 });
}
