# System architecture

## High-level diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                     Clients (PWA-ready SPA)                  │
│         Phone shell │ Tablet shell │ Desktop shell           │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  Static assets │ Edge Middleware (optional) │ Cron triggers  │
│  Vercel Blob (evidence binaries) │ Analytics                 │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
              ▼                               ▼
┌──────────────────────────┐    ┌─────────────────────────────┐
│         Supabase         │    │         Google              │
│  Auth (Google OAuth)     │    │  OAuth / Drive / Picker     │
│  Postgres + RLS          │    │  User Drive import          │
│  Realtime (status)       │    └─────────────────────────────┘
│  Edge Functions (AI,     │
│    ingest, webhooks)     │
└──────────────────────────┘
```

## Request paths

### 1. Interactive app traffic

Browser → Vercel CDN (SPA) → Supabase JS client (Auth + PostgREST + Realtime).

All user data access is **RLS-enforced**. The SPA never uses the service role key.

### 2. Evidence upload (app-owned)

1. Client requests a short-lived upload path (Edge Function or Blob client token pattern).
2. File lands in **Vercel Blob**.
3. Metadata row written in Postgres (`evidence_items` + `evidence_files`).
4. Ingest job enqueued → AI classification / OCR / extraction.
5. Realtime or Query invalidation updates UI.

### 3. Evidence import (Google Drive)

1. User connects Google via OAuth (scopes limited to Drive file access as needed).
2. Google Picker selects files/folders.
3. Edge Function copies or references files; preferred path for durability: **copy into Vercel Blob** and store Drive file id as provenance.
4. Same ingest pipeline as uploads.

### 4. Background & scheduled work

- **Vercel Cron** hits secured Edge Function routes (e.g. nightly FY readiness recompute, stuck-job recovery, reminder emails later).
- Edge Functions use service role **only** inside the function boundary.

## Bounded contexts (domain)

| Context | Owns |
|---------|------|
| Identity | Profiles, preferences, OAuth links, **organizations & memberships (future)** |
| Capture | Upload, camera, Drive picker, email-forward, **bank/ATO imports (future)** |
| Evidence | Items, files, classifications, tags, confidence, versions |
| Timeline | FY calendar, trips, rosters, flights, **calendar sync (future)** |
| Income | Payslips, employer links, allowances |
| Deductions | Claim categories, work-related ruleset metadata |
| Readiness | Completeness scoring, missing-evidence hints |
| Integrations | Google, Blob, analytics, **adapter registry** |
| Billing | **Subscriptions & entitlements (future)** |
| Assistant | **AI chat & tools (future)** |
| Platform | **Public API, webhooks, plugins (future)** |

## Scalability posture (thousands → commercial scale)

- Postgres with proper indexes on `user_id`, **`organization_id` (future)**, `financial_year`, `created_at`, status
- Blob storage for binaries (not Postgres LOBs)
- Async AI — never block the capture UX on model latency
- TanStack Query caching to reduce chatty reads
- Edge Functions horizontally scaled on Vercel/Supabase
- Avoid N+1: list endpoints return denormalised summary DTOs
- Soft delete + archival strategy for old FYs
- **API-first:** domain rules not trapped in web-only code ([Commercial expansion](./14-commercial-expansion.md))
- **Entitlement gates** for paid features (future)
- **Versioned public API** for native clients and partners (future)

See [Capability roadmap](./15-capability-roadmap.md) for phased commercial features (iOS, Android, desktop, family/business/trust/SMSF, billing, bank feeds, ATO prefill, assistant, plugins).

## Observability

- Vercel Analytics for page/web vitals
- Structured logs in Edge Functions (`request_id`, `user_id` hash, `evidence_id`)
- Supabase dashboard for DB performance; add slow-query review before scale events

## Environments

| Env | Purpose |
|-----|---------|
| `local` | Vite + local/Supabase project or linked remote |
| `preview` | Vercel preview per PR |
| `production` | Live |

Secrets live in Vercel / Supabase project settings — never in the repo.
