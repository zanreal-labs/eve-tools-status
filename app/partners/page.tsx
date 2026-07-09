import type { Metadata } from "next";
import { Activity, BadgeCheck, Braces, Radar } from "lucide-react";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = {
  title: "Partners — EVE Tools Status",
  description:
    "Free availability monitoring, status badges and a public API for EVE Online community projects.",
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-12 text-xs font-medium uppercase tracking-widest text-zinc-500 first:mt-0">
      {children}
    </h2>
  );
}

function Snippet({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-sm border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs leading-relaxed text-zinc-300">
      {children}
    </pre>
  );
}

const FEATURES = [
  {
    icon: Radar,
    title: "Free monitoring",
    text: "Your tool is checked every 15 minutes from 4 regions — uptime history, latency stats, incident timeline and its own status page, at no cost, forever.",
  },
  {
    icon: BadgeCheck,
    title: "Status badges",
    text: "Live SVG badges for your README, website or Discord — served from our edge, cached 5 minutes, always in sync with the checks.",
  },
  {
    icon: Braces,
    title: "Public API",
    text: "JSON API with CORS enabled — embed your live status and uptime in your own UI, no key required for read access.",
  },
];

export default function PartnersPage() {
  return (
    <div className="text-sm leading-relaxed text-zinc-300">
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-zinc-100">
        Partners
      </h1>
      <p className="mb-10 text-sm text-zinc-500">
        Running an EVE community tool? We&apos;ll watch it for you — so you
        don&apos;t have to build monitoring alone.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-sm border border-zinc-800 bg-zinc-900/40 px-5 py-5"
          >
            <f.icon className="mb-3 h-6 w-6 text-cyan-400" aria-hidden />
            <div className="mb-1.5 font-semibold uppercase tracking-wider text-zinc-100">
              {f.title}
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">{f.text}</p>
          </div>
        ))}
      </div>

      <H2>Status badges</H2>
      <p className="mb-3">
        Every monitored tool gets a live badge. Here&apos;s the one for ESI,
        rendered live:
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/api/badge/esi"
        alt="ESI API status badge"
        className="mb-4 h-5"
      />
      <p className="mb-2 text-zinc-400">Markdown:</p>
      <Snippet>{`[![ESI API status](https://eve-tools-status.com/api/badge/esi)](https://eve-tools-status.com/monitors/esi)`}</Snippet>
      <p className="mb-2 mt-4 text-zinc-400">HTML:</p>
      <Snippet>{`<a href="https://eve-tools-status.com/monitors/esi">
  <img src="https://eve-tools-status.com/api/badge/esi" alt="ESI API status" />
</a>`}</Snippet>
      <p className="mt-3 text-zinc-500">
        Swap <span className="text-zinc-300">esi</span> for your tool&apos;s id
        (visible in its status-page URL). Optional{" "}
        <span className="text-zinc-300">?label=…</span> overrides the left-hand
        text.
      </p>

      <H2>Public API</H2>
      <p className="mb-3">
        Read-only JSON, CORS enabled, cached 60 s. No authentication.
      </p>
      <Snippet>{`# every monitor with current health + 45-day uptime
curl https://eve-tools-status.com/api/v1/status

# one tool in detail: per-region latency, uptime, incidents
curl https://eve-tools-status.com/api/v1/monitors/esi`}</Snippet>
      <p className="mt-3 text-zinc-500">
        Please keep polling reasonable (the data only changes every 15
        minutes). If you need webhooks or higher resolution, mention it in the
        application — we&apos;ll figure it out together.
      </p>

      <H2>What we ask in return</H2>
      <ul className="list-inside list-disc space-y-1.5">
        <li>
          Whitelist our checker (<span className="text-zinc-300">EveToolsStatusBot</span>,
          see the docs page) so probes reflect reality.
        </li>
        <li>
          Ideally give us a lightweight health endpoint instead of your heavy
          homepage.
        </li>
        <li>A link back or a badge is appreciated — never required.</li>
      </ul>

      <H2>Apply</H2>
      <p className="mb-5">
        Tell us about your project — we typically add tools within a couple of
        days.
      </p>
      <ApplyForm />

      <p className="mt-10 flex items-center gap-2 text-xs text-zinc-600">
        <Activity className="h-3.5 w-3.5" aria-hidden />
        Partnership is free for non-commercial EVE community projects. Not
        affiliated with CCP Games.
      </p>
    </div>
  );
}
