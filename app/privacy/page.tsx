import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — EVE Tools Status",
  description:
    "How EVE Tools Status (ZanReal) processes personal data, cookies and analytics.",
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-10 text-xs font-medium uppercase tracking-widest text-zinc-500 first:mt-0">
      {children}
    </h2>
  );
}

const LAST_UPDATED = "9 July 2026";

export default function PrivacyPage() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-zinc-100">
        Privacy Policy
      </h1>
      <p className="mb-8 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

      <H2>1. Data controller</H2>
      <p>
        The controller of personal data processed in connection with the
        eve-tools-status.com website (the &quot;Service&quot;) is{" "}
        <strong className="text-zinc-100">ZANREAL Mateusz Janota</strong>, ul. 3
        Maja 30a, 44-200 Rybnik, Poland, EU VAT ID: PL6423261225
        (&quot;ZanReal&quot;, &quot;we&quot;). Contact:{" "}
        <a
          href="https://zanreal.com/contact?utm_source=eve-tools-status&utm_medium=referral&utm_campaign=status-page&utm_content=privacy"
          className="text-zinc-100 underline underline-offset-4"
        >
          zanreal.com/contact
        </a>
        .
      </p>

      <H2>2. What we process and why</H2>
      <p>The Service is available without registration. We process:</p>
      <ul className="list-inside list-disc space-y-1.5">
        <li>
          <strong className="text-zinc-100">Server logs</strong> — IP address,
          user agent, requested URL, timestamp — processed by our hosting
          provider (Vercel) to deliver the Service, ensure security and prevent
          abuse. Legal basis: legitimate interest (Art. 6(1)(f) GDPR).
        </li>
        <li>
          <strong className="text-zinc-100">Tool suggestions</strong> — the
          tool name, URL and optional note you submit via the suggestion form.
          To limit abuse we also store a truncated, one-way hash of your IP
          address for up to one hour; the suggestion content itself contains no
          personal data unless you include it. Legal basis: legitimate interest
          (Art. 6(1)(f) GDPR).
        </li>
        <li>
          <strong className="text-zinc-100">Analytics data</strong> — only
          after you grant consent (see section 4): usage statistics via Google
          Analytics 4 and Vercel Web Analytics. Legal basis: consent (Art.
          6(1)(a) GDPR).
        </li>
        <li>
          <strong className="text-zinc-100">Consent choices</strong> — your
          cookie preferences are stored locally in your browser
          (localStorage); we do not receive them on our servers.
        </li>
      </ul>
      <p>
        Monitoring data shown on the Service (availability of third-party
        tools) contains no personal data — we store only HTTP status codes and
        response times of public endpoints.
      </p>

      <H2>3. Recipients and transfers</H2>
      <p>Data is processed by the following providers acting for us:</p>
      <ul className="list-inside list-disc space-y-1.5">
        <li>
          <strong className="text-zinc-100">Vercel Inc.</strong> (hosting,
          Vercel Web Analytics) — USA; transfers safeguarded by the EU-U.S.
          Data Privacy Framework and Standard Contractual Clauses.
        </li>
        <li>
          <strong className="text-zinc-100">Google Ireland Ltd. / Google
          LLC</strong> (Google Analytics 4) — data may be transferred to the
          USA under the EU-U.S. Data Privacy Framework. GA4 is loaded with
          Google Consent Mode v2 and all signals denied until you consent.
        </li>
        <li>
          <strong className="text-zinc-100">Upstash Inc.</strong> (database
          storing monitoring results and suggestions) — data held in the EU
          region.
        </li>
      </ul>

      <H2>4. Cookies and similar technologies</H2>
      <p>
        We use a consent manager (c15t, offline mode — your choice never leaves
        the browser). Categories: <em>necessary</em> (always on),{" "}
        <em>functionality</em>, <em>measurement</em> (Google Analytics, Vercel
        Analytics), <em>experience</em> and <em>marketing</em>. No analytics or
        marketing storage is used before you opt in. You can change your choice
        anytime via the &quot;Cookie preferences&quot; link in the footer.
      </p>

      <H2>5. Retention</H2>
      <ul className="list-inside list-disc space-y-1.5">
        <li>Monitoring aggregates: up to 100 days.</li>
        <li>Tool suggestions: until reviewed, at most 12 months.</li>
        <li>IP rate-limit hashes: 1 hour.</li>
        <li>Google Analytics: up to 14 months (Google default we configure).</li>
        <li>Server logs: per Vercel&apos;s log retention (up to 30 days).</li>
      </ul>

      <H2>6. Your rights</H2>
      <p>
        Under the GDPR you have the right of access, rectification, erasure,
        restriction, portability, objection (for processing based on
        legitimate interest) and to withdraw consent at any time without
        affecting prior processing. You may lodge a complaint with a
        supervisory authority — in Poland: Prezes Urzędu Ochrony Danych
        Osobowych (uodo.gov.pl). To exercise your rights, contact us via the
        address in section 1.
      </p>

      <H2>7. Changes</H2>
      <p>
        We may update this policy as the Service evolves; the current version
        is always published on this page with its effective date.
      </p>
    </div>
  );
}
