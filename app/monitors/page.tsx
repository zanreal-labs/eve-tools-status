import { CATEGORIES } from "@/lib/monitors";
import { loadStatus, type MonitorStatus } from "@/lib/status";
import { ExternalLink } from "lucide-react";
import { HEALTH_META, RegionChips, StatusDot, monitorHealth } from "../ui";

export const dynamic = "force-dynamic";

export default async function MonitorsPage() {
  let monitors: Record<string, MonitorStatus> = {};
  try {
    ({ monitors } = await loadStatus());
  } catch {}

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
              {cat.monitors.map((m) => {
                const s = monitors[m.id];
                const health = monitorHealth(s);
                const meta = HEALTH_META[health];
                return (
                  <div key={m.id} className="px-5 py-4">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <a
                        href={m.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-zinc-100 underline-offset-4 hover:underline"
                      >
                        {m.name}
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-600" aria-hidden />
                      </a>
                      <span className={`flex items-center gap-2 text-sm ${meta.text}`}>
                        {meta.label}
                        <StatusDot health={health} />
                      </span>
                    </div>
                    <p className="mb-1 text-xs text-zinc-500">{m.description}</p>
                    <p className="mb-3 break-all text-[11px] text-zinc-600">
                      GET {m.url}
                    </p>
                    <RegionChips s={s} />
                  </div>
                );
              })}
            </div>
          </section>
        ))}

      </div>
    </div>
  );
}
