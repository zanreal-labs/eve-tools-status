import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — EVE Tools Status",
  description:
    "Terms of using the EVE Tools Status availability monitor operated by ZanReal.",
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-10 text-xs font-medium uppercase tracking-widest text-zinc-500 first:mt-0">
      {children}
    </h2>
  );
}

const LAST_UPDATED = "9 July 2026";

export default function TermsPage() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-zinc-100">
        Terms of Service
      </h1>
      <p className="mb-8 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

      <H2>1. Operator</H2>
      <p>
        The eve-tools-status.com website (the &quot;Service&quot;) is operated
        by <strong className="text-zinc-100">ZANREAL Mateusz Janota</strong>,
        ul. 3 Maja 30a, 44-200 Rybnik, Poland, EU VAT ID: PL6423261225
        (&quot;ZanReal&quot;, &quot;we&quot;). By using the Service you accept
        these terms.
      </p>

      <H2>2. The service</H2>
      <p>
        The Service is a free, informational availability monitor for
        third-party EVE Online community tools. It periodically requests
        public endpoints of the monitored tools and publishes the observed
        status, response times and incident history. The Service is provided
        &quot;as is&quot;, without registration and without charge.
      </p>

      <H2>3. Informational character of the data</H2>
      <p>
        Status information reflects only what our probes observed from our
        infrastructure at the time of checking. It may differ from the actual
        availability experienced by other users (e.g. due to network routing,
        bot protection or regional issues) and must not be treated as an
        authoritative statement about any third-party service, its quality or
        its operators. We are not affiliated with CCP Games or any monitored
        project. EVE Online is a registered trademark of CCP hf.
      </p>

      <H2>4. Acceptable use</H2>
      <ul className="list-inside list-disc space-y-1.5">
        <li>
          Do not overload, scrape abusively, or attempt to disrupt the Service
          or its API endpoints.
        </li>
        <li>
          Do not submit unlawful, offensive or misleading content through the
          suggestion form.
        </li>
        <li>
          Automated read access in reasonable volumes is tolerated; we may
          rate-limit or block abusive clients.
        </li>
      </ul>

      <H2>5. Tool operators</H2>
      <p>
        If you operate a monitored tool and want your service removed from the
        board, or want us to use a different health endpoint, contact us (see
        section 8) — we honour such requests.
      </p>

      <H2>6. Liability</H2>
      <p>
        To the maximum extent permitted by law, ZanReal is not liable for any
        damage arising from reliance on the published status data, from
        Service interruptions, or from decisions made based on the Service.
        Nothing in these terms excludes liability that cannot be excluded
        under Polish law, including liability towards consumers under
        mandatory provisions.
      </p>

      <H2>7. Intellectual property</H2>
      <p>
        The Service&apos;s design and content (except third-party names and
        marks, which belong to their owners) are owned by ZanReal. You may
        link to and quote the Service with attribution.
      </p>

      <H2>8. Contact and changes</H2>
      <p>
        Contact:{" "}
        <a
          href="https://zanreal.com/contact?utm_source=eve-tools-status&utm_medium=referral&utm_campaign=status-page&utm_content=terms"
          className="text-zinc-100 underline underline-offset-4"
        >
          zanreal.com/contact
        </a>
        . We may amend these terms; the current version is always published on
        this page with its effective date. Polish law governs these terms;
        disputes fall under the competent Polish courts, without prejudice to
        consumers&apos; statutory rights.
      </p>
    </div>
  );
}
