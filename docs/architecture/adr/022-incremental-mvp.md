# ADR-022: Incremental MVP v1 sequencing

## Status

Accepted — product spine refined by [ADR-024](./024-overnight-workflow-mvp-foundation.md)

## Context

Architecture, domain, and standards docs (ADRs 001–021, Tax Position model, parity gate) describe the full commercial product. The original implementation roadmap ([06](../06-implementation-roadmap.md)) sequenced AI ingest, Drive sync, and Audit Mode early.

Product strategy shifted to **incremental delivery**, then further reset so MVP centres the proven **overnight workflow** (ADR-024): overnight counts → evidence → sample days → average → Tax Position claim — not a generic expense tracker, and not AI- or roster-dependent.

## Decision

1. Adopt [MVP v1](../../product/01-mvp-v1.md) as the **active build order** (phases M0–M6), sequenced around the overnight spine.  
2. Adopt [ADR-024](./024-overnight-workflow-mvp-foundation.md) as the MVP product foundation.  
3. Existing architecture docs remain **valid** as the long-term north star for Evidence Vault, AI, Audit, and commercial expansion; they must not force those capabilities into MVP.  
4. Defer production AI, roster interpretation, Drive sync, Audit Mode UI, and Accountant Mode collaboration until after MVP.  
5. Ship **extension points** (`IngestProviderAdapter`, `DriveSyncAdapter`, job runner) as stubs so later work plugs in without rewriting overnight / sample-day core.  
6. Overnight claim maths: average daily spend from completed sample days × qualifying overnights, with full provenance.  
7. Accountant handoff in MVP is **package export only**.

## Consequences

- Faster path to a usable overnight-claim product for Calculator users and new personal users  
- Some P0 feature specs (AI, Drive, Audit, roster parsing) are postponed relative to their original priority labels  
- Schema still leaves room for versions, AI extractions, Drive mirrors, and accountant grants  
- Roadmap Phases 0–4 remain the post-MVP expansion sequence once M0–M6 are complete  

## Related

- [ADR-024 Overnight workflow MVP foundation](./024-overnight-workflow-mvp-foundation.md)  
- [MVP v1 product scope](../../product/mvp-v1-scope.md)  
- [MVP v1 build phases](../../product/01-mvp-v1.md)  
- [Overnight workflow feature](../../features/overnight-workflow-mvp.md)  
- [ADR-021 Tax Position domain](../../decisions/ADR-021-tax-position-domain.md)  
- [Tax calculation parity](../../testing/tax-calculation-parity.md)  
- [Implementation roadmap](../06-implementation-roadmap.md)  
