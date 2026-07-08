import { NextResponse } from "next/server";

import { apiError, requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("allowed_emails")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return apiError("メールアドレスの取得に失敗しました", 500);
  }

  return NextResponse.json({ emails: data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email)) {
    return apiError("メールアドレスの形式が正しくありません", 400);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("allowed_emails")
    .insert({ email })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return apiError("このメールアドレスは既に登録されています", 409);
    }
    return apiError("メールアドレスの追加に失敗しました", 500);
  }

  return NextResponse.json({ email: data }, { status: 201 });
}
