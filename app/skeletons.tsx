function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm bg-zinc-900 ${className}`} />;
}

function RowSkeleton() {
  return (
    <div className="py-5">
      <div className="mb-2 flex items-center justify-between">
        <Pulse className="h-5 w-40" />
        <Pulse className="h-4 w-20" />
      </div>
      <Pulse className="h-12 w-full" />
      <div className="mt-1.5 flex justify-between">
        <Pulse className="h-3 w-16" />
        <Pulse className="h-3 w-10" />
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading status">
      <Pulse className="mb-10 h-[72px] w-full" />
      <div className="space-y-10">
        {[3, 4].map((rows, s) => (
          <section key={s}>
            <Pulse className="mb-3 h-3 w-32" />
            <div className="divide-y divide-zinc-900">
              {Array.from({ length: rows }, (_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
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
        <div key={i} className="flex items-center justify-between px-5 py-3.5">
          <Pulse className="h-4 w-56" />
          <Pulse className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading details">
      <Pulse className="mb-2 h-6 w-64" />
      <Pulse className="mb-8 h-4 w-96 max-w-full" />
      <Pulse className="mb-10 h-12 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Pulse key={i} className="h-36 w-full" />
        ))}
      </div>
    </div>
  );
}
