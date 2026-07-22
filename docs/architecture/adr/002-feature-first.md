# ADR-002: Feature-first architecture

## Status

Accepted

## Context

Layer-first (`components/`, `hooks/`, `services/`) repositories become unnavigable as domains multiply (evidence, flights, income, readiness).

## Decision

Use **feature-first** folders under `src/features/*` with a thin `shared/` and `app/` shell. Enforce public `index.ts` exports and a ~300-line file limit.

## Consequences

- Clear ownership per domain
- Requires discipline on shared extractions
- ESLint boundary rules recommended
