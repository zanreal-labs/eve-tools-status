import { MONITORS, REGIONS, type Region } from "./monitors";
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
}> {
  const r = kv();
  const dates = Array.from({ length: HISTORY_DAYS }, (_, i) =>
    dateStr(HISTORY_DAYS - 1 - i),
  );

  const pipe = r.pipeline();
  pipe.hgetall(K.latest);
  pipe.hgetall(K.lastRun);
  pipe.lrange(K.events, 0, 19);
  for (const date of dates) pipe.hgetall(K.day(date));
  const replies = await pipe.exec<unknown[]>();

  const latestRaw = (replies[0] ?? {}) as Record<string, unknown>;
  const lastRunRaw = (replies[1] ?? {}) as Record<string, unknown>;
  const eventsRaw = (replies[2] ?? []) as unknown[];
  const dayHashes = dates.map(
    (_, i) => (replies[3 + i] ?? {}) as Record<string, unknown>,
  );

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
  };
}
