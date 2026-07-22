# AJX Tax

**Simple. Reliable. Fast. Audit-ready.**

MVP is built around the proven AJX Calculator **overnight workflow** — not a generic expense tracker, not AI-dependent, not roster-parsing-dependent.

> Overnight table = source of truth. Roster = evidence. Sample days → average daily spend → claim on Tax Position.

## Status

**MVP v1** direction reset ([ADR-024](./docs/architecture/adr/024-overnight-workflow-mvp-foundation.md) · [overnight workflow](./docs/features/overnight-workflow-mvp.md) · [scope](./docs/product/mvp-v1-scope.md)).

Shipped in this codebase (pre-reset ledger/parity foundation — being realigned to overnight spine):

- Auth shell (Supabase Google OAuth when configured; local mode otherwise)
- Tax Position engine with calculator parity gate (`npm test`)
- Planner + evidence import via migration wizard
- Dashboard, Tax Position / Summary, Evidence library, Accountant package export
- Light + dark themes, mobile bottom nav, standards primitives

## Try it

```bash
npm install
npm run dev
```

Optional cloud auth — copy `.env.example` to `.env` and set Supabase keys. Without them, use **Continue locally**.

| Route | Purpose |
|-------|---------|
| `/` | Dashboard |
| `/overnight` | Overnight planner (primary overnight entry) |
| `/position` | Tax Position |
| `/position/summary` | Indicative tax summary |
| `/evidence` | Evidence organisation |
| `/export` | Accountant ZIP package |
| `/migration` | Import planner / evidence |
| `/design-system` | Living design system |

Sample files:

- Evidence V1: `/samples/ajx-tax-v1-sample-export.json`
- Planner: `/samples/ajx-tax-planner-sample.json`

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query · Supabase · Zod · Vitest · Framer Motion

## Docs

Start here: [`docs/README.md`](./docs/README.md) · [`docs/product/00-product-definition.md`](./docs/product/00-product-definition.md)
