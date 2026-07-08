import { NextResponse } from "next/server";
import { authorized } from "@/lib/checks";
import { redis, K } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const r = redis();
  const [ping, latestLen, lastRun, dbsize, keys] = await Promise.all([
    r.ping(),
    r.hlen(K.latest),
    r.hgetall(K.lastRun),
    r.dbsize(),
    r.keys("ets:*").then((k) => k.slice(0, 20)),
  ]);
  return NextResponse.json({
    ping,
    latestLen,
    lastRun,
    dbsize,
    keys,
    host: process.env.REDIS_URL?.replace(/\/\/.*@/, "//***@"),
  });
}
