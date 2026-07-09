import type { LatestEntry } from "./checks";

export type HealthState =
  | "operational"
  | "maintenance"
  | "degraded"
  | "down"
  | "unknown";

/** Health from the latest entries of one monitor across regions. */
export function healthFromEntries(
  entries: (LatestEntry | null | undefined)[],
): HealthState {
  const present = entries.filter(Boolean) as LatestEntry[];
  if (present.length === 0) return "unknown";
  const failing = present.filter((e) => !e.ok).length;
  if (failing === present.length && failing > 0) return "down";
  if (failing > 0) return "degraded";
  if (present.some((e) => e.maint)) return "maintenance";
  return "operational";
}

export const HEALTH_COLORS: Record<HealthState, string> = {
  operational: "#10b981",
  maintenance: "#22d3ee",
  degraded: "#f59e0b",
  down: "#ef4444",
  unknown: "#71717a",
};

export const HEALTH_LABELS: Record<HealthState, string> = {
  operational: "operational",
  maintenance: "maintenance",
  degraded: "degraded",
  down: "down",
  unknown: "no data",
};
