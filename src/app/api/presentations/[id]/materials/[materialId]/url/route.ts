import { NextResponse } from "next/server";

import { apiError, requireUser } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const SIGNED_URL_EXPIRES_IN = 60 * 60; // 1時間

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; materialId: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id, materialId } = await params;

  // RLS の効いたユーザークライアントで資料の存在を確認
  const { data: material, error } = await auth.supabase
    .from("materials")
    .select("*")
    .eq("id", materialId)
    .eq("presentation_id", id)
    .single();

  if (error || !material) {
    return apiError("資料が見つかりません", 404);
  }

  const admin = createAdminClient();
  const [preview, download] = await Promise.all([
    admin.storage
      .from("materials")
      .createSignedUrl(material.storage_path, SIGNED_URL_EXPIRES_IN),
    admin.storage
      .from("materials")
      .createSignedUrl(material.storage_path, SIGNED_URL_EXPIRES_IN, {
        download: material.file_name,
      }),
  ]);

  if (preview.error || !preview.data || download.error || !download.data) {
    return apiError("URL の発行に失敗しました", 500);
  }

  return NextResponse.json({
    url: preview.data.signedUrl,
    downloadUrl: download.data.signedUrl,
    fileName: material.file_name,
    fileType: material.file_type,
  });
}
