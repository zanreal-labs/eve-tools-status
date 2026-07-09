import { MONITORS, REGIONS } from "@/lib/monitors";
import { kv, K } from "@/lib/kv";
import {
  HEALTH_COLORS,
  HEALTH_LABELS,
  healthFromEntries,
} from "@/lib/health";
import type { LatestEntry } from "@/lib/checks";


// ~monospace glyph width at font-size 11 for width estimation
const CHAR_W = 6.7;
const PAD = 10;

function segment(text: string): number {
  return Math.round(text.length * CHAR_W + PAD * 2);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cleanId = id.replace(/\.svg$/, "");
  const monitor = MONITORS.find((m) => m.id === cleanId);
  if (!monitor) {
    return new Response("unknown monitor", { status: 404 });
  }

  let entries: (LatestEntry | null)[] = [];
  try {
    const raw = await kv().hmget<Record<string, LatestEntry | null>>(
      K.latest,
      ...REGIONS.map((r) => `${cleanId}:${r}`),
    );
    entries = Object.values(raw ?? {});
  } catch {}

  const health = healthFromEntries(entries);
  const url = new URL(req.url);
  const label = (url.searchParams.get("label") || monitor.name).slice(0, 40);
  const value = HEALTH_LABELS[health];
  const color = HEALTH_COLORS[health];

  const lw = segment(label);
  const vw = segment(value);
  const w = lw + vw;
  const h = 20;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="${esc(label)}: ${esc(value)}">
  <title>${esc(label)}: ${esc(value)}</title>
  <clipPath id="r"><rect width="${w}" height="${h}" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${lw}" height="${h}" fill="#27272a"/>
    <rect x="${lw}" width="${vw}" height="${h}" fill="${color}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11">
    <text x="${lw / 2}" y="14" fill="#e4e4e7">${esc(label)}</text>
    <text x="${lw + vw / 2}" y="14" fill="#0a0a0a" font-weight="bold">${esc(value)}</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=900",
      "access-control-allow-origin": "*",
    },
  });
}
