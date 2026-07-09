import { ImageResponse } from "next/og";
import { cacheLife } from "next/cache";
import { MONITORS, REGIONS } from "@/lib/monitors";
import { kv, K } from "@/lib/kv";
import type { LatestEntry } from "@/lib/checks";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "EVE Tools Status — live availability of EVE Online community tools";

type Overall = {
  label: string;
  color: string;
  up: number;
  total: number;
};

function toEntry(v: unknown): LatestEntry | null {
  if (v == null) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return v as LatestEntry;
}

async function overallStatus(): Promise<Overall> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  const total = MONITORS.length;
  try {
    const latest = await kv().hgetall<Record<string, unknown>>(K.latest);
    if (!latest) throw new Error("empty");
    let up = 0;
    let degraded = 0;
    let down = 0;
    for (const m of MONITORS) {
      const entries = REGIONS.map((r) => toEntry(latest[`${m.id}:${r}`])).filter(
        Boolean,
      ) as LatestEntry[];
      if (entries.length === 0) continue;
      const failing = entries.filter((e) => !e.ok).length;
      if (failing === 0) up++;
      else if (failing === entries.length) down++;
      else degraded++;
    }
    if (down > 0)
      return { label: "Service Outage Detected", color: "#ef4444", up, total };
    if (degraded > 0)
      return { label: "Some Systems Degraded", color: "#f59e0b", up, total };
    if (up > 0)
      return { label: "All Systems Operational", color: "#10b981", up, total };
    return { label: "Awaiting First Checks", color: "#71717a", up, total };
  } catch {
    return { label: "EVE Tools Status", color: "#71717a", up: 0, total };
  }
}

export default async function OgImage() {
  const s = await overallStatus();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          padding: 72,
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
          </svg>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 6,
              color: "#e4e4e7",
              textTransform: "uppercase",
            }}
          >
            EVE Tools Status
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: s.color,
              }}
            />
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: "#fafafa",
                letterSpacing: -1,
              }}
            >
              {s.label}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa" }}>
            {s.up}/{s.total} tools operational · checked from {REGIONS.length}{" "}
            regions every 15 min
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#71717a",
          }}
        >
          <div style={{ display: "flex", color: "#22d3ee" }}>
            eve-tools-status.com
          </div>
          <div style={{ display: "flex" }}>
            EVE Online community tools monitor
          </div>
        </div>
      </div>
    ),
    size,
  );
}
