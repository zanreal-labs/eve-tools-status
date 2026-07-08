import { MONITORS, REGIONS, type Region } from "./monitors";
import { redis, K } from "./redis";

export type LatestEntry = {
  ok: boolean;
  status: number;
  ms: number;
  ts: number;
};

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

export type StatusEvent = {
  ts: number;
  monitorId: string;
  region: Region;
  ok: boolean;
  status: number;
};

export async function loadStatus(): Promise<{
  monitors: Record<string, MonitorStatus>;
  lastRun: number | null;
  events: StatusEvent[];
}> {
  const r = redis();
  const dates = Array.from({ length: HISTORY_DAYS }, (_, i) =>
    dateStr(HISTORY_DAYS - 1 - i),
  );

  const pipe = r.pipeline();
  pipe.hgetall(K.latest);
  pipe.hgetall(K.lastRun);
  pipe.lrange(K.events, 0, 19);
  for (const m of MONITORS) {
    for (const date of dates) {
      for (const region of REGIONS) {
        pipe.hgetall(K.day(date, m.id, region));
      }
    }
  }
  const replies = (await pipe.exec()) ?? [];
  const value = (i: number) =>
    (replies[i]?.[1] ?? {}) as Record<string, string>;

  const latestRaw = value(0);
  const lastRunRaw = value(1);
  const eventsRaw = (replies[2]?.[1] ?? []) as string[];

  const monitors: Record<string, MonitorStatus> = {};
  let idx = 3;

  for (const m of MONITORS) {
    const latest: Partial<Record<Region, LatestEntry>> = {};
    for (const region of REGIONS) {
      const raw = latestRaw[`${m.id}:${region}`];
      if (raw) {
        try {
          latest[region] = JSON.parse(raw);
        } catch {}
      }
    }

    const days: DayStat[] = [];
    for (const date of dates) {
      let total = 0;
      let ok = 0;
      for (let ri = 0; ri < REGIONS.length; ri++) {
        const h = value(idx++);
        total += Number(h.total ?? 0);
        ok += Number(h.ok ?? 0);
      }
      days.push({ date, total, ok, fail: total - ok });
    }

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
    try {
      events.push(JSON.parse(raw));
    } catch {}
  }

  const runTimestamps = Object.values(lastRunRaw).map(Number).filter(Boolean);
  return {
    monitors,
    lastRun: runTimestamps.length ? Math.max(...runTimestamps) : null,
    events,
  };
}
