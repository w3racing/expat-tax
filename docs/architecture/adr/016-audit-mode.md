# ADR-016: Audit Mode flagship ATO package

## Status

Accepted

## Context

AJX Tax organises evidence all year so that by EOFY — or under ATO review — the user can produce a complete, professional package for their tax agent or the ATO. Partial exports are not enough; the product needs a flagship **Audit Mode**.

## Decision

**Audit Mode** is a first-class product surface that:

1. Scores every claim’s evidence completeness (green / yellow / red)
2. Lets users open a claim and instantly see every linked document
3. Generates a complete Australian tax audit package including income, PAYG, travel, rosters, flights, receipts, ATO FX calculations, investments, rental, supporting documents, evidence index, tax calculation summaries, and notes
4. Outputs **PDF summary**, **ZIP archive**, **evidence index**, and **chronological timeline**
5. Optionally includes historical document versions
6. Mirrors the package into the user’s Drive `Audit Package/` folder when connected

Audit Mode produces **submission-ready evidence packages**. It does not lodge with the ATO and does not replace professional tax advice. Tax calculation sections are evidence-informed summaries with clear “indicative / working paper” labelling.

## Consequences

- Dedicated Audit Mode route and claim completeness engine
- Package generator job with deterministic folder layout inside the ZIP
- Claim traffic-light status stored/derived for UI and PDF
- Shared generation path for owner Audit Mode and accountant `generate_audit_package`
