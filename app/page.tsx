import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight, ExternalLink } from "lucide-react";
import {
  CATEGORIES,
  REGIONS,
  REGION_LABELS,
  type Monitor,
} from "@/lib/monitors";
import { loadStatus, HISTORY_DAYS } from "@/lib/status";
import {
  HEALTH_META,
  StatusDot,
  StatusIcon,
  UptimeBars,
  monitorHealth,
  utc,
  type Health,
} from "./ui";
import { NextCheck } from "./next-check";

/* ------------------------------------------------------------------ */
/* Static shell: banner frame, category headings, monitor names/links, */
/* bar captions. Only the data values stream in as tiny islands.       */
/* ------------------------------------------------------------------ */

export default function Page() {
  return (
    <div>
      <Suspense fallback={<BannerFallback />}>
        <Banner />
      </Suspense>

      <Suspense fallback={null}>
        <ActiveIssues />
      </Suspense>

      <div className="space-y-10">
        {CATEGORIES.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-500">
              {cat.name}
            </h2>
            <div className="divide-y divide-zinc-900">
              {cat.monitors.map((m) => (
                <MonitorRowShell key={m.id} monitor={m} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* Row shell — static; stats and bars stream into fixed-size slots. */
function MonitorRowShell({ monitor }: { monitor: Monitor }) {
  return (
    <div className="py-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <Link
            href={`/monitors/${monitor.id}`}
            title={monitor.description}
            className="text-[15px] font-medium text-zinc-100 underline-offset-4 hover:underline"
          >
            {monitor.name}
          </Link>
          <a
            href={monitor.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${monitor.name}`}
            className="text-zinc-600 transition-colors hover:text-zinc-300"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </span>
        <span className="flex h-5 items-center">
          <Suspense
            fallback={
              <span className="inline-block h-4 w-24 animate-pulse rounded-sm bg-zinc-900" />
            }
          >
            <RowStats id={monitor.id} />
          </Suspense>
        </span>
      </div>
      <div className="h-12">
        <Suspense
          fallback={
            <div className="h-12 w-full animate-pulse rounded-sm bg-zinc-900" />
          }
        >
          <RowBars id={monitor.id} />
        </Suspense>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
        <span>{HISTORY_DAYS} days ago</span>
        <span>today</span>
      </div>
    </div>
  );
}

async function RowStats({ id }: { id: string }) {
  await connection();
  const { monitors } = await loadStatus().catch(() => ({
    monitors: {} as Awaited<ReturnType<typeof loadStatus>>["monitors"],
  }));
  const s = monitors[id];
  const health = monitorHealth(s);
  return (
    <span
      className={`flex items-center gap-2 text-sm tabular-nums ${HEALTH_META[health].text}`}
    >
      {s?.uptimePct != null ? `${s.uptimePct.toFixed(2)}%` : "—"}
      <StatusDot health={health} />
    </span>
  );
}

async function RowBars({ id }: { id: string }) {
  await connection();
  const { monitors } = await loadStatus().catch(() => ({
    monitors: {} as Awaited<ReturnType<typeof loadStatus>>["monitors"],
  }));
  const s = monitors[id];
  if (!s) return <div className="h-12 rounded-sm bg-zinc-900" />;
  return <UptimeBars days={s.days} />;
}

/* Banner — fallback is dimensionally identical to the real banner,     */
/* so the streamed swap never shifts the layout.                        */

function BannerFrame({
  cls,
  icon,
  title,
  right,
  subLeft,
}: {
  cls: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  right?: React.ReactNode;
  subLeft?: React.ReactNode;
}) {
  return (
    <div className={`mb-10 rounded-sm border px-5 py-4 ${cls}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-lg font-semibold tracking-tight text-zinc-100">
            {title}
          </span>
        </div>
        {right}
      </div>
      <div className="mt-2 flex items-center justify-between gap-4 pl-9">
        {subLeft ?? <span />}
        <NextCheck />
      </div>
    </div>
  );
}

function BannerFallback() {
  return (
    <BannerFrame
      cls="border-zinc-800 bg-zinc-900/40"
      icon={
        <span className="inline-block h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
      }
      title={<span className="text-zinc-500">Checking status…</span>}
      right={
        <span className="hidden h-4 w-40 animate-pulse rounded-sm bg-zinc-900 sm:block" />
      }
    />
  );
}

async function Banner() {
  await connection();
  let overall: Health = "unknown";
  let lastRun: number | null = null;
  let loadError = false;
  try {
    const { monitors, lastRun: lr } = await loadStatus();
    lastRun = lr;
    const healths = CATEGORIES.flatMap((c) => c.monitors).map((m) =>
      monitorHealth(monitors[m.id]),
    );
    overall = healths.includes("down")
      ? "down"
      : healths.includes("degraded")
        ? "degraded"
        : healths.every((h) => h === "unknown")
          ? "unknown"
          : "operational";
  } catch {
    loadError = true;
  }

  const banner: Record<Health, { text: string; cls: string }> = {
    operational: {
      text: "All Systems Operational",
      cls: "border-emerald-500/40 bg-emerald-500/5",
    },
    maintenance: {
      text: "Planned Maintenance",
      cls: "border-cyan-500/40 bg-cyan-500/5",
    },
    degraded: {
      text: "Some Systems Degraded",
      cls: "border-amber-500/40 bg-amber-500/5",
    },
    down: {
      text: "Service Outage Detected",
      cls: "border-red-500/40 bg-red-500/5",
    },
    unknown: {
      text: loadError ? "Status Data Unavailable" : "Awaiting First Checks",
      cls: "border-zinc-800 bg-zinc-900/40",
    },
  };

  return (
    <BannerFrame
      cls={banner[overall].cls}
      icon={<StatusIcon health={overall} className="h-6 w-6" />}
      title={banner[overall].text}
      right={
        lastRun ? (
          <span className="hidden text-sm text-zinc-400 sm:block">
            {utc(lastRun)}
          </span>
        ) : undefined
      }
      subLeft={
        lastRun ? (
          <span className="text-xs text-zinc-500 sm:hidden">
            last check {utc(lastRun)}
          </span>
        ) : undefined
      }
    />
  );
}

/* Active issues — renders nothing when everything is green, so the    */
/* fallback is null and there is no reserved space to shift.           */

async function ActiveIssues() {
  await connection();
  let data: Awaited<ReturnType<typeof loadStatus>> | null = null;
  try {
    data = await loadStatus();
  } catch {
    return null;
  }
  const { monitors, openIncidents } = data;

  const failing = CATEGORIES.flatMap((c) => c.monitors)
    .map((m) => ({
      m,
      s: monitors[m.id],
      health: monitorHealth(monitors[m.id]),
    }))
    .filter(({ health }) => health === "down" || health === "degraded");
  if (failing.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-1 text-xs font-medium uppercase tracking-widest text-red-400">
        Active Issues
      </h2>
      <div className="divide-y divide-zinc-900 rounded-sm border border-red-500/30 bg-red-500/5">
        {failing.map(({ m, s, health }) => {
          const regions = REGIONS.filter((r) => {
            const e = s?.latest[r];
            return e && !e.ok;
          });
          const incidentId = openIncidents[m.id];
          const row = (
            <>
              <div className="flex items-center gap-2.5">
                <StatusDot health={health} />
                <span className="font-medium text-zinc-100">{m.name}</span>
                <span className={HEALTH_META[health].text}>
                  {HEALTH_META[health].label.toLowerCase()}
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                {regions.map((r) => REGION_LABELS[r]).join(", ")}
                {incidentId && (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-zinc-600"
                    aria-hidden
                  />
                )}
              </span>
            </>
          );
          return incidentId ? (
            <a
              key={m.id}
              href={`/issues/${incidentId}`}
              className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-red-500/5"
            >
              {row}
            </a>
          ) : (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm"
            >
              {row}
            </div>
          );
        })}
      </div>
    </section>
  );
}
