import { NextResponse } from "next/server";

import { apiError, requireUser } from "@/lib/api/auth";
import type { CategoryWithTags } from "@/lib/types/app";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("tag_categories")
    .select("*, tags(id, value)")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return apiError("タグの取得に失敗しました", 500);
  }

  const categories: CategoryWithTags[] = data.map((category) => ({
    ...category,
    tags: [...category.tags].sort((a, b) =>
      a.value.localeCompare(b.value, "ja"),
    ),
  }));

  return NextResponse.json({ categories });
}
