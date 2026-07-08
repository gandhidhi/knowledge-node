import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * コメント/議事録（文字起こし + 要約）の登録・更新。1発表につき1レコード。
 * 両方を空にして保存するとレコードを削除する。
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const transcript =
    typeof body?.transcript === "string" ? body.transcript : null;
  const summary = typeof body?.summary === "string" ? body.summary : null;

  if (transcript === null && summary === null) {
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

  const transcriptValue = transcript?.trim() ? transcript : null;
  const summaryValue = summary?.trim() ? summary : null;

  if (transcriptValue === null && summaryValue === null) {
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
      {
        presentation_id: id,
        transcript: transcriptValue,
        summary: summaryValue,
      },
      { onConflict: "presentation_id" },
    )
    .select()
    .single();

  if (error) {
    return apiError("コメントの保存に失敗しました", 500);
  }

  return NextResponse.json({ comment: data });
}
