import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Database, Profile } from "@/lib/types/database";

type ServerClient = SupabaseClient<Database>;

type AuthOk = {
  ok: true;
  supabase: ServerClient;
  user: User;
};

type AuthNg = {
  ok: false;
  response: NextResponse;
};

type AdminOk = AuthOk & { profile: Profile };

/** 認証済みユーザーであることを要求する（API Route 用） */
export async function requireUser(): Promise<AuthOk | AuthNg> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "認証が必要です" }, { status: 401 }),
    };
  }

  return { ok: true, supabase, user };
}

/** 管理者ロールであることを要求する（管理系 API Route 用） */
export async function requireAdmin(): Promise<AdminOk | AuthNg> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 },
      ),
    };
  }

  return { ...auth, profile };
}

/** API のエラーレスポンスを生成する */
export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
