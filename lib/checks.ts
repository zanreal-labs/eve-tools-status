import { MONITORS, type Region } from "./monitors";
import {
  PATHS,
  readJson,
  writeJson,
  HISTORY_RETENTION_DAYS,
  type LatestFile,
  type HistoryFile,
  type StatusEvent,
} from "./store";

export type CheckResult = {
  monitorId: string;
  ok: boolean;
  status: number;
  latencyMs: number;
};

const CHECK_TIMEOUT_MS = 10_000;
const EVENTS_MAX = 100;
const USER_AGENT = "eve-tools-status/1.0 (uptime monitor; +https://eve-tools-status.vercel.app)";

async function checkOne(monitorId: string, url: string): Promise<CheckResult> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { "user-agent": USER_AGENT, accept: "*/*" },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    // Drain body so latency reflects a full response.
    await res.arrayBuffer().catch(() => undefined);
    return {
      monitorId,
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      latencyMs: Date.now() - started,
    };
  } catch {
    return { monitorId, ok: false, status: 0, latencyMs: Date.now() - started };
  }
}

export async function runChecks(region: Region): Promise<CheckResult[]> {
  const [results, prevLatest, prevHistory, prevEvents] = await Promise.all([
    Promise.all(MONITORS.map((m) => checkOne(m.id, m.url))),
    readJson<LatestFile>(PATHS.latest(region)),
    readJson<HistoryFile>(PATHS.history(region)),
    readJson<StatusEvent[]>(PATHS.events(region)),
  ]);

  const now = Date.now();
  const date = new Date(now).toISOString().slice(0, 10);

  // Latest snapshot for this region.
  const latest: LatestFile = { ts: now, results: {} };
  for (const r of results) {
    latest.results[r.monitorId] = { ok: r.ok, status: r.status, ms: r.latencyMs };
  }

  // Status transitions vs the previous run in this region.
  const newEvents: StatusEvent[] = [];
  for (const r of results) {
    const prevOk = prevLatest?.results[r.monitorId]?.ok ?? null;
    const isTransition = prevOk === null ? !r.ok : prevOk !== r.ok;
    if (isTransition) {
      newEvents.push({
        ts: now,
        monitorId: r.monitorId,
        region,
        ok: r.ok,
        status: r.status,
      });
    }
  }
  const events = [...newEvents, ...(prevEvents ?? [])].slice(0, EVENTS_MAX);

  // Daily aggregates, pruned to the retention window.
  const history: HistoryFile = prevHistory ?? {};
  const cutoff = new Date(now - HISTORY_RETENTION_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  for (const d of Object.keys(history)) {
    if (d < cutoff) delete history[d];
  }
  const day = (history[date] ??= {});
  for (const r of results) {
    const agg = (day[r.monitorId] ??= { ok: 0, total: 0, msSum: 0 });
    agg.total += 1;
    if (r.ok) agg.ok += 1;
    agg.msSum += r.latencyMs;
  }

  await Promise.all([
    writeJson(PATHS.latest(region), latest),
    writeJson(PATHS.history(region), history),
    newEvents.length > 0
      ? writeJson(PATHS.events(region), events)
      : Promise.resolve(),
  ]);

  return results;
}

export function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
