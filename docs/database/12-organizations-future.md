# Organizations (future schema)

**Status:** Design only — implement when multi-user / family / business ships ([ADR-019](../architecture/adr/019-organization-model.md)).

## `organizations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `type` | text | `personal` \| `family` \| `business` \| `trust` \| `smsf` |
| `name` | text | Display name |
| `abn` | text | nullable; business/trust |
| `metadata` | jsonb | entity-specific (SMSF fund name, trust deed ref, etc.) |
| `billing_customer_id` | text | Stripe customer id |
| `created_at` / `updated_at` | timestamptz | |

## `organization_memberships`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `user_id` | uuid FK | |
| `role` | text | `owner` \| `admin` \| `member` \| `accountant` \| `viewer` \| `billing` |
| `status` | text | `active` \| `invited` \| `revoked` |
| `invited_at` / `accepted_at` / `revoked_at` | timestamptz | |

Unique `(organization_id, user_id)`.

## `entitlements`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid | |
| `feature_key` | text | e.g. `audit_mode`, `bank_feeds`, `api_access` |
| `limit_value` | int | nullable quota |
| `expires_at` | timestamptz | nullable |
| `source` | text | `subscription` \| `trial` \| `manual` |

## Tenant table migration

Add to all evidence-related tables:

```sql
organization_id uuid references organizations(id)
```

Backfill: one `personal` org per existing `user_id`.

RLS: membership check replaces or supplements `user_id = auth.uid()`.

## SMSF / trust notes

- Separate audit retention policies may apply (already compatible with seven-year vault)
- SMSF may require additional document classes — extend `document_type` enum only via migration ADR
- Trusts may have multiple financial years active — FY scoping remains on evidence rows
