import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MONITORS, REGION_LABELS, type Region } from "@/lib/monitors";
import { loadStatus, type StatusEvent } from "@/lib/status";
import { utc } from "../ui";

export const dynamic = "force-dynamic";

const MONITOR_NAMES: Record<string, string> = Object.fromEntries(
  MONITORS.map((m) => [m.id, m.name]),
);

type EventGroup = {
  key: string;
  incidentId?: string;
  monitorId: string;
  events: StatusEvent[]; // newest first
  firstTs: number;
  lastTs: number;
  regions: string[];
  resolved: boolean;
  maint: boolean;
};

function groupEvents(events: StatusEvent[]): EventGroup[] {
  const groups = new Map<string, EventGroup>();
  for (const e of events) {
    const day = new Date(e.ts).toISOString().slice(0, 10);
    const key = e.incidentId ?? `${e.monitorId}-${day}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        incidentId: e.incidentId,
        monitorId: e.monitorId,
        events: [],
        firstTs: e.ts,
        lastTs: e.ts,
        regions: [],
        resolved: true,
        maint: false,
      };
      groups.set(key, g);
    }
    if (e.maint) g.maint = true;
    g.events.push(e);
    g.firstTs = Math.min(g.firstTs, e.ts);
    g.lastTs = Math.max(g.lastTs, e.ts);
    if (!e.ok && !g.regions.includes(e.region)) g.regions.push(e.region);
  }
  for (const g of groups.values()) {
    // Newest event per region decides whether the group is still failing.
    const latestPerRegion = new Map<string, StatusEvent>();
    for (const e of g.events) {
      const cur = latestPerRegion.get(e.region);
      if (!cur || e.ts > cur.ts) latestPerRegion.set(e.region, e);
    }
    g.resolved = [...latestPerRegion.values()].every((e) => e.ok);
  }
  return [...groups.values()].sort((a, b) => b.lastTs - a.lastTs);
}

function groupByDay(groups: EventGroup[]): [string, EventGroup[]][] {
  const days = new Map<string, EventGroup[]>();
  for (const g of groups) {
    const day = new Date(g.lastTs).toISOString().slice(0, 10);
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push(g);
  }
  return [...days.entries()];
}

function GroupRow({ g }: { g: EventGroup }) {
  const downEvents = g.events.filter((e) => !e.ok);
  const sample = downEvents[0];
  const reason = sample
    ? sample.status > 0
      ? `HTTP ${sample.status}`
      : "timeout"
    : "recovered";

  const inner = (
    <>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            g.maint
              ? "bg-cyan-400"
              : g.resolved
                ? "bg-emerald-500"
                : "bg-red-500"
          }`}
        />
        <span className="font-medium text-zinc-100">
          {MONITOR_NAMES[g.monitorId] ?? g.monitorId}
        </span>
        <span
          className={
            g.maint
              ? "text-cyan-400"
              : g.resolved
                ? "text-emerald-400"
                : "text-red-400"
          }
        >
          {g.maint
            ? g.resolved
              ? "planned maintenance completed"
              : "planned maintenance in progress"
            : g.resolved
              ? `outage resolved (${reason})`
              : `down (${reason})`}
        </span>
        {g.regions.length > 0 && (
          <span className="text-xs text-zinc-500">
            {g.regions
              .map((r) => REGION_LABELS[r as Region] ?? r)
              .join(", ")}
          </span>
        )}
      </div>
      <span className="flex items-center gap-1.5 whitespace-nowrap text-xs tabular-nums text-zinc-500">
        {g.resolved
          ? utc(g.firstTs, false) === utc(g.lastTs, false)
            ? utc(g.firstTs, false)
            : `${utc(g.firstTs, false)} – ${utc(g.lastTs, false)}`
          : `since ${utc(g.firstTs, false)}`}
        {g.incidentId && (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" aria-hidden />
        )}
      </span>
    </>
  );

  return g.incidentId ? (
    <Link
      href={`/issues/${g.incidentId}`}
      className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-zinc-800/40"
    >
      {inner}
    </Link>
  ) : (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
      {inner}
    </div>
  );
}

export default async function EventsPage() {
  let events: StatusEvent[] = [];
  let loadError = false;
  try {
    ({ events } = await loadStatus());
    events = events.filter((e) => e.monitorId in MONITOR_NAMES);
  } catch {
    loadError = true;
  }

  const groups = groupEvents(events);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-zinc-100">
        Events
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Outages and recoveries detected by the checks — grouped per incident,
        most recent first.
      </p>

      {loadError ? (
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center text-sm text-zinc-500">
          Event data unavailable.
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center text-sm text-zinc-500">
          No incidents recorded yet. All quiet on the New Eden front.
        </div>
      ) : (
        <div className="space-y-8">
          {groupByDay(groups).map(([day, dayGroups]) => (
            <section key={day}>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
                {day}
              </h2>
              <div className="divide-y divide-zinc-900 rounded-sm border border-zinc-800 bg-zinc-900/40">
                {dayGroups.map((g) => (
                  <GroupRow key={g.key} g={g} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
