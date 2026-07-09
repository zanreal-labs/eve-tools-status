"use client";

import { useEffect, useState } from "react";

const ZONES: { label: string; tz: string | null; accent?: boolean }[] = [
  { label: "EVE Time", tz: "UTC", accent: true },
  { label: "US East", tz: "America/New_York" },
  { label: "US West", tz: "America/Los_Angeles" },
  { label: "Europe", tz: "Europe/Berlin" },
  { label: "Oceania", tz: "Australia/Sydney" },
  { label: "Local", tz: null, accent: true },
];

function timeIn(tz: string | null, now: Date): string {
  return now.toLocaleTimeString("en-GB", {
    hour12: false,
    ...(tz ? { timeZone: tz } : {}),
  });
}

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800/60 sm:grid-cols-3 lg:grid-cols-6">
      {ZONES.map((z) => (
        <div
          key={z.label}
          className="flex flex-col gap-0.5 bg-zinc-950/90 px-3 py-2.5"
        >
          <span
            className={`text-[10px] uppercase tracking-wider ${
              z.accent ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            {z.label}
          </span>
          <span
            suppressHydrationWarning
            className={`text-sm tabular-nums ${
              z.accent ? "font-semibold text-zinc-100" : "text-zinc-300"
            }`}
          >
            {now ? timeIn(z.tz, now) : "--:--:--"}
          </span>
        </div>
      ))}
    </div>
  );
}
