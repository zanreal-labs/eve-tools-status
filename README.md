# EVE Tools Status

Status page for EVE Online community tools — https://eve-tools-status.com

25 monitors across 6 categories (core services, killboards, market & industry,
maps & intel, wormholes, reference), checked every 15 minutes from 4 Vercel
regions (`iad1`, `sfo1`, `fra1`, `syd1`).

## How it works

- `vercel.json` cron (`*/15 * * * *`) hits `/api/cron`
- The orchestrator fans out to `/api/check/{region}` — each route is pinned to
  its region via `preferredRegion`, fetches every monitor URL and records
  status + latency
- Results land in Upstash Redis (`ets:*` keys): latest snapshot, one daily
  aggregate hash per day (100-day TTL), status-transition events
- UI: Status (45-day uptime bars), Events (incident log), Monitors (live
  per-region state) + a suggest-a-tool form

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
