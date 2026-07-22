# ADR-021: Tax Position as a First-Class Domain

## Status

Accepted

## Context

AJX Tax serves people whose Australian tax affairs involve volume, movement, and proof. Their need is twofold and inseparable:

1. **Durable evidence** — receipts, payslips, rosters, flights, statements, and supporting documents must be captured once, retained for years, and ready for the user, an accountant, or the ATO.
2. **A living tax position** — income, claims, travel, FX, investments, and indicative summaries must be maintained throughout the financial year, not reconstructed from a document dump in June.

Early product framing correctly elevated the **Evidence Vault** (ADR-011) as the long-term spine for capture, durability, versions, and audit packages. Live V1 usage, however, also depends on a full **tax planner / position engine**: structured financial-year inputs, claim maths, FX and overseas-daily logic, and printable working summaries.

If Tax Position were treated only as a reporting layer over the vault — or as something generated solely from evidence extractions — the product would fail real users in several ways:

- **Migration** — V1 planner data has structured rows that often lack binaries; importing only into Evidence would discard years of working tax maths.
- **Trust** — Users need to enter and adjust figures (income, claim amounts, destinations) before every supporting document exists; the system must accept explicit inputs with clear provenance, not invent precision from incomplete OCR.
- **Auditability** — Standards U11–U12 require every material figure to be traceable to source documents *or* explicitly incomplete. A report that silently derives totals from vault contents cannot honour that contract.
- **Product identity** — AJX Tax is Evidence Vault **and** Tax Position. Collapsing Position into “vault reports” would make the product an organiser without a year-long financial stance.

AJX Tax therefore requires **both** domains: Evidence Vault for proof and durability; Tax Position for authoritative, FY-scoped calculation and working papers. Neither replaces the other.

## Decision

**Tax Position is a primary domain within AJX Tax.**

It is:

- A **first-class bounded context** — not a UI view, not a PDF section, not a derived dashboard.
- The **authoritative calculation domain** for financial-year income, claims, travel/FX, investments, offsets, and indicative tax summaries.
- Allowed to hold **structured ledger rows** that may link to evidence versions — or may stand as explicit user/imported inputs with provenance until evidence is attached.
- Bound by product standards: every shown figure is **traceable** (U11) and carries an **audit trail** (U12); never silently invent numbers without source attribution.

It is **not**:

- A reporting layer over Evidence Vault.
- Generated **only** from Evidence Vault (OCR/extractions may *suggest* drafts; they do not own the calculation state).
- An ATO lodgement engine, personalised tax advice, or a full accounting suite.

Evidence remains the long-term spine for capture and proof. Tax Position consumes evidence links and structured inputs, produces FY summary snapshots and readiness signals, and feeds Audit Mode and accountant handoffs with labelled, indicative working papers.

## Relationship

```text
Documents ──► Evidence Vault ──► (optional links) ──► Tax Position
                                      │
Claims / ledger rows ─────────────────┤
                                      ▼
                              Calculations
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
                 Reports         Audit Mode      Accountant Mode
```

| Concept | Role relative to Tax Position |
|---------|-------------------------------|
| **Tax Position** | Authoritative FY calculation domain: incomes, claims, destinations, investments, summary engine, readiness. Owns *what is being claimed and how it was computed* for the year. |
| **Evidence Vault** | Authoritative evidence domain: capture, binaries, versions, Drive mirror, processing status. Owns *what proves a claim*. Supplies optional `evidence_version` links into Position rows; does not compute tax totals. |
| **Documents** | Binary artefacts (uploads, imports, Drive mirrors). Live in the vault lifecycle (queued → ready/failed). Become inputs to Position only when linked or when AI suggests a draft that a human (or import) accepts. |
| **Claims** | Structured Tax Position entities (category, amount, FY, provenance). May be evidence-backed, partially backed, or explicitly unsubstantiated — Audit Mode traffic-lights completeness; Position still holds the claim. |
| **Calculations** | Deterministic (or versioned) rules inside Tax Position: FX, overseas daily, CGT helpers, offsets, indicative summaries. Outputs are snapshots with actor, time, inputs, and source links — not ephemeral UI maths. |
| **Reports** | Presentations of Tax Position (and vault indexes): printable summaries, readiness views, package sections. Always secondary to Position state; reports must not invent figures the domain does not hold. |
| **Accountant Mode** (ADR-015) | Delegated read collaboration over vault (and, as product expands, Position visibility). Accountants do not mutate original evidence; they consume organised proof and working papers derived from Position + vault. |
| **Audit Mode** (ADR-016) | Flagship package surface: claim completeness against linked evidence, ZIP/PDF/index/timeline. Tax calculation sections are **evidence-informed summaries** sourced from Tax Position, labelled indicative / working paper — not a separate calculation silo. |

**Bridge:** Overnight counts (destination × month) are the source of truth for travel quantity. Sample days produce average daily spend. Evidence (including rosters) substantiates; it does not silently overwrite overnight counts ([ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md)). Timeline / trips may link vault artefacts later without becoming calculation authority.

## Benefits

### Migration

V1 users bring years of planner state that may have little or no binary evidence. A first-class Tax Position domain can import structured rows with provenance (`Imported from AJX Tax Version 1`, `evidence_version_id = null`) and let users attach proof later. Treating Position as vault-only would force a false choice: drop maths or fabricate documents.

### Trust

Users see a continuous stance for the year — including gaps (“missing support”) — rather than false precision from incomplete extractions. Explicit inputs and linked evidence share one audit model; AI suggestions remain drafts with confidence and why (U10), never silent overrides of Position.

### Auditability

Claims, calculations, and reports share a single calculation authority. Audit Mode scores completeness against Position claims and vault links. Financial figures carry source, FX, actor, and time. Accountants and owners review the same working papers the product computes from.

### Future expansion

Clear bounded contexts (ADR-018) let Evidence deepen (AI, sync, packages) while Position deepens (multi-entity FYs, entitlements, API) without rewriting either. New surfaces — native apps, public API, plugins — consume typed Position and vault contracts instead of scraping reports.

## Consequences

### Positive

- Product IA stays honest: Capture → Evidence → Position → Audit, with dual capability explicit in architecture and schema.
- V1 migration preserves planner value without pretending every row is already evidenced.
- U11–U12 and Audit Mode have a stable owner for numbers.
- Accountant and commercial paths can grant read of Position independently of vault write authority.
- Schema and services can evolve Position tables and summary snapshots without overloading evidence_item metadata.

### Negative

- Two primary domains increase modelling, RLS, and UX complexity versus an evidence-only product.
- Risk of dual-product confusion if IA or copy collapses Position into “reports from your vault.”
- More migration and sync surface area (planner rows + vault binaries + link state).
- Calculation engine versions must be governed so historical FY snapshots remain explainable.

### Trade-offs

| Choice | Trade-off |
|--------|-----------|
| Position may exist without evidence | Better migration and mid-year capture; Audit Mode must surface unsubstantiated claims clearly. |
| Evidence does not auto-own totals | Avoids invented precision; requires human/import acceptance for material figures. |
| Reports are not authoritative | Extra discipline so UI never computes one-off maths outside the domain. |
| Separate bounded contexts | More services/tables now; far less rewrite when multi-entity and API ship. |

## Future implications

### Multiple entities

Organization tenancy (ADR-019) scopes both vault and Position by `organization_id`. Family, business, trust, and SMSF each get FY-scoped Position state without merging entity maths into a single personal vault blob. Entity-specific rules attach to Position; evidence remains shared infrastructure.

### Accountant access

Accountant Mode stays delegation, not co-ownership of originals. First-class Position enables read-safe visibility of working papers and claim completeness alongside vault packages — the handoff accountants need — while write paths for evidence (and later Position mutations) stay permissioned and audited.

### Commercial SaaS

API-first Position services, entitlement gates, and FY snapshots support subscriptions, native clients, and public `/v1` consumers (ADR-018). Tax Position becomes a product capability to sell and extend, not a spreadsheet side-effect of document storage.

### AI assistance

AI continues to normalise and suggest from documents (ADR-012) — confidence, why, and human acceptance required. Suggestions may propose Position draft links or claim updates; **Tax Position remains the authority** that accepts, rejects, or holds them. AI never becomes a silent second calculator.

## Related

- [ADR-011 Evidence Vault](../architecture/adr/011-evidence-vault.md)
- [ADR-015 Accountant Mode](../architecture/adr/015-accountant-mode.md)
- [ADR-016 Audit Mode](../architecture/adr/016-audit-mode.md)
- [ADR-017 Migration wizard](../architecture/adr/017-migration-wizard.md)
- [ADR-018 Commercial expansion](../architecture/adr/018-commercial-expansion.md)
- [ADR-019 Organization model](../architecture/adr/019-organization-model.md)
- [ADR-020 Product & engineering standards](../architecture/adr/020-product-engineering-standards.md)
- [v2 Migration architecture](../architecture/16-v2-migration-architecture.md)
- [Product definition](../product/00-product-definition.md)
