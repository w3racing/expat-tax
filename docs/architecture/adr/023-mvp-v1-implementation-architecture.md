# ADR-023: MVP v1 implementation architecture

## Status

Accepted

## Context

AJX Tax has a rich long-term architecture (Evidence Vault, AI ingest, Drive, Audit Mode, Accountant Mode). MVP v1 must ship a usable personal tax app quickly ([mvp-v1-scope.md](../../product/mvp-v1-scope.md)) without implementing that full surface.

Engineering needs a single, simple implementation contract: stack, feature folders, persistence rules, and extension points — without temporary local-only data models or duplicated domain logic.

## Decision

1. **Stack for MVP:** React + TypeScript + Vite + Tailwind + shadcn/ui + Supabase + Vercel (as in [01-technology-stack.md](../01-technology-stack.md)).  
2. **Feature-first folders** under `src/features/*` with `components`, `hooks`, `services`, `types`, `utils` (+ `pages` / `index.ts`).  
3. **MVP features only:** `auth`, `dashboard`, `tax-position`, `income`, `expenses`, `evidence`, `imports`, `exports`, `settings`.  
4. **Supabase (+ Blob) is the system of record** for Tax Position, Evidence, imports, and exports. Do not use local-only storage for important data.  
5. **Tax Position engine** is pure TS with pinned `engine_version` and parity tests; `income` / `expenses` are UI/service slices, not second calculators.  
6. **Future features** (AI, Drive, Accountant access, Audit Mode) attach via `shared/integrations/*` interfaces; MVP ships stubs only.  
7. Canonical write-up: [17-mvp-v1-implementation.md](../17-mvp-v1-implementation.md).

## Consequences

- Clear folder ownership reduces large components and cross-feature coupling.  
- Persistence discipline prevents “demo-only” data that cannot migrate to production.  
- Extension interfaces keep ADR-011/012/015/016 paths open without building them now.  
- Existing broader docs remain valid; when they conflict on **sequencing**, MVP docs + ADR-022/023 win until MVP is complete.

## Related

- [ADR-022 Incremental MVP](./022-incremental-mvp.md)  
- [ADR-002 Feature-first](./002-feature-first.md)  
- [ADR-021 Tax Position domain](../../decisions/ADR-021-tax-position-domain.md)  
- [Product MVP scope](../../product/mvp-v1-scope.md)  
