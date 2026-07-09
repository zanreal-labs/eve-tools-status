import { REGIONS, REGION_LABELS } from "@/lib/monitors";
import type { DayStat, MonitorStatus } from "@/lib/status";

export type Health = "operational" | "degraded" | "down" | "unknown";

export function monitorHealth(s: MonitorStatus | undefined): Health {
  if (!s) return "unknown";
  const entries = REGIONS.map((r) => s.latest[r]).filter(Boolean);
  if (entries.length === 0) return "unknown";
  const failing = entries.filter((e) => !e!.ok).length;
  if (failing === 0) return "operational";
  if (failing === entries.length) return "down";
  return "degraded";
}

export const HEALTH_META: Record<
  Health,
  { label: string; dot: string; text: string }
> = {
  operational: {
    label: "Operational",
    dot: "bg-emerald-500",
    text: "text-emerald-400",
  },
  degraded: { label: "Degraded", dot: "bg-amber-500", text: "text-amber-400" },
  down: { label: "Down", dot: "bg-red-500", text: "text-red-400" },
  unknown: { label: "No data", dot: "bg-zinc-700", text: "text-zinc-500" },
};

function dayColor(d: DayStat): string {
  if (d.total === 0) return "bg-zinc-800/80";
  const pct = (d.ok / d.total) * 100;
  if (pct >= 99) return "bg-emerald-500";
  if (pct >= 95) return "bg-amber-500";
  return "bg-red-500";
}

function dayTitle(d: DayStat): string {
  if (d.total === 0) return `${d.date} — no data`;
  return `${d.date} — ${((d.ok / d.total) * 100).toFixed(2)}% (${d.fail} failed of ${d.total} checks)`;
}

export function UptimeBars({
  days,
  className = "h-12",
}: {
  days: DayStat[];
  className?: string;
}) {
  return (
    <div className={`flex items-stretch gap-[2px] ${className}`}>
      {days.map((d) => (
        <div
          key={d.date}
          title={dayTitle(d)}
          className={`min-w-[2px] flex-1 rounded-[2px] ${dayColor(d)}`}
        />
      ))}
    </div>
  );
}

export function CheckBadge({ health }: { health: Health }) {
  const bg =
    health === "operational"
      ? "bg-emerald-500 text-zinc-950"
      : health === "degraded"
        ? "bg-amber-500 text-zinc-950"
        : health === "down"
          ? "bg-red-500 text-zinc-950"
          : "bg-zinc-700 text-zinc-400";
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-[4px] text-[10px] font-bold ${bg}`}
    >
      {health === "operational" ? "✓" : health === "unknown" ? "·" : "!"}
    </span>
  );
}

export function RegionChips({ s }: { s: MonitorStatus | undefined }) {
  return (
    <div className="flex flex-wrap gap-2">
      {REGIONS.map((r) => {
        const e = s?.latest[r];
        return (
          <span
            key={r}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400"
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                e ? (e.ok ? "bg-emerald-500" : "bg-red-500") : "bg-zinc-600"
              }`}
            />
            {REGION_LABELS[r]}
            {e && e.ok && <span className="text-zinc-500">{e.ms}ms</span>}
            {e && !e.ok && (
              <span className="text-red-400">
                {e.status > 0 ? `HTTP ${e.status}` : "timeout"}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function utc(ts: number, withDate = true): string {
  return (
    new Date(ts).toLocaleString("en-GB", {
      timeZone: "UTC",
      hour12: false,
      ...(withDate
        ? { day: "2-digit", month: "short", year: "numeric" }
        : {}),
      hour: "2-digit",
      minute: "2-digit",
    }) + " UTC"
  );
}
