# Capability roadmap (commercial expansion)

Phased delivery. **Design and ADRs now; implement when product priority demands.**

Legend: **Now** (v1 foundation) · **Next** · **Later** · **Future**

| Capability | Phase | Depends on | Architectural prerequisite |
|------------|-------|------------|----------------------------|
| Web SPA (phone/tablet/desktop shells) | **Now** | — | Feature-first, design system, API-first docs |
| Evidence Vault tri-location | **Now** | — | Blob + Drive + Postgres; adapter pattern |
| AI ingest every document | **Now** | — | Async jobs, pluggable provider |
| Document version history | **Now** | — | Immutable versions |
| Audit Mode package | **Now** | Vault, versions | Job fabric, deterministic ZIP |
| Insights Dashboard | **Now** | Readiness snapshots | Precomputed aggregates |
| Accountant Mode (delegated) | **Next** | Vault | Collaboration + audit events |
| V1 Migration wizard | **Now** | Import adapter registry | Extensible importers |
| Personal org backfill | **Next** | Supabase live | ADR-019 schema |
| Multi-user / family | **Next** | Org model | Memberships + invites |
| Business / trust / SMSF orgs | **Later** | Org model | Entity metadata, roles |
| Subscription billing | **Next** | Org model | Stripe, entitlements |
| iOS app | **Later** | Public API parity | PKCE auth, shared domain pkg |
| Android app | **Later** | iOS patterns | FCM, same API |
| Desktop app | **Later** | Web parity | Tauri/Electron + API |
| Bank feeds (AU CDR) | **Later** | Integrations | BankFeedAdapter, entitlements |
| ATO Prefill | **Later** | Integrations, compliance | Credential vault, AtoPrefillAdapter |
| Email ingestion | **Next** | Capture pipeline | Inbound webhook → ingest |
| Calendar integration | **Later** | Timeline | OAuth, sync jobs |
| OCR / model upgrades | **Continuous** | AI ingest | IngestProviderAdapter |
| AI Chat Assistant | **Later** | Evidence RAG | Assistant context, tool policy |
| Public API v1 | **Later** | Org auth, rate limits | Versioned routes, API keys |
| Plugin marketplace | **Future** | Public API, security | Manifest, sandbox, permissions |

## Sequencing rules

1. Never ship a **Later** item on a design that blocks **Future** items
2. **Next** items must not require destructive migrations of evidence or versions
3. Billing and public API require **organization_id** scope
4. Native apps require **no local-only business state** (except offline queue with sync)

## Migration debt register

Track v1 shortcuts that must be resolved:

| Debt | Resolution | Target phase |
|------|------------|--------------|
| `user_id`-only RLS | Org membership policies | Next |
| Migration wizard localStorage | Supabase import_batches | Next |
| SPA-only routes | Extract shared `@ajx/domain` | Later (native) |
| No entitlements table | Add subscriptions + gates | Next (billing) |
| Edge Functions without public versioning | `/v1` namespace + OpenAPI | Later |

Update this table when new shortcuts are introduced.
