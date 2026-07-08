import { MONITORS, REGIONS, type Region } from "./monitors";
import {
  PATHS,
  readAllState,
  type LatestFile,
  type HistoryFile,
  type StatusEvent as StoreEvent,
} from "./store";

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

export type StatusEvent = {
  ts: number;
  monitorId: string;
  region: Region;
  ok: boolean;
  status: number;
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

export async function loadStatus(): Promise<{
  monitors: Record<string, MonitorStatus>;
  lastRun: number | null;
  events: StatusEvent[];
}> {
  const state = await readAllState();
  const dates = Array.from({ length: HISTORY_DAYS }, (_, i) =>
    dateStr(HISTORY_DAYS - 1 - i),
  );

  const latestByRegion: Partial<Record<Region, LatestFile>> = {};
  const historyByRegion: Partial<Record<Region, HistoryFile>> = {};
  let events: StatusEvent[] = [];

  for (const region of REGIONS) {
    const latest = state.get(PATHS.latest(region)) as LatestFile | undefined;
    if (latest) latestByRegion[region] = latest;
    const history = state.get(PATHS.history(region)) as HistoryFile | undefined;
    if (history) historyByRegion[region] = history;
    const regionEvents = state.get(PATHS.events(region)) as
      | StoreEvent[]
      | undefined;
    if (regionEvents) events.push(...(regionEvents as StatusEvent[]));
  }

  events = events.sort((a, b) => b.ts - a.ts).slice(0, 20);

  const monitors: Record<string, MonitorStatus> = {};
  for (const m of MONITORS) {
    const latest: Partial<Record<Region, LatestEntry>> = {};
    for (const region of REGIONS) {
      const file = latestByRegion[region];
      const r = file?.results[m.id];
      if (file && r) {
        latest[region] = { ok: r.ok, status: r.status, ms: r.ms, ts: file.ts };
      }
    }

    const days: DayStat[] = dates.map((date) => {
      let total = 0;
      let ok = 0;
      for (const region of REGIONS) {
        const agg = historyByRegion[region]?.[date]?.[m.id];
        if (agg) {
          total += agg.total;
          ok += agg.ok;
        }
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

  const runTimestamps = Object.values(latestByRegion)
    .map((f) => f?.ts ?? 0)
    .filter(Boolean);

  return {
    monitors,
    lastRun: runTimestamps.length ? Math.max(...runTimestamps) : null,
    events,
  };
}
