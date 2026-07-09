import { makeCheckHandler } from "@/lib/check-route";

export const preferredRegion = "syd1";
export const maxDuration = 120;

export const GET = makeCheckHandler("syd1");
