# Security & multi-tenancy

## Tenancy model

**Owner-centric tenancy** with optional **Accountant Mode** delegation, evolving to **organization-scoped** multi-user ([ADR-019](./adr/019-organization-model.md)):

- Every evidence row is owned by the user today; **`organization_id`** is the future primary scope
- Active accountant collaborations may **read** (and write only comments/requests/audit) under explicit grants
- Accountants **never** mutate original evidence or versions
- Family, business, trust, and SMSF accounts are org **types**, not separate products
- Household sharing and firm multi-client portals use the same membership model with different roles

See [Accountant Mode](./11-accountant-mode.md), [ADR-015](./adr/015-accountant-mode.md), and [Commercial expansion](./14-commercial-expansion.md).

## Authentication

- Supabase Auth with **Google OAuth** as primary
- Accountant invite may use magic link or Google sign-in to accept
- Session stored per Supabase SPA best practice

## Authorisation

- **Postgres Row Level Security (RLS)** on all user tables
- Owner policies: full CRUD on own data (within product rules)
- Collaborator policies: SELECT evidence when collaboration active + read grant; INSERT limited to comments/requests
- Service role used only in Edge Functions for ingest, cron, package generation, and admin repair jobs

## Secrets

| Secret | Where |
|--------|-------|
| `SUPABASE_ANON_KEY` | Vite public env (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions / Cron only |
| `GOOGLE_CLIENT_SECRET` | Edge / Supabase secrets |
| Blob / cron secrets | Vercel env |

Never commit `.env` files with real values.

## Evidence file security

- Blob URLs should be unguessable and preferably short-lived or access-checked
- Prefer private Blob access with authenticated download via Edge Function when feasible
- Accountant downloads must check collaboration + grant and write audit events
- Drive tokens stored encrypted/at-rest via Supabase vault or server-only tables; never expose refresh tokens to the client beyond OAuth handling requirements
- Accountants never receive owner Drive OAuth tokens

## Privacy (AU)

- Collect only evidence needed for tax preparation assistance
- Clear retention & deletion in Settings (export + delete account path)
- AI processing: send minimal necessary content to model providers; document processors in API docs
- No selling of user financial data
- Owner can revoke accountant access; audit trail retained per policy

## Abuse & rate limits

- Capture/upload rate limits at Edge Function layer
- Cron endpoints authenticated with shared secret header
- Picker/import quotas per user per day
- Accountant package generation rate-limited per collaboration

## Auditability

- `evidence_events` append-only log for status transitions
- `accountant_audit_events` append-only log for every accountant (and collaboration) action including denials
- Soft deletes with `deleted_at` for recovery window
- Version history never permanently destroyed within retention
