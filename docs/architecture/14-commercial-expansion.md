# Commercial expansion & platform principles

Every architectural decision must support future commercial expansion. **Never implement anything that limits future scalability.**

This document is the gate for ADRs, schema changes, and feature specs.

## Platform principles

| # | Principle | Meaning |
|---|-----------|---------|
| P1 | **API-first** | Domain logic and authorization on the server; all clients consume the same contracts |
| P2 | **Org-ready tenancy** | Data scoped for `organization_id` + memberships; personal user is one org type |
| P3 | **Adapter registries** | External systems plug in via interfaces (import, bank, ATO, email, calendar, OCR, plugins) |
| P4 | **Job fabric** | Heavy work is async, idempotent, retriable, observable |
| P5 | **Immutable evidence** | Vault + versions + audit are append-only; integrations never silently overwrite |
| P6 | **Entitlements** | Plans and limits enforced server-side (`entitlements` / feature flags) |
| P7 | **Versioned APIs** | Public and partner APIs are versioned, scoped, rate-limited |
| P8 | **Client parity** | Web, iOS, Android, desktop share design tokens + API; no web-only business rules |
| P9 | **Extension points** | Hooks for plugins without forking core (manifest, sandbox, permissions) |
| P10 | **Document before build** | Expansion impact recorded in ADR or feature spec before code |

## ADR review checklist

Before accepting any ADR or major feature, confirm:

- [ ] Does not hard-code single-user-only assumptions in irreplaceable ways?
- [ ] Can iOS/Android/desktop call the same API without a rewrite?
- [ ] Are integrations behind an adapter interface?
- [ ] Is authorization enforceable server-side (RLS / Edge Functions)?
- [ ] Are binaries and metadata separable (Blob + Postgres, not LOBs)?
- [ ] Can subscription limits be applied without schema migration?
- [ ] Is audit trail preserved for compliance (ATO, accountant, SMSF)?
- [ ] Does it avoid vendor lock-in for one client platform?

If any answer is **no**, revise the design or document an explicit migration ADR.

---

## Future capability map

How each capability extends the platform **without** breaking v1.

### Native clients

| Capability | Architectural enabler | v1 state |
|------------|----------------------|----------|
| **iOS App** | REST/Realtime API + OAuth PKCE; shared `@ajx/domain` types | Web SPA |
| **Android App** | Same API; push via FCM | Web SPA |
| **Desktop App** | Electron/Tauri shell or PWA; same API; keyboard shortcuts in design system | Responsive web |

**Never:** business rules only in React components; platform-specific evidence storage without server sync.

### Account types

| Capability | Enabler | ADR |
|------------|---------|-----|
| **Multi-user accounts** | `organization_memberships` + roles | [019](./adr/019-organization-model.md) |
| **Family accounts** | Org type `family`; shared FY vault; member invites | 019 |
| **Business accounts** | Org type `business`; ABN metadata; employer links | 019 |
| **Trusts** | Org type `trust`; trustee roles; entity FY metadata | 019 |
| **SMSF** | Org type `smsf`; segregated evidence classes; stricter audit | 019 |

Accountant Mode ([011](./11-accountant-mode.md)) becomes a **role + grant** on org membership, not a separate product.

### Commercial

| Capability | Enabler |
|------------|---------|
| **Subscription billing** | `billing_customers`, `subscriptions`, `entitlements` on `organization_id`; Stripe webhooks → job fabric |
| **Public API** | `/v1` routes, API keys, OAuth client credentials, scopes, rate limits, webhooks |
| **Plugin architecture** | `plugin_manifests`, signed bundles, permission declarations, hook registry (capture, ingest, export, dashboard widgets) |

Entitlements examples: `max_evidence_per_fy`, `audit_mode`, `accountant_seats`, `bank_feeds`, `ato_prefill`, `api_access`.

### Integrations

| Capability | Enabler | Pattern |
|------------|---------|---------|
| **Bank feeds** | `integration_accounts` + `BankFeedAdapter`; CDR/Open Banking AU | Same as Google Drive adapter |
| **ATO Prefill** | `AtoPrefillAdapter`; secure credential vault; read-only import → evidence pipeline | Integration context |
| **Email ingestion** | Inbound parse (SendGrid/Postmark) → `capture_source=email_forward` → AI ingest | Capture bounded context |
| **Calendar integration** | Google/Microsoft OAuth; `calendar_sync_jobs`; trip suggestion | Integration + timeline |

**Never:** embed bank or ATO credentials in the client; never bypass ingest pipeline for imports.

### Intelligence

| Capability | Enabler |
|------------|---------|
| **AI Chat Assistant** | `assistant` bounded context; RAG over evidence metadata (not raw blob spam); tool calls are read-only or user-confirmed writes |
| **OCR improvements** | `IngestProviderAdapter` behind `process-evidence`; swap models without schema change |

Assistant must not mutate evidence without explicit user confirmation (same as low-confidence review).

---

## Target platform architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│ Clients: Web SPA │ iOS │ Android │ Desktop │ Public API clients │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WSS (versioned API)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ API Gateway / Edge Functions                                     │
│ Auth (user + org + API key) │ Entitlements │ Rate limits         │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────────┐   ┌──────────────┐
│ Domain      │    │ Job fabric       │   │ Adapters     │
│ services    │    │ (queues, cron)   │   │ bank, ATO,   │
│ evidence,   │    │ AI, packages,    │   │ email, cal,  │
│ vault,      │    │ billing, sync    │   │ import, OCR, │
│ audit,      │    └─────────────────┘   │ plugins      │
│ billing     │                          └──────────────┘
└──────┬──────┘
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Postgres (org-scoped RLS) │ Blob storage │ Realtime             │
└─────────────────────────────────────────────────────────────────┘
```

## Shared packages (future monorepo layout)

```text
packages/
  domain/          # Zod schemas, FY utils, types — all clients
  api-client/      # Generated or hand-maintained SDK
  design-tokens/   # CSS + native token export
apps/
  web/             # Current Vite SPA
  ios/             # Future
  android/         # Future
  desktop/         # Future
```

v1 code lives in `src/`; extract to `packages/` when second client ships — **types and schemas first**.

## Plugin architecture (outline)

Plugins declare:

- `id`, `version`, `permissions[]` (read_evidence, hook_ingest, export_widget, …)
- Hook entrypoints (server-side only in v1 of plugin system)
- Sandbox: no direct DB; calls platform SDK

Owner installs plugin per organization; entitlements may gate marketplace access.

## Public API (outline)

- Base: `https://api.ajxtax.com.au/v1`
- Auth: Bearer API key or OAuth 2.0 (org-scoped)
- Scopes: `evidence:read`, `evidence:write`, `audit:generate`, `webhooks:manage`
- Webhooks: evidence.ready, package.complete, subscription.updated
- Idempotency-Key on all mutating routes

## v1 allowances vs future hardening

| Area | v1 (acceptable) | Before scale / native |
|------|-----------------|------------------------|
| Tenancy | `user_id` RLS | Org membership RLS |
| Migration | localStorage importer | Supabase `import_batches` |
| Auth | Google OAuth SPA | + PKCE mobile, API keys |
| Billing | Not shipped | Stripe + entitlements table |
| Public API | Internal Edge Functions only | Versioned `/v1` |

Documented shortcuts must have a tracked migration in [capability roadmap](./15-capability-roadmap.md).

## Related

- [ADR-018 Commercial expansion](./adr/018-commercial-expansion.md)
- [ADR-019 Organization model](./adr/019-organization-model.md)
- [Capability roadmap](./15-capability-roadmap.md)
- [Security & tenancy](./05-security-tenancy.md)
