import type { SupabaseClient } from "@supabase/supabase-js";

import { MATERIALS_BUCKET } from "@/lib/constants";
import type { Database } from "@/lib/types/database";

type AdminClient = SupabaseClient<Database>;

/** 指定プレフィックス配下の全ファイルパスを再帰的に列挙する */
async function listAllFiles(
  admin: AdminClient,
  prefix: string,
): Promise<string[]> {
  const { data, error } = await admin.storage
    .from(MATERIALS_BUCKET)
    .list(prefix, { limit: 1000 });

  if (error || !data) return [];

  const paths: string[] = [];
  for (const entry of data) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id) {
      paths.push(fullPath);
    } else {
      // id が null のエントリはフォルダ
      paths.push(...(await listAllFiles(admin, fullPath)));
    }
  }
  return paths;
}

/** 指定プレフィックス配下の Storage オブジェクトをすべて削除する */
export async function removeStorageFolder(
  admin: AdminClient,
  prefix: string,
): Promise<void> {
  const files = await listAllFiles(admin, prefix);
  if (files.length > 0) {
    await admin.storage.from(MATERIALS_BUCKET).remove(files);
  }
}
