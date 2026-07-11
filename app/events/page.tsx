import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { MONITORS, REGION_LABELS } from "@/lib/monitors";
import {
  loadIncidentFeed,
  HISTORY_DAYS,
  type IncidentFeedItem,
} from "@/lib/status";
import { utc } from "../ui";
import { GroupedListSkeleton } from "../skeletons";

const MONITOR_NAMES: Record<string, string> = Object.fromEntries(
  MONITORS.map((m) => [m.id, m.name]),
);

function groupByDay(items: IncidentFeedItem[]): [string, IncidentFeedItem[]][] {
  const days = new Map<string, IncidentFeedItem[]>();
  for (const item of items) {
    const day = new Date(item.endedAt ?? item.startedAt)
      .toISOString()
      .slice(0, 10);
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push(item);
  }
  return [...days.entries()];
}

function FeedRow({ item }: { item: IncidentFeedItem }) {
  const ongoing = item.endedAt === null;
  const isMaint = item.kind === "maint";
  const dot = isMaint
    ? "bg-cyan-400"
    : ongoing
      ? "bg-red-500"
      : "bg-emerald-500";
  const text = isMaint
    ? "text-cyan-400"
    : ongoing
      ? "text-red-400"
      : "text-emerald-400";
  const label = isMaint
    ? ongoing
      ? "planned maintenance in progress"
      : "planned maintenance completed"
    : ongoing
      ? `down (${item.reason ?? "unreachable"})`
      : `outage resolved (${item.reason ?? "unreachable"})`;

  return (
    <Link
      href={`/issues/${item.id}`}
      className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-zinc-800/40"
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
        <span className="font-medium text-zinc-100">
          {MONITOR_NAMES[item.monitorId] ?? item.monitorId}
        </span>
        <span className={text}>{label}</span>
        {item.regions.length > 0 && (
          <span className="text-xs text-zinc-500">
            {item.regions.map((r) => REGION_LABELS[r] ?? r).join(", ")}
          </span>
        )}
      </div>
      <span className="flex items-center gap-1.5 whitespace-nowrap text-xs tabular-nums text-zinc-500">
        {ongoing
          ? `since ${utc(item.startedAt, false)}`
          : `${utc(item.startedAt, false)} – ${utc(item.endedAt!, false)}`}
        <ChevronRight className="h-3.5 w-3.5 text-zinc-600" aria-hidden />
      </span>
    </Link>
  );
}

export default function EventsPage() {
  // Static shell — heading renders instantly, the log streams in.
  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-zinc-100">
        Events
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Every outage and maintenance window from the last {HISTORY_DAYS} days
        — most recent first.
      </p>
      <Suspense fallback={<GroupedListSkeleton />}>
        <EventsLog />
      </Suspense>
    </div>
  );
}

async function EventsLog() {
  await connection();
  let items: IncidentFeedItem[] = [];
  let loadError = false;
  try {
    items = (await loadIncidentFeed()).filter(
      (i) => i.monitorId in MONITOR_NAMES,
    );
  } catch {
    loadError = true;
  }

  return (
    <div>
      {loadError ? (
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center text-sm text-zinc-500">
          Event data unavailable.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-sm border border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center text-sm text-zinc-500">
          No incidents recorded yet. All quiet on the New Eden front.
        </div>
      ) : (
        <div className="space-y-8">
          {groupByDay(items).map(([day, dayItems]) => (
            <section key={day}>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
                {day}
              </h2>
              <div className="divide-y divide-zinc-900 rounded-sm border border-zinc-800 bg-zinc-900/40">
                {dayItems.map((item) => (
                  <FeedRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
