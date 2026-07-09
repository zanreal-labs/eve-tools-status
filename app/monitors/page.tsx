import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ExternalLink } from "lucide-react";
import {
  CATEGORIES,
  REGIONS,
  REGION_LABELS,
  type Monitor,
} from "@/lib/monitors";
import { loadStatus } from "@/lib/status";
import { HEALTH_META, RegionChips, StatusDot, monitorHealth } from "../ui";

/* Static shell: category cards, names, descriptions, check URLs and   */
/* region chip frames. Health labels and chip values stream in.        */

export default function MonitorsPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-zinc-100">
        Monitors
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Every monitored endpoint with its live per-region state.
      </p>

      <div className="space-y-8">
        {CATEGORIES.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
              {cat.name}
            </h2>
            <div className="divide-y divide-zinc-900 rounded-sm border border-zinc-800 bg-zinc-900/40">
              {cat.monitors.map((m) => (
                <MonitorCard key={m.id} monitor={m} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ChipsFallback() {
  return (
    <div className="flex flex-wrap gap-2">
      {REGIONS.map((r) => (
        <span
          key={r}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400"
        >
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-600" />
          {REGION_LABELS[r]}
        </span>
      ))}
    </div>
  );
}

function MonitorCard({ monitor }: { monitor: Monitor }) {
  return (
    <div className="px-5 py-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <Link
            href={`/monitors/${monitor.id}`}
            className="font-medium text-zinc-100 underline-offset-4 hover:underline"
          >
            {monitor.name}
          </Link>
          <a
            href={monitor.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${monitor.name}`}
            className="text-zinc-600 transition-colors hover:text-zinc-300"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </span>
        <span className="flex h-5 items-center">
          <Suspense
            fallback={
              <span className="inline-block h-4 w-24 animate-pulse rounded-sm bg-zinc-900" />
            }
          >
            <CardHealth id={monitor.id} />
          </Suspense>
        </span>
      </div>
      <p className="mb-1 text-xs text-zinc-500">{monitor.description}</p>
      <p className="mb-3 break-all text-[11px] text-zinc-600">
        GET {monitor.url}
      </p>
      <Suspense fallback={<ChipsFallback />}>
        <CardChips id={monitor.id} />
      </Suspense>
    </div>
  );
}

async function CardHealth({ id }: { id: string }) {
  await connection();
  const { monitors } = await loadStatus().catch(() => ({
    monitors: {} as Awaited<ReturnType<typeof loadStatus>>["monitors"],
  }));
  const health = monitorHealth(monitors[id]);
  const meta = HEALTH_META[health];
  return (
    <span className={`flex items-center gap-2 text-sm ${meta.text}`}>
      {meta.label}
      <StatusDot health={health} />
    </span>
  );
}

async function CardChips({ id }: { id: string }) {
  await connection();
  const { monitors } = await loadStatus().catch(() => ({
    monitors: {} as Awaited<ReturnType<typeof loadStatus>>["monitors"],
  }));
  return <RegionChips s={monitors[id]} />;
}
