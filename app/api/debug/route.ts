import { NextResponse } from "next/server";
import { authorized } from "@/lib/checks";
import { kv, K } from "@/lib/kv";


export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const r = kv();
  const pipe = r.pipeline();
  pipe.ping();
  pipe.hlen(K.latest);
  pipe.hgetall(K.lastRun);
  pipe.llen(K.events);
  pipe.lrange(K.suggestions, 0, 49);
  pipe.keys("ets:*");
  const [ping, latestLen, lastRun, eventCount, suggestions, keys] =
    await pipe.exec<[string, number, Record<string, string>, number, unknown[], string[]]>();
  return NextResponse.json({
    ping,
    latestLen,
    lastRun,
    eventCount,
    suggestions,
    keys: keys.slice(0, 30),
  });
}
