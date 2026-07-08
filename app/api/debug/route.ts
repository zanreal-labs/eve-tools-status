import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { authorized } from "@/lib/checks";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [state, suggestions] = await Promise.all([
    list({ prefix: "state/", limit: 100 }),
    list({ prefix: "suggestions/", limit: 500 }),
  ]);
  return NextResponse.json({
    state: state.blobs.map((b) => ({
      pathname: b.pathname,
      size: b.size,
      uploadedAt: b.uploadedAt,
    })),
    suggestionCount: suggestions.blobs.length,
    suggestionUrls: suggestions.blobs.slice(0, 50).map((b) => b.url),
  });
}
