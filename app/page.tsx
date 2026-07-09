import { CATEGORIES, type Monitor } from "@/lib/monitors";
import { loadStatus, HISTORY_DAYS, type MonitorStatus } from "@/lib/status";
import {
  CheckBadge,
  HEALTH_META,
  UptimeBars,
  monitorHealth,
  utc,
  type Health,
} from "./ui";

export const dynamic = "force-dynamic";

function MonitorRow({
  monitor,
  s,
}: {
  monitor: Monitor;
  s: MonitorStatus | undefined;
}) {
  const health = monitorHealth(s);
  return (
    <div className="py-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <a
          href={monitor.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={monitor.description}
          className="text-[15px] font-medium text-zinc-100 underline-offset-4 hover:underline"
        >
          {monitor.name} <span className="text-xs text-zinc-600">↗</span>
        </a>
        <span className="flex items-center gap-2 text-sm tabular-nums text-zinc-300">
          {s?.uptimePct != null ? `${s.uptimePct.toFixed(2)}%` : "—"}
          <CheckBadge health={health} />
        </span>
      </div>
      {s ? (
        <UptimeBars days={s.days} />
      ) : (
        <div className="h-12 rounded bg-zinc-900" />
      )}
      <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
        <span>{HISTORY_DAYS} days ago</span>
        <span>today</span>
      </div>
    </div>
  );
}

export default async function Page() {
  let monitors: Record<string, MonitorStatus> = {};
  let lastRun: number | null = null;
  let loadError = false;
  try {
    ({ monitors, lastRun } = await loadStatus());
  } catch {
    loadError = true;
  }

  const healths = CATEGORIES.flatMap((c) => c.monitors).map((m) =>
    monitorHealth(monitors[m.id]),
  );
  const overall: Health = loadError
    ? "unknown"
    : healths.includes("down")
      ? "down"
      : healths.includes("degraded")
        ? "degraded"
        : healths.every((h) => h === "unknown")
          ? "unknown"
          : "operational";

  const banner: Record<Health, { text: string; cls: string; badge: string }> = {
    operational: {
      text: "All Systems Operational",
      cls: "border-emerald-500/40 bg-emerald-500/5",
      badge: "bg-emerald-500 text-zinc-950",
    },
    degraded: {
      text: "Some Systems Degraded",
      cls: "border-amber-500/40 bg-amber-500/5",
      badge: "bg-amber-500 text-zinc-950",
    },
    down: {
      text: "Service Outage Detected",
      cls: "border-red-500/40 bg-red-500/5",
      badge: "bg-red-500 text-zinc-950",
    },
    unknown: {
      text: loadError ? "Status Data Unavailable" : "Awaiting First Checks",
      cls: "border-zinc-800 bg-zinc-900/40",
      badge: "bg-zinc-700 text-zinc-300",
    },
  };

  return (
    <div>
      <div
        className={`mb-10 flex items-center justify-between gap-4 rounded-lg border px-5 py-4 ${banner[overall].cls}`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold ${banner[overall].badge}`}
          >
            {overall === "operational" ? "✓" : overall === "unknown" ? "·" : "!"}
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-100">
            {banner[overall].text}
          </span>
        </div>
        {lastRun && (
          <span className="hidden text-sm text-emerald-400/90 sm:block">
            {utc(lastRun)}
          </span>
        )}
      </div>

      <div className="space-y-10">
        {CATEGORIES.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-500">
              {cat.name}
            </h2>
            <div className="divide-y divide-zinc-900">
              {cat.monitors.map((m) => (
                <MonitorRow key={m.id} monitor={m} s={monitors[m.id]} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
