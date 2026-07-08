import { NextResponse } from "next/server";

import { apiError, requireUser } from "@/lib/api/auth";
import { mapTagRows, TAG_SELECT, type RawTagRow } from "@/lib/api/mappers";
import type { CommentContent, PresentationDetail } from "@/lib/types/app";
import type { Material } from "@/lib/types/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data, error } = await auth.supabase
    .from("presentations")
    .select(
      `*, project:projects(id, name), comment:comments(id, transcript, summary, updated_at), materials(*), ${TAG_SELECT}`,
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return apiError("発表が見つかりません", 404);
  }

  const raw = data as unknown as {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    presented_at: string;
    created_at: string;
    updated_at: string;
    project: { id: string; name: string };
    comment: CommentContent | CommentContent[] | null;
    materials: Material[];
    presentation_tags: RawTagRow[];
  };

  const comment = Array.isArray(raw.comment)
    ? (raw.comment[0] ?? null)
    : raw.comment;

  const detail: PresentationDetail = {
    id: raw.id,
    project_id: raw.project_id,
    title: raw.title,
    description: raw.description,
    presented_at: raw.presented_at,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    project: raw.project,
    comment,
    materials: [...raw.materials].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
    tags: mapTagRows(raw.presentation_tags),
  };

  return NextResponse.json({ presentation: detail });
}
