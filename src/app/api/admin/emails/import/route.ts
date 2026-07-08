import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailImportResult } from "@/lib/types/app";
import { parseEmailCsv } from "@/lib/utils/csv-parser";

/** CSV による許可メールアドレスの一括登録 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return apiError("CSV ファイルを指定してください", 400);
  }

  const text = await file.text();
  const { valid, invalid } = parseEmailCsv(text);

  if (valid.length === 0) {
    return apiError("有効なメールアドレスが見つかりませんでした", 400);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("allowed_emails")
    .upsert(
      valid.map((email) => ({ email })),
      { onConflict: "email", ignoreDuplicates: true },
    )
    .select();

  if (error) {
    return apiError("メールアドレスの登録に失敗しました", 500);
  }

  const added = data?.length ?? 0;
  const result: EmailImportResult = {
    added,
    skipped: valid.length - added,
    invalid,
  };

  return NextResponse.json(result);
}
