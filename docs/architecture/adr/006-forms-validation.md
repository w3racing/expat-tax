# ADR-006: React Hook Form + Zod

## Status

Accepted

## Context

Settings, manual evidence corrections, onboarding, and structured metadata need validation shared between client and Edge Functions.

## Decision

**Zod** is the single schema source. **React Hook Form** with Zod resolvers for forms. Reuse schemas in Edge Functions where inputs are validated.

## Consequences

- Slight duplication risk if schemas drift — mitigate by shared packages/folders imported by both app and functions where tooling allows
- Prefer co-locating feature schemas under `features/*/schemas`
