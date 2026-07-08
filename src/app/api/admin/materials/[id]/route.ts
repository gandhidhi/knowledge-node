import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { MATERIALS_BUCKET } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: material } = await admin
    .from("materials")
    .select("*")
    .eq("id", id)
    .single();

  if (!material) {
    return apiError("資料が見つかりません", 404);
  }

  await admin.storage.from(MATERIALS_BUCKET).remove([material.storage_path]);

  const { error } = await admin.from("materials").delete().eq("id", id);

  if (error) {
    return apiError("資料の削除に失敗しました", 500);
  }

  return NextResponse.json({ ok: true });
}
