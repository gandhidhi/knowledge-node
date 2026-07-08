import { NextResponse } from "next/server";

import { apiError, requireUser } from "@/lib/api/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data, error } = await auth.supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return apiError("プロジェクトが見つかりません", 404);
  }

  return NextResponse.json({ project: data });
}
