import { list, put } from "@vercel/blob";

export const HISTORY_RETENTION_DAYS = 100;

export type LatestFile = {
  ts: number;
  results: Record<string, { ok: boolean; status: number; ms: number }>;
};

export type HistoryFile = Record<
  string, // YYYY-MM-DD
  Record<string, { ok: number; total: number; msSum: number }>
>;

export type StatusEvent = {
  ts: number;
  monitorId: string;
  region: string;
  ok: boolean;
  status: number;
};

export const PATHS = {
  latest: (region: string) => `state/latest-${region}.json`,
  history: (region: string) => `state/history-${region}.json`,
  events: (region: string) => `state/events-${region}.json`,
};

export async function writeJson(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function readJson<T>(pathname: string): Promise<T | null> {
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  const blob = blobs.find((b) => b.pathname === pathname);
  if (!blob) return null;
  return fetchJson<T>(blob.url);
}

/** Read every state/* file in one list call. Returns pathname → parsed JSON. */
export async function readAllState(): Promise<Map<string, unknown>> {
  const { blobs } = await list({ prefix: "state/", limit: 100 });
  const entries = await Promise.all(
    blobs.map(async (b) => [b.pathname, await fetchJson(b.url)] as const),
  );
  const map = new Map<string, unknown>();
  for (const [pathname, data] of entries) {
    if (data !== null) map.set(pathname, data);
  }
  return map;
}
