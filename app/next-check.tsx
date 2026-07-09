"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

const INTERVAL_MS = 15 * 60 * 1000; // cron runs on every quarter hour (UTC)

function remaining(): number {
  return Math.ceil(Date.now() / INTERVAL_MS) * INTERVAL_MS - Date.now();
}

export function NextCheck() {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    setMs(remaining());
    const id = setInterval(() => setMs(remaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = ms != null ? String(Math.floor(ms / 60000)).padStart(2, "0") : "--";
  const ss = ms != null ? String(Math.floor((ms % 60000) / 1000)).padStart(2, "0") : "--";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
      <Timer className="h-3.5 w-3.5" aria-hidden />
      next check in{" "}
      <span suppressHydrationWarning className="tabular-nums text-zinc-300">
        {mm}:{ss}
      </span>
    </span>
  );
}
