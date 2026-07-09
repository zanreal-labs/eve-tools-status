import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react";
import { CATEGORIES, MONITORS, REGION_LABELS } from "@/lib/monitors";
import { loadMonitorDetail, HISTORY_DAYS } from "@/lib/status";
import { UptimeBars, utc } from "../../ui";

export const dynamic = "force-dynamic";

function categoryOf(monitorId: string): string | undefined {
  return CATEGORIES.find((c) => c.monitors.some((m) => m.id === monitorId))
    ?.name;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const monitor = MONITORS.find((m) => m.id === id);
  if (!monitor) return { title: "Monitor not found — EVE Tools Status" };
  return {
    title: `${monitor.name} status & uptime — EVE Tools Status`,
    description: `Is ${monitor.name} down? Live availability, response times and incident history for ${monitor.name} (${monitor.description}), checked every 15 minutes from 4 regions.`,
  };
}

function durationText(startedAt: number, endedAt?: number): string {
  const ms = (endedAt ?? Date.now()) - startedAt;
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

export default async function MonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await loadMonitorDetail(id).catch(() => null);
  if (!detail) notFound();
  const { monitor, regions, days, uptimePct, incidents, openIncidentId } =
    detail;

  const failingRegions = regions.filter((r) => r.latest && !r.latest.ok);
  const health =
    regions.every((r) => !r.latest) ? "unknown"
    : failingRegions.length === 0 ? "operational"
    : failingRegions.length === regions.filter((r) => r.latest).length ? "down"
    : "degraded";
  const healthText = {
    operational: ["Operational", "text-emerald-400"],
    degraded: ["Degraded", "text-amber-400"],
    down: ["Down", "text-red-400"],
    unknown: ["No data", "text-zinc-500"],
  }[health] as [string, string];

  return (
    <div>
      <Link
        href="/monitors"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All monitors
      </Link>

      <div className="mb-1 mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
          {monitor.name}
        </h1>
        <a
          href={monitor.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 transition-colors hover:text-zinc-300"
          title={`Open ${monitor.name}`}
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
        <span className={`text-sm ${healthText[1]}`}>{healthText[0]}</span>
        {uptimePct != null && (
          <span className="text-sm tabular-nums text-zinc-400">
            {uptimePct.toFixed(2)}% over {HISTORY_DAYS} days
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-500">
        {monitor.description}
        {categoryOf(monitor.id) && ` · ${categoryOf(monitor.id)}`}
      </p>
      <p className="mb-8 mt-1 break-all text-xs text-zinc-600">
        GET {monitor.url} · every 15 min · timeout{" "}
        {(monitor.timeoutMs ?? 10_000) / 1000}s
        {monitor.maintenance &&
          ` · daily maintenance ${String(Math.floor(monitor.maintenance.fromMinute / 60)).padStart(2, "0")}:${String(monitor.maintenance.fromMinute % 60).padStart(2, "0")}–${String(Math.floor(monitor.maintenance.toMinute / 60)).padStart(2, "0")}:${String(monitor.maintenance.toMinute % 60).padStart(2, "0")} UTC`}
      </p>

      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        Combined uptime · last {HISTORY_DAYS} days
      </h2>
      <UptimeBars days={days} />
      <div className="mb-10 mt-1.5 flex items-center justify-between text-xs text-zinc-500">
        <span>{HISTORY_DAYS} days ago</span>
        <span>today</span>
      </div>

      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        Probes by region
      </h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {regions.map((rd) => {
          const e = rd.latest;
          return (
            <div
              key={rd.region}
              className="rounded-sm border border-zinc-800 bg-zinc-900/40 px-5 py-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      e
                        ? e.maint
                          ? "bg-cyan-400"
                          : e.ok
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        : "bg-zinc-600"
                    }`}
                  />
                  {REGION_LABELS[rd.region]}
                  <span className="text-xs font-normal text-zinc-600">
                    {rd.region}
                  </span>
                </span>
                {rd.uptimePct != null && (
                  <span className="text-xs tabular-nums text-zinc-400">
                    {rd.uptimePct.toFixed(2)}%
                  </span>
                )}
              </div>
              <UptimeBars days={rd.days} className="h-6" />
              <div className="mt-3 space-y-1 text-xs text-zinc-500">
                {e ? (
                  <>
                    <div>
                      last probe:{" "}
                      <span
                        className={
                          e.maint
                            ? "text-cyan-400"
                            : e.ok
                              ? "text-emerald-400"
                              : "text-red-400"
                        }
                      >
                        {e.maint
                          ? "maintenance"
                          : e.status > 0
                            ? `HTTP ${e.status}`
                            : "timeout"}
                      </span>{" "}
                      · <span className="tabular-nums">{e.ms}ms</span>
                    </div>
                    <div>checked {utc(e.ts)}</div>
                  </>
                ) : (
                  <div>no probes yet</div>
                )}
                {rd.avgMs != null && (
                  <div>
                    avg response ({HISTORY_DAYS}d):{" "}
                    <span className="tabular-nums text-zinc-400">
                      {rd.avgMs}ms
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        Incident history
      </h2>
      {incidents.length === 0 ? (
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/40 px-5 py-8 text-center text-sm text-zinc-500">
          No incidents recorded for {monitor.name}.
        </div>
      ) : (
        <div className="divide-y divide-zinc-900 rounded-sm border border-zinc-800 bg-zinc-900/40">
          {incidents.map((inc) => {
            const ongoing = !inc.endedAt && inc.id === openIncidentId;
            return (
              <Link
                key={inc.id}
                href={`/issues/${inc.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-zinc-800/40"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      ongoing ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-zinc-100">{utc(inc.startedAt)}</span>
                  <span
                    className={ongoing ? "text-red-400" : "text-zinc-500"}
                  >
                    {ongoing
                      ? "ongoing"
                      : `resolved · ${durationText(inc.startedAt, inc.endedAt)}`}
                  </span>
                </span>
                <ChevronRight
                  className="h-3.5 w-3.5 text-zinc-600"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
