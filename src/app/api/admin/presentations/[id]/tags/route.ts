import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** 発表へのタグ付け */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const tagId = typeof body?.tag_id === "string" ? body.tag_id : "";

  if (!tagId) {
    return apiError("タグを指定してください", 400);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("presentation_tags")
    .upsert(
      { presentation_id: id, tag_id: tagId },
      { onConflict: "presentation_id,tag_id", ignoreDuplicates: true },
    );

  if (error) {
    return apiError("タグ付けに失敗しました", 500);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
