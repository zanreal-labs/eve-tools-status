import type { Metadata } from "next";
import { Suspense } from "react";
import { Activity } from "lucide-react";
import { REGIONS, REGION_LABELS } from "@/lib/monitors";
import { Nav } from "./nav";
import { Clock } from "./clock";
import { SuggestTool } from "./suggest-tool";
import { Consent, CookiePreferencesButton } from "./consent";
import "./globals.css";

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

// lucide-react no longer ships brand icons — official GitHub mark inlined.
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] font-mono text-zinc-200 antialiased">
        <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5">
          <a href="/" className="flex items-center gap-2.5">
            <Activity className="h-4 w-4 text-cyan-400" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wider">
              EVE Tools Status
            </span>
          </a>
          <Suspense
            fallback={
              <nav className="flex items-center gap-1 rounded-sm border border-zinc-800 bg-zinc-900/60 p-1">
                {["Status", "Events", "Monitors", "Partners", "Docs"].map(
                  (l) => (
                    <span
                      key={l}
                      className="rounded-sm px-3 py-1.5 text-sm uppercase tracking-wider text-zinc-400"
                    >
                      {l}
                    </span>
                  ),
                )}
              </nav>
            }
          >
            <Nav />
          </Suspense>
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
              <a
                href="https://zanreal.com/services/websites-and-branding/websites?utm_source=eve-tools-status&utm_medium=referral&utm_campaign=status-page&utm_content=footer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 underline-offset-4 hover:underline"
              >
                ZanReal - Website Development
              </a>
            </span>
            <span className="flex items-center gap-4">
              <a
                href="https://github.com/zanreal-labs/eve-tools-status"
                target="_blank"
                rel="noopener noreferrer"
                title="Source code on GitHub"
                className="inline-flex items-center gap-1.5 text-zinc-300 underline-offset-4 hover:underline"
              >
                <GithubIcon className="h-3.5 w-3.5" />
                GitHub
              </a>
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
