import { NextResponse } from "next/server";

import { apiError, requireUser } from "@/lib/api/auth";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("projects")
    .select("*, presentations(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return apiError("プロジェクトの取得に失敗しました", 500);
  }

  const projects = data.map(({ presentations, ...project }) => ({
    ...project,
    presentation_count: presentations?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ projects });
}
