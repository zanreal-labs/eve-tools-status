import {
  CATEGORIES,
  REGIONS,
  REGION_LABELS,
  type Monitor,
} from "@/lib/monitors";
import {
  loadStatus,
  HISTORY_DAYS,
  type MonitorStatus,
  type DayStat,
  type StatusEvent,
} from "@/lib/status";
import { SuggestTool } from "./suggest-tool";

export const revalidate = 60;

type Health = "operational" | "degraded" | "down" | "unknown";

function monitorHealth(s: MonitorStatus | undefined): Health {
  if (!s) return "unknown";
  const entries = REGIONS.map((r) => s.latest[r]).filter(Boolean);
  if (entries.length === 0) return "unknown";
  const failing = entries.filter((e) => !e!.ok).length;
  if (failing === 0) return "operational";
  if (failing === entries.length) return "down";
  return "degraded";
}

const HEALTH_META: Record<Health, { label: string; dot: string; text: string }> = {
  operational: { label: "Operational", dot: "bg-emerald-500", text: "text-emerald-400" },
  degraded: { label: "Degraded", dot: "bg-amber-500", text: "text-amber-400" },
  down: { label: "Down", dot: "bg-red-500", text: "text-red-400" },
  unknown: { label: "No data", dot: "bg-zinc-600", text: "text-zinc-500" },
};

function dayColor(d: DayStat): string {
  if (d.total === 0) return "bg-zinc-800";
  const pct = (d.ok / d.total) * 100;
  if (pct >= 99) return "bg-emerald-500";
  if (pct >= 95) return "bg-amber-500";
  return "bg-red-500";
}

function dayTitle(d: DayStat): string {
  if (d.total === 0) return `${d.date}: no data`;
  return `${d.date}: ${((d.ok / d.total) * 100).toFixed(2)}% (${d.fail} failed of ${d.total})`;
}

function UptimeBars({ days }: { days: DayStat[] }) {
  return (
    <div className="flex h-8 items-stretch gap-[3px]">
      {days.map((d) => (
        <div
          key={d.date}
          title={dayTitle(d)}
          className={`w-full min-w-[3px] flex-1 rounded-[2px] ${dayColor(d)}`}
        />
      ))}
    </div>
  );
}

function RegionChips({ s }: { s: MonitorStatus | undefined }) {
  return (
    <div className="flex flex-wrap gap-2">
      {REGIONS.map((r) => {
        const e = s?.latest[r];
        return (
          <span
            key={r}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400"
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                e ? (e.ok ? "bg-emerald-500" : "bg-red-500") : "bg-zinc-600"
              }`}
            />
            {REGION_LABELS[r]}
            {e && e.ok && <span className="text-zinc-500">{e.ms}ms</span>}
          </span>
        );
      })}
    </div>
  );
}

function MonitorRow({
  monitor,
  s,
}: {
  monitor: Monitor;
  s: MonitorStatus | undefined;
}) {
  const health = monitorHealth(s);
  const meta = HEALTH_META[health];
  return (
    <div className="border-t border-zinc-800/80 px-5 py-4 first:border-t-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
          <a
            href={monitor.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline-offset-4 hover:underline"
          >
            {monitor.name}
            <span className="ml-1 text-xs text-zinc-600">↗</span>
          </a>
          <span className="hidden text-xs text-zinc-500 sm:inline">
            {monitor.description}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {s?.uptimePct != null && (
            <span className="tabular-nums text-zinc-400">
              {s.uptimePct.toFixed(2)}%
            </span>
          )}
          <span className={meta.text}>{meta.label}</span>
        </div>
      </div>
      {s && <UptimeBars days={s.days} />}
      <div className="mt-2">
        <RegionChips s={s} />
      </div>
    </div>
  );
}

const MONITOR_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.monitors).map((m) => [m.id, m.name]),
);

function EventsLog({ events }: { events: StatusEvent[] }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-medium uppercase tracking-wider text-zinc-500">
        Recent Events
      </h2>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40">
        {events.length === 0 ? (
          <p className="px-5 py-4 text-sm text-zinc-500">
            No incidents recorded yet.
          </p>
        ) : (
          events.map((e, i) => (
            <div
              key={`${e.ts}-${e.monitorId}-${e.region}-${i}`}
              className="flex items-center justify-between gap-3 border-t border-zinc-800/80 px-5 py-3 text-sm first:border-t-0"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    e.ok ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <span className="font-medium">
                  {MONITOR_NAMES[e.monitorId] ?? e.monitorId}
                </span>
                <span className={e.ok ? "text-emerald-400" : "text-red-400"}>
                  {e.ok
                    ? "recovered"
                    : e.status > 0
                      ? `down (HTTP ${e.status})`
                      : "down (timeout)"}
                </span>
                <span className="text-xs text-zinc-500">
                  from {REGION_LABELS[e.region]}
                </span>
              </div>
              <span className="whitespace-nowrap text-xs tabular-nums text-zinc-500">
                {new Date(e.ts).toLocaleString("en-GB", {
                  timeZone: "UTC",
                  hour12: false,
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                UTC
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default async function Page() {
  let monitors: Record<string, MonitorStatus> = {};
  let lastRun: number | null = null;
  let events: StatusEvent[] = [];
  let loadError = false;
  try {
    ({ monitors, lastRun, events } = await loadStatus());
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
      text: "All systems operational",
      cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    },
    degraded: {
      text: "Some systems degraded",
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    },
    down: {
      text: "Service outage detected",
      cls: "border-red-500/30 bg-red-500/10 text-red-300",
    },
    unknown: {
      text: loadError ? "Status data unavailable" : "Awaiting first checks",
      cls: "border-zinc-700 bg-zinc-900 text-zinc-400",
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          EVE Tools Status
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Availability of EVE Online community tools — checked every 15 minutes
          from {REGIONS.length} regions.
        </p>
      </header>

      <div
        className={`mb-10 rounded-lg border px-5 py-4 text-sm font-medium ${banner[overall].cls}`}
      >
        {banner[overall].text}
        {lastRun && (
          <span className="ml-2 font-normal opacity-70">
            · last check{" "}
            {new Date(lastRun).toLocaleString("en-GB", {
              timeZone: "UTC",
              hour12: false,
            })}{" "}
            UTC
          </span>
        )}
      </div>

      <div className="space-y-8">
        {CATEGORIES.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-2 px-1 text-sm font-medium uppercase tracking-wider text-zinc-500">
              {cat.name}
            </h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40">
              {cat.monitors.map((m) => (
                <MonitorRow key={m.id} monitor={m} s={monitors[m.id]} />
              ))}
            </div>
          </section>
        ))}

        <EventsLog events={events} />

        <SuggestTool />
      </div>

      <footer className="mt-12 space-y-2 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
        <div className="flex items-center justify-between">
          <span>
            Last {HISTORY_DAYS} days · regions:{" "}
            {REGIONS.map((r) => REGION_LABELS[r]).join(", ")}
          </span>
          <span>Not affiliated with CCP Games</span>
        </div>
        <div>
          Made &amp; powered by{" "}
          <a
            href="https://zanreal.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-300 underline-offset-4 hover:underline"
          >
            ZanReal
          </a>
        </div>
      </footer>
    </main>
  );
}
