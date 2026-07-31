import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react";
import {
  CATEGORIES,
  MONITORS,
  REGIONS,
  REGION_LABELS,
  type Region,
} from "@/lib/monitors";
import { loadMonitorDetail, HISTORY_DAYS } from "@/lib/status";
import { UptimeBars, utc } from "../../ui";
import { BarsSkeleton, EventRowSkeleton, StatSkeleton } from "../../skeletons";

export function generateStaticParams() {
  return MONITORS.map((m) => ({ id: m.id }));
}

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

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm bg-zinc-900 ${className}`} />;
}

/* Static shell: heading, description, check config, section headings   */
/* and one framed card per region (labels included). Data streams into  */
/* fixed-size slots inside each frame — no layout shift.                */

export default async function MonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const monitor = MONITORS.find((m) => m.id === id);
  if (!monitor) notFound();

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
        <span className="flex h-5 items-center">
          <Suspense fallback={<StatSkeleton textWidth="w-56" />}>
            <HealthLine id={monitor.id} />
          </Suspense>
        </span>
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
      <div className="h-12">
        <Suspense fallback={<BarsSkeleton />}>
          <CombinedBars id={monitor.id} />
        </Suspense>
      </div>
      <div className="mb-10 mt-1.5 flex items-center justify-between text-xs text-zinc-500">
        <span>{HISTORY_DAYS} days ago</span>
        <span>today</span>
      </div>

      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        Probes by region
      </h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {REGIONS.map((region) => (
          <div
            key={region}
            className="rounded-sm border border-zinc-800 bg-zinc-900/40 px-5 py-4"
          >
            <Suspense fallback={<RegionCardFallback region={region} />}>
              <RegionCard id={monitor.id} region={region} />
            </Suspense>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        Incident history
      </h2>
      <Suspense
        fallback={
          <div className="divide-y divide-zinc-900 rounded-sm border border-zinc-800 bg-zinc-900/40">
            {[0, 1].map((i) => (
              <EventRowSkeleton key={i} />
            ))}
          </div>
        }
      >
        <IncidentList id={monitor.id} name={monitor.name} />
      </Suspense>
    </div>
  );
}

async function HealthLine({ id }: { id: string }) {
  const detail = await loadMonitorDetail(id).catch(() => null);
  if (!detail) return <span className="text-sm text-zinc-500">No data</span>;
  const { regions, uptimePct } = detail;
  const present = regions.filter((r) => r.latest);
  const failing = regions.filter((r) => r.latest && !r.latest.ok);
  const health =
    present.length === 0 ? "unknown"
    : failing.length === present.length && failing.length > 0 ? "down"
    : failing.length > 0 ? "degraded"
    : present.some((r) => r.latest!.maint) ? "maintenance"
    : "operational";
  const [label, cls] = {
    operational: ["Operational", "text-emerald-400"],
    maintenance: ["Planned maintenance", "text-cyan-400"],
    degraded: ["Degraded", "text-amber-400"],
    down: ["Down", "text-red-400"],
    unknown: ["No data", "text-zinc-500"],
  }[health] as [string, string];
  return (
    <span className="flex items-center gap-3 text-sm">
      <span className={cls}>{label}</span>
      {uptimePct != null && (
        <span className="tabular-nums text-zinc-400">
          {uptimePct.toFixed(2)}% over {HISTORY_DAYS} days
        </span>
      )}
    </span>
  );
}

async function CombinedBars({ id }: { id: string }) {
  const detail = await loadMonitorDetail(id).catch(() => null);
  if (!detail) return <Pulse className="h-12 w-full" />;
  return <UptimeBars days={detail.days} />;
}

function RegionCardHeader({
  region,
  dot,
  right,
}: {
  region: Region;
  dot: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
        {dot}
        {REGION_LABELS[region]}
        <span className="text-xs font-normal text-zinc-600">{region}</span>
      </span>
      {right}
    </div>
  );
}

function RegionCardFallback({ region }: { region: Region }) {
  return (
    <div>
      <RegionCardHeader
        region={region}
        dot={
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-600" />
        }
      />
      <BarsSkeleton className="h-6" />
      <div className="mt-3 space-y-1.5">
        <Pulse className="h-3 w-40" />
        <Pulse className="h-3 w-48" />
        <Pulse className="h-3 w-44" />
      </div>
    </div>
  );
}

async function RegionCard({ id, region }: { id: string; region: Region }) {
  const detail = await loadMonitorDetail(id).catch(() => null);
  const rd = detail?.regions.find((r) => r.region === region);
  if (!rd) return <RegionCardFallback region={region} />;
  const e = rd.latest;
  return (
    <div>
      <RegionCardHeader
        region={region}
        dot={
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
        }
        right={
          rd.uptimePct != null ? (
            <span className="text-xs tabular-nums text-zinc-400">
              {rd.uptimePct.toFixed(2)}%
            </span>
          ) : undefined
        }
      />
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
            <span className="tabular-nums text-zinc-400">{rd.avgMs}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}

async function IncidentList({ id, name }: { id: string; name: string }) {
  const detail = await loadMonitorDetail(id).catch(() => null);
  const incidents = detail?.incidents ?? [];
  if (incidents.length === 0) {
    return (
      <div className="rounded-sm border border-zinc-800 bg-zinc-900/40 px-5 py-8 text-center text-sm text-zinc-500">
        No incidents recorded for {name}.
      </div>
    );
  }
  return (
    <div className="divide-y divide-zinc-900 rounded-sm border border-zinc-800 bg-zinc-900/40">
      {incidents.map((inc) => {
        const ongoing = !inc.endedAt;
        const isMaint = inc.kind === "maint";
        return (
          <Link
            key={inc.id}
            href={`/issues/${inc.id}`}
            className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-zinc-800/40"
          >
            <span className="flex items-center gap-2.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isMaint
                    ? "bg-cyan-400"
                    : ongoing
                      ? "bg-red-500"
                      : "bg-emerald-500"
                }`}
              />
              <span className="text-zinc-100">{utc(inc.startedAt)}</span>
              <span
                className={
                  isMaint
                    ? "text-cyan-400"
                    : ongoing
                      ? "text-red-400"
                      : "text-zinc-500"
                }
              >
                {isMaint
                  ? ongoing
                    ? "planned maintenance · in progress"
                    : `planned maintenance · ${durationText(inc.startedAt, inc.endedAt)}`
                  : ongoing
                    ? "ongoing"
                    : `resolved · ${durationText(inc.startedAt, inc.endedAt)}`}
              </span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" aria-hidden />
          </Link>
        );
      })}
    </div>
  );
}
