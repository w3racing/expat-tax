# AI ingest pipeline

## Purpose

**Every** uploaded document is processed by AI — photos, screenshots, PDFs, scans, email attachments, ZIP archives, and CSV files. The user captures once; the system classifies, extracts, converts currency, suggests categories, and detects duplicates without blocking upload.

## Supported uploads

| Format | Notes |
|--------|-------|
| Photos | Camera or library; HEIC supported |
| Screenshots | Same pipeline as photos |
| PDF | Text + scan paths |
| Scanned documents | Multi-page OCR |
| Email attachments | Via forward/ingest; attachment bytes enter same pipeline |
| ZIP | Unpacked; each eligible member processed as its own evidence |
| CSV | Parsed; column mapping when needed |

## Document recognition

AI assigns one primary type:

- Receipt
- Payslip
- Roster
- Invoice
- Bank Statement
- Dividend Statement
- Capital Gains Statement
- Lease
- Utility Bill
- Travel Itinerary
- Employment Contract
- Other (fallback)

## Extraction

When present in the document, extract:

- Dates (transaction, period, pay period)
- Merchant
- Employer
- Currency
- Amounts (total, line items where useful)
- GST
- Country
- City
- Flight number
- Hotel
- Suggested tax category

All fields carry individual confidence scores.

## ATO exchange rates

Foreign amounts are converted to AUD using the **ATO monthly average rate** for the relevant month. Original currency and amount are always preserved alongside `amount_aud` and rate metadata.

## Tax categories

AI suggests a category aligned with Evidence Vault folders and deduction workspace — suggestion only, never auto-lodgement.

## Duplicates

Detect exact (checksum), near-duplicate (image hash), and fuzzy (date + amount + merchant) matches. High-confidence duplicates surface for user confirmation; never silent merge.

## Confidence and confirmation

| Outcome | When |
|---------|------|
| **Auto-ready** | High overall and critical-field confidence |
| **Needs review** | Low confidence, missing FX rate, or possible duplicate |
| **Failed** | Retryable worker error |

User confirmation is required **only** when confidence is low or a duplicate is suspected. High-confidence documents proceed to `ready` without interruption.

## Pipeline stages

1. Persist file + `uploaded`
2. Intake (ZIP/CSV/email special cases)
3. Preprocess (PDF pages, image normalise)
4. Classify `document_type`
5. Extract fields + per-field confidence
6. Apply ATO monthly FX when currency ≠ AUD
7. Suggest tax category
8. Scan duplicates
9. Route → `ready` | `needs_review` | `failed`
10. Write `evidence_extractions` + events
11. Reconcile Drive folder + readiness (async)

## UX

- Capture success is immediate
- Processing shown calmly on evidence row (Organising…)
- Low-confidence: single review sheet with highlighted uncertain fields
- Duplicate: “Looks like a duplicate” with link to original
- Never show raw model JSON

## Acceptance

- 100% of allowed uploads enter AI pipeline
- Per-field and overall confidence stored
- FX uses `ato_exchange_rates` table
- User-corrected fields not silently overwritten
- Reprocess is idempotent and versioned

## Related

- [Architecture: AI processing](../architecture/08-ai-processing.md)
- [Database: AI extractions](../database/06-ai-extractions.md)
- [API: AI ingest](../api/07-ai-ingest.md)
