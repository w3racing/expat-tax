# ADR-012: AI processes every uploaded document

## Status

Accepted

## Context

AJX Tax is an evidence management platform. Users upload heterogeneous files (photos, PDFs, ZIPs, CSVs, email attachments). Manual classification does not scale and breaks the “capture once” promise.

## Decision

**Every** uploaded document enters an async AI pipeline. No upload bypasses processing.

The pipeline must:

1. Support all declared upload types (photos, screenshots, PDF, scans, email attachments, ZIP, CSV)
2. Classify into a rich document-type taxonomy (receipt, payslip, roster, etc.)
3. Extract structured fields with per-field confidence
4. Convert foreign amounts to AUD using **ATO monthly average exchange rates**
5. Suggest tax categories without performing tax calculations
6. Detect duplicates
7. Auto-confirm when confidence is high; require user confirmation only when confidence is low

Capture UX remains non-blocking; processing is always asynchronous.

## Consequences

- Expanded `evidence_kind` enum and extraction schema
- New tables: exchange rates, duplicate links, extraction field provenance
- ZIP and CSV require pre-processing workers before model calls
- Product copy must clarify: FX conversion is for evidence normalisation, not tax advice
- Model provider remains swappable behind Edge Functions
