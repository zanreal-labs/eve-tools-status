"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Status" },
  { href: "/events", label: "Events" },
  { href: "/monitors", label: "Monitors" },
  { href: "/partners", label: "Partners" },
  { href: "/docs", label: "Docs" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 rounded-sm border border-zinc-800 bg-zinc-900/60 p-1">
      {TABS.map((t) => {
        const active =
          t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-sm px-3 py-1.5 text-sm uppercase tracking-wider transition-colors ${
              active
                ? "bg-cyan-400/10 text-cyan-300"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
