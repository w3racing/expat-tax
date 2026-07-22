# Database overview

## Engine

Supabase **Postgres** with migrations under `supabase/migrations/`.

## Conventions

- `uuid` primary keys (`gen_random_uuid()`)
- `created_at` / `updated_at` timestamptz on all tables
- `user_id uuid not null` on tenant tables
- Soft delete via `deleted_at` where user recovery matters
- Monetary amounts as `numeric(12,2)` with explicit currency (`AUD` default)
- Financial year as `text` in form `YYYY-YY` (e.g. `2025-26`) plus helper functions
- Enums as Postgres enums or check constraints — prefer enums for closed sets

## Migration rules

1. Forward-only migrations
2. RLS enabled in the same migration that creates a tenant table
3. Indexes created for every common filter (`user_id`, `financial_year`, `status`)
4. Never break preview environments without expand/contract

## Documents in this folder

| Doc | Contents |
|-----|----------|
| [01-schema.md](./01-schema.md) | Tables, enums, relationships |
| [02-tax-position-domain-model.md](./02-tax-position-domain-model.md) | Tax Position domain model (entities, mapping, provenance, audit) |
| [02-rls-policies.md](./02-rls-policies.md) | RLS policy patterns |
| [03-indexes-performance.md](./03-indexes-performance.md) | Indexes & scale notes |
| [04-financial-year.md](./04-financial-year.md) | FY helpers & scoping |
| [05-evidence-vault.md](./05-evidence-vault.md) | Drive sync, revisions, retention, backups |
| [06-ai-extractions.md](./06-ai-extractions.md) | Classification, FX, duplicates, confidence |
| [07-document-versions.md](./07-document-versions.md) | Replace, archive, restore, compare, audit |
| [08-dashboard-snapshots.md](./08-dashboard-snapshots.md) | Precomputed Home insights & estimates |
| [09-accountant-mode.md](./09-accountant-mode.md) | Collaborations, grants, audit, packages |
| [10-audit-mode.md](./10-audit-mode.md) | ATO package, claim traffic lights, artefacts |
| [11-migration.md](./11-migration.md) | Import batches, legacy ids, wizard flags |
| [12-organizations-future.md](./12-organizations-future.md) | Org, membership, entitlements (design) |
