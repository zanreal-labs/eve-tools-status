import { MONITORS, REGIONS, type Region } from "./monitors";
import { kv, K, DAY_TTL_SECONDS, EVENTS_MAX } from "./kv";

export type CheckResult = {
  monitorId: string;
  ok: boolean;
  status: number;
  latencyMs: number;
  maint?: boolean;
};

export type LatestEntry = {
  ok: boolean;
  status: number;
  ms: number;
  ts: number;
  maint?: boolean;
};

export type StatusEvent = {
  ts: number;
  monitorId: string;
  region: Region;
  ok: boolean;
  status: number;
  incidentId?: string;
  /** Planned-maintenance event: ok=false → started, ok=true → ended. */
  maint?: boolean;
};

export const CHECK_TIMEOUT_MS = 10_000;
/** Pause between the two attempts. Long enough to separate them into two
 *  independent rounds, short enough that a down monitor does not hold the
 *  whole region batch - and every other probe with it - open for seconds. */
export const RETRY_DELAY_MS = 500;
export const USER_AGENT =
  "Mozilla/5.0 (compatible; EveToolsStatusBot/1.0; +https://eve-tools-status.com/docs)";

async function attempt(
  monitorId: string,
  url: string,
  timeoutMs: number,
): Promise<CheckResult> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { "user-agent": USER_AGENT, accept: "*/*" },
      signal: AbortSignal.timeout(timeoutMs),
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

async function checkOne(
  monitorId: string,
  url: string,
  timeoutMs = CHECK_TIMEOUT_MS,
): Promise<CheckResult> {
  const first = await attempt(monitorId, url, timeoutMs);
  if (first.ok) return first;
  // One retry after a short pause — a single slow round shouldn't page as down.
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  return attempt(monitorId, url, timeoutMs);
}

function inMaintenanceWindow(m: (typeof MONITORS)[number], ts: number): boolean {
  if (!m.maintenance) return false;
  const d = new Date(ts);
  const minute = d.getUTCHours() * 60 + d.getUTCMinutes();
  return minute >= m.maintenance.fromMinute && minute < m.maintenance.toMinute;
}

export async function runChecks(region: Region): Promise<CheckResult[]> {
  const r = kv();
  const fields = MONITORS.map((m) => `${m.id}:${region}`);
  const [rawResults, prevRaw] = await Promise.all([
    Promise.all(MONITORS.map((m) => checkOne(m.id, m.url, m.timeoutMs))),
    r.hmget<Record<string, LatestEntry | null>>(K.latest, ...fields),
  ]);

  // Failures inside a planned-maintenance window count as maintenance, not
  // outage: no incident, no uptime penalty, distinct UI state.
  const results = rawResults.map((res) => {
    const m = MONITORS.find((mm) => mm.id === res.monitorId);
    if (!res.ok && m && inMaintenanceWindow(m, Date.now())) {
      return { ...res, ok: true, maint: true };
    }
    return res;
  });

  const now = Date.now();
  const date = new Date(now).toISOString().slice(0, 10);

  // Status transitions vs the previous run in this region.
  const events: StatusEvent[] = [];
  for (const res of results) {
    const prev = prevRaw?.[`${res.monitorId}:${region}`] ?? null;
    const prevOk = prev?.ok ?? null;
    const prevMaint = prev?.maint ?? false;
    const base = {
      ts: now,
      monitorId: res.monitorId,
      region,
      status: res.status,
    };
    if (res.maint) {
      if (!prevMaint) events.push({ ...base, ok: false, maint: true }); // maintenance started
    } else if (prevMaint) {
      if (res.ok) events.push({ ...base, ok: true, maint: true }); // maintenance ended
      else events.push({ ...base, ok: false }); // real outage after the window
    } else {
      const isTransition = prevOk === null ? !res.ok : prevOk !== res.ok;
      if (isTransition) events.push({ ...base, ok: res.ok });
    }
  }

  const latestUpdate: Record<string, LatestEntry> = {};
  for (const res of results) {
    latestUpdate[`${res.monitorId}:${region}`] = {
      ok: res.ok,
      status: res.status,
      ms: res.latencyMs,
      ts: now,
      ...(res.maint ? { maint: true } : {}),
    };
  }

  // Incident bookkeeping — permalink pages live off these records.
  // Maintenance and outage incidents use separate open pointers and id
  // prefixes ("<mid>-m<ts>" vs "<mid>-<ts>").
  for (const e of events) {
    const openKey = e.maint ? K.openMaint(e.monitorId) : K.open(e.monitorId);
    if (!e.ok) {
      const candidate = `${e.monitorId}-${e.maint ? "m" : ""}${now}`;
      const created = await r.set(openKey, candidate, { nx: true });
      let id = candidate;
      if (created === "OK") {
        await Promise.all([
          r.hset(K.incident(id), {
            id,
            monitorId: e.monitorId,
            startedAt: now,
            ...(e.maint ? { kind: "maint" } : {}),
          }),
          r.lpush(K.incidents, id),
        ]);
        await r.ltrim(K.incidents, 0, 499);
      } else {
        id = (await r.get<string>(openKey)) ?? candidate;
      }
      e.incidentId = id;
      await r.rpush(K.incidentEvents(id), JSON.stringify(e));
    } else {
      const id = await r.get<string>(openKey);
      if (id) {
        e.incidentId = id;
        await r.rpush(K.incidentEvents(id), JSON.stringify(e));
      }
    }
  }

  const pipe = r.pipeline();
  pipe.hset(K.latest, latestUpdate);
  pipe.hset(K.lastRun, { [region]: now });
  const dayKey = K.day(date);
  for (const res of results) {
    // Planned-maintenance probes don't count towards availability at all.
    if (res.maint) continue;
    pipe.hincrby(dayKey, `${res.monitorId}:${region}:total`, 1);
    if (res.ok) pipe.hincrby(dayKey, `${res.monitorId}:${region}:ok`, 1);
    pipe.hincrby(dayKey, `${res.monitorId}:${region}:msSum`, res.latencyMs);
  }
  pipe.expire(dayKey, DAY_TTL_SECONDS);
  if (events.length > 0) {
    pipe.lpush(K.events, ...events.map((e) => JSON.stringify(e)));
    pipe.ltrim(K.events, 0, EVENTS_MAX - 1);
  }
  await pipe.exec();

  // Close incidents whose monitor is now healthy in every region.
  for (const e of events) {
    if (!e.ok || !e.incidentId) continue;
    const vals = await r.hmget<Record<string, LatestEntry | null>>(
      K.latest,
      ...REGIONS.map((rg) => `${e.monitorId}:${rg}`),
    );
    const entries = Object.values(vals ?? {});
    if (e.maint) {
      const noneInMaint = entries.every((v) => v == null || !v.maint);
      if (noneInMaint) {
        await r.hset(K.incident(e.incidentId), { endedAt: now });
        await r.del(K.openMaint(e.monitorId));
      }
    } else {
      const allOk = entries.every((v) => v == null || v.ok);
      if (allOk) {
        await r.hset(K.incident(e.incidentId), { endedAt: now });
        await r.del(K.open(e.monitorId));
      }
    }
  }

  return results;
}

export function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
