# Vercel Cron jobs

Configured in `vercel.json` (when app is scaffolded).

| Cron | Path | Schedule | Work |
|------|------|----------|------|
| Recover jobs | `/api/cron/recover-jobs` or Edge equivalent | every 10–15 min | Requeue stale `running`/`queued` |
| Readiness | `/api/cron/readiness` | daily off-peak AU | Recompute for users with recent changes |
| Cleanup | `/api/cron/cleanup` | daily | Expire soft-deleted blobs past retention |
| ATO rates | `/api/cron/ingest-ato-rates` | monthly | Refresh `ato_exchange_rates` table |

## Security

Shared `CRON_SECRET` required. No public access.

## Idempotency

Crons must be safe on overlap; use job locks or `updated_at` fencing.
