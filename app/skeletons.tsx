import { HISTORY_DAYS } from "@/lib/status";

export function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm bg-zinc-900 ${className}`} />;
}

/** Mirrors UptimeBars: one segment per day, same gaps and radii. */
export function BarsSkeleton({
  className = "h-12",
  segments = HISTORY_DAYS,
}: {
  className?: string;
  segments?: number;
}) {
  return (
    <div className={`flex animate-pulse items-stretch gap-[2px] ${className}`}>
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className="min-w-[2px] flex-1 rounded-[2px] bg-zinc-800/80"
        />
      ))}
    </div>
  );
}

/** Mirrors the "100.00% ●" stat: text-width pulse + dot. */
export function StatSkeleton({ textWidth = "w-14" }: { textWidth?: string }) {
  return (
    <span className="flex animate-pulse items-center gap-2">
      <span className={`h-4 rounded-sm bg-zinc-900 ${textWidth}`} />
      <span className="h-2 w-2 rounded-full bg-zinc-700" />
    </span>
  );
}

/** Mirrors an event/incident row: dot + name + state left, time right. */
export function EventRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center justify-between gap-3 px-5 py-3.5">
      <span className="flex items-center gap-2.5">
        <span className="h-2 w-2 rounded-full bg-zinc-700" />
        <span className="h-4 w-28 rounded-sm bg-zinc-900" />
        <span className="h-4 w-40 rounded-sm bg-zinc-900" />
      </span>
      <span className="h-3 w-24 rounded-sm bg-zinc-900" />
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="divide-y divide-zinc-900 rounded-sm border border-zinc-800 bg-zinc-900/40"
    >
      {Array.from({ length: rows }, (_, i) => (
        <EventRowSkeleton key={i} />
      ))}
    </div>
  );
}

/** Mirrors the incident permapage body: header, meta, regions, timeline. */
export function IncidentSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading incident">
      <div className="mb-1 flex animate-pulse items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-6 w-56 rounded-sm bg-zinc-900" />
        <span className="h-5 w-20 rounded-sm bg-zinc-900" />
      </div>
      <div className="mb-8 flex animate-pulse gap-2">
        <span className="h-4 w-96 max-w-full rounded-sm bg-zinc-900" />
      </div>

      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        Affected regions
      </h2>
      <div className="mb-8 flex animate-pulse flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-6 w-20 rounded-full bg-zinc-900" />
        ))}
      </div>

      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        Timeline
      </h2>
      <div className="divide-y divide-zinc-900 rounded-sm border border-zinc-800 bg-zinc-900/40">
        {[0, 1, 2, 3].map((i) => (
          <EventRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
