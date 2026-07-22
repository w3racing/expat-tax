# ADR-018: Commercial expansion & platform scalability

## Status

Accepted

## Context

AJX Tax must grow from a premium individual evidence product into a commercial platform: native apps, multi-entity accounts (family, business, trust, SMSF), subscriptions, integrations (bank, ATO, email, calendar), AI assistant, public API, and plugins. Architectural choices made now must not foreclose these paths.

## Decision

Adopt a **platform-first** posture governed by these non-negotiables:

1. **API-first domain** — business rules live in server-side services and typed contracts; clients (web, iOS, Android, desktop) are thin
2. **Organization-scoped tenancy path** — evolve from `user_id` RLS to `organization_id` + memberships without breaking existing data
3. **Adapter registries** — integrations (import, bank, ATO, email, calendar, OCR providers, plugins) plug in via stable interfaces
4. **Async job fabric** — all heavy work (AI, packages, sync, billing webhooks) is queued and idempotent
5. **Immutable evidence core** — vault, versions, audit trails remain append-only; new capabilities add layers, not rewrites
6. **Entitlement-gated features** — subscription and plan limits enforced server-side via entitlements, not UI-only
7. **Versioned public API** — external consumers use `/v1` with keys, scopes, and rate limits from day one of public API launch
8. **ADR gate** — no merge that violates [Platform principles](./14-commercial-expansion.md#platform-principles)

## Consequences

- Personal B2C remains the v1 ship target; org model is designed now, migrated later
- Some v1 shortcuts (localStorage migration, SPA-only routes) must be replaced before native apps ship — documented in capability roadmap
- Every new feature spec must include a **Commercial expansion** section
- Plugin and public API surfaces require security review before GA

## Supersedes / amends

- Amends ADR-010: personal tenancy is phase 1; organization tenancy is phase 2+
- Amends ADR-015: accountant collaboration becomes one collaboration type under org permissions
