# AI document processing

## Principle

> Capture once. Never think about it again.

AI is responsible for understanding every uploaded document. The user should only be interrupted when the system is genuinely uncertain.

## Scope

| In scope | Out of scope |
|----------|--------------|
| OCR and layout understanding | Tax liability calculation |
| Document type classification | BAS lodgement |
| Field extraction | Accounting double-entry |
| AUD normalisation via ATO monthly rates | Legal or tax advice |
| Tax category **suggestions** | Auto-lodgement without review |
| Duplicate detection | |

## Supported uploads

| Input | Handling |
|-------|----------|
| Photos (JPEG, PNG, HEIC, WebP) | Direct OCR + vision model |
| Screenshots | Same as photos; detect UI chrome where possible |
| PDF | Text layer first; rasterise pages if scan-only |
| Scanned documents | Deskew, denoise, OCR per page |
| Email attachments | Extract attachment bytes from ingest; same pipeline |
| ZIP | Unpack in worker; one child file → one evidence item (or grouped PDF bundle policy) |
| CSV | Structured parse + column inference; optional AI for header mapping |

MIME allowlist and size limits are enforced at upload; unsupported types fail fast with a clear message.

## Document types (classification)

The model assigns exactly one primary `document_type`:

| Type | Examples |
|------|----------|
| `receipt` | Retail, meals, parking |
| `payslip` | Employer pay advice |
| `roster` | Crew / FIFO schedule |
| `invoice` | Supplier or client invoice |
| `bank_statement` | Account statement period |
| `dividend_statement` | DRP, franking, distribution |
| `capital_gains_statement` | CGT schedule, broker summary |
| `lease` | Residential or commercial lease |
| `utility_bill` | Electricity, gas, water, internet |
| `travel_itinerary` | Flight/hotel booking confirmation |
| `employment_contract` | Offer letter, contract, variation |
| `other` | Unclassified; always lower confidence |

Classification drives Evidence Vault folder placement, income/deduction hints, and which fields are required for auto-confirmation.

## Extracted fields

All applicable fields are extracted when present in the document. Absence is not an error.

| Field | Typical sources |
|-------|-----------------|
| `dates` | Transaction, service, period start/end, pay period |
| `merchant` | Vendor on receipt or invoice |
| `employer` | Payslip, contract, PAYG |
| `currency` | ISO 4217 |
| `amounts` | Total, subtotal, line items |
| `gst` | GST component where labelled |
| `country` | Address or issuer jurisdiction |
| `city` | Location |
| `flight_number` | Itinerary, boarding pass |
| `hotel` | Property name |
| `tax_category` | Suggested ATO-oriented work/deduction bucket |

Extractions are versioned in `evidence_extractions` with per-field confidence and `user_corrected` flags.

## Pipeline (async)

```text
uploaded
  → intake (MIME, ZIP unpack, CSV parse, email part)
  → preprocess (PDF pages, image normalise)
  → classify (document_type)
  → extract (structured fields + confidences)
  → fx_convert (foreign → AUD if needed)
  → suggest_tax_category
  → detect_duplicates
  → score_and_route
  → ready | needs_review | failed
  → mirror_drive + readiness (downstream)
```

Capture returns after `uploaded` + durable Blob + metadata row. The user never waits on AI.

## ATO monthly exchange rates

Foreign-currency amounts are normalised to **AUD** using the **ATO monthly average exchange rate** for the relevant month.

Rules:

1. **Rate month** = calendar month of the transaction date when known; else month of `occurred_on` assignment; else upload month (flag for review)
2. Rates stored in `ato_exchange_rates` (currency, year, month, rate_to_aud, source_version)
3. Store both `amount_original`, `currency_original`, and computed `amount_aud`, `exchange_rate_used`, `exchange_rate_month`
4. This is evidence normalisation for Australian tax context — not a tax position

Rates are ingested periodically from the authoritative ATO publication (worker/cron). Stale rate tables block FX auto-confirmation for affected currencies.

## Tax category suggestions

AI proposes a `suggested_tax_category` mapped to product enums and Evidence Vault folders. Examples:

- meal receipt on layover → work travel / meals
- uniform purchase → work expenses / uniform
- dividend statement → investments
- lease → rental property

Suggestions are soft: user override always wins and is never silently overwritten on reprocess.

## Duplicate detection

Duplicates are detected after extraction using a layered strategy:

| Signal | Use |
|--------|-----|
| `checksum_sha256` | Exact file duplicate |
| Perceptual hash (images) | Near-identical photo re-upload |
| Fuzzy match | Same date ±1 day, amount ±1%, merchant/employer similarity |

Outcomes:

- `duplicate_of_evidence_id` link when high confidence
- `needs_review` with reason `possible_duplicate` when medium confidence
- No auto-merge; user confirms link or dismisses

## Confidence and confirmation

### Per-field confidence

Each extracted field carries `confidence` in `[0, 1]`.

### Overall confidence

Weighted score from document type confidence + critical fields for that type.

### Routing

| Condition | Status | User action |
|-----------|--------|-------------|
| Overall ≥ **0.85** and all critical fields ≥ **0.75** | `ready` | None |
| Overall **0.70–0.84** or any critical field **0.60–0.74** | `ready` with soft banner optional | Optional review |
| Overall < **0.70** or any critical field < **0.60** | `needs_review` | Confirmation required |
| `possible_duplicate` | `needs_review` | Confirm or dismiss |
| Missing ATO rate for FX | `needs_review` | Confirm amount or date |
| Worker error | `failed` | Retry |

Critical fields by type (examples):

- `receipt`: date, amount, currency
- `payslip`: employer, pay period end, gross or net
- `travel_itinerary`: date, flight_number or hotel
- `bank_statement`: period end, account identifier fragment

Thresholds are configurable per environment; defaults above are product baseline.

## User correction contract

- Fields marked `user_corrected` are frozen against silent AI overwrite
- Reprocess creates a new extraction version; UI shows diff only when user opens detail
- Low-confidence confirmation is a lightweight sheet — not a full tax form

## Observability

Log per job: `evidence_id`, `document_type`, `overall_confidence`, `duration_ms`, `model`, `schema_version`. Never log raw document content in production logs.

## Related docs

- [ADR-012](./adr/012-ai-every-document.md)
- [Database: AI extractions](../database/06-ai-extractions.md)
- [API: AI ingest](../api/07-ai-ingest.md)
- [Feature: AI ingest](../features/12-ai-ingest.md)
