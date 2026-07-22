# Trust & audit standards

AJX Tax holds evidence that may face ATO scrutiny. Users must always understand **what happened**, **why the system suggested it**, and **where numbers came from**.

## 1. Document processing status

Every uploaded document **must** display processing status in list and detail views.

| Status | Meaning | User-visible label (example) |
|--------|---------|------------------------------|
| `queued` | Waiting for worker | Waiting to process |
| `uploading` | Bytes in flight | Uploading… |
| `processing` | AI / OCR / FX in progress | Reading document… |
| `needs_review` | Low confidence or duplicate | Needs your review |
| `ready` | Usable as evidence | Ready |
| `failed` | Terminal failure | Couldn’t process — Retry |
| `archived` | Soft-removed from active set | Archived |

Requirements:

- Status is persisted server-side and reflected via query/realtime — not only ephemeral local state
- Detail view shows phase timeline when useful (uploaded → classified → extracted → vault synced)
- Failed states always expose **Retry** and a non-technical reason

## 2. AI suggestions — confidence + explanation

Every AI suggestion (classification, fields, category, duplicate, FX, dashboard insight) **must** include:

1. **Confidence score** — overall and per critical field where applicable (0–1 stored; UI may show High / Medium / Low plus numeric on demand)
2. **Why** — a short human rationale, e.g. “Matched ‘Qantas’ and boarding-pass layout” or “Amount and date match a prior receipt”

Rules:

- Never present AI output as undisputed fact without confidence context when confidence is not high
- Low confidence → visual emphasis + confirmation required before `ready`
- High confidence → may auto-ready, but explanation remains inspectable in detail / audit views
- Users can always edit; edits become the source of truth and are auditable

## 3. Calculation provenance

Every calculated or estimated figure (dashboard refund/payable estimate, totals, readiness scores, travel day counts, FY summaries) **must** be traceable to source documents or explicit inputs.

| Requirement | Detail |
|-------------|--------|
| Drill-in | Tap/click a figure → list contributing evidence items / rules |
| Missing inputs | If estimate is incomplete, show what’s missing — never invent precision |
| Formula transparency | Short plain-language method note (“Indicative only — based on captured income and expenses”) |
| No orphan numbers | If a figure cannot cite sources, do not show it as authoritative |

Estimates are **insights**, not lodged tax figures. Copy must never imply ATO-certified calculation.

## 4. Financial figure audit trail

Every financial amount shown as product truth (evidence amounts, FX conversions, payslip totals used in summaries) **must** have an audit trail.

Minimum trail fields:

- Source document / evidence id(s)
- Original amount + currency
- FX rate + rate date + rate source (when converted)
- Who/what set the value (user | AI | import | integration)
- Timestamps (created, last confirmed)
- Version link when amounts change via document versions

UI:

- “How was this calculated?” / “Source” affordance on detail and audit package views
- Accountant and Audit Mode consume the same trail — no parallel undocumented math

## 5. Trust copy principles

- Prefer understatement over certainty when data is incomplete
- Separate **captured evidence** from **estimates**
- Never hide confidence or provenance behind developer-only screens

## Related

- [AI processing](../architecture/08-ai-processing.md)
- [Insights Dashboard](../architecture/10-insights-dashboard.md)
- [Audit Mode](../architecture/12-audit-mode.md)
- [Document version history](../architecture/09-document-version-history.md)
