# ADR-010: RLS multi-tenancy (owner-centric)

## Status

Accepted (amended by ADR-015)

## Context

Primary users are individual professionals. Full firm multi-client portals are out of scope.

## Decision

Every tenant evidence table is owned by the user (`user_id` / `owner_user_id`). **RLS** enforces ownership for writes.

**Amendment (ADR-015):** optional **Accountant Mode** allows delegated **read** (plus comments/requests/exports) via explicit collaborations. Accountants never mutate original evidence.

## Consequences

- Simple owner mental model preserved
- Collaboration is grant-based, revocable, and fully audited
- Firm org hierarchies remain a future ADR
