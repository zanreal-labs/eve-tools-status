import { MONITORS, REGION_LABELS } from "@/lib/monitors";
import { loadStatus, type StatusEvent } from "@/lib/status";
import { utc } from "../ui";

export const dynamic = "force-dynamic";

const MONITOR_NAMES: Record<string, string> = Object.fromEntries(
  MONITORS.map((m) => [m.id, m.name]),
);

function groupByDay(events: StatusEvent[]): [string, StatusEvent[]][] {
  const groups = new Map<string, StatusEvent[]>();
  for (const e of events) {
    const day = new Date(e.ts).toISOString().slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(e);
  }
  return [...groups.entries()];
}

export default async function EventsPage() {
  let events: StatusEvent[] = [];
  let loadError = false;
  try {
    ({ events } = await loadStatus());
    // Hide events for monitors that have since been removed.
    events = events.filter((e) => e.monitorId in MONITOR_NAMES);
  } catch {
    loadError = true;
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-zinc-100">
        Events
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Status changes detected by the checks — most recent first.
      </p>

      {loadError ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center text-sm text-zinc-500">
          Event data unavailable.
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center text-sm text-zinc-500">
          No incidents recorded yet. All quiet on the New Eden front.
        </div>
      ) : (
        <div className="space-y-8">
          {groupByDay(events).map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
                {day}
              </h2>
              <div className="divide-y divide-zinc-900 rounded-lg border border-zinc-800 bg-zinc-900/40">
                {dayEvents.map((e, i) => (
                  <div
                    key={`${e.ts}-${e.monitorId}-${e.region}-${i}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          e.ok ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <span className="font-medium text-zinc-100">
                        {MONITOR_NAMES[e.monitorId] ?? e.monitorId}
                      </span>
                      <span
                        className={e.ok ? "text-emerald-400" : "text-red-400"}
                      >
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
                      {utc(e.ts, false)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
