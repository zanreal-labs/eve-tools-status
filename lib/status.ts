import { cache } from "react";
import { cacheLife } from "next/cache";
import { MONITORS, REGIONS, type Monitor, type Region } from "./monitors";
import { kv, K } from "./kv";
import type { LatestEntry, StatusEvent } from "./checks";

export type { LatestEntry, StatusEvent };

export type DayStat = {
  date: string;
  total: number;
  ok: number;
  fail: number;
};

export type MonitorStatus = {
  monitorId: string;
  latest: Partial<Record<Region, LatestEntry>>;
  days: DayStat[]; // oldest → newest
  uptimePct: number | null;
};

export const HISTORY_DAYS = 45;

/* The cron rewrites every KV key once per 15 minutes, so rendering a status
 * surface per request buys no freshness - it just multiplies KV round-trips
 * and function invocations by traffic. One profile covers all of them:
 *   revalidate 60  - a check that lands shows up within a minute
 *   expire     600 - a cold page refreshes well inside one check cycle, so
 *                    cached output is never older than the data a fresh
 *                    render would have found
 * `expire` stays above 5 minutes deliberately: shorter lifetimes are excluded
 * from prerendering and fall back to per-request rendering, which is the cost
 * this profile exists to remove. */
const STATUS_CACHE_LIFE = { stale: 60, revalidate: 60, expire: 600 };

/** A KV failure must not escape a `use cache` scope: an error thrown inside
 *  one fails the whole prerender instead of reaching the caller's catch. The
 *  cached loaders report failure as a value; the exported wrappers turn it
 *  back into a rejection, which is what every call site already handles. */
type Loaded<T> = { ok: true; value: T } | { ok: false };

function unavailable(): Error {
  return new Error("status data unavailable");
}

function dateStr(offsetDays: number): string {
  const d = new Date(Date.now() - offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function toEntry(v: unknown): LatestEntry | null {
  if (v == null) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return v as LatestEntry;
}

export type StatusSnapshot = {
  monitors: Record<string, MonitorStatus>;
  lastRun: number | null;
  events: StatusEvent[];
  openIncidents: Record<string, string>;
};

const readStatus = async (): Promise<StatusSnapshot> => {
  const r = kv();
  const dates = Array.from({ length: HISTORY_DAYS }, (_, i) =>
    dateStr(HISTORY_DAYS - 1 - i),
  );

  const pipe = r.pipeline();
  pipe.hgetall(K.latest);
  pipe.hgetall(K.lastRun);
  pipe.lrange(K.events, 0, 19);
  pipe.mget(...MONITORS.map((m) => K.open(m.id)));
  for (const date of dates) pipe.hgetall(K.day(date));
  const replies = await pipe.exec<unknown[]>();

  const latestRaw = (replies[0] ?? {}) as Record<string, unknown>;
  const lastRunRaw = (replies[1] ?? {}) as Record<string, unknown>;
  const eventsRaw = (replies[2] ?? []) as unknown[];
  const openRaw = (replies[3] ?? []) as (string | null)[];
  const dayHashes = dates.map(
    (_, i) => (replies[4 + i] ?? {}) as Record<string, unknown>,
  );

  const openIncidents: Record<string, string> = {};
  MONITORS.forEach((m, i) => {
    if (openRaw[i]) openIncidents[m.id] = openRaw[i]!;
  });

  const monitors: Record<string, MonitorStatus> = {};
  for (const m of MONITORS) {
    const latest: Partial<Record<Region, LatestEntry>> = {};
    for (const region of REGIONS) {
      const e = toEntry(latestRaw[`${m.id}:${region}`]);
      if (e) latest[region] = e;
    }

    const days: DayStat[] = dates.map((date, i) => {
      const h = dayHashes[i];
      let total = 0;
      let ok = 0;
      for (const region of REGIONS) {
        total += Number(h[`${m.id}:${region}:total`] ?? 0);
        ok += Number(h[`${m.id}:${region}:ok`] ?? 0);
      }
      return { date, total, ok, fail: total - ok };
    });

    const grandTotal = days.reduce((s, d) => s + d.total, 0);
    const grandOk = days.reduce((s, d) => s + d.ok, 0);
    monitors[m.id] = {
      monitorId: m.id,
      latest,
      days,
      uptimePct: grandTotal > 0 ? (grandOk / grandTotal) * 100 : null,
    };
  }

  const events: StatusEvent[] = [];
  for (const raw of eventsRaw) {
    if (typeof raw === "string") {
      try {
        events.push(JSON.parse(raw));
      } catch {}
    } else if (raw && typeof raw === "object") {
      events.push(raw as StatusEvent);
    }
  }

  const runTimestamps = Object.values(lastRunRaw).map(Number).filter(Boolean);
  return {
    monitors,
    lastRun: runTimestamps.length ? Math.max(...runTimestamps) : null,
    events,
    openIncidents,
  };
};

const loadStatusImpl = async (): Promise<Loaded<StatusSnapshot>> => {
  "use cache";
  cacheLife(STATUS_CACHE_LIFE);
  try {
    return { ok: true, value: await readStatus() };
  } catch {
    return { ok: false };
  }
};

const loadStatusCached = cache(loadStatusImpl);

/** One KV round-trip per revalidation serves the whole site instead of one
 *  per request; `cache()` also dedupes the Suspense islands that share it
 *  inside a single render. Rejects when KV is unreachable. */
export async function loadStatus(): Promise<StatusSnapshot> {
  const result = await loadStatusCached();
  if (!result.ok) throw unavailable();
  return result.value;
}

export type RegionDayStat = DayStat & { avgMs: number | null };

export type RegionDetail = {
  region: Region;
  latest: LatestEntry | null;
  days: RegionDayStat[];
  uptimePct: number | null;
  avgMs: number | null;
};

export type IncidentSummary = {
  id: string;
  startedAt: number;
  endedAt?: number;
  kind?: "maint";
};

export type MonitorDetail = {
  monitor: Monitor;
  regions: RegionDetail[];
  days: DayStat[]; // aggregated across regions
  uptimePct: number | null;
  openIncidentId: string | null;
  incidents: IncidentSummary[];
};

const readMonitorDetail = async (
  monitorId: string,
): Promise<MonitorDetail | null> => {
  const monitor = MONITORS.find((m) => m.id === monitorId);
  if (!monitor) return null;

  const r = kv();
  const dates = Array.from({ length: HISTORY_DAYS }, (_, i) =>
    dateStr(HISTORY_DAYS - 1 - i),
  );

  const pipe = r.pipeline();
  pipe.hmget(K.latest, ...REGIONS.map((rg) => `${monitorId}:${rg}`));
  pipe.get(K.open(monitorId));
  pipe.lrange(K.incidents, 0, 499);
  for (const date of dates) pipe.hgetall(K.day(date));
  const replies = await pipe.exec<unknown[]>();

  const latestRaw = (replies[0] ?? {}) as Record<string, unknown>;
  const openIncidentId = (replies[1] as string | null) ?? null;
  const incidentIds = ((replies[2] ?? []) as string[]).filter((id) =>
    id.startsWith(`${monitorId}-`),
  );
  const dayHashes = dates.map(
    (_, i) => (replies[3 + i] ?? {}) as Record<string, unknown>,
  );

  const regions: RegionDetail[] = REGIONS.map((region) => {
    const latest = toEntry(latestRaw[`${monitorId}:${region}`]);
    const days: RegionDayStat[] = dates.map((date, i) => {
      const h = dayHashes[i];
      const total = Number(h[`${monitorId}:${region}:total`] ?? 0);
      const ok = Number(h[`${monitorId}:${region}:ok`] ?? 0);
      const msSum = Number(h[`${monitorId}:${region}:msSum`] ?? 0);
      return {
        date,
        total,
        ok,
        fail: total - ok,
        avgMs: total > 0 ? Math.round(msSum / total) : null,
      };
    });
    const total = days.reduce((s, d) => s + d.total, 0);
    const okCount = days.reduce((s, d) => s + d.ok, 0);
    const msSum = days.reduce(
      (s, d) => s + (d.avgMs != null ? d.avgMs * d.total : 0),
      0,
    );
    return {
      region,
      latest,
      days,
      uptimePct: total > 0 ? (okCount / total) * 100 : null,
      avgMs: total > 0 ? Math.round(msSum / total) : null,
    };
  });

  const days: DayStat[] = dates.map((date, i) => {
    let total = 0;
    let ok = 0;
    for (const rd of regions) {
      total += rd.days[i].total;
      ok += rd.days[i].ok;
    }
    return { date, total, ok, fail: total - ok };
  });
  const grandTotal = days.reduce((s, d) => s + d.total, 0);
  const grandOk = days.reduce((s, d) => s + d.ok, 0);

  let incidents: IncidentSummary[] = [];
  const wanted = incidentIds.slice(0, 15);
  if (wanted.length > 0) {
    const ipipe = r.pipeline();
    for (const id of wanted) ipipe.hgetall(K.incident(id));
    const metas = await ipipe.exec<Record<string, unknown>[]>();
    incidents = metas
      .map((meta, i) => ({
        id: wanted[i],
        startedAt: Number(meta?.startedAt ?? 0),
        endedAt: meta?.endedAt ? Number(meta.endedAt) : undefined,
        kind: meta?.kind === "maint" ? ("maint" as const) : undefined,
      }))
      .filter((x) => x.startedAt > 0)
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  return {
    monitor,
    regions,
    days,
    uptimePct: grandTotal > 0 ? (grandOk / grandTotal) * 100 : null,
    openIncidentId,
    incidents,
  };
};

const loadMonitorDetailImpl = async (
  monitorId: string,
): Promise<Loaded<MonitorDetail | null>> => {
  "use cache";
  cacheLife(STATUS_CACHE_LIFE);
  try {
    return { ok: true, value: await readMonitorDetail(monitorId) };
  } catch {
    return { ok: false };
  }
};

const loadMonitorDetailCached = cache(loadMonitorDetailImpl);

/** Resolves to null for an unknown monitor id and rejects when KV is
 *  unreachable - callers rely on that distinction (404 vs 503). */
export async function loadMonitorDetail(
  monitorId: string,
): Promise<MonitorDetail | null> {
  const result = await loadMonitorDetailCached(monitorId);
  if (!result.ok) throw unavailable();
  return result.value;
}

export type IncidentFeedItem = {
  id: string;
  monitorId: string;
  kind: "outage" | "maint";
  startedAt: number;
  endedAt: number | null;
  /** Regions that reported the failure/maintenance. */
  regions: Region[];
  /** Sample failure signature, e.g. "HTTP 503" or "timeout"; null for maint. */
  reason: string | null;
};

/** Full incident history for the events page — everything within the
 *  uptime window, sourced from the persistent incident records rather
 *  than the small rolling event buffer. */
const readIncidentFeed = async (
  windowDays: number,
): Promise<IncidentFeedItem[]> => {
  const r = kv();
  const ids = (await r.lrange<string>(K.incidents, 0, 199)) ?? [];
  if (ids.length === 0) return [];

  // Two phases on purpose: the metadata hashes are cheap and decide which
  // incidents fall inside the window, so the event lists - the expensive
  // half - are only fetched for the ones that will actually be rendered.
  const metaPipe = r.pipeline();
  for (const id of ids) metaPipe.hgetall(K.incident(id));
  const metas = await metaPipe.exec<(Record<string, unknown> | null)[]>();

  const cutoff = Date.now() - windowDays * 86_400_000;
  const kept: { id: string; meta: Record<string, unknown> }[] = [];
  ids.forEach((id, i) => {
    const meta = metas[i] ?? {};
    if (!meta.monitorId || Number(meta.startedAt ?? 0) < cutoff) return;
    kept.push({ id, meta });
  });
  if (kept.length === 0) return [];

  const eventsPipe = r.pipeline();
  for (const { id } of kept) eventsPipe.lrange(K.incidentEvents(id), 0, 99);
  const eventReplies = await eventsPipe.exec<(unknown[] | null)[]>();

  const items: IncidentFeedItem[] = [];
  kept.forEach(({ id, meta }, i) => {
    const rawEvents = eventReplies[i] ?? [];
    const startedAt = Number(meta.startedAt ?? 0);

    const events: StatusEvent[] = [];
    for (const raw of rawEvents) {
      if (typeof raw === "string") {
        try {
          events.push(JSON.parse(raw));
        } catch {}
      } else if (raw && typeof raw === "object") {
        events.push(raw as StatusEvent);
      }
    }
    const down = events.filter((e) => !e.ok);
    const sample = down[0];
    items.push({
      id,
      monitorId: String(meta.monitorId),
      kind: meta.kind === "maint" ? "maint" : "outage",
      startedAt,
      endedAt: meta.endedAt ? Number(meta.endedAt) : null,
      regions: [...new Set(down.map((e) => e.region))],
      reason:
        meta.kind === "maint" || !sample
          ? null
          : sample.status > 0
            ? `HTTP ${sample.status}`
            : "timeout",
    });
  });

  return items.sort(
    (a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt),
  );
};

const loadIncidentFeedImpl = async (
  windowDays: number,
): Promise<Loaded<IncidentFeedItem[]>> => {
  "use cache";
  cacheLife(STATUS_CACHE_LIFE);
  try {
    return { ok: true, value: await readIncidentFeed(windowDays) };
  } catch {
    return { ok: false };
  }
};

const loadIncidentFeedCached = cache(loadIncidentFeedImpl);

export async function loadIncidentFeed(
  windowDays = HISTORY_DAYS,
): Promise<IncidentFeedItem[]> {
  const result = await loadIncidentFeedCached(windowDays);
  if (!result.ok) throw unavailable();
  return result.value;
}
