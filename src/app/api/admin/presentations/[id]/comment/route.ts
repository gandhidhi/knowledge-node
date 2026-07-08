import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** コメント/議事録の登録・更新（1発表につき1レコード）。空文字で削除。 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content : null;

  if (content === null) {
    return apiError("コメント内容が不正です", 400);
  }

  const admin = createAdminClient();

  const { data: presentation } = await admin
    .from("presentations")
    .select("id")
    .eq("id", id)
    .single();

  if (!presentation) {
    return apiError("発表が見つかりません", 404);
  }

  if (content.trim() === "") {
    const { error } = await admin
      .from("comments")
      .delete()
      .eq("presentation_id", id);
    if (error) {
      return apiError("コメントの削除に失敗しました", 500);
    }
    return NextResponse.json({ comment: null });
  }

  const { data, error } = await admin
    .from("comments")
    .upsert(
      { presentation_id: id, content },
      { onConflict: "presentation_id" },
    )
    .select()
    .single();

  if (error) {
    return apiError("コメントの保存に失敗しました", 500);
  }

  return NextResponse.json({ comment: data });
}
