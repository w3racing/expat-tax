# Commercial product bar

**Status:** Canonical — required before implementing any feature or screen.  
**Audience:** Product, engineering, design  
**Related:** [Standards overview](./00-overview.md) · [Definition of done](./04-definition-of-done.md) · [Product definition](../product/00-product-definition.md) · [MVP completion gate](../features/mvp-completion-gate.md)

## Positioning

AJX Tax is a **commercial SaaS product**, not an internal tool or hobby spreadsheet wrapper.

Every screen should be something you would be **proud to show another professional pilot** (or any overnight-claiming professional) — calm, clear, and complete.

The first release must feel **polished, professional, and finished**, even when advanced features (AI, OCR, Drive, roster parsing) are intentionally deferred.

## Pre-implementation questions

Before building or expanding anything, answer all four:

| # | Question | If no… |
|---|----------|--------|
| 1 | Does this make the user’s **annual tax preparation simpler**? | Reconsider |
| 2 | Does it **reduce effort**? | Reconsider |
| 3 | Does it **improve trust**? | Reconsider |
| 4 | Does it **improve audit readiness**? | Reconsider |

If the honest answer to any is **no**, do not add the complexity. Prefer removing friction, clarifying provenance, or polishing the existing overnight loop.

## Product feel

| Prefer | Avoid |
|--------|-------|
| One clear job per screen | Dashboard clutter and “power user” sprawl |
| Traceable numbers with quiet labels | Unexplained totals or spreadsheet grids as default UI |
| Calm professional copy | Internal jargon, blame, or technical error dumps |
| Finished empty / loading / error states | Placeholder chrome that looks unfinished |
| Depth behind progressive disclosure | Exposing every ledger field on first visit |
| Deferred features clearly labelled “later” | Half-built AI/Drive/OCR surfaces that erode trust |

References: Apple system apps · Stripe · Linear · Notion · Flighty — spacious, premium, glanceable.

## Complexity rule

**Do not add complexity unless it clearly improves the product** against the four questions above.

Acceptable complexity: provenance expanders, confirmations for destructive actions, backup typing gates, Calculator-parity maths.

Unacceptable complexity: speculative settings, unused integrations in the happy path, generic expense-tracker IA, features that only help the builder.

## First-release bar

Ship a complete overnight-claim loop that another pilot could use without apology:

1. Financial year → overnight counts → evidence → sample days → averages → Tax Position → accountant export → backup/restore.  
2. Every material figure explainable.  
3. No promise of AI, Drive, or roster parsing until those are truly ready.

See [MVP completion gate](../features/mvp-completion-gate.md).

## Feature specs

Every feature spec must include a short **Commercial product bar** section answering the four questions, plus **Standards compliance** / **Standards exceptions**.
