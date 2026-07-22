# AJX Tax — Documentation

**Philosophy:** Simple. Reliable. Fast. Audit-ready.

**MVP foundation:** The proven AJX Calculator **overnight workflow** — overnight counts (source of truth) → evidence → sample days → average daily spend → claim on Tax Position. Roster is evidence only. AI and roster parsing are future extensions, not dependencies. See [ADR-024](./architecture/adr/024-overnight-workflow-mvp-foundation.md).

AJX Tax is not a generic expense tracker, not an accounting suite, not a lodgement portal, and not a substitute for a tax agent.

## Documentation map

| Area | Path | Purpose |
|------|------|---------|
| Product | [`product/`](./product/) | **Canonical** product definition (non-technical) |
| Standards | [`standards/`](./standards/) | **Required** product UX, trust, engineering quality gates |
| Architecture | [`architecture/`](./architecture/) | System design, ADRs, folder structure, responsive strategy |
| Database | [`database/`](./database/) | Schema, RLS, migrations, multi-tenancy |
| Features | [`features/`](./features/) | Product feature specifications |
| API | [`api/`](./api/) | External integrations, Edge Functions, contracts |
| Design system | [`design-system/`](./design-system/) | Visual language, components, responsive UI |

## Reading order (before implementation)

1. [**Product Definition**](./product/00-product-definition.md) — what we are building and why
2. [**ADR-024 Overnight workflow MVP foundation**](./architecture/adr/024-overnight-workflow-mvp-foundation.md) — MVP direction reset
3. [**Overnight workflow feature**](./features/overnight-workflow-mvp.md) — spine UX and acceptance
4. [**MVP v1 scope**](./product/mvp-v1-scope.md) — what ships for a real user day one
5. [**MVP v1 implementation**](./architecture/17-mvp-v1-implementation.md) — stack, folders, persistence ([ADR-023](./architecture/adr/023-mvp-v1-implementation-architecture.md))
6. [MVP build phases](./product/01-mvp-v1.md) · [ADR-022](./architecture/adr/022-incremental-mvp.md)
7. [Product overview](./architecture/00-product-overview.md) — short architecture-set orientation
8. [Product & engineering standards](./standards/00-overview.md) — **required before any feature code**
9. [Technology stack](./architecture/01-technology-stack.md)
10. [Architecture overview](./architecture/02-system-architecture.md)
11. [Feature-first structure](./architecture/03-feature-first-structure.md)
12. [Responsive & navigation](./architecture/04-responsive-navigation.md)
13. [Security & tenancy](./architecture/05-security-tenancy.md)
14. [Database schema](./database/01-schema.md)
15. [Design system](./design-system/README.md)
16. [Evidence Vault](./architecture/07-evidence-vault.md)
17. [AI processing](./architecture/08-ai-processing.md) — post-MVP; adapters only in MVP
18. [Document version history](./architecture/09-document-version-history.md)
19. [Insights Dashboard](./architecture/10-insights-dashboard.md)
20. [Accountant Mode](./architecture/11-accountant-mode.md)
21. [Audit Mode](./architecture/12-audit-mode.md)
22. [Migration wizard](./architecture/13-migration-wizard.md)
23. [Commercial expansion](./architecture/14-commercial-expansion.md) — **required for all new ADRs**
24. [Capability roadmap](./architecture/15-capability-roadmap.md)
25. [**v2 Migration architecture**](./architecture/16-v2-migration-architecture.md)
26. Feature specs under [`features/`](./features/)
27. API contracts under [`api/`](./api/)

## Non-negotiables

- Production-ready code only — no placeholders, no `TODO` comments
- Strict TypeScript
- No source file larger than ~300 lines
- Feature-first architecture
- Mobile-first, device-specific layouts (phone / tablet / desktop)
- Every architectural decision documented here before implementation
- **Premium SaaS quality gates** (skeletons, empty states, confirmations, progress, upload retry, actionable errors, drafts, undo, processing status, AI confidence + why, calculation provenance, financial audit trails, a11y, dark/light, scale) — see [Standards](./standards/00-overview.md)
- Always prioritise **simplicity, clarity, reliability and trust**
- **Never implement anything that limits future commercial scalability** — see [Commercial expansion](./architecture/14-commercial-expansion.md)
- Scalable to thousands of concurrent users → commercial platform (native apps, org accounts, billing, API, plugins)

## Brand references (feel, not copy)

Apple · Stripe · Linear · Notion · Flighty — calm, spacious, premium. Avoid traditional accounting-software aesthetics.
