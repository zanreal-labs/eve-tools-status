import { makeCheckHandler } from "@/lib/check-route";

export const preferredRegion = "sfo1";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export const GET = makeCheckHandler("sfo1");
