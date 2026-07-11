import type { Metadata } from "next";
import Link from "next/link";
import { MONITORS, REGIONS, REGION_LABELS } from "@/lib/monitors";
import { CHECK_TIMEOUT_MS, USER_AGENT } from "@/lib/checks";

export const metadata: Metadata = {
  title: "Docs — EVE Tools Status",
  description:
    "How EveToolsStatusBot checks EVE Online community tools and how to whitelist it.",
};

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-sm border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs leading-relaxed text-zinc-300">
      {children}
    </pre>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-10 text-xs font-medium uppercase tracking-widest text-zinc-500 first:mt-0">
      {children}
    </h2>
  );
}

export default function DocsPage() {
  return (
    <div className="text-sm leading-relaxed text-zinc-300">
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-zinc-100">
        Docs
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        What EveToolsStatusBot does, and how to whitelist it if you run one of
        the monitored tools.
      </p>

      <H2>What this is</H2>
      <p>
        EVE Tools Status is an independent, non-commercial availability monitor
        for {MONITORS.length} EVE Online community tools. It exists so
        capsuleers can quickly see whether a tool is down for everyone or just
        for them. It is made by{" "}
        <a
          href="https://zanreal.com?utm_source=eve-tools-status&utm_medium=referral&utm_campaign=status-page&utm_content=docs-about"
          className="text-zinc-100 underline underline-offset-4"
        >
          ZanReal
        </a>{" "}
        and is not affiliated with CCP Games or any of the monitored projects.
        The source code is public:{" "}
        <a
          href="https://github.com/zanreal-labs/eve-tools-status"
          className="text-zinc-100 underline underline-offset-4"
        >
          github.com/zanreal-labs/eve-tools-status
        </a>
        .
      </p>

      <H2>How we check</H2>
      <ul className="list-inside list-disc space-y-1.5">
        <li>
          One <span className="text-zinc-100">GET request per tool every 15
          minutes</span> from each of {REGIONS.length} regions:{" "}
          {REGIONS.map((r) => `${REGION_LABELS[r]} (${r})`).join(", ")} — all
          Vercel infrastructure.
        </li>
        <li>
          That is {REGIONS.length * 4} requests per tool per hour, ~
          {REGIONS.length * 4 * 24} per day. We fetch a single, fixed URL per
          tool (see <Link href="/monitors" className="text-zinc-100 underline underline-offset-4">Monitors</Link>) —
          no crawling, no link following, no login attempts.
        </li>
        <li>
          Timeout {CHECK_TIMEOUT_MS / 1000}s; HTTP status 200–399 counts as up.
          We store only the status code and response time — never response
          bodies.
        </li>
      </ul>

      <H2>User-Agent</H2>
      <p className="mb-3">Every request identifies itself with:</p>
      <Code>{USER_AGENT}</Code>

      <H2>Whitelisting</H2>
      <p className="mb-3">
        Our probes come from Vercel datacenter IPs, which bot-protection
        products often challenge or block — the tool then shows as down here
        even though it is fine for players. If you run a monitored tool, an
        allow rule on the User-Agent token fixes it:
      </p>
      <p className="mb-2 text-zinc-400">
        Cloudflare (WAF custom rule with the Skip action):
      </p>
      <Code>(http.user_agent contains &quot;EveToolsStatusBot&quot;)</Code>
      <p className="mb-2 mt-4 text-zinc-400">nginx:</p>
      <Code>{`if ($http_user_agent ~ "EveToolsStatusBot") {
    # exempt from rate limiting / bot rules
}`}</Code>
      <p className="mt-3 text-zinc-500">
        We do not fetch robots.txt because we only request one fixed URL that
        you can inspect on the Monitors page — but if you prefer we not check
        your service at all, use the form below and we will remove it.
      </p>

      <H2>Contact</H2>
      <p>
        For takedown requests, whitelisting questions, or suggesting a
        different health endpoint for your tool, use the form below or reach us
        via{" "}
        <a
          href="https://zanreal.com/contact?utm_source=eve-tools-status&utm_medium=referral&utm_campaign=status-page&utm_content=docs-contact"
          className="text-zinc-100 underline underline-offset-4"
        >
          zanreal.com/contact
        </a>
        .
      </p>
    </div>
  );
}
