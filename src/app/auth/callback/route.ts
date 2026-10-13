import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** OAuth / マジックリンク等の code 交換用コールバック */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/projects";

  // Supabase がエラー時に付与するパラメータ（例: リンク失効 otp_expired）
  const errorCode =
    searchParams.get("error_code") ?? searchParams.get("error");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 失敗理由を login 画面に引き継いで、具体的なメッセージを出せるようにする
  const reason = errorCode ?? "auth_callback";
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(reason)}`,
  );
}
