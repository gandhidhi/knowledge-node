import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * パスワード再設定メールのリンク先。
 * PKCE の code をセッションに交換し、新パスワード入力ページへ遷移させる。
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password`);
    }
  }

  // 失敗理由を引き継ぎ、再送を促せる /forgot-password へ戻す
  const reason =
    searchParams.get("error_code") ?? searchParams.get("error") ?? "auth_reset";
  return NextResponse.redirect(
    `${origin}/forgot-password?error=${encodeURIComponent(reason)}`,
  );
}
