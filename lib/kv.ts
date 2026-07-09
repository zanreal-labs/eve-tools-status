import { Redis } from "@upstash/redis";

let client: Redis | null = null;

export function kv(): Redis {
  if (!client) {
    const url =
      process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
    const token =
      process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error("Upstash KV env vars are not set");
    client = new Redis({ url, token });
  }
  return client;
}

// Key prefix `ets:` — keeps the namespace clean if the DB is ever shared.
export const K = {
  latest: "ets:latest", // hash: `${monitorId}:${region}` → LatestEntry JSON
  lastRun: "ets:lastRun", // hash: region → ms timestamp
  events: "ets:events", // list of StatusEvent JSON, newest first
  day: (date: string) => `ets:day:${date}`, // hash: `${mid}:${region}:{ok|total|msSum}` → int
  suggestions: "ets:suggestions", // list of suggestion JSON
  rateLimit: (ipHash: string) => `ets:rl:${ipHash}`,
  open: (monitorId: string) => `ets:open:${monitorId}`, // open outage incident id
  openMaint: (monitorId: string) => `ets:openm:${monitorId}`, // open maintenance incident id
  incident: (id: string) => `ets:incident:${id}`, // hash: monitorId, startedAt, endedAt
  incidentEvents: (id: string) => `ets:incident:${id}:events`, // list of StatusEvent JSON
  incidents: "ets:incidents", // list of incident ids, newest first
};

export const DAY_TTL_SECONDS = 100 * 24 * 60 * 60;
export const EVENTS_MAX = 100;
