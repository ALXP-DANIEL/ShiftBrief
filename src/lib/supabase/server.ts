// Minimal server-only Supabase REST (PostgREST) client. Dependency-free: it
// talks to the auto-generated REST API with the service role key. Only used
// when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are configured.

import { env } from "@/env";

export function isSupabaseConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

type RestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Querystring without the leading "?" (e.g. `code=eq.ABCDE&select=*`). */
  query?: string;
  body?: unknown;
  /** Extra Prefer header values, e.g. "return=representation". */
  prefer?: string;
};

/**
 * Perform a PostgREST request against a table and return the parsed rows.
 * Throws on non-2xx responses so the caller surfaces a 500.
 */
export async function sbRest<T>(
  table: string,
  options: RestOptions = {},
): Promise<T> {
  const { method = "GET", query, body, prefer } = options;
  const base = env.SUPABASE_URL?.replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Supabase is not configured");

  const url = `${base}/rest/v1/${table}${query ? `?${query}` : ""}`;
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Supabase ${method} ${table} failed: ${response.status} ${detail.slice(0, 200)}`,
    );
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
