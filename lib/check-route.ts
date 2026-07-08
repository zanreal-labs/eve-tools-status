import { NextResponse } from "next/server";
import { authorized, runChecks } from "./checks";
import type { Region } from "./monitors";

export function makeCheckHandler(region: Region) {
  return async function GET(req: Request) {
    if (!authorized(req)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const results = await runChecks(region);
    return NextResponse.json({
      region,
      checked: results.length,
      failures: results.filter((r) => !r.ok),
    });
  };
}
