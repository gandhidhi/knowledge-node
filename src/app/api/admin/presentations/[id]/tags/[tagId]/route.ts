import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** 発表からのタグ解除 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id, tagId } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("presentation_tags")
    .delete()
    .eq("presentation_id", id)
    .eq("tag_id", tagId);

  if (error) {
    return apiError("タグ解除に失敗しました", 500);
  }

  return NextResponse.json({ ok: true });
}
