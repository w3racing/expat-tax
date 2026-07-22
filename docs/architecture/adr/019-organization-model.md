# ADR-019: Organization model (future tenancy)

## Status

Accepted (design now; implement when multi-user ships)

## Context

Future accounts include family, business, trust, and SMSF. Multiple users may access one vault. Evidence ownership and RLS must scale beyond `auth.uid() = user_id`.

## Decision

Introduce an **Organization** as the tenancy boundary for data:

| Org type | Example |
|----------|---------|
| `personal` | Default 1:1 org auto-created per user at signup |
| `family` | Household shared FY evidence |
| `business` | Pty Ltd / sole trader entity |
| `trust` | Discretionary / unit trust |
| `smsf` | Self-managed super fund |

```text
organizations 1───* organization_memberships *───1 users
organizations 1───* evidence_items (and all tenant tables)
```

RLS pattern (target):

```sql
organization_id in (
  select organization_id from organization_memberships
  where user_id = auth.uid() and status = 'active'
)
```

Roles (extensible): `owner`, `admin`, `member`, `accountant`, `viewer`, `billing`.

## Migration from v1 personal model

1. Add nullable `organization_id` to tenant tables
2. Backfill: each user gets a `personal` organization; `organization_id` set
3. RLS policies accept `user_id = auth.uid()` OR org membership (transition period)
4. Drop direct `user_id`-only policies when all queries use org scope
5. Family/business/trust/SMSF orgs created explicitly; evidence can move only via audited transfer jobs

## Consequences

- `user_id` remains for audit actor and provenance; `organization_id` becomes primary scope
- SMSF and trust may require separate FY rules and entity metadata tables later
- Subscription billing attaches to `organization_id`, not user

## Does not block v1

v1 ships with personal org implicit (or user_id-only RLS). Schema and docs prepared so migration is additive.
