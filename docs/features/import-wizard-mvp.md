# AJX Tax V1 import wizard (TaxPlannerState)

**Status:** MVP implemented  
**Route:** `/migration` · logs `/settings/migration`  
**Adapter:** `ajx-calculator-tax-planner-v2` · contract `1.0.0` · migration version `mvp-planner-1.0.0`

## Flow

1. **Upload** JSON (`AJX Tax Backup.json` / `TaxPlannerState` schema 2)
2. **Validate** structure (hard fail on invalid schema / full app backup)
3. **Preview** counts, FY list, sample claims
4. **Warnings** (soft) — FY merge, orphan rates, FX zero, re-import checksum, receipt folders skipped
5. **Confirm** (typing gate `IMPORT`)
6. **Import** — snapshot → merge → recompute summaries → migration log

## Guarantees

| Requirement | Behaviour |
|-------------|-----------|
| Original IDs | Entity `id` values kept; `legacyIdMap` records every original id |
| Source | `ajx_calculator_tax_planner_v2` + label “Imported from AJX Tax Version 1” |
| Migration version | `mvp-planner-1.0.0` + adapter contract `1.0.0` on every log entry |
| Never lose data | Pre-import Tax Position snapshot; merge-by-id (existing-only rows kept) |

## Storage (local MVP)

- Position: `ajx.position.v1` (merged)
- Migration log: `ajx.migration.log.v1`
- Snapshots: `ajx.migration.snapshots.v1`
- Batch payload: `ajx.migration.imported.v1`

Postgres `import_batches` / `legacy_id_map` remain the long-term SoR when Supabase auth is wired.
