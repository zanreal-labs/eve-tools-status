import { NextResponse } from "next/server";
import { REGION_LABELS } from "@/lib/monitors";
import { loadMonitorDetail } from "@/lib/status";
import { healthFromEntries } from "@/lib/health";

export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let detail;
  try {
    detail = await loadMonitorDetail(id);
  } catch {
    return NextResponse.json(
      { error: "status data unavailable" },
      { status: 503, headers: CORS },
    );
  }
  if (!detail) {
    return NextResponse.json(
      { error: "unknown monitor" },
      { status: 404, headers: CORS },
    );
  }

  const { monitor, regions, uptimePct, incidents } = detail;
  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      id: monitor.id,
      name: monitor.name,
      description: monitor.description,
      siteUrl: monitor.siteUrl,
      checkUrl: monitor.url,
      health: healthFromEntries(regions.map((r) => r.latest)),
      uptime45d: uptimePct != null ? Number(uptimePct.toFixed(3)) : null,
      regions: regions.map((r) => ({
        region: r.region,
        label: REGION_LABELS[r.region],
        latest: r.latest,
        uptime45d:
          r.uptimePct != null ? Number(r.uptimePct.toFixed(3)) : null,
        avgResponseMs: r.avgMs,
      })),
      incidents: incidents.map((i) => ({
        id: i.id,
        kind: i.kind ?? "outage",
        startedAt: new Date(i.startedAt).toISOString(),
        endedAt: i.endedAt ? new Date(i.endedAt).toISOString() : null,
        page: `https://eve-tools-status.com/issues/${i.id}`,
      })),
    },
    {
      headers: {
        ...CORS,
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
