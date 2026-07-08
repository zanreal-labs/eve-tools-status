import { MONITORS, type Region } from "./monitors";
import { redis, K, DAY_TTL_SECONDS } from "./redis";

export type CheckResult = {
  monitorId: string;
  ok: boolean;
  status: number;
  latencyMs: number;
};

const CHECK_TIMEOUT_MS = 10_000;
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
  const results = await Promise.all(
    MONITORS.map((m) => checkOne(m.id, m.url)),
  );

  const now = Date.now();
  const date = new Date(now).toISOString().slice(0, 10);
  const pipe = redis().pipeline();

  for (const r of results) {
    pipe.hset(
      K.latest,
      `${r.monitorId}:${region}`,
      JSON.stringify({ ok: r.ok, status: r.status, ms: r.latencyMs, ts: now }),
    );
    const dayKey = K.day(date, r.monitorId, region);
    pipe.hincrby(dayKey, "total", 1);
    pipe.hincrby(dayKey, r.ok ? "ok" : "fail", 1);
    pipe.hincrby(dayKey, "msSum", r.latencyMs);
    pipe.expire(dayKey, DAY_TTL_SECONDS);
  }
  pipe.hset(K.lastRun, region, String(now));
  await pipe.exec();

  return results;
}

export function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
