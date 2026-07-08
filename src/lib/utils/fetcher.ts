/** API Route への fetch ラッパー。エラー時は message 付きで throw する。 */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      body && typeof body.error === "string"
        ? body.error
        : `リクエストに失敗しました (${res.status})`;
    throw new Error(message);
  }

  return body as T;
}
