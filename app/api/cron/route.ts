import { NextResponse } from "next/server";
import { authorized } from "@/lib/checks";
import { REGIONS } from "@/lib/monitors";

export const maxDuration = 150;

function baseUrl(): string {
  if (process.env.STATUS_BASE_URL) return process.env.STATUS_BASE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const base = baseUrl();
  const outcomes = await Promise.allSettled(
    REGIONS.map(async (region) => {
      const res = await fetch(`${base}/api/check/${region}`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
        cache: "no-store",
        signal: AbortSignal.timeout(130_000),
      });
      if (!res.ok) throw new Error(`${region}: HTTP ${res.status}`);
      return res.json();
    }),
  );

  const summary = outcomes.map((o, i) =>
    o.status === "fulfilled"
      ? { region: REGIONS[i], ok: true, failures: o.value.failures?.length ?? 0 }
      : { region: REGIONS[i], ok: false, error: String(o.reason) },
  );

  return NextResponse.json({ ranAt: new Date().toISOString(), regions: summary });
}
