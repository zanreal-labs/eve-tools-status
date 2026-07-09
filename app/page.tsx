import {
  CATEGORIES,
  REGIONS,
  REGION_LABELS,
  type Monitor,
} from "@/lib/monitors";
import { loadStatus, HISTORY_DAYS, type MonitorStatus } from "@/lib/status";
import {
  HEALTH_META,
  StatusDot,
  UptimeBars,
  monitorHealth,
  utc,
  type Health,
} from "./ui";
import { Clock } from "./clock";

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
        <span
          className={`flex items-center gap-2 text-sm tabular-nums ${HEALTH_META[health].text}`}
        >
          {s?.uptimePct != null ? `${s.uptimePct.toFixed(2)}%` : "—"}
          <StatusDot health={health} />
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

  const banner: Record<Health, { text: string; cls: string }> = {
    operational: {
      text: "All Systems Operational",
      cls: "border-emerald-500/40 bg-emerald-500/5",
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
    <div>
      <Clock />
      <div
        className={`mb-10 flex items-center justify-between gap-4 rounded-lg border px-5 py-4 ${banner[overall].cls}`}
      >
        <div className="flex items-center gap-3">
          <StatusDot health={overall} />
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

      {(() => {
        const failing = CATEGORIES.flatMap((c) => c.monitors)
          .map((m) => ({ m, s: monitors[m.id], health: monitorHealth(monitors[m.id]) }))
          .filter(({ health }) => health === "down" || health === "degraded");
        if (failing.length === 0) return null;
        return (
          <section className="mb-10">
            <h2 className="mb-1 text-xs font-medium uppercase tracking-widest text-red-400">
              Active Issues
            </h2>
            <div className="divide-y divide-zinc-900 rounded-lg border border-red-500/30 bg-red-500/5">
              {failing.map(({ m, s, health }) => {
                const regions = REGIONS.filter((r) => {
                  const e = s?.latest[r];
                  return e && !e.ok;
                });
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <StatusDot health={health} />
                      <a
                        href={m.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-zinc-100 underline-offset-4 hover:underline"
                      >
                        {m.name}
                      </a>
                      <span className={HEALTH_META[health].text}>
                        {HEALTH_META[health].label.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {regions.map((r) => REGION_LABELS[r]).join(", ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

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
