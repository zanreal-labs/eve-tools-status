import { MONITORS, REGIONS, type Region } from "./monitors";
import { kv, K, DAY_TTL_SECONDS, EVENTS_MAX } from "./kv";

export type CheckResult = {
  monitorId: string;
  ok: boolean;
  status: number;
  latencyMs: number;
};

export type LatestEntry = {
  ok: boolean;
  status: number;
  ms: number;
  ts: number;
};

export type StatusEvent = {
  ts: number;
  monitorId: string;
  region: Region;
  ok: boolean;
  status: number;
  incidentId?: string;
};

export const CHECK_TIMEOUT_MS = 10_000;
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
  await new Promise((r) => setTimeout(r, 2000));
  return attempt(monitorId, url, timeoutMs);
}

export async function runChecks(region: Region): Promise<CheckResult[]> {
  const r = kv();
  const fields = MONITORS.map((m) => `${m.id}:${region}`);
  const [results, prevRaw] = await Promise.all([
    Promise.all(MONITORS.map((m) => checkOne(m.id, m.url, m.timeoutMs))),
    r.hmget<Record<string, LatestEntry | null>>(K.latest, ...fields),
  ]);

  const now = Date.now();
  const date = new Date(now).toISOString().slice(0, 10);

  // Status transitions vs the previous run in this region.
  const events: StatusEvent[] = [];
  for (const res of results) {
    const prevOk = prevRaw?.[`${res.monitorId}:${region}`]?.ok ?? null;
    const isTransition = prevOk === null ? !res.ok : prevOk !== res.ok;
    if (isTransition) {
      events.push({
        ts: now,
        monitorId: res.monitorId,
        region,
        ok: res.ok,
        status: res.status,
      });
    }
  }

  const latestUpdate: Record<string, LatestEntry> = {};
  for (const res of results) {
    latestUpdate[`${res.monitorId}:${region}`] = {
      ok: res.ok,
      status: res.status,
      ms: res.latencyMs,
      ts: now,
    };
  }

  // Incident bookkeeping — permalink pages live off these records.
  for (const e of events) {
    if (!e.ok) {
      const candidate = `${e.monitorId}-${now}`;
      const created = await r.set(K.open(e.monitorId), candidate, { nx: true });
      let id = candidate;
      if (created === "OK" || created === null) {
        if (created === "OK") {
          await Promise.all([
            r.hset(K.incident(id), {
              id,
              monitorId: e.monitorId,
              startedAt: now,
            }),
            r.lpush(K.incidents, id),
          ]);
          await r.ltrim(K.incidents, 0, 499);
        }
        if (created === null) {
          id = (await r.get<string>(K.open(e.monitorId))) ?? candidate;
        }
      }
      e.incidentId = id;
      await r.rpush(K.incidentEvents(id), JSON.stringify(e));
    } else {
      const id = await r.get<string>(K.open(e.monitorId));
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
    const allOk = Object.values(vals ?? {}).every((v) => v == null || v.ok);
    if (allOk) {
      await r.hset(K.incident(e.incidentId), { endedAt: now });
      await r.del(K.open(e.monitorId));
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
