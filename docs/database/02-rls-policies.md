# RLS policies

## Global rules

1. `enable row level security` on every tenant table
2. No policy → no access
3. `user_id = auth.uid()` for CRUD unless noted
4. Service role bypasses RLS (Edge Functions only)

## Profile

- SELECT / UPDATE own row
- INSERT own row (`id = auth.uid()`) on first login trigger preferred

## Evidence family

Tables: `evidence_items`, `evidence_files`, `evidence_events`, `evidence_extractions`, tags joins.

- ALL operations require matching `user_id`
- INSERT must set `user_id = auth.uid()`
- Soft-deleted rows: filtered in API views/queries (`deleted_at is null`); RLS still ownership-based

## Employers, payslips, trips, claims, readiness

Same ownership pattern.

## Integration accounts

- Users can SELECT limited columns (no raw tokens exposed via a **view**)
- Token columns: revoke direct SELECT from authenticated role; only Edge Functions with service role read tokens
- Pattern: base table locked down; `integration_accounts_public` view for client

## Processing jobs

- Users SELECT own jobs (for progress UI)
- INSERT/UPDATE of jobs: prefer service role / security definer functions so clients cannot forge job state

## Recommended helpers

```sql
create or replace function public.is_owner(uid uuid)
returns boolean language sql stable as $$
  select uid = auth.uid()
$$;
```

## Realtime

- Publication only for tables the client must subscribe to (e.g. `evidence_items` status)
- RLS still applies to Realtime
