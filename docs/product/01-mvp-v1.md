# AJX Tax — MVP v1

**Status:** Canonical — active build scope  
**Audience:** Product, engineering, design  
**Related:** [Product definition](./00-product-definition.md) · [MVP scope](./mvp-v1-scope.md) · [Overnight workflow](../features/overnight-workflow-mvp.md) · [ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md) · [ADR-022](../architecture/adr/022-incremental-mvp.md)

## Purpose

Ship a usable, professional overnight-claim product quickly — the AJX Calculator workflow, not a generic expense tracker.

Philosophy: **Simple. Reliable. Fast. Audit-ready.**

## Priorities

1. Functional overnight workflow (complete the MVP gate)  
2. Beautiful  
3. Reliable  
4. Mobile friendly  
5. Extensible later — **do not** start AI / OCR / Drive / roster parsing until [MVP completion gate](../features/mvp-completion-gate.md) is green

## In scope

| Capability | MVP behaviour |
|------------|---------------|
| **Financial year** | Create / select in Settings |
| **Overnight workflow** | FY → overnight counts → evidence → sample days → receipts → average → Tax Position claim |
| **Tax Position** | First-class overnight claim with provenance; other FY ledgers for continuity |
| **Evidence organisation** | Upload, tag, filter, soft-delete; roster as evidence only |
| **Accountant export** | PDF + ZIP with overnight provenance + sample days |
| **Backup & restore** | Full JSON backup (planner + sample days + evidence) |
| **Dashboard** | FY stance, claim, evidence, recent activity, quick actions |

## Out of scope (extension points only)

- AI classification / extraction pipeline  
- Roster interpretation / parsing as a product requirement  
- Generic expense-tracker redesign  
- Google Drive sync / Picker  
- Full Audit Mode traffic-light workspace  
- Accountant Mode invites, grants, comments, requests  
- Email ingest, encrypted backups, billing, orgs, native apps  
- Timeline/trips as calculation authority (overnight table wins)

## Locked decisions

| Topic | Decision |
|-------|----------|
| Product spine | Overnight workflow (ADR-024) |
| Overnight counts | Manual; source of truth |
| Roster | Evidence only in MVP |
| AI / Drive | Interfaces + stubs; no production pipeline |
| Accountant handoff | Package export only |
| Tax maths for overnight claim | Average daily spend from completed sample days × qualifying overnights |

## Success criteria

- New user: auth → FY → overnight counts → sample days → claim on Tax Position  
- Evidence uploads never block on AI  
- Roster upload never changes overnight counts  
- Average and claim show full provenance  
- Download accountant package  
- Happy path requires neither AI nor roster parsing  

## Standards compliance

MVP targets [U1–U15](../standards/00-overview.md) via shared primitives.

### Standards exceptions

| Gate | Exception | Rationale |
|------|-----------|-----------|
| **U10** | N/A — no AI suggestions in MVP | AI deferred; gate applies when ingest ships |
| **U9** | Manual uploads set `processing_status = ready` immediately | No async AI worker; status enum retained for future |

## Build phases

Re-sequence around the overnight spine:

| Phase | Focus |
|-------|--------|
| M0 | Foundation (auth, FY, shell, standards primitives) |
| M1 | Overnight table (destination × month) |
| M2 | Evidence upload + link |
| M3 | Destination sample days + receipts + complete |
| M4 | Average daily spend + apply to qualifying overnights |
| M5 | Tax Position claim display + provenance |
| M6 | Dashboard, import mapping, accountant export, polish |

Active order supersedes older ledger-first MVP sequencing. See [ADR-022](../architecture/adr/022-incremental-mvp.md) and [ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md).
