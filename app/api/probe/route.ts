import { NextResponse } from "next/server";
import { authorized, drainBody, USER_AGENT } from "@/lib/checks";
import { MONITORS } from "@/lib/monitors";

export const maxDuration = 30;

// Only hosts belonging to monitored tools (or their subdomains) may be probed.
function allowed(host: string): boolean {
  return MONITORS.some((m) => {
    for (const u of [m.url, m.siteUrl]) {
      const h = new URL(u).hostname.replace(/^www\./, "");
      if (host === h || host.endsWith(`.${h}`)) return true;
    }
    return false;
  });
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const target = new URL(req.url).searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" || !allowed(parsed.hostname.replace(/^www\./, ""))) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  const started = Date.now();
  try {
    const res = await fetch(parsed, {
      redirect: "follow",
      cache: "no-store",
      headers: { "user-agent": USER_AGENT, accept: "*/*" },
      signal: AbortSignal.timeout(15_000),
    });
    await drainBody(res).catch(() => undefined);
    return NextResponse.json({
      url: target,
      status: res.status,
      ms: Date.now() - started,
    });
  } catch (e) {
    return NextResponse.json({
      url: target,
      status: 0,
      ms: Date.now() - started,
      error: String(e),
    });
  }
}
