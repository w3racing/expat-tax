# ADR index & technology stack

## Decision log

| ID | Decision | Status |
|----|----------|--------|
| [ADR-001](./adr/001-spa-vercel-supabase.md) | SPA on Vercel + Supabase backend | Accepted |
| [ADR-002](./adr/002-feature-first.md) | Feature-first architecture | Accepted |
| [ADR-003](./adr/003-auth-google-supabase.md) | Auth via Supabase Auth + Google OAuth | Accepted |
| [ADR-004](./adr/004-storage-strategy.md) | Evidence storage: Vercel Blob + Google Drive | Accepted |
| [ADR-005](./adr/005-data-fetching.md) | TanStack Query + typed Supabase client | Accepted |
| [ADR-006](./adr/006-forms-validation.md) | React Hook Form + Zod | Accepted |
| [ADR-007](./adr/007-ui-stack.md) | Tailwind + shadcn/ui + Framer Motion | Accepted |
| [ADR-008](./adr/008-responsive-shells.md) | Device shells: phone / tablet / desktop | Accepted |
| [ADR-009](./adr/009-ai-processing.md) | Async AI via Edge Functions + Cron | Accepted |
| [ADR-010](./adr/010-multi-tenancy.md) | Row-level security per user (B2C) | Accepted |
| [ADR-011](./adr/011-evidence-vault.md) | Evidence Vault tri-location durability | Accepted |
| [ADR-012](./adr/012-ai-every-document.md) | AI processes every upload | Accepted |
| [ADR-013](./adr/013-document-version-history.md) | Immutable document version history | Accepted |
| [ADR-014](./adr/014-insights-dashboard.md) | Visual insights dashboard (not tax forms) | Accepted |
| [ADR-015](./adr/015-accountant-mode.md) | Accountant Mode delegated read collaboration | Accepted |
| [ADR-016](./adr/016-audit-mode.md) | Audit Mode flagship ATO package | Accepted |
| [ADR-017](./adr/017-migration-wizard.md) | One-time V1 migration wizard | Accepted |
| [ADR-018](./adr/018-commercial-expansion.md) | Platform scalability & commercial expansion | Accepted |
| [ADR-019](./adr/019-organization-model.md) | Organization tenancy (future) | Accepted |
| [ADR-020](./adr/020-product-engineering-standards.md) | Product & engineering standards (premium SaaS) | Accepted |
| [ADR-022](./adr/022-incremental-mvp.md) | Incremental MVP v1 sequencing | Accepted |
| [ADR-023](./adr/023-mvp-v1-implementation-architecture.md) | MVP v1 implementation architecture | Accepted |

## Stack (locked)

| Layer | Choice | Role |
|-------|--------|------|
| UI | React 19 + TypeScript | Application |
| Build | Vite | Bundler / dev server |
| Styling | Tailwind CSS | Utility styles |
| Components | shadcn/ui | Accessible primitives |
| Motion | Framer Motion | Intentional motion |
| Routing | React Router | Client routes |
| Server state | TanStack Query | Cache, mutations, sync |
| Forms | React Hook Form + Zod | Forms & schemas |
| Backend | Supabase (Postgres, Auth, Realtime, Edge Functions) | Primary API & data |
| Hosting | Vercel | SPA + serverless |
| Object storage | Vercel Blob | App-owned evidence blobs |
| Cloud files | Google Drive API + Picker + OAuth | Import / link Drive files |
| Analytics | Vercel Analytics | Product analytics |
| Jobs | Vercel Cron + Edge Functions | Scheduled processing |
| Source | GitHub | VCS / CI |

## Explicit non-goals for v1 stack

- No Next.js (SPA + Edge Functions preferred for this product shape)
- No Redux / Zustand as default global store (prefer Query + URL + local UI state)
- No Prisma (Supabase client + SQL migrations)
- No Electron / Capacitor in v1 (responsive web that feels native)
