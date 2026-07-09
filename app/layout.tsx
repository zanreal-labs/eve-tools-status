import type { Metadata } from "next";
import Script from "next/script";
import { Activity } from "lucide-react";
import { REGIONS, REGION_LABELS } from "@/lib/monitors";
import { Nav } from "./nav";
import { Clock } from "./clock";
import { SuggestTool } from "./suggest-tool";
import { Consent, CookiePreferencesButton } from "./consent";
import "./globals.css";

const GA_ID = "G-FCHN28KZ3T";

const gaConsentDefault = `
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500,
});
gtag('set', 'url_passthrough', true);
gtag('set', 'ads_data_redaction', true);
gtag('js', new Date());
gtag('config', '${GA_ID}');
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://eve-tools-status.com"),
  title: "EVE Tools Status",
  description:
    "Availability of EVE Online community tools, checked every 15 minutes from 4 regions.",
  openGraph: {
    title: "EVE Tools Status",
    description:
      "Availability of EVE Online community tools, checked every 15 minutes from 4 regions.",
    url: "https://eve-tools-status.com",
    siteName: "EVE Tools Status",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVE Tools Status",
    description:
      "Availability of EVE Online community tools, checked every 15 minutes from 4 regions.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] font-mono text-zinc-200 antialiased">
        <Script id="ga-consent-default" strategy="beforeInteractive">
          {gaConsentDefault}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5">
          <a href="/" className="flex items-center gap-2.5">
            <Activity className="h-4 w-4 text-cyan-400" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wider">
              EVE Tools Status
            </span>
          </a>
          <Nav />
        </header>
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
          <Clock />
          {children}
        </main>
        <section className="mx-auto max-w-3xl px-4 pb-10">
          <SuggestTool />
        </section>
        <footer className="mx-auto max-w-3xl space-y-2 border-t border-zinc-800 px-4 py-6 text-xs text-zinc-500">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Checks every 15 min from{" "}
              {REGIONS.map((r) => REGION_LABELS[r]).join(", ")}
            </span>
            <span>Not affiliated with CCP Games</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Made &amp; powered by{" "}
              <a
                href="https://zanreal.com?utm_source=eve-tools-status&utm_medium=referral&utm_campaign=status-page&utm_content=footer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 underline-offset-4 hover:underline"
              >
                ZanReal
              </a>
            </span>
            <span className="flex items-center gap-4">
              <a
                href="/privacy"
                className="text-zinc-300 underline-offset-4 hover:underline"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-zinc-300 underline-offset-4 hover:underline"
              >
                Terms
              </a>
              <CookiePreferencesButton />
            </span>
          </div>
        </footer>
        <Consent />
      </body>
    </html>
  );
}
