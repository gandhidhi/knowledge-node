const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export type ParsedEmails = {
  valid: string[];
  invalid: string[];
};

/**
 * CSV テキストからメールアドレスを抽出する。
 * - 改行・カンマ・セミコロン区切りに対応
 * - 前後の空白と引用符を除去
 * - ヘッダー行（"email" 等）はスキップ
 * - 小文字化して重複を除去
 */
export function parseEmailCsv(text: string): ParsedEmails {
  const tokens = text
    .split(/[\r\n,;]+/)
    .map((t) => t.trim().replace(/^["']|["']$/g, "").trim())
    .filter((t) => t.length > 0);

  const valid = new Set<string>();
  const invalid: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    // よくあるヘッダー行はスキップ
    if (lower === "email" || lower === "mail" || lower === "メールアドレス") {
      continue;
    }
    if (EMAIL_RE.test(lower)) {
      valid.add(lower);
    } else {
      invalid.push(token);
    }
  }

  return { valid: [...valid], invalid };
}
