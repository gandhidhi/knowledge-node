// API レスポンス等のアプリケーション共通型

import type {
  Material,
  Presentation,
  Project,
  Tag,
  TagCategory,
} from "./database";

/** タグ（カテゴリ情報付き） */
export type TagWithCategory = Tag & {
  category_name: string;
  category_sort_order: number;
};

/** カテゴリとその配下のタグ一覧 */
export type CategoryWithTags = TagCategory & {
  tags: Pick<Tag, "id" | "value">[];
};

/** プロジェクト（発表数付き） */
export type ProjectWithCount = Project & {
  presentation_count: number;
};

/** 発表一覧アイテム */
export type PresentationListItem = Presentation & {
  tags: TagWithCategory[];
};

/** 発表詳細 */
export type PresentationDetail = Presentation & {
  project: Pick<Project, "id" | "name">;
  comment: { id: string; content: string; updated_at: string } | null;
  materials: Material[];
  tags: TagWithCategory[];
};

/** 発表一覧 API レスポンス */
export type PresentationListResponse = {
  presentations: PresentationListItem[];
  total: number;
  page: number;
  limit: number;
};

/** CSV インポート結果 */
export type EmailImportResult = {
  added: number;
  skipped: number;
  invalid: string[];
};
