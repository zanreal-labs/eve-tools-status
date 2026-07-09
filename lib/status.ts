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

export async function loadStatus(): Promise<{
  monitors: Record<string, MonitorStatus>;
  lastRun: number | null;
  events: StatusEvent[];
  openIncidents: Record<string, string>;
}> {
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
};

export type MonitorDetail = {
  monitor: Monitor;
  regions: RegionDetail[];
  days: DayStat[]; // aggregated across regions
  uptimePct: number | null;
  openIncidentId: string | null;
  incidents: IncidentSummary[];
};

export async function loadMonitorDetail(
  monitorId: string,
): Promise<MonitorDetail | null> {
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
}
