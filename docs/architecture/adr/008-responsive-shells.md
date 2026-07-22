# ADR-008: Device-specific shells

## Status

Accepted

## Context

“Responsive CSS only” leads to compromised navigation. Phone, tablet, and desktop need different chrome and density.

## Decision

Implement three explicit shells — **Phone**, **Tablet**, **Desktop** — selected by breakpoint. Shared routes; divergent navigation chrome and page composition where needed.

## Consequences

- More layout code, better UX
- Pages should prefer composition props over forking business logic
- QA matrix must include all three shells
