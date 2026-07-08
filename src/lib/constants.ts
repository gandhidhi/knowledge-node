/** ファイルアップロードの最大サイズ (NFR-3: 50MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** アップロードを許可するファイル拡張子 */
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "md",
] as const;

/** Supabase Storage の資料用バケット名 */
export const MATERIALS_BUCKET = "materials";

/** ファイル名から拡張子（小文字）を取り出す */
export function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx + 1).toLowerCase();
}

/** アップロード可能なファイルかどうか */
export function isAllowedFile(fileName: string): boolean {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(
    getExtension(fileName),
  );
}
