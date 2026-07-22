# ADR-020: Product & engineering standards

## Status

Accepted

## Context

AJX Tax must feel like a premium commercial SaaS product from the first implemented screen. Ad-hoc UX (blank loads, technical errors, unexplained AI, missing dark mode, client-side full-table loads) would erode trust and block scale. Standards must exist **before** feature implementation so every screen shares the same quality bar.

## Decision

Adopt the canonical standards in [`docs/standards/`](../../standards/00-overview.md) as non-negotiable gates:

1. Skeleton loading on every screen/region
2. Attractive, guided empty states
3. Confirmation for destructive actions
4. Progress for long-running tasks
5. Upload status + retry
6. Clear, actionable, non-technical errors
7. Form draft auto-save where appropriate
8. Undo for major reversible actions
9. Processing status on every uploaded document
10. AI confidence + explanation on every suggestion
11. Traceable calculations (source documents)
12. Audit trail on every financial figure
13. Fully responsive + keyboard accessible screens
14. Dark Mode and Light Mode from day one (token-based)
15. Performance designed for hundreds of thousands of records and many years of documents

Product priorities for all UX copy and interaction design: **simplicity, clarity, reliability, trust**.

Every feature spec must include a **Standards compliance** section (or checklist reference) and any **Standards exceptions**. PRs use [Definition of done](../../standards/04-definition-of-done.md).

Shared primitives for skeletons, empty states, confirmations, job progress, upload status, errors, drafts, and undo live in the design system / `shared/components` — features compose, they do not fork.

## Consequences

- Slightly more upfront UI work per screen; higher consistency and trust
- Theme tokens and dual palettes are required before shipping product pages
- List and dashboard queries must be paginated/snapshot-based from v1 — no “load everything” shortcuts
- Error catalogue and processing status enums become shared contracts for web and future native clients

## Related

- [Commercial expansion ADR-018](./018-commercial-expansion.md)
- [UI stack ADR-007](./007-ui-stack.md)
- [Responsive shells ADR-008](./008-responsive-shells.md)
- [AI every document ADR-012](./012-ai-every-document.md)
