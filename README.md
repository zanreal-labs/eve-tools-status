# EVE Tools Status

Status page for EVE Online community tools — https://eve-tools-status.com

27 monitors across 6 categories (core services, killboards, market & industry,
maps & intel, wormholes, reference), checked every 15 minutes from 4 Vercel
regions (`iad1`, `sfo1`, `fra1`, `syd1`).

## How it works

- Four `vercel.json` crons (`*/15 * * * *`), one per region, hit
  `/api/check/{region}` directly. Each route is pinned to its region via
  `preferredRegion`, fetches every monitor URL in parallel and records status +
  latency. There is no orchestrator in the scheduled path on purpose: a fan-out
  function spends its whole life awaiting the region it called, which billed a
  fifth function for the duration of the slowest region on every run
- `/api/cron` still fans out to all four regions, for triggering a full round
  by hand
- Results land in Upstash Redis (`ets:*` keys): latest snapshot, one daily
  aggregate hash per day (100-day TTL), status-transition events
- UI: Status (45-day uptime bars), Events (incident log), Monitors (live
  per-region state) + a suggest-a-tool form
- Every page reads KV through a cached loader (`use cache`, 60s revalidate),
  so the pages are prerendered and served from the CDN. Data that only changes
  once per check cycle does not need a function invocation and a 49-command
  pipeline per visitor

## Environment variables

| Var | Source |
| --- | --- |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash KV via Vercel Marketplace (auto-injected on connect) |
| `CRON_SECRET` | Random secret; Vercel cron sends it automatically, also guards `/api/check/*` and `/api/debug` |

## Development

```sh
npm install
vercel env pull .env.development.local
npm run dev
```

Trigger a check manually:

```sh
curl -H "Authorization: Bearer $CRON_SECRET" https://<deployment>/api/cron
```

Review visitor tool suggestions:

```sh
curl -H "Authorization: Bearer $CRON_SECRET" https://<deployment>/api/debug
```

Monitors are defined in [lib/monitors.ts](lib/monitors.ts). Before adding one,
probe it with curl — sites behind aggressive bot protection (e.g. Cloudflare)
may 403 datacenter IPs and show as permanently down.

---

Made & powered by [ZanReal](https://zanreal.com). Not affiliated with CCP Games.
