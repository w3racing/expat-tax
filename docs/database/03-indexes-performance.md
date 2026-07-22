# Indexes & performance

## Required indexes (v1)

```text
evidence_items (user_id, financial_year, deleted_at)
evidence_items (user_id, status) where deleted_at is null
evidence_items (user_id, occurred_on desc)
evidence_items (user_id, kind, financial_year)
evidence_files (evidence_id)
evidence_events (evidence_id, created_at)
processing_jobs (status, run_after) where status in ('queued', 'running')
processing_jobs (user_id, evidence_id)
payslips (user_id, financial_year)
trips (user_id, financial_year, starts_on)
readiness_snapshots (user_id, financial_year) unique
integration_accounts (user_id, provider) unique
```

## Query patterns to optimise

| Pattern | Strategy |
|---------|----------|
| Evidence library infinite scroll | Keyset on `(occurred_on, id)` |
| Dashboard readiness | Read `readiness_snapshots`, recompute async |
| Needs review queue | Partial index on `status = needs_review` |
| Stuck processing | Cron scans `processing_jobs` |

## Scale notes (hundreds of thousands of records / many years)

Standards require excellent UX at this scale ([Engineering standards](../standards/03-engineering.md)):

- **Keyset pagination** on all evidence/history lists — never offset into huge tables as the primary path
- **FY default scope** — queries default to active financial year; “all years” is explicit and paginated
- **Virtualized lists** in the client once rows exceed ~50–100 on screen
- **Summary DTOs** for lists; full metadata and file URLs on detail only
- **Snapshots** for dashboard aggregates; recompute via jobs
- **Partial indexes** for `needs_review`, active `processing_jobs`
- **No full-history hydrate** into React state or localStorage
- Partitioning `evidence_events` by month only if growth demands (defer until metrics justify)

## Scale notes (thousands of users)

- Expect high write volume at EOFY — keep ingest async
- `metadata` / `normalised` jsonb: index specific keys only when filtered in product queries
- Vacuum/analyse monitored via Supabase

## Caching

- TanStack Query TTLs: short for status-heavy lists; longer for employers/tags
- Readiness snapshot prevents heavy aggregate queries on every home load
