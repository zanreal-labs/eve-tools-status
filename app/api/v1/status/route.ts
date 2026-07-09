import { NextResponse } from "next/server";
import { CATEGORIES, REGIONS } from "@/lib/monitors";
import { loadStatus } from "@/lib/status";
import { healthFromEntries } from "@/lib/health";

export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    const { monitors, lastRun } = await loadStatus();

    const items = CATEGORIES.flatMap((cat) =>
      cat.monitors.map((m) => {
        const s = monitors[m.id];
        const health = healthFromEntries(
          REGIONS.map((r) => s?.latest[r]),
        );
        return {
          id: m.id,
          name: m.name,
          category: cat.name,
          siteUrl: m.siteUrl,
          health,
          uptime45d:
            s?.uptimePct != null ? Number(s.uptimePct.toFixed(3)) : null,
          page: `https://eve-tools-status.com/monitors/${m.id}`,
          badge: `https://eve-tools-status.com/api/badge/${m.id}`,
        };
      }),
    );

    const overall = items.some((i) => i.health === "down")
      ? "down"
      : items.some((i) => i.health === "degraded")
        ? "degraded"
        : items.every((i) => i.health === "unknown")
          ? "unknown"
          : "operational";

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        lastCheck: lastRun ? new Date(lastRun).toISOString() : null,
        overall,
        regions: REGIONS,
        monitors: items,
      },
      {
        headers: {
          ...CORS,
          "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "status data unavailable" },
      { status: 503, headers: CORS },
    );
  }
}
