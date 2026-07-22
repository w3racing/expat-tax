# Product & engineering standards

**Status:** Canonical — required before implementing any feature.  
**Feel:** Premium commercial SaaS (Apple · Stripe · Linear · Notion · Flighty)  
**Priorities:** Simplicity · Clarity · Reliability · Trust

AJX Tax is a **commercial SaaS product**, not an internal tool. Every screen should be something you would be **proud to show another professional pilot**.

These standards govern UX, trust/audit behaviour, accessibility, theming, and performance. They sit alongside [Commercial expansion](../architecture/14-commercial-expansion.md) and the [Design system](../design-system/README.md).

## Documents

| Doc | Contents |
|-----|----------|
| [01-product-ux.md](./01-product-ux.md) | Skeletons, empty states, confirmations, progress, uploads, errors, drafts, undo |
| [02-trust-audit.md](./02-trust-audit.md) | Processing status, AI confidence + rationale, calculation provenance, financial audit trails |
| [03-engineering.md](./03-engineering.md) | Responsive + keyboard a11y, dark/light mode, scale & performance |
| [04-definition-of-done.md](./04-definition-of-done.md) | Pre-merge checklist for every screen and feature |
| [05-commercial-product-bar.md](./05-commercial-product-bar.md) | Four product questions · complexity rule · first-release bar |

## ADR

- [ADR-020 Product & engineering standards](../architecture/adr/020-product-engineering-standards.md)

## North star

> **Simple. Reliable. Fast. Audit-ready.**

MVP is built around the overnight workflow ([ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md)). Broader product priorities remain **simplicity, clarity, reliability and trust**.

Every screen and flow must feel finished: no blank flashes, no cryptic errors, no silent failures, no unexplained numbers.

## Pre-implementation gate

Before any feature or screen, answer yes to all four ([details](./05-commercial-product-bar.md)):

1. Makes annual tax preparation **simpler**?  
2. **Reduces effort**?  
3. Improves **trust**?  
4. Improves **audit readiness**?

If not — reconsider. Do not add complexity unless it clearly improves the product.

## Non-negotiable UX gates

| # | Rule |
|---|------|
| U1 | Every screen has a **skeleton** loading state |
| U2 | Every empty page has an **attractive empty state** with helpful guidance |
| U3 | Every **destructive** action requires confirmation |
| U4 | Every **long-running** task displays progress |
| U5 | Every **upload** shows status and allows **retry** on failure |
| U6 | Every **error** is clear, actionable, and non-technical |
| U7 | Every form **auto-saves drafts** where appropriate |
| U8 | Every major action supports **undo** where practical |
| U9 | Every uploaded document displays **processing status** |
| U10 | Every AI suggestion includes a **confidence score** and **why** |
| U11 | Every calculation is **traceable** to source documents |
| U12 | Every financial figure has an **audit trail** |
| U13 | Every screen is fully **responsive** and **keyboard accessible** |
| U14 | **Dark Mode** and **Light Mode** from day one |
| U15 | Performance stays excellent with **hundreds of thousands** of records and many years of documents |

If a feature cannot meet a gate, document an explicit exception in the feature spec and ADR — never ship silently incomplete.
