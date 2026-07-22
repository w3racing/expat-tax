# Audit Mode

## Flagship purpose

Audit Mode turns a year of captured evidence into a **complete Australian Tax Office–ready audit package** suitable for:

- the user’s tax agent
- direct ATO information requests / audits
- the user’s own EOFY review

It is not a lodgement portal. It is the organised proof pack.

## Product promise

> Everything linked. Everything indexed. Nothing missing left unexplained.

## Claim completeness (traffic lights)

Every claim in Audit Mode displays one status:

| Status | Label | Meaning |
|--------|-------|---------|
| **Green** | Evidence Complete | Required evidence present, linked, and current-version bound |
| **Yellow** | Evidence Mostly Complete | Core evidence present; minor gaps or low-confidence fields |
| **Red** | Missing Evidence | Required documents absent, unlinked, or critically incomplete |

Clicking a claim **immediately** reveals every linked document (current version by default; expand for history when included).

### Completeness rules (examples)

| Claim type | Green requires | Yellow | Red |
|------------|----------------|--------|-----|
| Work travel meal | Receipt + date + amount (+ trip link if travel claim) | Receipt missing GST or weak confidence | No receipt |
| Uniform | Receipt + category | Amount unclear | No document |
| Payslip month | Payslip for period | Partial period coverage | Month employed, no payslip |
| Flight travel | Itinerary or receipt + dates | Missing boarding pass when expected | No flight evidence |
| FX amount | Foreign amount + ATO monthly rate applied | Rate month inferred | No rate / no date |
| Investment dividend | Dividend statement | Missing franking detail | No statement |
| Rental expense | Invoice/receipt + property link | Weak property link | No support |

Rules are versioned (`audit_ruleset_version`) so packages record which rules applied.

## Package contents

The generated audit package always includes these sections (empty sections stated explicitly as “None for this FY” — never silently omitted):

| Section | Contents |
|---------|----------|
| **Income** | Employment income evidence summary, totals from payslips |
| **Payslips** | All payslip documents, indexed by employer and period |
| **PAYG** | PAYG summaries / withholding evidence |
| **Travel** | Trips, travel days, countries, linked claims |
| **Rosters** | Roster screenshots/documents by period |
| **Flights** | Flight receipts, itineraries, boarding passes |
| **Receipts** | Work expense and other receipts by category |
| **ATO FX Calculations** | Foreign amounts, ATO monthly rates used, AUD conversions, rate months |
| **Investments** | Dividend, CGT, and related statements + tallies |
| **Rental Property** | Lease, expenses, income evidence by property |
| **Supporting Documents** | Contracts, utility bills, misc support |
| **Evidence Index** | Master inventory: id, type, date, amount, checksum, Drive file id, version |
| **Tax Calculations** | Indicative working-paper summaries (refund/payable inputs) — labelled not advice |
| **Notes** | Owner notes + accountant comments (if collaboration scope includes them) |

Optional toggle: **Include historical versions** (from document version history).

## Generated artefacts

Every Audit Mode run produces:

| Artefact | Format | Role |
|----------|--------|------|
| **PDF summary** | PDF | Human-readable cover + section summaries + claim traffic lights |
| **ZIP archive** | ZIP | Full folder tree of documents + PDF + indexes |
| **Evidence index** | CSV + PDF appendix | Machine- and human-readable inventory |
| **Chronological timeline** | PDF (+ JSON in ZIP) | Date-ordered narrative of evidence and travel |

### ZIP layout (deterministic)

```text
AJX-Audit-{FY}-{YYYYMMDD}/
  00-Summary/
    Audit-Summary.pdf
    Chronological-Timeline.pdf
    Evidence-Index.csv
    Evidence-Index.pdf
    Manifest.json
  01-Income/
  02-Payslips/
  03-PAYG/
  04-Travel/
  05-Rosters/
  06-Flights/
  07-Receipts/
  08-ATO-FX-Calculations/
  09-Investments/
  10-Rental-Property/
  11-Supporting-Documents/
  12-Tax-Calculations/
  13-Notes/
  99-Versions/          # only if historical versions included
```

Files named with stable prefixes: `{date}_{type}_{shortId}_{checksum8}.ext`.

`Manifest.json` includes package id, FY, generated_at, ruleset version, include_history flag, file count, checksums.

## UX

### Entry

- Desktop: primary nav **Audit Mode**
- Phone: Settings / Readiness → **Prepare audit package**
- Dashboard Quick Action
- Accountant: Generate Audit Package (permissioned)

### Audit Mode screen

1. FY switcher
2. Overall readiness + claim traffic-light summary (counts of green/yellow/red)
3. Claim list with status pills — tap → linked documents sheet/panel
4. Options: include historical versions, include accountant notes, include indicative tax calculations
5. **Generate package** primary CTA
6. Past packages list (download / remirror to Drive)

### Claim detail

- Status + why (missing items as chips)
- Every linked document as cards (preview, type, date, amount, version)
- One-tap open evidence detail (read-only in accountant shell)

Visual language: calm traffic lights (design-system success / warning / destructive soft fills) — not alarmist.

## Generation pipeline

```text
request → validate FY ownership
  → snapshot claims + links + versions
  → assemble section files from Blob
  → build Evidence Index + Timeline
  → render PDF summary + timeline PDF
  → compute FX calculation sheets
  → assemble Tax Calculations working papers
  → zip → checksum → store Blob
  → audit_events + package row
  → optional Drive mirror to Audit Package/
  → notify user (and accountant if requested)
```

Generation is async. UI shows calm progress. Failed runs leave no partial “ready” package.

## Suitability statement (in PDF cover)

Include a clear cover note:

- Package prepared by AJX Tax as an evidence organisation tool
- Suitable for provision to a registered tax agent or in response to ATO information requests
- Indicative tax figures are working papers only, not a lodged return
- User / agent remains responsible for lodgement accuracy

## Security

- Owner can always generate
- Accountant requires `generate_audit_package`
- Every generation and download audited
- Packages retained per seven-year policy
- No permanent deletion of package artefacts within retention

## Related

- [ADR-016](./adr/016-audit-mode.md)
- [Feature](../features/16-audit-mode.md)
- [Database](../database/10-audit-mode.md)
- [API](../api/10-audit-mode.md)
- [Document versions](./09-document-version-history.md)
- [Accountant Mode](./11-accountant-mode.md)
