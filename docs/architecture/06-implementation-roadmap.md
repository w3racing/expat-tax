# Implementation roadmap

Build only after the relevant docs for that slice are accepted.
**Before any feature UI:** [Product & engineering standards](../standards/00-overview.md) (ADR-020) and design-system tokens (including light/dark).

## Active build order — MVP v1

> **Current priority:** [MVP v1](../product/mvp-v1-scope.md) · [Implementation architecture](./17-mvp-v1-implementation.md) (phases in [01-mvp-v1.md](../product/01-mvp-v1.md), [ADR-022](./adr/022-incremental-mvp.md), [ADR-023](./adr/023-mvp-v1-implementation-architecture.md)).
>
> Ship Tax Position (calculator parity), evidence organisation, planner/evidence import, dashboard, tax summary, and accountant package export first. AI ingest, Drive sync, Audit Mode, and Accountant Mode collaboration remain valid architecture but are deferred until MVP is done.
>
> Phases 0–4 below remain the long-range expansion sequence after MVP.

## Phase 0 — Foundation

1. Vite + React 19 + TS + Tailwind + shadcn scaffolding
2. App providers (Query, Router, Auth)
3. Device shells (phone / tablet / desktop) with empty routes
4. Supabase project + initial migrations (profiles, evidence core)
5. Design tokens applied (non-default theme) — **light + dark from day one**
6. Shared standards primitives (Skeleton, EmptyState, ConfirmDialog, JobProgress, UploadStatus, ErrorBanner, DraftStatus, UndoToast)
7. Error copy catalogue (`shared/lib/errors`)
8. **Migration wizard** (V1 JSON importer + admin re-enable)

## Phase 1 — Capture, AI & evidence (vertical slice)

1. Google auth
2. Blob upload path (photos, PDF, ZIP, CSV)
3. Evidence list + detail with AI fields
4. `process-evidence` worker: classify, extract, confidence routing
5. ATO monthly rate table + FX normalisation
6. Duplicate scan (checksum + fuzzy)
7. Low-confidence review sheet
8. Document version history (replace, archive, restore, compare)

## Phase 2 — Vault, readiness, Drive & Audit Mode

1. Evidence Vault bootstrap + mirror
2. Readiness snapshots + cron
3. Drive sync (rename / replace / delete → version rows)
4. Needs-review queue polish
5. **Audit Mode** (claim traffic lights, PDF/ZIP/index/timeline generation)
6. Dashboard snapshots wired to completeness + missing insights

## Phase 3 — Travel & income

1. Trips/timeline
2. Employers/payslips
3. Deductions workspace

## Phase 4 — Scale, backups & Accountant Mode

1. Email attachment ingest
2. Encrypted monthly backups
3. Accountant Mode (invite, grants, comments, requests, packages, audit)
4. Performance pass (indexes, Query, upload quotas)

## Definition of done (every phase)

- Strict TypeScript
- No placeholders / TODO comments
- Files ≤ ~300 lines
- Works on phone, tablet, desktop shells
- Docs updated if decisions change (new ADR)
