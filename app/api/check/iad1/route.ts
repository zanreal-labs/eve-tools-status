import { makeCheckHandler } from "@/lib/check-route";

export const preferredRegion = "iad1";
export const maxDuration = 120;

export const GET = makeCheckHandler("iad1");
