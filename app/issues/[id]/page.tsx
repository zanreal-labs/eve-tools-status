import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MONITORS, REGION_LABELS, type Region } from "@/lib/monitors";
import { kv, K } from "@/lib/kv";
import type { StatusEvent } from "@/lib/checks";
import { utc } from "../../ui";

export const dynamic = "force-dynamic";

type IncidentMeta = {
  id: string;
  monitorId: string;
  startedAt: number;
  endedAt?: number;
};

const ID_RE = /^[a-z0-9]+-\d+$/;

async function loadIncident(id: string) {
  if (!ID_RE.test(id)) return null;
  const r = kv();
  const [meta, rawEvents] = await Promise.all([
    r.hgetall<IncidentMeta>(K.incident(id)),
    r.lrange<StatusEvent | string>(K.incidentEvents(id), 0, 199),
  ]);
  if (!meta?.monitorId) return null;
  const events: StatusEvent[] = [];
  for (const e of rawEvents ?? []) {
    if (typeof e === "string") {
      try {
        events.push(JSON.parse(e));
      } catch {}
    } else if (e) {
      events.push(e);
    }
  }
  return { meta, events };
}

function durationText(startedAt: number, endedAt?: number): string {
  const ms = (endedAt ?? Date.now()) - Number(startedAt);
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await loadIncident(id);
  if (!data) return { title: "Incident not found — EVE Tools Status" };
  const tool =
    MONITORS.find((m) => m.id === data.meta.monitorId)?.name ??
    data.meta.monitorId;
  const date = new Date(Number(data.meta.startedAt)).toISOString().slice(0, 10);
  const resolved = data.meta.endedAt ? "resolved outage" : "ongoing outage";
  return {
    title: `${tool} ${resolved} — ${date} | EVE Tools Status`,
    description: `${tool} availability incident on ${date}: detected by EVE Tools Status checks from 4 regions. Duration: ${durationText(Number(data.meta.startedAt), data.meta.endedAt ? Number(data.meta.endedAt) : undefined)}.`,
  };
}

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadIncident(id);
  if (!data) notFound();
  const { meta, events } = data;
  const monitor = MONITORS.find((m) => m.id === meta.monitorId);
  const tool = monitor?.name ?? meta.monitorId;
  const startedAt = Number(meta.startedAt);
  const endedAt = meta.endedAt ? Number(meta.endedAt) : undefined;
  const resolved = Boolean(endedAt);
  const affected = [...new Set(events.filter((e) => !e.ok).map((e) => e.region))];

  return (
    <div>
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All events
      </Link>

      <div className="mb-1 mt-4 flex items-center gap-3">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            resolved ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
          <Link
            href={`/monitors/${meta.monitorId}`}
            className="underline-offset-4 hover:underline"
          >
            {tool}
          </Link>{" "}
          outage
        </h1>
        <span
          className={`rounded-sm border px-2 py-0.5 text-xs uppercase tracking-wider ${
            resolved
              ? "border-emerald-500/40 text-emerald-400"
              : "border-red-500/40 text-red-400"
          }`}
        >
          {resolved ? "Resolved" : "Ongoing"}
        </span>
      </div>
      <p className="mb-8 text-sm text-zinc-500">
        {monitor?.description}
        {monitor && " · "}
        detected {utc(startedAt)}
        {resolved && ` · resolved ${utc(endedAt!)}`} · duration{" "}
        {durationText(startedAt, endedAt)}
      </p>

      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        Affected regions
      </h2>
      <div className="mb-8 flex flex-wrap gap-2">
        {affected.map((r) => (
          <span
            key={r}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400"
          >
            {REGION_LABELS[r as Region] ?? r}
          </span>
        ))}
      </div>

      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        Timeline
      </h2>
      <div className="divide-y divide-zinc-900 rounded-sm border border-zinc-800 bg-zinc-900/40">
        {events.map((e, i) => (
          <div
            key={`${e.ts}-${e.region}-${i}`}
            className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  e.ok ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span className={e.ok ? "text-emerald-400" : "text-red-400"}>
                {e.ok
                  ? "recovered"
                  : e.status > 0
                    ? `down (HTTP ${e.status})`
                    : "down (timeout)"}
              </span>
              <span className="text-xs text-zinc-500">
                from {REGION_LABELS[e.region as Region] ?? e.region}
              </span>
            </div>
            <span className="whitespace-nowrap text-xs tabular-nums text-zinc-500">
              {utc(e.ts)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
