import Redis from "ioredis";

let client: Redis | null = null;

export function redis(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not set");
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      enableAutoPipelining: true,
    });
  }
  return client;
}

// Key prefix — store is shared with other projects on this team.
export const K = {
  latest: "ets:latest",
  day: (date: string, monitorId: string, region: string) =>
    `ets:day:${date}:${monitorId}:${region}`,
  lastRun: "ets:lastRun",
  events: "ets:events",
  suggestions: "ets:suggestions",
  rateLimit: (ip: string) => `ets:rl:${ip}`,
};

export const DAY_TTL_SECONDS = 100 * 24 * 60 * 60;
