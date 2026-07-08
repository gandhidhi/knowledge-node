import type { TagWithCategory } from "@/lib/types/app";

/** presentation_tags のネスト select 結果の行 */
export type RawTagRow = {
  tag: {
    id: string;
    category_id: string;
    value: string;
    created_at: string;
    category: {
      id: string;
      name: string;
      sort_order: number;
    } | null;
  } | null;
};

/** ネストされたタグ join 結果を TagWithCategory[] に変換する */
export function mapTagRows(rows: RawTagRow[] | null | undefined): TagWithCategory[] {
  const tags = (rows ?? [])
    .map((row) => row.tag)
    .filter((tag): tag is NonNullable<RawTagRow["tag"]> => tag != null)
    .map((tag) => ({
      id: tag.id,
      category_id: tag.category_id,
      value: tag.value,
      created_at: tag.created_at,
      category_name: tag.category?.name ?? "",
      category_sort_order: tag.category?.sort_order ?? 0,
    }));

  return tags.sort(
    (a, b) =>
      a.category_sort_order - b.category_sort_order ||
      a.category_name.localeCompare(b.category_name, "ja") ||
      a.value.localeCompare(b.value, "ja"),
  );
}

/** タグ join を含む select 句（発表用） */
export const TAG_SELECT =
  "presentation_tags(tag:tags(id, category_id, value, created_at, category:tag_categories(id, name, sort_order)))";
