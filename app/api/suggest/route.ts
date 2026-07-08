import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const dynamic = "force-dynamic";

const MAX_PER_HOUR = 5;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, url, note } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
    return NextResponse.json(
      { error: "Tool name is required (2–100 chars)" },
      { status: 400 },
    );
  }
  if (typeof url !== "string" || url.length > 300 || !/^https?:\/\/\S+\.\S+/.test(url)) {
    return NextResponse.json(
      { error: "A valid http(s) URL is required" },
      { status: 400 },
    );
  }
  if (note !== undefined && (typeof note !== "string" || note.length > 500)) {
    return NextResponse.json({ error: "Note too long (max 500)" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 12);
  const hourBucket = Math.floor(Date.now() / 3_600_000);

  const { blobs } = await list({
    prefix: `suggestions/${ipHash}-${hourBucket}-`,
    limit: MAX_PER_HOUR + 1,
  });
  if (blobs.length >= MAX_PER_HOUR) {
    return NextResponse.json(
      { error: "Too many suggestions — try again later" },
      { status: 429 },
    );
  }

  await put(
    `suggestions/${ipHash}-${hourBucket}-suggestion.json`,
    JSON.stringify({
      ts: Date.now(),
      name: name.trim(),
      url: url.trim(),
      note: typeof note === "string" ? note.trim() : "",
    }),
    {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: true,
    },
  );

  return NextResponse.json({ ok: true });
}
