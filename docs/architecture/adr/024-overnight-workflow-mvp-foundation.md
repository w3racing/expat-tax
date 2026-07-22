# ADR-024: Overnight workflow as MVP foundation

## Status

Accepted — supersedes prior MVP framing that centred generic Tax Position ledgers and nights × fixed daily rates as the primary travel product surface.

## Context

AJX Calculator’s overnight workflow has been proven across multiple financial years. AJX Tax MVP was drifting toward a broader evidence / expense / ledger product and toward future AI and roster interpretation as implicit requirements.

That drift is wrong for MVP. The proven workflow is narrow, manual, and calculation-clear:

1. Create or select a financial year.
2. Enter overnight counts manually by destination and month.
3. Upload supporting evidence (rosters, payslips, receipts, PDFs, screenshots).
4. Open a destination.
5. Create sample days for that destination.
6. Enter receipts for each sample day.
7. Complete the sample day.
8. Automatically calculate average daily spend.
9. Apply that average to every qualifying overnight.
10. Display the resulting claim in the Tax Position.

Roster is **evidence**. The overnight table is the **source of truth**. AI and roster parsing must remain optional future capabilities — never MVP dependencies.

## Decision

### Product philosophy (MVP)

> **Simple. Reliable. Fast. Audit-ready.**

### Foundation

**Build AJX Tax MVP around the overnight workflow.** Do not redesign it into a generic expense tracker.

| Rule | Meaning |
|------|---------|
| Overnight table is authoritative | Manual overnight counts by destination × month own travel quantity. Nothing else silently overwrites them. |
| Roster is evidence only | Rosters may be uploaded and linked for substantiation. Interpreting or parsing a roster is **not** required for MVP. |
| Sample days drive the rate | Average daily spend is derived from completed sample days and their receipts for a destination. |
| Average applies to qualifying overnights | Claim = average daily spend × qualifying overnight count (with explicit provenance). |
| Tax Position displays the claim | The overnight-derived claim appears in Tax Position with traceable inputs (U11–U12). |
| No AI dependency | Happy path works with manual entry + uploads only. |
| No roster-parsing dependency | Happy path never waits on OCR, classification, or trip extraction. |
| Extensible later | Schema and adapters must allow AI ingest and roster interpretation to plug in later without rewriting the overnight / sample-day core. |

### Explicit non-goals for MVP

- Generic expense-tracker UX (endless categories, bookkeeping ledgers as the front door).
- Requiring roster interpretation to create overnights or claims.
- Requiring AI for capture, organisation, or calculation.
- Replacing the overnight table with a trip graph as the calculation authority.

### Relationship to existing domains

| Domain | Role under this ADR |
|--------|---------------------|
| **Overnight table** | Source of truth for overnight counts (destination × month). |
| **Sample days + receipts** | Source of truth for average daily spend per destination. |
| **Tax Position** | Authoritative display and FY claim aggregation; still the calculation domain for the resulting claim and other FY ledgers (ADR-021). |
| **Evidence Vault** | Proof store for rosters, payslips, receipts, PDFs, screenshots — linked, never silent owners of overnight counts. |
| **AI / roster parsing** | Future adapters only (ADR-009, ADR-012, ADR-022). Suggestions may propose drafts; humans accept; overnight table remains authoritative. |

### Relationship to calculator parity

AJX Calculator remains the reference for proven behaviour and migration. MVP travel **product surface** is the overnight → sample day → average → claim workflow described here. Fixed destination daily rates, overseas overrides, and other Calculator-parity ledgers may remain as engine/migration concerns where needed for continuity, but they must not redefine the MVP user journey away from overnight + sample days.

When average-from-sample-days maths and legacy nights × rate maths both exist, the product must make the active claim path explicit and provenance must state which method produced the figure. Prefer one clear MVP path: **sample-day average applied to overnight counts**.

## Consequences

### Positive

- MVP matches a workflow users already trust.
- Ships without AI or roster OCR.
- Audit story is clear: overnights + sample days + receipts + evidence links.
- Future AI/roster features attach as assists, not rewrites.

### Negative / trade-offs

- Broader ledger and “continuous capture” ambitions are de-emphasised in MVP IA.
- Existing docs and UI that present nights × fixed rates as the primary travel UX must be realigned.
- Receipt-folder import mapping becomes first-class (sample days), not a skipped warning forever.

### Implementation implications

1. Product definition, MVP scope, and feature specs must describe this workflow as the spine.
2. Domain model must name overnight counts, sample days, sample-day receipts, average daily spend, and qualifying overnight application.
3. Evidence upload stays manual-ready; processing status retained for future AI (U9 exception remains until AI ships).
4. Do not add product UI that promises roster interpretation or AI until those features exist.

## Related

- [Product definition](../../product/00-product-definition.md)
- [MVP v1 scope](../../product/mvp-v1-scope.md)
- [Overnight workflow feature](../../features/overnight-workflow-mvp.md)
- [ADR-021 Tax Position domain](../../decisions/ADR-021-tax-position-domain.md)
- [ADR-022 Incremental MVP](./022-incremental-mvp.md)
- [ADR-012 AI every document](./012-ai-every-document.md) — future only
- [Tax Position domain model](../../database/02-tax-position-domain-model.md)
