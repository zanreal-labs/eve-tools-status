import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Activity } from "lucide-react";
import { REGIONS, REGION_LABELS } from "@/lib/monitors";
import { Nav } from "./nav";
import { SuggestTool } from "./suggest-tool";
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
          <Nav />
        </header>
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">{children}</main>
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
          <div>
            Made &amp; powered by{" "}
            <a
              href="https://zanreal.com?utm_source=eve-tools-status&utm_medium=referral&utm_campaign=status-page&utm_content=footer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 underline-offset-4 hover:underline"
            >
              ZanReal
            </a>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
