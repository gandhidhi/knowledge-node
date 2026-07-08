import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { isAllowedFile, MAX_FILE_SIZE } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 資料メタデータの登録。
 * ファイル本体は Vercel のリクエストサイズ制限（4.5MB）を避けるため、
 * クライアントから Supabase Storage へ直接アップロードする（Storage RLS で管理者のみ許可）。
 * このエンドポイントはアップロード完了後のメタデータ登録を行う。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const fileName =
    typeof body?.file_name === "string" ? body.file_name.trim() : "";
  const storagePath =
    typeof body?.storage_path === "string" ? body.storage_path : "";
  const fileType = typeof body?.file_type === "string" ? body.file_type : "";
  const fileSize = typeof body?.file_size === "number" ? body.file_size : null;

  if (!fileName || !storagePath || !fileType) {
    return apiError("ファイル情報が不足しています", 400);
  }
  if (!isAllowedFile(fileName)) {
    return apiError("このファイル形式はアップロードできません", 400);
  }
  if (fileSize !== null && fileSize > MAX_FILE_SIZE) {
    return apiError("ファイルサイズは 50MB 以下にしてください", 400);
  }

  const admin = createAdminClient();

  const { data: presentation } = await admin
    .from("presentations")
    .select("id, project_id")
    .eq("id", id)
    .single();

  if (!presentation) {
    return apiError("発表が見つかりません", 404);
  }

  // storage_path が当該発表のフォルダ配下であることを確認
  const expectedPrefix = `${presentation.project_id}/${presentation.id}/`;
  if (!storagePath.startsWith(expectedPrefix)) {
    return apiError("ストレージパスが不正です", 400);
  }

  const { data, error } = await admin
    .from("materials")
    .insert({
      presentation_id: id,
      file_name: fileName,
      storage_path: storagePath,
      file_type: fileType,
      file_size: fileSize,
    })
    .select()
    .single();

  if (error) {
    return apiError("資料の登録に失敗しました", 500);
  }

  return NextResponse.json({ material: data }, { status: 201 });
}
