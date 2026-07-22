# Product overview

**Canonical product definition:** [Product Definition](../product/00-product-definition.md) — non-technical source of truth for what AJX Tax is, who it serves, and what we deliberately exclude.

**MVP foundation:** [ADR-024 Overnight workflow](./adr/024-overnight-workflow-mvp-foundation.md) · [Overnight workflow feature](../features/overnight-workflow-mvp.md)

This page is a short orientation for readers entering the architecture set.

## What AJX Tax is

An Australian tax product whose MVP is built around the proven AJX Calculator **overnight workflow**:

1. Financial year  
2. Manual overnight counts (destination × month) — **source of truth**  
3. Supporting evidence uploads (roster is evidence only)  
4. Destination sample days + receipts  
5. Average daily spend → applied to qualifying overnights  
6. Claim on **Tax Position**

Supporting domains:

1. **Evidence Vault** — proof for the claim  
2. **Tax Position** — living, traceable claim and FY working papers  

**Philosophy:** Simple. Reliable. Fast. Audit-ready.

## What it is not

- Not a generic expense tracker  
- Not an AI-dependent product (MVP)  
- Not a roster-interpretation requirement  
- Not an ATO lodgement portal  
- Not personalised tax advice  
- Not a full accounting / bookkeeping / BAS / payroll suite  

## Target users

People with overnight travel and substantiation needs: airline pilots, cabin crew, FIFO workers, international consultants, frequent business travellers. See the [Product Definition](../product/00-product-definition.md).

## Australian financial year

- FY runs **1 July → 30 June**  
- Overnights, sample days, evidence, and Tax Position are scoped to a financial year  
- Dashboard defaults to the current FY  

## Success metrics (product)

| Metric | Target direction |
|--------|------------------|
| Time to complete overnight → claim path | Minutes for a known destination pattern, not hours |
| Provenance coverage of overnight claim | Every figure traceable to counts, sample days, receipts |
| Capture friction for evidence | One drop / one upload; no AI wait |
| Dependence on roster parsing | Zero for MVP happy path |
| Dependence on AI | Zero for MVP happy path |

## Implementation gate

No application code ships until decisions in `/docs/architecture`, `/docs/database`, `/docs/api`, `/docs/design-system`, and `/docs/standards` are accepted for the vertical slice being built — and the work respects the [Product Definition](../product/00-product-definition.md) and [ADR-024](./adr/024-overnight-workflow-mvp-foundation.md).
