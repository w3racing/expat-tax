# Dashboard snapshots

## `dashboard_snapshots`

Precomputed Home payload per user + FY.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | |
| `estimated_refund_aud` | numeric(12,2) | nullable |
| `estimated_payable_aud` | numeric(12,2) | nullable |
| `estimate_confidence` | numeric(3,2) | |
| `estimate_missing_inputs` | jsonb | string array |
| `completeness_score` | numeric(5,2) | mirrors readiness |
| `missing_documents` | int | |
| `missing_receipts` | int | |
| `missing_payslips` | int | |
| `missing_rosters` | int | |
| `travel_days` | int | |
| `countries` | jsonb | `[{ code, name, days }]` |
| `income_total_aud` | numeric(12,2) | evidence tally |
| `income_breakdown` | jsonb | |
| `expense_total_aud` | numeric(12,2) | |
| `expense_breakdown` | jsonb | |
| `investment_total_aud` | numeric(12,2) | |
| `investment_breakdown` | jsonb | |
| `computed_at` | timestamptz | |

Unique `(user_id, financial_year)`.

## `ato_alerts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `slug` | text unique | |
| `title` | text | |
| `body` | text | |
| `severity` | text | `info` \| `deadline` \| `rates` |
| `starts_on` / `ends_on` | date | |
| `audience` | text | `all` \| segment filter later |
| `is_active` | boolean | |

User dismissals optional in `ato_alert_dismissals (user_id, alert_id)`.

## Recompute

Job `recompute-dashboard` runs:

- after evidence ready / archived
- after claim rebind
- nightly with readiness
- after ATO rate ingest (estimate may change)

Client reads snapshot only; no heavy aggregates on Home render.
